import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '@/app/api/auth/authOptions';
import { z } from 'zod';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

// Define the JobType enum to match Prisma schema
type JobType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'temporary' | 'volunteer' | 'other';

// Helper function to normalize job type formats
function normalizeJobType(jobType: string): JobType {
  if (!jobType) return 'full_time';

  const normalized = jobType.toLowerCase().trim();

  // Map common variations to our enum values
  const jobTypeMap: Record<string, JobType> = {
    'full-time': 'full_time',
    'full_time': 'full_time',
    'fulltime': 'full_time',
    'full time': 'full_time',
    'part-time': 'part_time',
    'part_time': 'part_time',
    'parttime': 'part_time',
    'part time': 'part_time',
    'contract': 'contract',
    'contractor': 'contract',
    'freelance': 'contract',
    'temporary': 'temporary',
    'temp': 'temporary',
    'temporary work': 'temporary',
    'internship': 'internship',
    'intern': 'internship',
    'student': 'internship',
    'volunteer': 'volunteer',
    'volunteering': 'volunteer',
  };

  return jobTypeMap[normalized] || 'full_time'; // Default to full_time if not found
}

// Define the ExperienceLevel enum to match Prisma schema
type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'executive';

// Helper function to normalize experience level
function normalizeExperienceLevel(level: string): ExperienceLevel {
  if (!level) return 'entry';

  const normalized = level.toLowerCase().trim();

  const levelMap: Record<string, ExperienceLevel> = {
    'entry': 'entry',
    'entry-level': 'entry',
    'entry level': 'entry',
    'junior': 'entry',
    'beginner': 'entry',
    'mid': 'mid',
    'mid-level': 'mid',
    'mid level': 'mid',
    'middle': 'mid',
    'intermediate': 'mid',
    'senior': 'senior',
    'senior-level': 'senior',
    'senior level': 'senior',
    'experienced': 'senior',
    'expert': 'senior',
    'executive': 'executive',
    'leadership': 'executive',
    'management': 'executive',
    'director': 'executive',
    'manager': 'executive',
  };

  return levelMap[normalized] || 'entry';
}

// Helper function to normalize boolean values
function normalizeBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    return normalized === 'true' || normalized === 'yes' || normalized === '1' ||
           normalized === 'remote' || normalized === 'featured';
  }
  return false;
}

// Schema for processed job validation
const processedJobSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  company: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  jobType: z.string().optional(),
  salary: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
});

// POST /api/employers/bulk-upload/process - Process uploaded file
export async function POST(request: NextRequest) {
  try {
    // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const optimizationSettingsStr = formData.get('optimizationSettings') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload a CSV, Excel, or JSON file.' 
      }, { status: 400 });
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File size too large. Please upload a file smaller than 10MB.' 
      }, { status: 400 });
    }

    let optimizationSettings;
    try {
      optimizationSettings = optimizationSettingsStr ? JSON.parse(optimizationSettingsStr) : {};
    } catch {
      optimizationSettings = {};
    }

    // Process the file based on type
    let jobs: any[] = [];
    
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      jobs = await processCSVFile(file);
    } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
      jobs = await processJSONFile(file);
    } else if (file.name.endsWith('.xlsx')) {
      // For now, treat Excel files as CSV (would need xlsx library for proper parsing)
      jobs = await processCSVFile(file);
    }

    if (jobs.length === 0) {
      return NextResponse.json({ 
        error: 'No valid jobs found in the file. Please check the format.' 
      }, { status: 400 });
    }

    // Process and normalize each job (validation already done in CSV processing)
    const processedJobs = jobs.map((job) => {
      // Calculate credits required based on optimization settings
      let creditsRequired = 1; // Base credit for job posting

      if (optimizationSettings.optimizationLevel === 'enhanced') {
        creditsRequired += 0.5;
      } else if (optimizationSettings.optimizationLevel === 'premium') {
        creditsRequired += 1;
      }

      if (optimizationSettings.generateGraphics) {
        creditsRequired += 1;
      }

      if (optimizationSettings.createFeatured) {
        creditsRequired += 2;
      }

      return {
        ...job, // Keep all fields from CSV processing including id, status, validationErrors
        title: job.title || '',
        company: job.company || '',
        location: job.location || '',
        jobType: normalizeJobType(job.jobtype || job.jobType || job.job_type || ''),
        salary: job.salary || '',
        description: job.description || '',
        requirements: job.requirements || '',
        benefits: job.benefits || '',
        experienceLevel: normalizeExperienceLevel(job.experiencelevel || job.experienceLevel || job.experience_level || ''),
        remote: normalizeBoolean(job.remote),
        featured: normalizeBoolean(job.featured),
        creditsRequired,
        optimized: false,
      };
    });

    return NextResponse.json({
      success: true,
      processedJobs,
      totalJobs: processedJobs.length,
      successfulJobs: processedJobs.filter(job => job.status === 'success').length,
      warningJobs: processedJobs.filter(job => job.status === 'warning').length,
      errorJobs: processedJobs.filter(job => job.status === 'error').length,
    });

  } catch (error) {
    console.error('Error processing bulk upload file:', error);
    return NextResponse.json(
      { error: 'Failed to process file. Please check the format and try again.' },
      { status: 500 }
    );
  }
}

// Helper function to process CSV files with proper parsing
async function processCSVFile(file: File): Promise<any[]> {
  const text = await file.text();
  const lines = text.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    throw new Error('File must contain at least a header row and one job');
  }

  // Parse CSV with proper handling of quoted fields and commas within quotes
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Handle escaped quotes
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add the last field
    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/"/g, ''));

  // Validate required headers
  const requiredHeaders = ['title', 'company', 'location', 'description'];
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(', ')}. Please ensure your CSV has these columns: ${requiredHeaders.join(', ')}`);
  }

  const jobs = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue; // Skip empty lines

    try {
      const values = parseCSVLine(line);
      const job: any = { csvRowIndex: i }; // Add unique index for tracking (not database ID)

      headers.forEach((header, index) => {
        let value = values[index] || '';
        // Clean up the value
        value = value.replace(/^["']|["']$/g, '').trim();
        job[header] = value;
      });

      // Validate required fields
      const errors = [];
      if (!job.title) errors.push('Title is required');
      if (!job.company) errors.push('Company is required');
      if (!job.location) errors.push('Location is required');
      if (!job.description || job.description.length < 10) errors.push('Description must be at least 10 characters');

      job.validationErrors = errors;
      job.status = errors.length === 0 ? 'success' : 'error';

      jobs.push(job);
    } catch (error) {
      // Handle malformed rows
      jobs.push({
        csvRowIndex: i,
        title: `Row ${i} - Parse Error`,
        company: '',
        location: '',
        description: '',
        validationErrors: [`Failed to parse row ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`],
        status: 'error'
      });
    }
  }

  return jobs;
}

// Helper function to process JSON files
async function processJSONFile(file: File): Promise<any[]> {
  const text = await file.text();
  const data = JSON.parse(text);
  
  if (Array.isArray(data)) {
    return data;
  } else if (data.jobs && Array.isArray(data.jobs)) {
    return data.jobs;
  } else {
    throw new Error('JSON file must contain an array of jobs or an object with a "jobs" array');
  }
}


