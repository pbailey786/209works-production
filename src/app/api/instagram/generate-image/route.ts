import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import InstagramImageGenerator from '@/lib/services/instagram-image-generator';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const generateImageSchema = z.object({
  jobId: z.string().optional(),
  jobData: z.object({
    jobTitle: z.string(),
    company: z.string(),
    location: z.string(),
    salary: z.string().optional(),
    jobType: z.string(),
    postedDate: z.string().optional(),
  }).optional(),
  options: z.object({
    template: z.enum(['modern', 'classic', 'minimal', 'gradient']).optional(),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    brandColor: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
});

const prisma = new PrismaClient();
const imageGenerator = new InstagramImageGenerator();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = generateImageSchema.parse(body);

    let imageBuffer: Buffer;

    if (validatedData.jobId) {
      // Generate image from job ID
      const job = await prisma.job.findUnique({
        where: { id: validatedData.jobId }
      });

      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      imageBuffer = await imageGenerator.generateFromJob(job, validatedData.options);
    } else if (validatedData.jobData) {
      // Generate image from provided job data
      imageBuffer = await imageGenerator.generateJobImage(
        validatedData.jobData,
        validatedData.options
      );
    } else {
      return NextResponse.json(
        { error: 'Either jobId or jobData must be provided' },
        { status: 400 }
      );
    }

    // Return the image as base64 for preview
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    return NextResponse.json({
      image: dataUrl,
      size: imageBuffer.length,
      format: 'png',
    });
  } catch (error) {
    console.error('Error generating Instagram image:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return available templates and options
    const templates = InstagramImageGenerator.getAvailableTemplates();
    
    return NextResponse.json({
      templates,
      defaultOptions: {
        width: 1080,
        height: 1080,
        backgroundColor: '#1a1a1a',
        textColor: '#ffffff',
        brandColor: '#3b82f6',
      },
      supportedFormats: ['png'],
    });
  } catch (error) {
    console.error('Error fetching image generation options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch options' },
      { status: 500 }
    );
  }
} 