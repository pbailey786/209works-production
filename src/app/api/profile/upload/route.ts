import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '../../auth/authOptions';
import { prisma } from '../../auth/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    // TODO: Replace with Clerk
  const session = { user: { role: "admin" } } // Mock session as Session | null;
    if (!session!.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user by email
    const currentUser = await prisma.user.findUnique({
      where: { email: session!.user?.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type || !['profile', 'resume'].includes(type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large (max 5MB)' },
        { status: 400 }
      );
    }

    // Validate file type
    if (type === 'profile') {
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid image format. Please use JPEG, PNG, or WebP.' },
          { status: 400 }
        );
      }
    } else if (type === 'resume') {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid resume format. Please use PDF, DOC, or DOCX.' },
          { status: 400 }
        );
      }
    }

    // For Netlify deployment, we'll store file data as base64 in database
    // In production, you should use cloud storage like AWS S3, Cloudinary, etc.
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    const mimeType = file.type;

    // Generate a data URL for the file
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    // For now, we'll use the data URL as the public URL
    // This is not ideal for large files but works for demo purposes
    const publicUrl = dataUrl;

    // Update user record
    const updateData =
      type === 'profile'
        ? { profilePictureUrl: publicUrl }
        : { resumeUrl: publicUrl };

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
      select: {
        id: true,
        profilePictureUrl: true,
        resumeUrl: true,
      },
    });

    return NextResponse.json({
      message: `${type === 'profile' ? 'Profile picture' : 'Resume'} uploaded successfully`,
      url: publicUrl,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
