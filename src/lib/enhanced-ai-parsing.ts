/**
 * Enhanced AI-powered resume parsing with improved reliability and validation
 */

import { processWithAI } from '@/lib/ai';
import { z } from 'zod';

// Enhanced schema for parsed resume data
export const EnhancedResumeSchema = z.object({
  // Basic information
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().regex(/[\d\s\-\(\)\+\.]{7,20}/).optional(),
  location: z.string().min(2).max(200).optional(),
  
  // Professional information
  currentJobTitle: z.string().min(2).max(200).optional(),
  summary: z.string().min(10).max(1000).optional(),
  
  // Skills and experience
  skills: z.array(z.string().min(1).max(50)).max(20).optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
  yearsOfExperience: z.number().min(0).max(50).optional(),
  
  // Work history
  workExperience: z.array(z.object({
    title: z.string().min(1).max(200),
    company: z.string().min(1).max(200),
    duration: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
  })).max(10).optional(),
  
  // Education
  education: z.array(z.object({
    degree: z.string().min(1).max(200),
    institution: z.string().min(1).max(200),
    year: z.string().max(50).optional(),
  })).max(5).optional(),
  
  // Additional information
  certifications: z.array(z.string().min(1).max(200)).max(10).optional(),
  languages: z.array(z.string().min(1).max(50)).max(10).optional(),
  linkedinUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
});

export type EnhancedResumeData = z.infer<typeof EnhancedResumeSchema>;

export interface ParsedResumeResult {
  data: EnhancedResumeData;
  confidence: number;
  warnings: string[];
  processingTime: number;
  fallbackUsed: boolean;
}

/**
 * Enhanced resume parsing with multiple strategies and validation
 */
export async function parseResumeWithEnhancedAI(
  resumeText: string,
  options: {
    includeWorkHistory?: boolean;
    includeEducation?: boolean;
    timeout?: number;
    retries?: number;
  } = {}
): Promise<ParsedResumeResult> {
  const startTime = Date.now();
  const {
    includeWorkHistory = true,
    includeEducation = true,
    timeout = 30000,
    retries = 2,
  } = options;

  // Validate input text
  const textValidation = validateResumeText(resumeText);
  if (!textValidation.isValid) {
    throw new Error(`Invalid resume text: ${textValidation.issues.join(', ')}`);
  }

  console.log('[AI Parsing] Starting enhanced resume parsing...');

  let lastError: Error | null = null;
  let fallbackUsed = false;

  // Try primary parsing strategy
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await parseWithPrimaryStrategy(resumeText, {
        includeWorkHistory,
        includeEducation,
        timeout,
        isRetry: attempt > 0,
      });

      const processingTime = Date.now() - startTime;
      console.log(`[AI Parsing] Primary strategy succeeded in ${processingTime}ms`);

      return {
        ...result,
        processingTime,
        fallbackUsed,
      };
    } catch (error) {
      console.warn(`[AI Parsing] Primary strategy attempt ${attempt + 1} failed:`, error);
      lastError = error as Error;
      
      if (attempt < retries) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  // Try fallback parsing strategy
  try {
    console.log('[AI Parsing] Trying fallback parsing strategy...');
    fallbackUsed = true;
    
    const result = await parseWithFallbackStrategy(resumeText, {
      includeWorkHistory,
      includeEducation,
    });

    const processingTime = Date.now() - startTime;
    console.log(`[AI Parsing] Fallback strategy succeeded in ${processingTime}ms`);

    return {
      ...result,
      processingTime,
      fallbackUsed,
    };
  } catch (fallbackError) {
    console.error('[AI Parsing] Fallback strategy also failed:', fallbackError);
    
    // Last resort: manual extraction
    try {
      const result = await extractWithManualParsing(resumeText);
      const processingTime = Date.now() - startTime;
      
      return {
        ...result,
        processingTime,
        fallbackUsed: true,
      };
    } catch (manualError) {
      throw new Error(`All parsing strategies failed. Last errors: Primary: ${lastError?.message}, Fallback: ${(fallbackError as Error).message}, Manual: ${(manualError as Error).message}`);
    }
  }
}

/**
 * Primary AI parsing strategy with structured prompts
 */
async function parseWithPrimaryStrategy(
  resumeText: string,
  options: {
    includeWorkHistory: boolean;
    includeEducation: boolean;
    timeout: number;
    isRetry: boolean;
  }
): Promise<Omit<ParsedResumeResult, 'processingTime' | 'fallbackUsed'>> {
  const systemPrompt = `You are an expert resume parser. Extract structured information from resumes and return it as valid JSON.

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON that exactly matches the required schema
2. If information is not found, omit the field or use null
3. Validate all extracted data (emails must be valid, phone numbers reasonable, etc.)
4. For arrays, include only relevant, non-duplicate items
5. Keep descriptions concise but informative

Required JSON Schema:
{
  "name": "string (optional)",
  "email": "valid_email (optional)",
  "phoneNumber": "string with digits/spaces/dashes (optional)",
  "location": "city, state or full address (optional)",
  "currentJobTitle": "most recent job title (optional)",
  "summary": "professional summary 10-1000 chars (optional)",
  "skills": "array of skills, max 20 items (optional)",
  "experienceLevel": "entry|mid|senior|executive (optional)",
  "yearsOfExperience": "number 0-50 (optional)"${options.includeWorkHistory ? `,
  "workExperience": "array of {title, company, duration, description} max 10 (optional)"` : ''}${options.includeEducation ? `,
  "education": "array of {degree, institution, year} max 5 (optional)"` : ''},
  "certifications": "array of certification names max 10 (optional)",
  "languages": "array of language names max 10 (optional)",
  "linkedinUrl": "valid LinkedIn URL (optional)",
  "portfolioUrl": "valid portfolio/website URL (optional)"
}

Focus on accuracy over completeness. Return valid JSON only.`;

  const userPrompt = `Parse this resume and extract the information as JSON:

${resumeText.substring(0, 4000)}${resumeText.length > 4000 ? '...' : ''}`;

  try {
    const response = await processWithAI(userPrompt, {
      systemPrompt,
      maxTokens: 2000,
      temperature: 0.1,
      timeout: options.timeout,
      context: options.isRetry ? 'Resume Parsing (Retry)' : 'Resume Parsing',
    });

    // Extract and validate JSON
    const parsed = extractAndValidateJSON(response);
    const warnings = validateParsedData(parsed, resumeText);
    
    return {
      data: parsed,
      confidence: calculateParsingConfidence(parsed, resumeText, warnings),
      warnings,
    };
  } catch (error) {
    throw new Error(`Primary parsing failed: ${(error as Error).message}`);
  }
}

/**
 * Fallback parsing strategy with simpler prompts
 */
async function parseWithFallbackStrategy(
  resumeText: string,
  options: {
    includeWorkHistory: boolean;
    includeEducation: boolean;
  }
): Promise<Omit<ParsedResumeResult, 'processingTime' | 'fallbackUsed'>> {
  const basicFields = [
    'name',
    'email', 
    'phoneNumber',
    'location',
    'currentJobTitle',
    'skills',
    'experienceLevel'
  ];

  const extractedData: any = {};
  const warnings: string[] = ['Used simplified parsing strategy'];

  // Extract basic fields one by one
  for (const field of basicFields) {
    try {
      const value = await extractSingleField(resumeText, field);
      if (value !== null) {
        extractedData[field] = value;
      }
    } catch (error) {
      console.warn(`[Fallback] Failed to extract ${field}:`, error);
    }
  }

  // Validate the extracted data
  const validated = EnhancedResumeSchema.partial().parse(extractedData);
  const additionalWarnings = validateParsedData(validated, resumeText);
  
  return {
    data: validated,
    confidence: calculateParsingConfidence(validated, resumeText, warnings.concat(additionalWarnings)),
    warnings: warnings.concat(additionalWarnings),
  };
}

/**
 * Manual extraction using regex patterns (last resort)
 */
async function extractWithManualParsing(resumeText: string): Promise<Omit<ParsedResumeResult, 'processingTime' | 'fallbackUsed'>> {
  const data: any = {};
  const warnings = ['Used manual text extraction - limited accuracy'];

  // Extract email
  const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    data.email = emailMatch[0];
  }

  // Extract phone number
  const phoneMatch = resumeText.match(/(?:\+?1[-. ]?)?\(?[0-9]{3}\)?[-. ]?[0-9]{3}[-. ]?[0-9]{4}/);
  if (phoneMatch) {
    data.phoneNumber = phoneMatch[0];
  }

  // Extract name (simple heuristic)
  const lines = resumeText.split('\n').filter(line => line.trim().length > 0);
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine.length < 50 && firstLine.split(' ').length <= 4) {
      data.name = firstLine;
    }
  }

  // Extract basic skills
  const skillKeywords = ['skills', 'technologies', 'technical skills', 'competencies'];
  for (const keyword of skillKeywords) {
    const skillIndex = resumeText.toLowerCase().indexOf(keyword);
    if (skillIndex !== -1) {
      const skillSection = resumeText.substring(skillIndex, skillIndex + 500);
      const commonSkills = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'HTML', 'CSS'];
      const foundSkills = commonSkills.filter(skill => 
        skillSection.toLowerCase().includes(skill.toLowerCase())
      );
      if (foundSkills.length > 0) {
        data.skills = foundSkills;
        break;
      }
    }
  }

  const validated = EnhancedResumeSchema.partial().parse(data);
  
  return {
    data: validated,
    confidence: 0.3, // Low confidence for manual extraction
    warnings,
  };
}

/**
 * Extract a single field using targeted AI prompts
 */
async function extractSingleField(resumeText: string, field: string): Promise<any> {
  const prompts: Record<string, string> = {
    name: "Extract the person's full name from this resume. Return only the name or null.",
    email: 'Extract the email address from this resume. Return only the email or null.',
    phoneNumber: 'Extract the phone number from this resume. Return only the phone number or null.',
    location: 'Extract the location/address from this resume. Return only the location or null.',
    currentJobTitle: 'Extract the most recent job title from this resume. Return only the job title or null.',
    skills: 'Extract a list of technical skills from this resume. Return as a JSON array or null.',
    experienceLevel: 'Determine the experience level (entry, mid, senior, executive) from this resume. Return only the level or null.',
  };

  const prompt = prompts[field];
  if (!prompt) return null;

  try {
    const response = await processWithAI(
      `${prompt}\n\nResume text:\n${resumeText.substring(0, 2000)}`,
      {
        maxTokens: 100,
        temperature: 0.1,
        timeout: 10000,
      }
    );

    // Parse the response based on field type
    if (field === 'skills') {
      try {
        return JSON.parse(response);
      } catch {
        // Try to extract comma-separated list
        const skills = response.split(',').map(s => s.trim()).filter(s => s.length > 0);
        return skills.length > 0 ? skills : null;
      }
    }

    const cleaned = response.trim().replace(/^"|"$/g, '');
    return cleaned.toLowerCase() === 'null' ? null : cleaned;
  } catch (error) {
    console.warn(`Failed to extract ${field}:`, error);
    return null;
  }
}

/**
 * Extract and validate JSON from AI response
 */
function extractAndValidateJSON(response: string): EnhancedResumeData {
  // Try to find JSON in the response
  const jsonMatch = response.match(/{[\s\S]*}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in AI response');
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return EnhancedResumeSchema.partial().parse(parsed);
  } catch (error) {
    throw new Error(`JSON parsing failed: ${(error as Error).message}`);
  }
}

/**
 * Validate resume text quality
 */
function validateResumeText(text: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!text || text.trim().length === 0) {
    issues.push('Resume text is empty');
  } else if (text.length < 100) {
    issues.push('Resume text is too short');
  } else if (text.length > 50000) {
    issues.push('Resume text is too long');
  }

  // Check for reasonable content
  const wordCount = text.split(/\s+/).length;
  if (wordCount < 20) {
    issues.push('Resume contains too few words');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Validate parsed data quality
 */
function validateParsedData(data: EnhancedResumeData, originalText: string): string[] {
  const warnings: string[] = [];

  // Check email validity
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      warnings.push('Extracted email may be invalid');
    }
  }

  // Check phone number format
  if (data.phoneNumber) {
    const phoneRegex = /[\d\s\-\(\)\+\.]{7,20}/;
    if (!phoneRegex.test(data.phoneNumber)) {
      warnings.push('Extracted phone number may be invalid');
    }
  }

  // Check skills quality
  if (data.skills) {
    const commonWords = ['and', 'or', 'the', 'with', 'in', 'at', 'to', 'for'];
    const invalidSkills = data.skills.filter(skill => 
      commonWords.includes(skill.toLowerCase()) || skill.length < 2
    );
    if (invalidSkills.length > 0) {
      warnings.push('Some extracted skills may be invalid');
    }
  }

  // Check for missing critical information
  if (!data.name && !data.email) {
    warnings.push('No contact information found');
  }

  if (!data.skills || data.skills.length === 0) {
    warnings.push('No skills extracted');
  }

  return warnings;
}

/**
 * Calculate parsing confidence based on extracted data quality
 */
function calculateParsingConfidence(
  data: EnhancedResumeData,
  originalText: string,
  warnings: string[]
): number {
  let confidence = 0.5; // Base confidence

  // Boost confidence for extracted fields
  if (data.name) confidence += 0.1;
  if (data.email) confidence += 0.1;
  if (data.phoneNumber) confidence += 0.05;
  if (data.location) confidence += 0.05;
  if (data.currentJobTitle) confidence += 0.1;
  if (data.skills && data.skills.length > 0) confidence += 0.1;
  if (data.experienceLevel) confidence += 0.05;

  // Reduce confidence for warnings
  confidence -= warnings.length * 0.05;

  // Check data quality
  const textLength = originalText.length;
  const extractedDataSize = JSON.stringify(data).length;
  const extractionRatio = extractedDataSize / textLength;

  if (extractionRatio > 0.01) confidence += 0.1; // Good extraction ratio
  if (extractionRatio < 0.001) confidence -= 0.1; // Poor extraction ratio

  return Math.max(0.1, Math.min(1.0, confidence));
}

/**
 * Sanitize and clean extracted data
 */
export function sanitizeResumeData(data: EnhancedResumeData): EnhancedResumeData {
  const sanitized = { ...data };

  // Clean name
  if (sanitized.name) {
    sanitized.name = sanitized.name.trim().replace(/\s+/g, ' ');
  }

  // Clean email
  if (sanitized.email) {
    sanitized.email = sanitized.email.toLowerCase().trim();
  }

  // Clean phone number
  if (sanitized.phoneNumber) {
    sanitized.phoneNumber = sanitized.phoneNumber.replace(/[^\d\s\-\(\)\+\.]/g, '');
  }

  // Clean skills
  if (sanitized.skills) {
    sanitized.skills = sanitized.skills
      .map(skill => skill.trim())
      .filter(skill => skill.length > 1)
      .slice(0, 20); // Limit to 20 skills
  }

  // Clean location
  if (sanitized.location) {
    sanitized.location = sanitized.location.trim().replace(/\s+/g, ' ');
  }

  return sanitized;
}