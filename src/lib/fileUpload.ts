import { createServerSupabaseClient } from './supabase';

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

export function isValidResumeFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Supported file types for resume parsing
  const allowedTypes = [
    // Microsoft Word documents
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc

    // PDF documents
    'application/pdf', // .pdf

    // Plain text files
    'text/plain', // .txt

    // Image files (for OCR)
    'image/jpeg', // .jpg, .jpeg
    'image/png', // .png
    'image/gif', // .gif
    'image/bmp', // .bmp
    'image/tiff', // .tiff
    'image/webp', // .webp

    // Rich Text Format
    'application/rtf', // .rtf
    'text/rtf', // .rtf (alternative MIME type)
  ];

  const maxSize = 10 * 1024 * 1024; // 10MB (increased for images)

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Supported formats: DOCX, DOC, PDF, TXT, JPG, PNG, GIF, BMP, TIFF, WEBP, RTF',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 10MB.',
    };
  }

  return { valid: true };
}
