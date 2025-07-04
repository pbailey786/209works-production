import { z } from 'zod';

export const noteTypeEnum = z.enum([
  'general',
  'interview', 
  'skills',
  'follow_up',
  'concern',
  'positive'
]);

export const createNoteSchema = z.object({
  content: z.string()
    .min(1, 'Note content is required')
    .max(2000, 'Note content must be less than 2000 characters')
    .trim(),
  type: noteTypeEnum.default('general'),
  isPrivate: z.boolean().default(false)
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type NoteType = z.infer<typeof noteTypeEnum>;

// Sanitize HTML content to prevent XSS
export function sanitizeNoteContent(content: string): string {
  // Remove all HTML tags and decode entities
  return content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .trim();
}