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
  // Currently supported file types (working without additional packages)
  const allowedTypes = [
    // Microsoft Word documents
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc

    // Plain text files
    'text/plain', // .txt

    // Rich Text Format
    'application/rtf', // .rtf
    'text/rtf', // .rtf (alternative MIME type)
  ];

  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Currently supported formats: DOCX, DOC, TXT, RTF. PDF and image support coming soon!',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 5MB.',
    };
  }

  return { valid: true };
}
