import { createServerSupabaseClient } from './supabase';
import path from "path";

export async function saveResumeFile(
  file: File,
  userId: string
): Promise<string> {
  try {
    const supabase = createServerSupabaseClient();

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}_${timestamp}.${fileExtension}`;
    const filePath = `resumes/${fileName}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to save resume file');
  }
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
  fileInfo?: {
    size: string;
    type: string;
    category: string;
    reliability: 'high' | 'medium' | 'low';
  };
}

export function isValidResumeFile(file: File): FileValidationResult {
  // Enhanced supported file types with better reliability
  const allowedTypes = [
    // PDF documents (high priority)
    'application/pdf', // .pdf
    
    // Microsoft Word documents
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc

    // Plain text files
    'text/plain', // .txt

    // Rich Text Format
    'application/rtf', // .rtf
    'text/rtf', // .rtf (alternative MIME type)
    
    // HTML documents
    'text/html', // .html
    
    // Generic document types that browsers might set
    'application/octet-stream', // Generic binary (we'll validate by extension)
  ];

  const maxSize = 10 * 1024 * 1024; // Increased to 10MB for PDF support
  const warnings: string[] = [];

  // Get file extension for additional validation
  const extension = getFileExtension(file.name);
  const allowedExtensions = ['pdf', 'docx', 'doc', 'txt', 'rtf', 'html', 'htm'];

  // File size check
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File appears to be empty. Please select a valid resume file.',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large (${formatFileSize(file.size)}). Maximum size is 10MB.`,
    };
  }

  // Warn for large files
  if (file.size > 5 * 1024 * 1024) {
    warnings.push('Large file size may result in slower processing');
  }

  // Validate by MIME type and extension
  const isValidMimeType = allowedTypes.includes(file.type);
  const isValidExtension = allowedExtensions.includes(extension);

  // Special handling for generic MIME types
  if (file.type === 'application/octet-stream' || file.type === '') {
    if (!isValidExtension) {
      return {
        valid: false,
        error: `Unsupported file type. Please use: ${allowedExtensions.map(ext => ext.toUpperCase()).path.join(', ')}`,
      };
    }
    warnings.push('File type detected by extension - please ensure file is not corrupted');
  } else if (!isValidMimeType && !isValidExtension) {
    return {
      valid: false,
      error: `Unsupported file format (${file.type}). Supported formats: PDF, DOCX, DOC, TXT, RTF, HTML`,
    };
  }

  // Determine file category and reliability
  const { category, reliability } = getFileCategory(file.type, extension);

  // Add format-specific warnings
  if (extension === 'pdf' && file.size < 10 * 1024) {
    warnings.push('PDF file is very small - may contain minimal text');
  }

  if (extension === 'html' || extension === 'htm') {
    warnings.push('HTML files may contain formatting that affects text extraction');
  }

  if (reliability === 'low') {
    warnings.push('This file format may have reduced text extraction quality');
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    fileInfo: {
      size: formatFileSize(file.size),
      type: file.type,
      category,
      reliability,
    },
  };
}

export function getFileCategory(mimeType: string, extension: string): {
  category: string;
  reliability: 'high' | 'medium' | 'low';
} {
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return { category: 'PDF Document', reliability: 'high' };
  }
  
  if (mimeType.includes('wordprocessingml') || extension === 'docx') {
    return { category: 'Word Document (DOCX)', reliability: 'high' };
  }
  
  if (mimeType === 'application/msword' || extension === 'doc') {
    return { category: 'Word Document (DOC)', reliability: 'high' };
  }
  
  if (mimeType === 'text/plain' || extension === 'txt') {
    return { category: 'Text File', reliability: 'high' };
  }
  
  if (mimeType.includes('rtf') || extension === 'rtf') {
    return { category: 'Rich Text Format', reliability: 'medium' };
  }
  
  if (mimeType === 'text/html' || extension === 'html' || extension === 'htm') {
    return { category: 'HTML Document', reliability: 'medium' };
  }
  
  return { category: 'Unknown', reliability: 'low' };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
