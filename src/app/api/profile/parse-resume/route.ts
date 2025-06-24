import { NextRequest, NextResponse } from 'next/server';
import { ensureUserExists } from '@/lib/auth/user-sync';
import { getChatCompletion } from '@/lib/openai';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Dynamic imports to avoid build-time issues
let pdf: any;
let mammoth: any;

// Initialize libraries only when needed
async function initLibraries() {
  if (!pdf) {
    pdf = (await import('pdf-parse')).default;
  }
  if (!mammoth) {
    mammoth = await import('mammoth');
  }
}

// File type definitions
const SUPPORTED_FILE_TYPES = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/jpg': 'image',
} as const;

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// OpenAI prompt for resume parsing
const RESUME_PARSE_PROMPT = `
You are an expert resume parser. Extract the following information from the resume text provided.
Return ONLY a valid JSON object with these fields (use null for any fields you cannot find):

{
  "name": "Full name of the candidate",
  "email": "Email address",
  "phone": "Phone number",
  "location": "City, State or general location",
  "summary": "A brief 1-2 sentence professional summary",
  "skills": ["Array of technical and soft skills"],
  "experience": {
    "totalYears": "Number of years of experience (numeric value or null)",
    "positions": [
      {
        "title": "Job title",
        "company": "Company name",
        "duration": "Time period worked",
        "description": "Brief description of role"
      }
    ]
  },
  "education": [
    {
      "degree": "Degree or certification",
      "institution": "School or institution name",
      "year": "Graduation year or period"
    }
  ],
  "industries": ["Array of industries worked in"],
  "jobTitles": ["Array of unique job titles held"]
}

Resume text:
`;

export async function POST(req: NextRequest) {
  try {
    console.log('📄 Resume parse API called');
    
    // Ensure user is authenticated
    const currentUser = await ensureUserExists();
    console.log('✅ User authenticated:', currentUser.id);

    // Get form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size too large (max 10MB)' },
        { status: 400 }
      );
    }

    // Check if file type is supported
    const fileType = SUPPORTED_FILE_TYPES[file.type as keyof typeof SUPPORTED_FILE_TYPES];
    if (!fileType) {
      return NextResponse.json(
        { 
          error: 'Unsupported file type',
          supportedTypes: Object.keys(SUPPORTED_FILE_TYPES)
        },
        { status: 400 }
      );
    }

    // Handle image files separately
    if (fileType === 'image') {
      return NextResponse.json({
        success: false,
        message: 'Image parsing is not yet supported. Please upload a PDF, DOC, DOCX, or TXT file.',
        data: null
      });
    }

    let extractedText = '';

    try {
      // Initialize libraries dynamically
      await initLibraries();
      
      // Extract text based on file type
      if (fileType === 'pdf') {
        const buffer = Buffer.from(await file.arrayBuffer());
        const pdfData = await pdf(buffer);
        extractedText = pdfData.text;
      } else if (fileType === 'docx') {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } else if (fileType === 'doc') {
        // Note: mammoth can handle some .doc files too
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value;
        } catch (docError) {
          return NextResponse.json({
            success: false,
            message: 'Unable to parse .doc file. Please save as .docx or PDF format.',
            data: null
          });
        }
      } else if (fileType === 'txt') {
        extractedText = await file.text();
      }

      // Validate extracted text
      if (!extractedText || extractedText.trim().length < 50) {
        return NextResponse.json({
          success: false,
          message: 'Unable to extract sufficient text from the file. Please ensure the file contains resume content.',
          data: null
        });
      }

      console.log(`📝 Extracted ${extractedText.length} characters from ${fileType} file`);

      // Truncate text if too long (to avoid token limits)
      const maxTextLength = 6000;
      if (extractedText.length > maxTextLength) {
        extractedText = extractedText.substring(0, maxTextLength);
        console.log(`⚠️ Text truncated to ${maxTextLength} characters`);
      }

      // Send to OpenAI for parsing
      const messages = [
        {
          role: 'system',
          content: 'You are an expert resume parser. Extract information accurately and return only valid JSON.'
        },
        {
          role: 'user',
          content: RESUME_PARSE_PROMPT + extractedText
        }
      ];

      const aiResponse = await getChatCompletion(messages, {
        model: 'gpt-4o-mini',
        maxTokens: 1500,
        temperature: 0.1, // Low temperature for consistent parsing
      });

      // Parse the AI response
      let parsedData;
      try {
        // Remove any markdown code blocks if present
        const jsonString = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
        parsedData = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.error('AI Response:', aiResponse);
        return NextResponse.json({
          success: false,
          message: 'Failed to parse resume data. Please try again.',
          data: null
        });
      }

      // Validate and clean the parsed data
      const cleanedData = {
        name: parsedData.name || null,
        email: parsedData.email || null,
        phone: parsedData.phone || null,
        location: parsedData.location || null,
        summary: parsedData.summary || null,
        skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
        experience: {
          totalYears: parsedData.experience?.totalYears || null,
          positions: Array.isArray(parsedData.experience?.positions) 
            ? parsedData.experience.positions.map((pos: any) => ({
                title: pos.title || '',
                company: pos.company || '',
                duration: pos.duration || '',
                description: pos.description || ''
              }))
            : []
        },
        education: Array.isArray(parsedData.education) 
          ? parsedData.education.map((edu: any) => ({
              degree: edu.degree || '',
              institution: edu.institution || '',
              year: edu.year || ''
            }))
          : [],
        industries: Array.isArray(parsedData.industries) ? parsedData.industries : [],
        jobTitles: Array.isArray(parsedData.jobTitles) ? parsedData.jobTitles : []
      };

      console.log('✅ Resume parsed successfully');

      return NextResponse.json({
        success: true,
        message: 'Resume parsed successfully',
        data: cleanedData,
        metadata: {
          fileType,
          fileSize: file.size,
          textLength: extractedText.length,
          fileName: file.name
        }
      });

    } catch (extractionError: any) {
      console.error('Text extraction error:', extractionError);
      return NextResponse.json({
        success: false,
        message: `Failed to extract text from ${fileType.toUpperCase()} file: ${extractionError.message}`,
        data: null
      });
    }

  } catch (error: any) {
    console.error('Resume parse error:', error);
    
    // Handle authentication errors
    if (error.message === 'Not authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Handle OpenAI errors
    if (error.message?.includes('API')) {
      return NextResponse.json({
        success: false,
        message: 'AI service temporarily unavailable. Please try again later.',
        data: null
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to parse resume. Please try again.',
      data: null
    });
  }
}