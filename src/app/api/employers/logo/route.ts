import { NextRequest, NextResponse } from 'next/server';
import { auth as getServerSession } from "@/auth";
import { prisma } from '@/lib/database/prisma';
import type { Session } from 'next-auth';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession() as Session | null;
    if (!session || !session.user || (session!.user as any).role !== 'employer') {
      return NextResponse.json(
        { error: 'Authentication required. Only employers can upload logos.' },
        { status: 401 }
      );
    }

    // Get current user by email
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.' },
        { status: 400 }
      );
    }

    // Validate file size (2MB limit for logos)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Please upload an image smaller than 2MB.' },
        { status: 400 }
      );
    }

    // Convert file to base64 for storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    const mimeType = file.type;

    // Generate a data URL for the file
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    // Update user record with logo URL
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: { companyLogo: dataUrl },
      select: {
        id: true,
        companyLogo: true,
        companyName: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Company logo uploaded successfully!',
      logoUrl: dataUrl,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { error: 'Failed to upload logo. Please try again.' },
      { status: 500 }
    );
  }
}

// GET /api/employers/logo - Get current logo
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession() as Session | null;
    if (!session || !session.user || (session!.user as any).role !== 'employer') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { 
        id: true, 
        companyLogo: true,
        companyName: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      logoUrl: user.companyLogo,
      companyName: user.companyName,
    });
  } catch (error) {
    console.error('Error fetching logo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logo' },
      { status: 500 }
    );
  }
}

// DELETE /api/employers/logo - Remove logo
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession() as Session | null;
    if (!session || !session.user || (session!.user as any).role !== 'employer') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove logo from user record
    await prisma.user.update({
      where: { id: user.id },
      data: { companyLogo: null },
    });

    return NextResponse.json({
      success: true,
      message: 'Logo removed successfully',
    });
  } catch (error) {
    console.error('Error removing logo:', error);
    return NextResponse.json(
      { error: 'Failed to remove logo' },
      { status: 500 }
    );
  }
}
