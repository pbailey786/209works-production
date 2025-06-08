import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/authOptions';
import { openai } from '@/lib/openai';
import { isValidResumeFile } from '@/lib/fileUpload';
import type { Session } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Environment variables check:', {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      openAILength: process.env.OPENAI_API_KEY?.length || 0,
      hasDatabase: !!process.env.DATABASE_URL,
      hasNextAuth: !!process.env.NEXTAUTH_SECRET,
      nodeEnv: process.env.NODE_ENV,
    });

    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Unauthorized',
        debug: {
          step: 'authentication',
          details: {
            hasSession: !!session,
            hasUserEmail: !!session?.user?.email
          }
        }
      }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('resume') as File;

    if (!file) {
      return NextResponse.json({ 
        error: 'No file provided',
        debug: { step: 'file_validation', details: 'No file in form data' }
      }, { status: 400 });
    }

    console.log('🔍 DEBUG: File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Step 1: Validate file type and size
    const validation = isValidResumeFile(file);
    if (!validation.valid) {
      return NextResponse.json({ 
        error: validation.error,
        debug: { 
          step: 'file_validation', 
          details: { 
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            validation 
          }
        }
      }, { status: 400 });
    }

    console.log('✅ DEBUG: File validation passed');

    // Step 2: Check OpenAI API key
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    if (!hasApiKey) {
      return NextResponse.json({
        error: 'OpenAI API key not configured',
        debug: { 
          step: 'openai_config', 
          details: 'OPENAI_API_KEY environment variable is missing' 
        }
      }, { status: 500 });
    }

    console.log('✅ DEBUG: OpenAI API key is configured');

    // Step 3: Test mammoth import first
    console.log('🔍 DEBUG: Testing mammoth import...');
    try {
      const mammoth = (await import('mammoth')).default;
      console.log('✅ DEBUG: Mammoth import successful');
    } catch (mammothError: any) {
      return NextResponse.json({
        error: 'Mammoth import failed',
        debug: {
          step: 'mammoth_import',
          details: {
            error: mammothError.message,
            stack: mammothError.stack?.substring(0, 500)
          }
        }
      }, { status: 500 });
    }

    // Step 4: Extract text from file
    let fileText: string;
    try {
      const fileBuffer = await file.arrayBuffer();
      fileText = await extractTextFromFile(fileBuffer, file.type);
      
      if (!fileText || fileText.trim().length === 0) {
        return NextResponse.json({
          error: 'Could not extract text from resume',
          debug: { 
            step: 'text_extraction', 
            details: { 
              extractedLength: fileText?.length || 0,
              fileType: file.type 
            }
          }
        }, { status: 400 });
      }

      console.log('✅ DEBUG: Text extraction successful:', {
        textLength: fileText.length,
        preview: fileText.substring(0, 200) + '...'
      });

    } catch (textError: any) {
      return NextResponse.json({
        error: 'Text extraction failed',
        debug: { 
          step: 'text_extraction', 
          details: { 
            error: textError.message,
            fileType: file.type 
          }
        }
      }, { status: 500 });
    }

    // Step 5: Test OpenAI API call
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a resume parser. Extract structured information from resumes and return it as JSON. 
            
            Focus on extracting:
            - name: Full name of the person
            - location: City and state
            - currentJobTitle: Most recent job title
            - skills: Array of skills (max 10)
            - experienceLevel: entry, mid, senior, or executive
            - email: Email address if present
            - phoneNumber: Phone number if present
            
            Return only valid JSON. If information is not found, omit the field.`,
          },
          {
            role: 'user',
            content: `Please parse this resume and extract the information as JSON:\n\n${fileText.substring(0, 3000)}`, // Limit to first 3000 chars for debug
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (!aiResponse) {
        return NextResponse.json({
          error: 'No response from OpenAI',
          debug: { 
            step: 'openai_call', 
            details: { 
              choices: completion.choices?.length || 0,
              usage: completion.usage 
            }
          }
        }, { status: 500 });
      }

      console.log('✅ DEBUG: OpenAI response received:', aiResponse);

      // Step 6: Parse JSON response
      let parsedData;
      try {
        parsedData = JSON.parse(aiResponse);
      } catch (jsonError: any) {
        return NextResponse.json({
          error: 'Failed to parse AI response as JSON',
          debug: { 
            step: 'json_parsing', 
            details: { 
              rawResponse: aiResponse,
              error: jsonError.message 
            }
          }
        }, { status: 500 });
      }

      console.log('✅ DEBUG: JSON parsing successful:', parsedData);

      return NextResponse.json({
        success: true,
        debug: {
          step: 'complete',
          details: {
            fileProcessed: {
              name: file.name,
              type: file.type,
              size: file.size
            },
            textExtracted: {
              length: fileText.length,
              preview: fileText.substring(0, 200)
            },
            aiResponse: {
              raw: aiResponse,
              parsed: parsedData
            }
          }
        },
        data: parsedData,
        message: 'Resume parsing debug completed successfully!'
      });

    } catch (openaiError: any) {
      return NextResponse.json({
        error: 'OpenAI API call failed',
        debug: { 
          step: 'openai_call', 
          details: { 
            error: openaiError.message,
            status: openaiError.status,
            type: openaiError.type
          }
        }
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('DEBUG: Unexpected error:', error);
    return NextResponse.json({
      error: 'Unexpected error occurred',
      debug: { 
        step: 'unknown', 
        details: { 
          error: error.message,
          stack: error.stack?.substring(0, 500)
        }
      }
    }, { status: 500 });
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
      throw new Error('PDF parsing is not supported yet. Please use DOCX format.');
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      // Parse DOCX files using mammoth
      const mammoth = (await import('mammoth')).default;
      const result = await mammoth.extractRawText({
        buffer: Buffer.from(uint8Array),
      });
      return result.value;
    } else if (mimeType === 'application/msword') {
      // Parse DOC files using mammoth
      const mammoth = (await import('mammoth')).default;
      const result = await mammoth.extractRawText({
        buffer: Buffer.from(uint8Array),
      });
      return result.value;
    } else {
      // For plain text files
      const decoder = new TextDecoder();
      return decoder.decode(buffer);
    }
  } catch (error: any) {
    console.error('Text extraction error:', error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
} 