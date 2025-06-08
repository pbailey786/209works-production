/**
 * Text extraction utilities for different file formats
 * Supports DOCX, DOC, PDF, TXT, and image files (with OCR)
 */

export interface TextExtractionResult {
  text: string;
  confidence?: number;
  method: string;
  warnings?: string[];
}

/**
 * Extract text from different file types
 */
export async function extractTextFromFile(
  buffer: ArrayBuffer,
  mimeType: string,
  fileName?: string
): Promise<TextExtractionResult> {
  try {
    const uint8Array = new Uint8Array(buffer);

    // Microsoft Word documents (.docx, .doc)
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword') {
      return await extractFromWordDocument(uint8Array);
    }
    
    // PDF documents
    if (mimeType === 'application/pdf') {
      return await extractFromPDF(uint8Array);
    }
    
    // Plain text files
    if (mimeType === 'text/plain') {
      return extractFromTextFile(uint8Array);
    }
    
    // RTF files
    if (mimeType === 'application/rtf' || mimeType === 'text/rtf') {
      return extractFromRTF(uint8Array);
    }
    
    // Image files (OCR)
    if (mimeType.startsWith('image/')) {
      return await extractFromImage(uint8Array, mimeType);
    }

    throw new Error(`Unsupported file type: ${mimeType}`);
  } catch (error: any) {
    console.error('Text extraction error:', error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

/**
 * Extract text from Microsoft Word documents
 */
async function extractFromWordDocument(uint8Array: Uint8Array): Promise<TextExtractionResult> {
  try {
    const mammoth = (await import('mammoth')).default;
    const result = await mammoth.extractRawText({
      buffer: Buffer.from(uint8Array),
    });
    
    return {
      text: result.value,
      method: 'mammoth',
      warnings: result.messages?.map(msg => msg.message)
    };
  } catch (error: any) {
    throw new Error(`Failed to parse Word document: ${error.message}`);
  }
}

/**
 * Extract text from PDF files
 */
async function extractFromPDF(uint8Array: Uint8Array): Promise<TextExtractionResult> {
  try {
    // Try to dynamically import pdf-parse
    const pdfParse = (await import('pdf-parse')).default;
    const result = await pdfParse(Buffer.from(uint8Array));
    
    return {
      text: result.text,
      method: 'pdf-parse',
      confidence: result.numpages > 0 ? 0.9 : 0.5
    };
  } catch (error: any) {
    // Fallback: Return a helpful message if pdf-parse is not available
    console.warn('PDF parsing not available:', error.message);
    throw new Error('PDF parsing is temporarily unavailable. Please convert to DOCX or use a different format.');
  }
}

/**
 * Extract text from plain text files
 */
function extractFromTextFile(uint8Array: Uint8Array): TextExtractionResult {
  const decoder = new TextDecoder('utf-8');
  const text = decoder.decode(uint8Array);
  
  return {
    text,
    method: 'text-decoder',
    confidence: 1.0
  };
}

/**
 * Extract text from RTF files (basic implementation)
 */
function extractFromRTF(uint8Array: Uint8Array): TextExtractionResult {
  const decoder = new TextDecoder('utf-8');
  const rtfContent = decoder.decode(uint8Array);
  
  // Basic RTF text extraction (removes RTF control codes)
  // This is a simplified implementation - for production, consider using a proper RTF parser
  const text = rtfContent
    .replace(/\\[a-z]+\d*\s?/g, '') // Remove RTF control words
    .replace(/[{}]/g, '') // Remove braces
    .replace(/\\\\/g, '\\') // Unescape backslashes
    .replace(/\\'/g, "'") // Unescape quotes
    .trim();
  
  return {
    text,
    method: 'rtf-basic',
    confidence: 0.7,
    warnings: ['Basic RTF parsing - some formatting may be lost']
  };
}

/**
 * Extract text from images using OCR
 */
async function extractFromImage(uint8Array: Uint8Array, mimeType: string): Promise<TextExtractionResult> {
  try {
    // Try to dynamically import Tesseract.js
    const Tesseract = await import('tesseract.js');
    
    // Convert Uint8Array to Blob for Tesseract
    const blob = new Blob([uint8Array], { type: mimeType });
    
    const { data: { text, confidence } } = await Tesseract.recognize(blob, 'eng', {
      logger: m => console.log('OCR Progress:', m)
    });
    
    return {
      text: text.trim(),
      method: 'tesseract-ocr',
      confidence: confidence / 100, // Convert to 0-1 scale
      warnings: confidence < 70 ? ['Low OCR confidence - text may be inaccurate'] : undefined
    };
  } catch (error: any) {
    // Fallback: Return a helpful message if OCR is not available
    console.warn('OCR not available:', error.message);
    throw new Error('Image text extraction (OCR) is temporarily unavailable. Please convert to DOCX, PDF, or TXT format.');
  }
}

/**
 * Validate extracted text quality
 */
export function validateExtractedText(result: TextExtractionResult): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (!result.text || result.text.trim().length === 0) {
    issues.push('No text was extracted from the file');
  }
  
  if (result.text.length < 50) {
    issues.push('Very little text was extracted - file may be corrupted or mostly images');
  }
  
  if (result.confidence && result.confidence < 0.5) {
    issues.push('Low extraction confidence - text may be inaccurate');
  }
  
  // Check for common OCR errors or garbled text
  const garbledTextPattern = /[^\w\s\-.,!?@()[\]{}:;"'\/\\]+/g;
  const garbledMatches = result.text.match(garbledTextPattern);
  if (garbledMatches && garbledMatches.length > 10) {
    issues.push('Text appears to contain many special characters - may be garbled');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Get supported file formats information
 */
export function getSupportedFormats(): {
  category: string;
  formats: string[];
  description: string;
}[] {
  return [
    {
      category: 'Microsoft Word',
      formats: ['.docx', '.doc'],
      description: 'Best quality text extraction'
    },
    {
      category: 'PDF Documents',
      formats: ['.pdf'],
      description: 'Good quality for text-based PDFs'
    },
    {
      category: 'Plain Text',
      formats: ['.txt'],
      description: 'Perfect quality for plain text'
    },
    {
      category: 'Rich Text',
      formats: ['.rtf'],
      description: 'Good quality with basic formatting'
    },
    {
      category: 'Images (OCR)',
      formats: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'],
      description: 'Variable quality depending on image clarity'
    }
  ];
}
