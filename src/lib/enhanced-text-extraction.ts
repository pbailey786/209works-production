/**
 * Enhanced text extraction utilities with improved reliability and error handling
 * Supports PDF, DOCX, DOC, TXT, RTF, and includes multiple extraction strategies
 */

export interface TextExtractionResult {
  text: string;
  confidence: number;
  method: string;
  warnings: string[];
  metadata?: {
    pages?: number;
    words?: number;
    characters?: number;
    encoding?: string;
    language?: string;
  };
}

export interface ExtractionOptions {
  fallbackStrategies?: boolean;
  maxRetries?: number;
  timeout?: number;
  preserveFormatting?: boolean;
  extractMetadata?: boolean;
}

/**
 * Enhanced text extraction with multiple strategies and fallbacks
 */
export async function extractTextFromFile(
  buffer: ArrayBuffer,
  mimeType: string,
  fileName?: string,
  options: ExtractionOptions = {}
): Promise<TextExtractionResult> {
  const {
    fallbackStrategies = true,
    maxRetries = 3,
    timeout = 30000,
    preserveFormatting = false,
    extractMetadata = true,
  } = options;

  console.log(`[TextExtraction] Starting extraction for ${mimeType}, size: ${buffer.byteLength} bytes`);

  const uint8Array = new Uint8Array(buffer);
  let lastError: Error | null = null;

  // PDF files - multiple extraction strategies
  if (mimeType === 'application/pdf' || fileName?.toLowerCase().endsWith('.pdf')) {
    return await extractFromPDF(uint8Array, { fallbackStrategies, maxRetries, preserveFormatting, extractMetadata });
  }

  // Microsoft Word documents (.docx, .doc)
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword' ||
      fileName?.toLowerCase().endsWith('.docx') ||
      fileName?.toLowerCase().endsWith('.doc')) {
    return await extractFromWordDocument(uint8Array, { preserveFormatting, extractMetadata });
  }

  // Plain text files
  if (mimeType === 'text/plain' || fileName?.toLowerCase().endsWith('.txt')) {
    return extractFromTextFile(uint8Array, { extractMetadata });
  }

  // RTF files
  if (mimeType === 'application/rtf' || 
      mimeType === 'text/rtf' || 
      fileName?.toLowerCase().endsWith('.rtf')) {
    return extractFromRTF(uint8Array, { extractMetadata });
  }

  // HTML files (for web-based resumes)
  if (mimeType === 'text/html' || fileName?.toLowerCase().endsWith('.html')) {
    return extractFromHTML(uint8Array, { extractMetadata });
  }

  // Fallback: try to detect file type by content
  if (fallbackStrategies) {
    console.log('[TextExtraction] Unknown MIME type, attempting content-based detection');
    return await extractByContentDetection(uint8Array, { extractMetadata });
  }

  throw new Error(`Unsupported file type: ${mimeType}. Supported formats: PDF, DOCX, DOC, TXT, RTF, HTML`);
}

/**
 * Enhanced PDF extraction with multiple strategies
 */
async function extractFromPDF(
  uint8Array: Uint8Array,
  options: { fallbackStrategies?: boolean; maxRetries?: number; preserveFormatting?: boolean; extractMetadata?: boolean }
): Promise<TextExtractionResult> {
  const strategies = ['pdf-parse', 'pdf-lib-fallback', 'raw-text-extraction'];
  let lastError: Error | null = null;
  const warnings: string[] = [];

  for (const strategy of strategies) {
    try {
      console.log(`[PDF] Trying extraction strategy: ${strategy}`);
      
      switch (strategy) {
        case 'pdf-parse':
          return await extractWithPdfParse(uint8Array, options);
        
        case 'pdf-lib-fallback':
          return await extractWithPdfLibFallback(uint8Array, options);
        
        case 'raw-text-extraction':
          return await extractPdfRawText(uint8Array, options);
      }
    } catch (error) {
      console.warn(`[PDF] Strategy ${strategy} failed:`, error);
      lastError = error as Error;
      warnings.push(`${strategy} failed: ${(error as Error).message}`);
      
      if (!options.fallbackStrategies) break;
    }
  }

  throw new Error(`All PDF extraction strategies failed. Last error: ${lastError?.message}`);
}

/**
 * Primary PDF extraction using pdf-parse
 */
async function extractWithPdfParse(
  uint8Array: Uint8Array,
  options: { preserveFormatting?: boolean; extractMetadata?: boolean }
): Promise<TextExtractionResult> {
  try {
    const pdfParse = (await import('pdf-parse')).default as any;
    const buffer = Buffer.from(uint8Array);
    
    const data = await pdfParse(buffer, {
      // PDF parsing options
      max: 0, // no limit on pages
      version: 'default',
    });

    const confidence = calculatePdfConfidence(data.text, data.numpages, data.info);
    const warnings: string[] = [];

    // Quality checks
    if (data.numpages > 10) {
      warnings.push('Large document - extraction may take longer');
    }

    if (confidence < 0.7) {
      warnings.push('Low confidence extraction - document may be image-based or corrupted');
    }

    return {
      text: options.preserveFormatting ? data.text : cleanExtractedText(data.text),
      confidence,
      method: 'pdf-parse',
      warnings,
      metadata: options.extractMetadata ? {
        pages: data.numpages,
        words: countWords(data.text),
        characters: data.text.length,
        encoding: 'utf-8',
      } : undefined,
    };
  } catch (error) {
    throw new Error(`pdf-parse failed: ${(error as Error).message}`);
  }
}

/**
 * Fallback PDF extraction strategy
 */
async function extractWithPdfLibFallback(
  uint8Array: Uint8Array,
  options: { extractMetadata?: boolean }
): Promise<TextExtractionResult> {
  try {
    // This is a simplified fallback that attempts to extract text streams
    const text = await extractPdfTextStreams(uint8Array);
    
    return {
      text: cleanExtractedText(text),
      confidence: 0.6, // Lower confidence for fallback method
      method: 'pdf-fallback',
      warnings: ['Used fallback PDF extraction method'],
      metadata: options.extractMetadata ? {
        words: countWords(text),
        characters: text.length,
        encoding: 'utf-8',
      } : undefined,
    };
  } catch (error) {
    throw new Error(`PDF fallback extraction failed: ${(error as Error).message}`);
  }
}

/**
 * Raw text extraction from PDF (last resort)
 */
async function extractPdfRawText(
  uint8Array: Uint8Array,
  options: { extractMetadata?: boolean }
): Promise<TextExtractionResult> {
  try {
    // Convert to string and look for text patterns
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const content = decoder.decode(uint8Array);
    
    // Extract readable text using regex patterns
    const textMatches = content.match(/\(([^)]+)\)/g) || [];
    const extractedText = textMatches
      .map(match => match.slice(1, -1))
      .filter(text => text.length > 2 && /[a-zA-Z]/.test(text))
      .join(' ');

    if (extractedText.length < 50) {
      throw new Error('Insufficient text extracted from PDF');
    }

    return {
      text: cleanExtractedText(extractedText),
      confidence: 0.4, // Very low confidence for raw extraction
      method: 'pdf-raw',
      warnings: ['Used raw PDF text extraction - quality may be poor'],
      metadata: options.extractMetadata ? {
        words: countWords(extractedText),
        characters: extractedText.length,
        encoding: 'utf-8',
      } : undefined,
    };
  } catch (error) {
    throw new Error(`Raw PDF extraction failed: ${(error as Error).message}`);
  }
}

/**
 * Enhanced Word document extraction
 */
async function extractFromWordDocument(
  uint8Array: Uint8Array,
  options: { preserveFormatting?: boolean; extractMetadata?: boolean }
): Promise<TextExtractionResult> {
  try {
    const mammoth = (await import('mammoth')).default;
    const buffer = Buffer.from(uint8Array);
    
    const extractionOptions = options.preserveFormatting 
      ? { 
          convertImage: (mammoth as any).images.ignoreAll,
          includeDefaultStyleMap: true,
        }
      : {
          convertImage: (mammoth as any).images.ignoreAll,
        };

    const result = await mammoth.extractRawText({
      buffer,
      ...extractionOptions,
    });
    
    const text = result.value;
    const warnings = result.messages?.map(msg => msg.message) || [];
    
    if (text.length < 20) {
      warnings.push('Very little text extracted - document may be mostly images');
    }

    return {
      text: options.preserveFormatting ? text : cleanExtractedText(text),
      confidence: calculateWordDocConfidence(text, warnings),
      method: 'mammoth',
      warnings,
      metadata: options.extractMetadata ? {
        words: countWords(text),
        characters: text.length,
        encoding: 'utf-8',
      } : undefined,
    };
  } catch (error) {
    throw new Error(`Word document extraction failed: ${(error as Error).message}`);
  }
}

/**
 * Enhanced text file extraction with encoding detection
 */
function extractFromTextFile(
  uint8Array: Uint8Array,
  options: { extractMetadata?: boolean }
): TextExtractionResult {
  const encodings = ['utf-8', 'utf-16', 'iso-8859-1', 'windows-1252'];
  let bestResult = { text: '', encoding: 'utf-8', confidence: 0 };

  for (const encoding of encodings) {
    try {
      const decoder = new TextDecoder(encoding, { fatal: true });
      const text = decoder.decode(uint8Array);
      
      // Score based on readable characters
      const confidence = calculateTextConfidence(text);
      
      if (confidence > bestResult.confidence) {
        bestResult = { text, encoding, confidence };
      }
    } catch {
      // Encoding failed, try next one
      continue;
    }
  }

  if (bestResult.confidence < 0.5) {
    throw new Error('Could not detect valid text encoding');
  }

  return {
    text: cleanExtractedText(bestResult.text),
    confidence: bestResult.confidence,
    method: 'text-decoder',
    warnings: bestResult.encoding !== 'utf-8' ? [`Detected encoding: ${bestResult.encoding}`] : [],
    metadata: options.extractMetadata ? {
      words: countWords(bestResult.text),
      characters: bestResult.text.length,
      encoding: bestResult.encoding,
    } : undefined,
  };
}

/**
 * Enhanced RTF extraction
 */
function extractFromRTF(
  uint8Array: Uint8Array,
  options: { extractMetadata?: boolean }
): TextExtractionResult {
  try {
    const decoder = new TextDecoder('utf-8');
    const rtfContent = decoder.decode(uint8Array);

    // Enhanced RTF parsing
    let text = rtfContent
      // Remove RTF header
      .replace(/^{\\rtf[^{]*/, '')
      // Remove control words with parameters
      .replace(/\\[a-z]+\d*\s?/gi, '')
      // Remove standalone control characters
      .replace(/\\[^a-z\s]/gi, '')
      // Remove braces
      .replace(/[{}]/g, '')
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();

    // Remove common RTF artifacts
    text = text
      .replace(/\\par\s*/g, '\n')
      .replace(/\\tab\s*/g, '\t')
      .replace(/\\line\s*/g, '\n')
      .replace(/\\\\/g, '\\')
      .replace(/\\'/g, "'");

    const confidence = calculateTextConfidence(text);
    const warnings: string[] = [];

    if (confidence < 0.6) {
      warnings.push('RTF parsing may be incomplete - complex formatting detected');
    }

    return {
      text: cleanExtractedText(text),
      confidence,
      method: 'rtf-enhanced',
      warnings,
      metadata: options.extractMetadata ? {
        words: countWords(text),
        characters: text.length,
        encoding: 'utf-8',
      } : undefined,
    };
  } catch (error) {
    throw new Error(`RTF extraction failed: ${(error as Error).message}`);
  }
}

/**
 * HTML extraction for web-based resumes
 */
function extractFromHTML(
  uint8Array: Uint8Array,
  options: { extractMetadata?: boolean }
): TextExtractionResult {
  try {
    const decoder = new TextDecoder('utf-8');
    const htmlContent = decoder.decode(uint8Array);

    // Remove script and style tags completely
    let text = htmlContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')  // Remove all HTML tags
      .replace(/&nbsp;/g, ' ')   // Replace HTML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, ' ')   // Remove numeric entities
      .replace(/\s+/g, ' ')      // Normalize whitespace
      .trim();

    return {
      text: cleanExtractedText(text),
      confidence: calculateTextConfidence(text),
      method: 'html-parser',
      warnings: ['HTML content converted to plain text'],
      metadata: options.extractMetadata ? {
        words: countWords(text),
        characters: text.length,
        encoding: 'utf-8',
      } : undefined,
    };
  } catch (error) {
    throw new Error(`HTML extraction failed: ${(error as Error).message}`);
  }
}

/**
 * Content-based file type detection and extraction
 */
async function extractByContentDetection(
  uint8Array: Uint8Array,
  options: { extractMetadata?: boolean }
): Promise<TextExtractionResult> {
  const sample = uint8Array.slice(0, 1024);
  const sampleText = new TextDecoder('utf-8', { fatal: false }).decode(sample);

  // Check for PDF signature
  if (sampleText.includes('%PDF-')) {
    return await extractFromPDF(uint8Array, { fallbackStrategies: true, extractMetadata: options.extractMetadata });
  }

  // Check for RTF signature
  if (sampleText.includes('{\\rtf')) {
    return extractFromRTF(uint8Array, options);
  }

  // Check for HTML
  if (sampleText.includes('<html') || sampleText.includes('<!DOCTYPE')) {
    return extractFromHTML(uint8Array, options);
  }

  // Check for Word document signatures
  if (sampleText.includes('PK') || uint8Array[0] === 0x50 && uint8Array[1] === 0x4B) {
    try {
      return await extractFromWordDocument(uint8Array, { extractMetadata: options.extractMetadata });
    } catch {
      // Fall through to text extraction
    }
  }

  // Default to text extraction
  return extractFromTextFile(uint8Array, options);
}

/**
 * Helper functions
 */

function calculatePdfConfidence(text: string, pages: number, info: any): number {
  let confidence = 0.8; // Base confidence for PDF

  // Adjust based on text quality
  const words = countWords(text);
  const avgWordsPerPage = words / pages;

  if (avgWordsPerPage < 10) confidence -= 0.3; // Very sparse text
  if (avgWordsPerPage > 200) confidence += 0.1; // Rich text content

  // Check for garbled text
  const garbledRatio = (text.match(/[^\w\s\-.,!?@()[\]{}:;"'\/\\]/g) || []).length / text.length;
  if (garbledRatio > 0.1) confidence -= 0.2;

  return Math.max(0.1, Math.min(1.0, confidence));
}

function calculateWordDocConfidence(text: string, warnings: string[]): number {
  let confidence = 0.9; // High base confidence for Word docs

  if (warnings.length > 0) confidence -= 0.1;
  if (text.length < 100) confidence -= 0.3;

  const garbledRatio = (text.match(/[^\w\s\-.,!?@()[\]{}:;"'\/\\]/g) || []).length / text.length;
  if (garbledRatio > 0.05) confidence -= 0.2;

  return Math.max(0.1, Math.min(1.0, confidence));
}

function calculateTextConfidence(text: string): number {
  if (text.length < 10) return 0.1;

  // Check for readable content
  const wordCount = countWords(text);
  const charCount = text.length;
  const avgWordLength = charCount / wordCount;

  let confidence = 0.7;

  // Reasonable average word length
  if (avgWordLength > 2 && avgWordLength < 15) confidence += 0.1;

  // Check for proper sentence structure
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
  if (sentences.length > 0) confidence += 0.1;

  // Check for excessive special characters
  const specialCharRatio = (text.match(/[^\w\s\-.,!?@()[\]{}:;"'\/\\]/g) || []).length / text.length;
  if (specialCharRatio > 0.2) confidence -= 0.3;

  return Math.max(0.1, Math.min(1.0, confidence));
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function cleanExtractedText(text: string): string {
  return text
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove excessive newlines
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // Remove leading/trailing whitespace
    .trim()
    // Remove null characters
    .replace(/\0/g, '')
    // Remove excessive punctuation
    .replace(/([.!?]){3,}/g, '$1$1$1')
    // Fix common OCR errors
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
    .replace(/(\d)([A-Za-z])/g, '$1 $2') // Add space between numbers and letters
    .replace(/([A-Za-z])(\d)/g, '$1 $2'); // Add space between letters and numbers
}

/**
 * Simplified PDF text stream extraction (fallback method)
 */
async function extractPdfTextStreams(uint8Array: Uint8Array): Promise<string> {
  // This is a very basic implementation for educational purposes
  // In production, you'd want to use a more robust PDF parsing library
  const content = new TextDecoder('latin1').decode(uint8Array);
  
  // Look for text objects in PDF
  const textMatches = content.match(/BT\s+(.*?)\s+ET/g) || [];
  let extractedText = '';

  for (const match of textMatches) {
    // Extract text from PDF text objects
    const textCommands = match.match(/\([^)]*\)\s*Tj/g) || [];
    for (const cmd of textCommands) {
      const text = cmd.match(/\(([^)]*)\)/);
      if (text && text[1]) {
        extractedText += text[1] + ' ';
      }
    }
  }

  return extractedText.trim();
}

/**
 * Validate extracted text quality with enhanced checks
 */
export function validateExtractedText(result: TextExtractionResult): {
  isValid: boolean;
  issues: string[];
  score: number;
} {
  const issues: string[] = [];
  let score = 100;

  // Basic text checks
  if (!result.text || result.text.trim().length === 0) {
    issues.push('No text was extracted from the file');
    score = 0;
  } else {
    // Length checks
    if (result.text.length < 50) {
      issues.push('Very little text was extracted - file may be corrupted or mostly images');
      score -= 30;
    } else if (result.text.length < 200) {
      issues.push('Limited text extracted - this may be a brief document');
      score -= 10;
    }

    // Confidence checks
    if (result.confidence < 0.3) {
      issues.push('Very low extraction confidence - text may be severely corrupted');
      score -= 40;
    } else if (result.confidence < 0.6) {
      issues.push('Low extraction confidence - some text may be inaccurate');
      score -= 20;
    }

    // Content quality checks
    const words = countWords(result.text);
    if (words < 10) {
      issues.push('Too few words extracted - document may not contain readable text');
      score -= 25;
    }

    // Check for garbled text
    const garbledTextPattern = /[^\w\s\-.,!?@()[\]{}:;"'\/\\]+/g;
    const garbledMatches = result.text.match(garbledTextPattern);
    if (garbledMatches && garbledMatches.length > words * 0.1) {
      issues.push('Text contains many special characters - may be garbled or corrupted');
      score -= 15;
    }

    // Check for repeated characters (OCR errors)
    const repeatedChars = result.text.match(/(.)\1{5,}/g);
    if (repeatedChars && repeatedChars.length > 3) {
      issues.push('Text contains repeated character patterns - may indicate OCR errors');
      score -= 10;
    }

    // Check for readable sentence structure
    const sentences = result.text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length === 0 && words > 20) {
      issues.push('No proper sentence structure detected - text may be fragmented');
      score -= 15;
    }
  }

  return {
    isValid: score >= 50 && issues.length < 3,
    issues,
    score: Math.max(0, score),
  };
}

/**
 * Get supported file formats with enhanced information
 */
export function getSupportedFormats(): {
  category: string;
  formats: string[];
  mimeTypes: string[];
  description: string;
  reliability: 'high' | 'medium' | 'low';
}[] {
  return [
    {
      category: 'PDF Documents',
      formats: ['.pdf'],
      mimeTypes: ['application/pdf'],
      description: 'Portable Document Format with multiple extraction strategies',
      reliability: 'high',
    },
    {
      category: 'Microsoft Word',
      formats: ['.docx', '.doc'],
      mimeTypes: [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ],
      description: 'Microsoft Word documents with excellent text extraction',
      reliability: 'high',
    },
    {
      category: 'Plain Text',
      formats: ['.txt'],
      mimeTypes: ['text/plain'],
      description: 'Plain text files with encoding detection',
      reliability: 'high',
    },
    {
      category: 'Rich Text Format',
      formats: ['.rtf'],
      mimeTypes: ['application/rtf', 'text/rtf'],
      description: 'Rich Text Format with enhanced parsing',
      reliability: 'medium',
    },
    {
      category: 'Web Documents',
      formats: ['.html', '.htm'],
      mimeTypes: ['text/html'],
      description: 'HTML documents converted to plain text',
      reliability: 'medium',
    },
  ];
}