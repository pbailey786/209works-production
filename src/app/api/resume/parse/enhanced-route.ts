import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { saveResumeFile, isValidResumeFile, type FileValidationResult } from '@/lib/fileUpload';
import { extractTextFromFile, validateExtractedText, type TextExtractionResult } from '@/lib/enhanced-text-extraction';
import { parseResumeWithEnhancedAI, sanitizeResumeData, type ParsedResumeResult } from '@/lib/enhanced-ai-parsing';
import { isResumeParsingAvailable, logEnvironmentStatus } from '@/lib/env-validation';
import { z } from 'zod';
import { prisma } from '@/lib/database/prisma';

// Request options schema
const ParseOptionsSchema = z.object({
  includeWorkHistory: z.boolean().optional().default(true),
  includeEducation: z.boolean().optional().default(true),
  preserveFormatting: z.boolean().optional().default(false),
  timeout: z.number().min(5000).max(60000).optional().default(30000),
}).optional().default({});

// Response interface
interface ResumeParseResponse {
  success: boolean;
  data?: {
    // Parsed resume data
    name?: string;
    email?: string;
    phoneNumber?: string;
    location?: string;
    currentJobTitle?: string;
    summary?: string;
    skills?: string[];
    experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
    yearsOfExperience?: number;
    workExperience?: Array<{
      title: string;
      company: string;
      duration: string;
      description?: string;
    }>;
    education?: Array<{
      degree: string;
      institution: string;
      year?: string;
    }>;
    certifications?: string[];
    languages?: string[];
    linkedinUrl?: string;
    portfolioUrl?: string;
    
    // Metadata
    resumeUrl?: string;
    fileInfo?: {
      size: string;
      type: string;
      category: string;
      reliability: 'high' | 'medium' | 'low';
    };
    extractionInfo?: {
      method: string;
      confidence: number;
      warnings: string[];
      processingTime: number;
    };
    parsingInfo?: {
      confidence: number;
      warnings: string[];
      fallbackUsed: boolean;
      processingTime: number;
    };
  };
  warnings?: string[];
  error?: string;
  debug?: any;
}

export async function POST(request: NextRequest): Promise<NextResponse<ResumeParseResponse>> {
  const startTime = Date.now();
  let sessionData: Session | null = null;
  let fileValidation: FileValidationResult | null = null;
  let extractionResult: TextExtractionResult | null = null;
  let parsingResult: ParsedResumeResult | null = null;

  try {
    console.log('📄 Enhanced resume parsing request initiated');

    // Environment checks
    logEnvironmentStatus();
    const isAvailable = isResumeParsingAvailable();
    
    if (!isAvailable) {
      console.log('❌ Resume parsing not available - AI service not configured');
      return NextResponse.json<ResumeParseResponse>({
        success: false,
        error: 'Resume parsing service is currently unavailable',
        debug: process.env.NODE_ENV === 'development' ? {
          reason: 'AI service not properly configured',
          timestamp: new Date().toISOString(),
        } : undefined,
      }, { status: 503 });
    }

    // Authentication
    sessionData = await auth() as Session | null;
    if (!sessionData?.user?.email) {
      console.log('❌ Unauthorized: No session or email');
      return NextResponse.json<ResumeParseResponse>({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('resume') as File;
    const optionsJson = formData.get('options') as string;

    if (!file) {
      console.log('❌ No file provided in form data');
      return NextResponse.json<ResumeParseResponse>({
        success: false,
        error: 'No resume file provided',
      }, { status: 400 });
    }

    // Parse options
    let options;
    try {
      const rawOptions = optionsJson ? JSON.parse(optionsJson) : {};
      options = ParseOptionsSchema.parse(rawOptions);
    } catch (error) {
      console.log('❌ Invalid options provided:', error);
      return NextResponse.json<ResumeParseResponse>({
        success: false,
        error: 'Invalid parsing options provided',
        debug: process.env.NODE_ENV === 'development' ? { error: (error as Error).message } : undefined,
      }, { status: 400 });
    }

    console.log('📁 Processing file:', {
      name: file.name,
      type: file.type,
      size: file.size,
      options,
    });

    // Validate file
    fileValidation = isValidResumeFile(file);
    if (!fileValidation.valid) {
      console.log('❌ File validation failed:', fileValidation.error);
      return NextResponse.json<ResumeParseResponse>({
        success: false,
        error: fileValidation.error,
        warnings: fileValidation.warnings,
      }, { status: 400 });
    }

    console.log('✅ File validation passed:', fileValidation);

    // Get user information
    const user = await prisma.user.findUnique({
      where: { email: sessionData.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      console.log('❌ User not found in database:', sessionData.user.email);
      return NextResponse.json<ResumeParseResponse>({
        success: false,
        error: 'User account not found',
      }, { status: 404 });
    }

    console.log('✅ User found:', user.id);

    // Extract text from file
    console.log('🔍 Starting enhanced text extraction...');
    const fileBuffer = await file.arrayBuffer();

    try {
      extractionResult = await extractTextFromFile(
        fileBuffer,
        file.type,
        file.name,
        {
          fallbackStrategies: true,
          maxRetries: 3,
          timeout: options.timeout,
          preserveFormatting: options.preserveFormatting,
          extractMetadata: true,
        }
      );
    } catch (extractionError) {
      console.error('❌ Text extraction failed:', extractionError);
      return NextResponse.json<ResumeParseResponse>({
        success: false,
        error: 'Failed to extract text from resume file',
        warnings: [
          'The file may be corrupted, password-protected, or in an unsupported format',
          'Please try saving your resume as a PDF or Word document and try again',
        ],
        debug: process.env.NODE_ENV === 'development' ? {
          error: (extractionError as Error).message,
          fileInfo: fileValidation.fileInfo,
        } : undefined,
      }, { status: 400 });
    }

    // Validate extracted text quality
    const textValidation = validateExtractedText(extractionResult);
    if (!textValidation.isValid) {
      console.log('❌ Text validation failed:', textValidation.issues);
      return NextResponse.json<ResumeParseResponse>({
        success: false,
        error: 'Extracted text quality is insufficient for parsing',
        warnings: textValidation.issues.concat([
          'This may indicate the file is mostly images or has formatting issues',
          'Try using a different file format or ensuring the resume contains readable text',
        ]),
        debug: process.env.NODE_ENV === 'development' ? {
          extractionResult,
          textValidation,
          score: textValidation.score,
        } : undefined,
      }, { status: 400 });
    }

    console.log('✅ Text extraction successful:', {
      method: extractionResult.method,
      textLength: extractionResult.text.length,
      confidence: extractionResult.confidence,
      warnings: extractionResult.warnings,
    });

    // Parse resume with enhanced AI
    console.log('🤖 Starting enhanced AI parsing...');
    try {
      parsingResult = await parseResumeWithEnhancedAI(
        extractionResult.text,
        {
          includeWorkHistory: options.includeWorkHistory,
          includeEducation: options.includeEducation,
          timeout: options.timeout,
          retries: 2,
        }
      );
    } catch (aiError) {
      console.error('❌ AI parsing failed:', aiError);
      return NextResponse.json<ResumeParseResponse>({
        success: false,
        error: 'AI parsing service is currently unavailable',
        warnings: [
          'The text was extracted successfully but could not be parsed',
          'You can manually fill out your profile information',
          'Our AI service will be back online shortly',
        ],
        debug: process.env.NODE_ENV === 'development' ? {
          error: (aiError as Error).message,
          extractedTextPreview: extractionResult.text.substring(0, 200),
        } : undefined,
      }, { status: 503 });
    }

    console.log('✅ AI parsing successful:', {
      confidence: parsingResult.confidence,
      fallbackUsed: parsingResult.fallbackUsed,
      warnings: parsingResult.warnings,
      processingTime: parsingResult.processingTime,
    });

    // Sanitize parsed data
    const sanitizedData = sanitizeResumeData(parsingResult.data);

    // Save resume file (optional - don't fail if this fails)
    let resumeUrl: string | null = null;
    try {
      console.log('🔍 Saving resume file to storage...');
      resumeUrl = await saveResumeFile(file, user.id);
      console.log('✅ Resume file saved:', resumeUrl);
    } catch (fileError) {
      console.warn('⚠️ File save failed (continuing without file save):', fileError);
      // Add warning but don't fail the request
      parsingResult.warnings.push('Resume file could not be saved - parsed data will still be processed');
    }

    // Update user with parsed data
    console.log('🔍 Updating user profile with parsed data...');
    try {
      const updateData: any = {};
      
      // Only update fields that were successfully extracted and validated
      if (sanitizedData.name && sanitizedData.name.length > 1) {
        updateData.name = sanitizedData.name;
      }
      if (sanitizedData.location) {
        updateData.location = sanitizedData.location;
      }
      if (sanitizedData.currentJobTitle) {
        updateData.currentJobTitle = sanitizedData.currentJobTitle;
      }
      if (sanitizedData.experienceLevel) {
        updateData.experienceLevel = sanitizedData.experienceLevel;
      }
      if (sanitizedData.phoneNumber) {
        updateData.phoneNumber = sanitizedData.phoneNumber;
      }
      if (resumeUrl) {
        updateData.resumeUrl = resumeUrl;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
        console.log('✅ User profile updated with:', Object.keys(updateData));
      } else {
        console.log('⚠️ No user profile updates needed');
      }
    } catch (dbError) {
      console.error('❌ Database update failed:', dbError);
      return NextResponse.json<ResumeParseResponse>({
        success: false,
        error: 'Failed to save parsed data to user profile',
        warnings: [
          'The resume was parsed successfully but could not be saved',
          'Please try again or contact support if the issue persists',
        ],
        debug: process.env.NODE_ENV === 'development' ? {
          error: (dbError as Error).message,
          parsedData: sanitizedData,
        } : undefined,
      }, { status: 500 });
    }

    // Compile all warnings
    const allWarnings: string[] = [];
    if (fileValidation.warnings) allWarnings.push(...fileValidation.warnings);
    if (extractionResult.warnings) allWarnings.push(...extractionResult.warnings);
    if (parsingResult.warnings) allWarnings.push(...parsingResult.warnings);
    if (parsingResult.confidence < 0.7) {
      allWarnings.push('Parsing confidence is lower than usual - please review extracted information');
    }

    const totalProcessingTime = Date.now() - startTime;
    console.log(`✅ Resume parsing completed successfully in ${totalProcessingTime}ms`);

    // Return successful response
    return NextResponse.json<ResumeParseResponse>({
      success: true,
      data: {
        ...sanitizedData,
        resumeUrl: resumeUrl || undefined,
        fileInfo: fileValidation.fileInfo,
        extractionInfo: {
          method: extractionResult.method,
          confidence: extractionResult.confidence,
          warnings: extractionResult.warnings || [],
          processingTime: totalProcessingTime - parsingResult.processingTime,
        },
        parsingInfo: {
          confidence: parsingResult.confidence,
          warnings: parsingResult.warnings,
          fallbackUsed: parsingResult.fallbackUsed,
          processingTime: parsingResult.processingTime,
        },
      },
      warnings: allWarnings.length > 0 ? allWarnings : undefined,
    });

  } catch (error) {
    const totalProcessingTime = Date.now() - startTime;
    console.error('❌ Resume parsing error:', {
      message: (error as Error).message,
      stack: (error as Error).stack?.substring(0, 1000),
      processingTime: totalProcessingTime,
    });

    // Provide detailed error information based on where the failure occurred
    let errorMessage = 'An unexpected error occurred while processing your resume';
    let userGuidance: string[] = [];

    if (!sessionData) {
      errorMessage = 'Authentication failed';
      userGuidance = ['Please log in and try again'];
    } else if (!fileValidation || !fileValidation.valid) {
      errorMessage = 'File validation failed';
      userGuidance = [
        'Please ensure your file is a valid resume document',
        'Supported formats: PDF, Word (DOCX/DOC), Text (TXT), RTF, HTML',
        'Maximum file size: 10MB',
      ];
    } else if (extractionResult && !validateExtractedText(extractionResult).isValid) {
      errorMessage = 'Could not extract readable text from your resume';
      userGuidance = [
        'The file may be corrupted or contain mostly images',
        'Try saving your resume in a different format',
        'Ensure the file contains readable text, not just images',
      ];
    } else if (extractionResult && !parsingResult) {
      errorMessage = 'Text extraction succeeded but AI parsing failed';
      userGuidance = [
        'Our AI service is temporarily unavailable',
        'You can manually enter your information',
        'Please try again in a few minutes',
      ];
    }

    return NextResponse.json<ResumeParseResponse>({
      success: false,
      error: errorMessage,
      warnings: userGuidance,
      debug: process.env.NODE_ENV === 'development' ? {
        error: (error as Error).message,
        stack: (error as Error).stack?.substring(0, 500),
        processingTime: totalProcessingTime,
        fileValidation: fileValidation?.valid,
        extractionSuccess: !!extractionResult,
        parsingSuccess: !!parsingResult,
      } : undefined,
    }, { status: 500 });
  }
}

// GET endpoint for checking parsing capabilities and status
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const includeHealth = searchParams.get('health') === 'true';

    const capabilities = {
      available: isResumeParsingAvailable(),
      supportedFormats: [
        { format: 'PDF', extensions: ['.pdf'], reliability: 'high' },
        { format: 'Microsoft Word', extensions: ['.docx', '.doc'], reliability: 'high' },
        { format: 'Plain Text', extensions: ['.txt'], reliability: 'high' },
        { format: 'Rich Text Format', extensions: ['.rtf'], reliability: 'medium' },
        { format: 'HTML', extensions: ['.html', '.htm'], reliability: 'medium' },
      ],
      limits: {
        maxFileSize: '10MB',
        maxProcessingTime: '60 seconds',
        timeout: '30 seconds (configurable)',
      },
      features: {
        textExtraction: true,
        aiParsing: true,
        fallbackStrategies: true,
        multipleFormats: true,
        metadataExtraction: true,
        confidenceScoring: true,
        errorRecovery: true,
      },
    };

    if (includeHealth) {
      // Add health check information
      const healthInfo = {
        aiService: isResumeParsingAvailable(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      };

      return NextResponse.json({
        ...capabilities,
        health: healthInfo,
      });
    }

    return NextResponse.json(capabilities);
  } catch (error) {
    console.error('Error getting parsing capabilities:', error);
    return NextResponse.json(
      { error: 'Failed to get parsing capabilities' },
      { status: 500 }
    );
  }
}