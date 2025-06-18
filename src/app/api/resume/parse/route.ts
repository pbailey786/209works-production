import { NextRequest, NextResponse } from 'next/server';
import { auth as getServerSession } from "@/auth";
import { openai } from '@/lib/openai';
import { z } from 'zod';
import { prisma } from '@/lib/database/prisma';
import { saveResumeFile, isValidResumeFile, type FileValidationResult } from '@/lib/fileUpload';
import { extractTextFromFile, validateExtractedText } from '@/lib/enhanced-text-extraction';
import { isResumeParsingAvailable, logEnvironmentStatus, getEnvironmentConfig } from '@/lib/env-validation';
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

    // Log environment status for debugging
    logEnvironmentStatus();

    // Check if resume parsing is available
    const isAvailable = isResumeParsingAvailable();
    console.log('🔍 Resume parsing availability check:', isAvailable);
    if (!isAvailable) {
      console.log('❌ Resume parsing not available - OpenAI API key not configured properly');
      const config = getEnvironmentConfig();
      console.log('🔍 Environment config:', config);
      return NextResponse.json(
        {
          error: 'Resume parsing is currently unavailable. AI service is not configured.',
          details: 'Please contact support or try again later.',
          debug: process.env.NODE_ENV === 'development' ? { config } : undefined,
        },
        { status: 503 }
      );
    }

    const session = await getServerSession() as Session | null;
    if (!session?.user?.email) {
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
      return NextResponse.json({ 
        error: validation.error,
        warnings: validation.warnings,
        debug: process.env.NODE_ENV === 'development' ? validation : undefined
      }, { status: 400 });
    }

    console.log('✅ File validation passed:', validation.fileInfo);

    // Get user ID for file naming
    console.log('🔍 Looking up user:', session.user.email);
    const user = await prisma.user.findUnique({
      where: { email: session!.user?.email },
      select: { id: true },
    });

    if (!user) {
      console.log('❌ User not found in database:', session.user.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('✅ User found:', user.id);

    // Extract text from file using enhanced text extraction
    console.log('🔍 Starting enhanced text extraction...');
    const fileBuffer = await file.arrayBuffer();

    let extractionResult;
    try {
      extractionResult = await extractTextFromFile(fileBuffer, file.type, file.name, {
        fallbackStrategies: true,
        maxRetries: 3,
        timeout: 30000,
        preserveFormatting: false,
        extractMetadata: true,
      });
    } catch (extractionError: any) {
      console.log('❌ Text extraction failed:', extractionError.message);
      return NextResponse.json(
        {
          error: 'Could not extract text from resume file.',
          details: extractionError.message,
          warnings: [
            'The file may be corrupted, password-protected, or in an unsupported format',
            'Please try saving your resume as a PDF or Word document and try again',
          ],
          debug: process.env.NODE_ENV === 'development' ? { 
            error: extractionError.message,
            fileInfo: validation.fileInfo 
          } : undefined
        },
        { status: 400 }
      );
    }

    // Validate extracted text quality
    const textValidation = validateExtractedText(extractionResult);
    if (!textValidation.isValid) {
      console.log('❌ Text validation failed:', textValidation.issues);
      return NextResponse.json(
        {
          error: 'Extracted text quality is insufficient for parsing.',
          details: textValidation.issues.join('. '),
          warnings: [
            'This may indicate the file is mostly images or has formatting issues',
            'Try using a different file format or ensuring the resume contains readable text',
          ],
          debug: process.env.NODE_ENV === 'development' ? {
            extractionResult,
            textValidation,
            score: textValidation.score
          } : undefined
        },
        { status: 400 }
      );
    }

    const fileText = extractionResult.text;
    console.log('✅ Text extraction successful:', {
      method: extractionResult.method,
      textLength: fileText.length,
      confidence: extractionResult.confidence,
      preview: fileText.substring(0, 100) + '...',
      warnings: extractionResult.warnings
    });

    // Use AI to parse the resume (with OpenAI + Anthropic fallback)
    console.log('🤖 Starting AI parsing...');
    let parsedData;
    try {
      const { parseResumeWithAI } = await import('@/lib/ai');
      parsedData = await parseResumeWithAI(fileText);

      if (!parsedData) {
        throw new Error('AI parsing returned null');
      }

      console.log('✅ AI parsing successful:', {
        hasName: !!parsedData.name,
        hasLocation: !!parsedData.location,
        hasSkills: !!parsedData.skills,
        skillsCount: parsedData.skills?.length || 0
      });
    } catch (aiError: any) {
      console.error('❌ AI parsing failed:', {
        error: aiError.message,
      });

      return NextResponse.json(
        {
          error: 'AI service is currently unavailable. Please try again later or fill out the form manually.',
          details: process.env.NODE_ENV === 'development' ? aiError.message : undefined,
        },
        { status: 503 }
      );
    }

    // Validate the parsed data
    console.log('🔍 Validating parsed data with Zod schema...');
    let validatedData;
    try {
      validatedData = ParsedResumeSchema.parse(parsedData);
      console.log('✅ Zod validation successful:', validatedData);
    } catch (zodError: any) {
      console.error('❌ Zod validation failed:', {
        error: zodError.message,
        issues: zodError.issues,
        parsedData
      });
      return NextResponse.json(
        {
          error: 'Resume data validation failed',
          details: 'The extracted data does not match the expected format',
          debug: process.env.NODE_ENV === 'development' ? { zodError: zodError.issues, parsedData } : undefined
        },
        { status: 400 }
      );
    }

    // Save the resume file to Supabase Storage
    console.log('🔍 Saving resume file to Supabase Storage...');
    let resumeUrl;
    try {
      resumeUrl = await saveResumeFile(file, user.id);
      console.log('✅ Resume file saved to Supabase:', resumeUrl);
    } catch (fileError: any) {
      console.error('❌ File save failed:', fileError.message);
      // Don't fail the entire request if file save fails - we still have the parsed data
      console.log('⚠️ Continuing without file save...');
      resumeUrl = null;
    }

    // Update user with resume URL and any extracted data
    console.log('🔍 Updating user in database...');
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          // Update resume URL if file was saved successfully
          ...(resumeUrl && { resumeUrl }),
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
      console.log('✅ User updated successfully');
    } catch (dbError: any) {
      console.error('❌ Database update failed:', dbError.message);
      return NextResponse.json(
        {
          error: 'Failed to save user data',
          details: 'The resume was parsed but user data could not be updated',
          debug: process.env.NODE_ENV === 'development' ? { error: dbError.message } : undefined
        },
        { status: 500 }
      );
    }

    // Compile all warnings
    const allWarnings: string[] = [];
    if (validation.warnings) allWarnings.push(...validation.warnings);
    if (extractionResult.warnings) allWarnings.push(...extractionResult.warnings);
    if (extractionResult.confidence < 0.7) {
      allWarnings.push('Text extraction confidence is lower than usual - please review extracted information');
    }

    return NextResponse.json({
      success: true,
      data: {
        ...validatedData,
        resumeUrl,
        fileInfo: validation.fileInfo,
        extractionInfo: {
          method: extractionResult.method,
          confidence: extractionResult.confidence,
          warnings: extractionResult.warnings || [],
          metadata: extractionResult.metadata
        }
      },
      warnings: allWarnings.length > 0 ? allWarnings : undefined,
      message: resumeUrl
        ? 'Resume parsed and saved successfully!'
        : 'Resume parsed successfully! (File not saved due to storage error)',
    });
  } catch (error: any) {
    console.error('❌ Resume parsing error:', {
      message: error.message,
      stack: error.stack?.substring(0, 1000),
      name: error.name
    });
    return NextResponse.json(
      {
        error: 'Failed to parse resume. Please try again or fill out the form manually.',
        debug: process.env.NODE_ENV === 'development' ? {
          error: error.message,
          stack: error.stack?.substring(0, 500)
        } : undefined
      },
      { status: 500 }
    );
  }
}


