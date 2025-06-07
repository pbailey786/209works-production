import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { openai } from '@/lib/openai';
import { z } from 'zod';
import { prisma } from '@/lib/database/prisma';
import { saveResumeFile, isValidResumeFile } from '@/lib/fileUpload';
import type { Session } from 'next-auth';

// Schema for parsed resume data
const ParsedResumeSchema = z.object({
  name: z.string().optional(),
  location: z.string().optional(),
  currentJobTitle: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  summary: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    console.log('📄 Resume parsing request initiated');
    const session = await getServerSession(authOptions) as Session | null;
    if (!session!.user?.email) {
      console.log('❌ Unauthorized: No session or email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('resume') as File;

    if (!file) {
      console.log('❌ No file provided in form data');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('📁 File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Validate file type and size
    const validation = isValidResumeFile(file);
    if (!validation.valid) {
      console.log('❌ File validation failed:', validation);
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    console.log('✅ File validation passed');

    // Get user ID for file naming
    const user = await prisma.user.findUnique({
      where: { email: session!.user?.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Convert file to text (simplified - in production you'd use a proper PDF/DOC parser)
    console.log('🔍 Starting text extraction...');
    const fileBuffer = await file.arrayBuffer();
    const fileText = await extractTextFromFile(fileBuffer, file.type);

    if (!fileText || fileText.trim().length === 0) {
      console.log('❌ Text extraction failed: No text extracted');
      return NextResponse.json(
        {
          error:
            'Could not extract text from resume. Please try a different file or fill out the form manually.',
        },
        { status: 400 }
      );
    }

    console.log('✅ Text extraction successful:', {
      textLength: fileText.length,
      preview: fileText.substring(0, 100) + '...'
    });

    // Use OpenAI to parse the resume
    console.log('🤖 Starting OpenAI parsing...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a resume parser. Extract structured information from resumes and return it as JSON. 
          
          Focus on extracting:
          - name: Full name of the person
          - location: City and state (prefer California cities like Modesto, Stockton, Fresno, etc.)
          - currentJobTitle: Most recent job title or desired position
          - skills: Array of technical and professional skills
          - experienceLevel: Based on years of experience (entry: 0-2 years, mid: 3-5 years, senior: 6-10 years, executive: 10+ years)
          - email: Email address if present
          - phoneNumber: Phone number if present
          - summary: Brief professional summary or objective
          
          Return only valid JSON that matches this schema. If information is not found, omit the field or return null.
          For skills, extract both technical skills (like "JavaScript", "Project Management") and soft skills.
          For location, if only a city is mentioned, assume it's in California.`,
        },
        {
          role: 'user',
          content: `Please parse this resume and extract the information as JSON:\n\n${fileText}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      console.log('❌ OpenAI parsing failed: No response content');
      return NextResponse.json(
        { error: 'Failed to parse resume with AI' },
        { status: 500 }
      );
    }

    console.log('✅ OpenAI response received:', {
      responseLength: aiResponse.length,
      preview: aiResponse.substring(0, 200)
    });

    // Parse the AI response as JSON
    let parsedData;
    try {
      parsedData = JSON.parse(aiResponse);
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', {
        aiResponse,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return NextResponse.json(
        { 
          error: 'Failed to parse resume data - AI response was not valid JSON',
          debug: process.env.NODE_ENV === 'development' ? { aiResponse } : undefined
        },
        { status: 500 }
      );
    }

    // Validate the parsed data
    const validatedData = ParsedResumeSchema.parse(parsedData);

    // Save the resume file
    const resumeUrl = await saveResumeFile(file, user.id);

    // Update user with resume URL and any extracted data
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resumeUrl,
        // Only update fields that were successfully extracted
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.location && { location: validatedData.location }),
        ...(validatedData.currentJobTitle && {
          currentJobTitle: validatedData.currentJobTitle,
        }),
        ...(validatedData.experienceLevel && {
          experienceLevel: validatedData.experienceLevel,
        }),
        ...(validatedData.phoneNumber && {
          phoneNumber: validatedData.phoneNumber,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...validatedData,
        resumeUrl,
      },
      message: 'Resume parsed and saved successfully!',
    });
  } catch (error) {
    console.error('Resume parsing error:', error);
    return NextResponse.json(
      {
        error:
          'Failed to parse resume. Please try again or fill out the form manually.',
      },
      { status: 500 }
    );
  }
}

// Extract text from different file types
async function extractTextFromFile(
  buffer: ArrayBuffer,
  mimeType: string
): Promise<string> {
  try {
    const uint8Array = new Uint8Array(buffer);

    if (mimeType === 'application/pdf') {
      // For now, return a message asking user to use DOCX or manual entry
      // In production, you'd implement proper PDF parsing
      throw new Error(
        'PDF parsing is temporarily unavailable. Please upload a DOCX file or fill out the form manually.'
      );
    } else if (
      mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      // Parse DOCX files using dynamic import
      try {
        const mammoth = (await import('mammoth')).default;
        const result = await mammoth.extractRawText({
          buffer: Buffer.from(uint8Array),
        });
        return result.value;
      } catch (error) {
        throw new Error(
          'Failed to parse DOCX file. Please try a different file or fill out the form manually.'
        );
      }
    } else if (mimeType === 'application/msword') {
      // For older DOC files, mammoth has limited support
      try {
        const mammoth = (await import('mammoth')).default;
        const result = await mammoth.extractRawText({
          buffer: Buffer.from(uint8Array),
        });
        return result.value;
      } catch (error) {
        throw new Error(
          'DOC files are not fully supported. Please convert to DOCX format or fill out the form manually.'
        );
      }
    } else {
      // For plain text files
      const decoder = new TextDecoder();
      return decoder.decode(buffer);
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    throw error; // Re-throw the error with the original message
  }
}
