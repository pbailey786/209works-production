import { prisma } from '@/lib/database/prisma';
import OpenAI from 'openai';


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class ResumeEmbeddingService {
  private static readonly EMBEDDING_MODEL = 'text-embedding-3-small';
  private static readonly MAX_TOKENS = 8000; // Conservative limit for embeddings

  /**
   * Process and store resume embedding for a user
   */
  static async processResumeEmbedding(userId: string, resumeText: string): Promise<void> {
    try {
      console.log(`🔍 Processing resume embedding for user: ${userId}`);

      // Clean and preprocess the resume text
      const processedText = this.preprocessResumeText(resumeText);
      
      // Extract structured data from resume
      const extractedData = await this.extractResumeData(processedText);
      
      // Generate embedding
      const embedding = await this.generateEmbedding(processedText);
      
      // Store in database
      await this.storeResumeEmbedding(userId, {
        rawText: resumeText,
        processedText,
        embedding: JSON.stringify(embedding),
        ...extractedData
      });

      console.log(`✅ Resume embedding processed successfully for user: ${userId}`);
    } catch (error) {
      console.error(`❌ Failed to process resume embedding for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Clean and preprocess resume text
   */
  private static preprocessResumeText(resumeText: string): string {
    // Remove extra whitespace and normalize
    let cleaned = resumeText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    // Remove email addresses and phone numbers for privacy
    cleaned = cleaned
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
      .replace(/\b\d{3}\s\d{3}\s\d{4}\b/g, '[PHONE]');

    // Truncate if too long (keeping most important sections first)
    if (cleaned.length > this.MAX_TOKENS * 4) { // Rough estimate: 4 chars per token
      cleaned = cleaned.substring(0, this.MAX_TOKENS * 4);
    }

    return cleaned;
  }

  /**
   * Extract structured data from resume using OpenAI
   */
  private static async extractResumeData(resumeText: string): Promise<{
    skills: string[];
    experience: string[];
    education: string[];
    jobTitles: string[];
    industries: string[];
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a resume parser. Extract structured data from the resume and return ONLY a valid JSON object with these exact fields:
            {
              "skills": [],
              "experience": [],
              "education": [],
              "jobTitles": [],
              "industries": []
            }

            Guidelines:
            - skills: Technical skills, soft skills, certifications (max 20 items)
            - experience: Years of experience or experience levels (e.g., "5 years", "senior level")
            - education: Degrees, institutions, relevant coursework (max 10 items)
            - jobTitles: Previous job titles and roles (max 15 items)
            - industries: Industries worked in (e.g., "healthcare", "technology", "retail")
            
            Return only the JSON object, no other text.`
          },
          {
            role: 'user',
            content: resumeText
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content);
      
      // Validate and clean the response
      return {
        skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 20) : [],
        experience: Array.isArray(parsed.experience) ? parsed.experience.slice(0, 10) : [],
        education: Array.isArray(parsed.education) ? parsed.education.slice(0, 10) : [],
        jobTitles: Array.isArray(parsed.jobTitles) ? parsed.jobTitles.slice(0, 15) : [],
        industries: Array.isArray(parsed.industries) ? parsed.industries.slice(0, 10) : []
      };
    } catch (error) {
      console.error('Failed to extract resume data:', error);
      // Return empty arrays if extraction fails
      return {
        skills: [],
        experience: [],
        education: [],
        jobTitles: [],
        industries: []
      };
    }
  }

  /**
   * Generate embedding vector for resume text
   */
  private static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: this.EMBEDDING_MODEL,
        input: text,
        encoding_format: 'float'
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  /**
   * Store resume embedding in database
   */
  private static async storeResumeEmbedding(userId: string, data: {
    rawText: string;
    processedText: string;
    embedding: string;
    skills: string[];
    experience: string[];
    education: string[];
    jobTitles: string[];
    industries: string[];
  }): Promise<void> {
    await prisma.resumeEmbedding.upsert({
      where: { userId },
      update: {
        ...data,
        lastJobProcessed: new Date(),
        updatedAt: new Date()
      },
      create: {
        userId,
        ...data
      }
    });
  }

  /**
   * Get resume embedding for a user
   */
  static async getResumeEmbedding(userId: string) {
    return await prisma.resumeEmbedding.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            location: true,
            lastLoginAt: true
          }
        }
      }
    });
  }

  /**
   * Check if a user needs their resume re-processed
   */
  static async needsReprocessing(userId: string): Promise<boolean> {
    const embedding = await prisma.resumeEmbedding.findUnique({
      where: { userId },
      select: {
        lastJobProcessed: true,
        updatedAt: true
      }
    });

    if (!embedding) {
      return true; // No embedding exists
    }

    // Check if embedding is older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return embedding.lastJobProcessed < thirtyDaysAgo;
  }

  /**
   * Get all users who need resume embeddings processed
   */
  static async getUsersNeedingProcessing(limit: number = 50): Promise<Array<{
    userId: string;
    resumeUrl: string | null;
    lastLoginAt: Date | null;
  }>> {
    // Get users who are opted in for alerts and have been active recently
    const activeUsers = await prisma.user.findMany({
      where: {
        role: 'jobseeker',
        isActive: true,
        deletedAt: null,
        lastLoginAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        },
        jobSeekerProfile: {
          optInEmailAlerts: true
        },
        resumeUrl: {
          not: null
        },
        // Users without embeddings OR with old embeddings
        OR: [
          {
            resumeEmbedding: null
          },
          {
            resumeEmbedding: {
              lastJobProcessed: {
                lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          }
        ]
      },
      select: {
        id: true,
        resumeUrl: true,
        lastLoginAt: true
      },
      take: limit,
      orderBy: {
        lastLoginAt: 'desc'
      }
    });

    return activeUsers.map(user => ({
      userId: user.id,
      resumeUrl: user.resumeUrl,
      lastLoginAt: user.lastLoginAt
    }));
  }

  /**
   * Batch process multiple users' resumes
   */
  static async batchProcessResumes(userIds: string[]): Promise<{
    successful: string[];
    failed: Array<{ userId: string; error: string }>;
  }> {
    const successful: string[] = [];
    const failed: Array<{ userId: string; error: string }> = [];

    for (const userId of userIds) {
      try {
        // Get user's resume
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { resumeUrl: true }
        });

        if (!user?.resumeUrl) {
          failed.push({ userId, error: 'No resume URL found' });
          continue;
        }

        // TODO: Fetch resume content from URL and extract text
        // For now, we'll skip users without processed resume text
        // In a real implementation, you'd use a PDF parser or file processing service
        
        console.log(`⏭️ Skipping user ${userId} - resume processing not implemented yet`);
        // This would be: await this.processResumeEmbedding(userId, resumeText);
        
      } catch (error) {
        failed.push({ 
          userId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Calculate cosine similarity between two embedding vectors
   */
  static calculateCosineSimilarity(embeddingA: number[], embeddingB: number[]): number {
    if (embeddingA.length !== embeddingB.length) {
      throw new Error('Embedding vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < embeddingA.length; i++) {
      dotProduct += embeddingA[i] * embeddingB[i];
      normA += embeddingA[i] * embeddingA[i];
      normB += embeddingB[i] * embeddingB[i];
    }

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    
    // Convert to percentage (0-100)
    return Math.max(0, Math.min(100, similarity * 100));
  }

  /**
   * Generate embedding for job description
   */
  static async generateJobEmbedding(jobDescription: string): Promise<number[]> {
    const processedDescription = this.preprocessJobDescription(jobDescription);
    return await this.generateEmbedding(processedDescription);
  }

  /**
   * Preprocess job description for embedding
   */
  private static preprocessJobDescription(jobDescription: string): string {
    // Clean and normalize job description
    let cleaned = jobDescription
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    // Truncate if too long
    if (cleaned.length > this.MAX_TOKENS * 4) {
      cleaned = cleaned.substring(0, this.MAX_TOKENS * 4);
    }

    return cleaned;
  }
}