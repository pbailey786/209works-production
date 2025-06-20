import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

// GET /api/profile/resumes - Get user's resumes
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || user.role !== 'jobseeker') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's resumes
    const resumes = await prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      resumes: resumes.map(resume => ({
        id: resume.id,
        filename: resume.filename,
        url: resume.url,
        uploadedAt: resume.uploadedAt.toISOString(),
        isDefault: resume.isDefault,
        parsedData: resume.parsedData,
        aiSuggestions: resume.aiSuggestions,
      })),
    });
  } catch (error) {
    console.error('Error fetching resumes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resumes' },
      { status: 500 }
    );
  }
}
