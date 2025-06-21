/**
 * File Processing Utilities
 * Handles file reading, text extraction, and processing
 */

// PDF processing will be handled with a fallback approach
// import { PDFExtract } from 'pdf.js-extract';

export interface TextExtractionResult {
  success: boolean;
  text: string;
  error?: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    fileSize?: number;
    processingTime?: number;
  };
}

export class FileProcessingService {
  /**
   * Extract text from various file types
   */
  static async extractTextFromFile(file: File): Promise<TextExtractionResult> {
    const startTime = Date.now();
    
    try {
      let text = '';
      
      switch (file.type) {
        case 'application/pdf':
          text = await this.extractFromPDF(file);
          break;
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          text = await this.extractFromWord(file);
          break;
        case 'text/plain':
          text = await this.extractFromText(file);
          break;
        case 'text/rtf':
          text = await this.extractFromRTF(file);
          break;
        default:
          return {
            success: false,
            text: '',
            error: `Unsupported file type: ${file.type}`
          };
      }

      const processingTime = Date.now() - startTime;
      const wordCount = this.countWords(text);

      return {
        success: true,
        text: this.cleanExtractedText(text),
        metadata: {
          wordCount,
          fileSize: file.size,
          processingTime
        }
      };
    } catch (error) {
      return {
        success: false,
        text: '',
        error: error instanceof Error ? error.message : 'Unknown error during text extraction'
      };
    }
  }

  /**
   * Extract text from PDF files
   */
  private static async extractFromPDF(file: File): Promise<string> {
    try {
      // For now, we'll use a basic approach since pdf.js-extract is not available
      // In production, you would install and use a proper PDF parsing library

      // Basic fallback - try to read as text (will work for some simple PDFs)
      const arrayBuffer = await file.arrayBuffer();
      const text = new TextDecoder().decode(arrayBuffer);

      // Look for readable text patterns
      const readableText = text
        .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ') // Remove control characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      // If we found some readable text, return it
      if (readableText.length > 50) {
        return readableText;
      }

      // If no readable text found, return a message
      throw new Error('PDF text extraction requires additional setup. Please use a plain text file or Word document for now.');
    } catch (error) {
      throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from Word documents
   */
  private static async extractFromWord(file: File): Promise<string> {
    // For Word documents, we'll need a library like mammoth.js
    // For now, return a placeholder implementation
    try {
      // This is a simplified implementation
      // In production, you'd use mammoth.js or similar
      const arrayBuffer = await file.arrayBuffer();
      
      // Basic text extraction (this is very limited)
      const text = new TextDecoder().decode(arrayBuffer);
      
      // Clean up binary data and extract readable text
      const cleanText = text
        .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ') // Remove control characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      if (cleanText.length < 50) {
        throw new Error('Unable to extract meaningful text from Word document');
      }

      return cleanText;
    } catch (error) {
      throw new Error(`Word document processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from plain text files
   */
  private static async extractFromText(file: File): Promise<string> {
    try {
      const text = await file.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error('Text file is empty');
      }

      return text;
    } catch (error) {
      throw new Error(`Text file processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from RTF files
   */
  private static async extractFromRTF(file: File): Promise<string> {
    try {
      const rtfContent = await file.text();
      
      // Basic RTF to text conversion
      // Remove RTF control words and formatting
      let text = rtfContent
        .replace(/\\[a-z]+\d*\s?/g, '') // Remove RTF control words
        .replace(/[{}]/g, '') // Remove braces
        .replace(/\\\\/g, '\\') // Unescape backslashes
        .replace(/\\'/g, "'") // Unescape quotes
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      if (text.length < 50) {
        throw new Error('Unable to extract meaningful text from RTF document');
      }

      return text;
    } catch (error) {
      throw new Error(`RTF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean extracted text
   */
  private static cleanExtractedText(text: string): string {
    return text
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Remove excessive line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Remove leading/trailing whitespace
      .trim()
      // Remove null characters
      .replace(/\0/g, '')
      // Remove other control characters except newlines and tabs
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  /**
   * Count words in text
   */
  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Extract metadata from file
   */
  static async extractFileMetadata(file: File): Promise<{
    name: string;
    size: number;
    type: string;
    lastModified: Date;
    extension: string;
  }> {
    const extension = file.name.substring(file.name.lastIndexOf('.'));
    
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified),
      extension
    };
  }

  /**
   * Convert file to base64
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove data URL prefix
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Compress text for storage
   */
  static compressText(text: string): string {
    // Simple compression by removing extra whitespace
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  /**
   * Extract keywords from text
   */
  static extractKeywords(text: string, maxKeywords: number = 20): string[] {
    // Simple keyword extraction
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Count word frequency
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Sort by frequency and return top keywords
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  /**
   * Detect language of text
   */
  static detectLanguage(text: string): string {
    // Simple language detection based on common words
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const spanishWords = ['el', 'la', 'y', 'o', 'pero', 'en', 'de', 'con', 'por', 'para'];
    
    const lowerText = text.toLowerCase();
    
    const englishCount = englishWords.reduce((count, word) => {
      return count + (lowerText.split(word).length - 1);
    }, 0);
    
    const spanishCount = spanishWords.reduce((count, word) => {
      return count + (lowerText.split(word).length - 1);
    }, 0);
    
    if (englishCount > spanishCount) {
      return 'en';
    } else if (spanishCount > englishCount) {
      return 'es';
    } else {
      return 'unknown';
    }
  }
}

// Export convenience function
export const extractTextFromFile = FileProcessingService.extractTextFromFile.bind(FileProcessingService);
