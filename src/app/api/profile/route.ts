import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { ensureUserExists } from '@/lib/auth/user-sync';
import { compare, hash } from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    console.log('👤 Profile API called');
    
    // Ensure user exists in database (auto-sync with Clerk)
    const user = await ensureUserExists();
    console.log('✅ User sync completed:', user.id);

    // Get full user profile data
    const fullUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isEmailVerified: true,
        resumeUrl: true,
        coverLetterUrl: true,
        profilePictureUrl: true,
        location: true,
        phoneNumber: true,
        linkedinUrl: true,
        currentJobTitle: true,
        preferredJobTypes: true,
        skills: true,
        workAuthorization: true,
        educationExperience: true,
        isProfilePublic: true,
        // Gamification fields
        achievements: true,
        profileStrength: true,
        lastActivityDate: true,
      },
    });

    if (!fullUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    return NextResponse.json({ user: fullUser });
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    console.log('📝 Profile update API called');
    
    // Ensure user exists in database (auto-sync with Clerk)
    const user = await ensureUserExists();
    console.log('✅ User sync completed:', user.id);

    const {
      name,
      currentPassword,
      newPassword,
      location,
      phoneNumber,
      linkedinUrl,
      currentJobTitle,
      preferredJobTypes,
      skills,
      workAuthorization,
      educationExperience,
      isProfilePublic,
      // Gamification fields
      achievements,
      profileStrength,
      lastActivityDate,
    } = await req.json();

    // Get full user data for password validation if needed
    const fullUser = await prisma.user.findUnique({ 
      where: { email: user.email } 
    });
    
    if (!fullUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  const updateData: any = {};
  if (name) updateData.name = name;
  if (location !== undefined) updateData.location = location;
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
  if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl;
  if (currentJobTitle !== undefined)
    updateData.currentJobTitle = currentJobTitle;
  if (preferredJobTypes !== undefined)
    updateData.preferredJobTypes = preferredJobTypes;
  if (skills !== undefined) updateData.skills = skills;
  if (workAuthorization !== undefined)
    updateData.workAuthorization = workAuthorization;
  if (educationExperience !== undefined)
    updateData.educationExperience = educationExperience;
  if (isProfilePublic !== undefined)
    updateData.isProfilePublic = isProfilePublic;
  // Gamification fields
  if (achievements !== undefined) updateData.achievements = achievements;
  if (profileStrength !== undefined) updateData.profileStrength = profileStrength;
  if (lastActivityDate !== undefined) updateData.lastActivityDate = lastActivityDate;
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json(
        { error: 'Current password required' },
        { status: 400 }
      );
    }
    const isValid = await compare(currentPassword, fullUser.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid current password' },
        { status: 400 }
      );
    }
    updateData.passwordHash = await hash(newPassword, 10);
  }
  
  await prisma.user.update({ 
    where: { email: user.email }, 
    data: updateData 
  });
  
  return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // TODO: Replace with Clerk authentication
    const token = { email: 'admin@209.works', sub: 'admin-user-id' }; // Mock token
  if (!token || !token.email || !token.sub) {
    // Ensure token.sub (userId) is present
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.sub;
  const formData = await req.formData();
  const resumeFile = formData.get('resume') as File | null;
  const profilePictureFile = formData.get('profilePicture') as File | null;

  // Handle profile picture upload
  if (profilePictureFile) {
    // Validate image type and size (max 2MB)
    if (profilePictureFile.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image too large (max 2MB)' },
        { status: 400 }
      );
    }
    const allowedImageTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedImageTypes.includes(profilePictureFile.type)) {
      return NextResponse.json(
        { error: 'Invalid image type (JPEG, PNG, GIF, WEBP only)' },
        { status: 400 }
      );
    }
    const bytes = await profilePictureFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const originalFilename = profilePictureFile.name.replace(
      /[^a-zA-Z0-9._-]/g,
      ''
    );
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${originalFilename}`;
    const picDir = path.join(
      process.cwd(),
      'public',
      'profile-pictures',
      userId
    );
    const picPath = path.join(picDir, uniqueFilename);
    const picUrl = `/profile-pictures/${userId}/${uniqueFilename}`;
    try {
      await fs.mkdir(picDir, { recursive: true });
      await fs.writeFile(picPath, buffer);
      await prisma.user.update({
        where: { email: token.email },
        data: { profilePictureUrl: picUrl },
      });
      return NextResponse.json({ success: true, profilePictureUrl: picUrl });
    } catch (error) {
      console.error('Profile picture upload error:', error);
      try {
        await fs.unlink(picPath);
      } catch {}
      return NextResponse.json(
        { error: 'Failed to save profile picture' },
        { status: 500 }
      );
    }
  }

  // Handle resume upload (existing logic)
  if (resumeFile) {
    if (!resumeFile) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Basic validation (can be expanded)
    if (resumeFile.size > 5 * 1024 * 1024) {
      // 5MB limit
      return NextResponse.json(
        { error: 'File too large (max 5MB)' },
        { status: 400 }
      );
    }
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(resumeFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type (PDF, DOC, DOCX only)' },
        { status: 400 }
      );
    }

    const bytes = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename to prevent overwrites and ensure it's web-safe
    const originalFilename = resumeFile.name.replace(/[^a-zA-Z0-9._-]/g, ''); // Sanitize filename
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${originalFilename}`;

    // Define the path for saving the resume
    // Ensures the directory uses the userId to keep resumes organized and secure
    const resumeDir = path.join(process.cwd(), 'public', 'resumes', userId);
    const resumePath = path.join(resumeDir, uniqueFilename);
    const resumeUrl = `/resumes/${userId}/${uniqueFilename}`;

    try {
      // Ensure the user-specific directory exists
      await fs.mkdir(resumeDir, { recursive: true });

      // Write the file
      await fs.writeFile(resumePath, buffer);

      // Update user's resumeUrl in the database
      await prisma.user.update({
        where: { email: token.email },
        data: { resumeUrl: resumeUrl },
      });

      return NextResponse.json({ success: true, resumeUrl: resumeUrl });
    } catch (error) {
      console.error('Resume upload error:', error);
      // Attempt to clean up the saved file if DB update fails or other error occurs
      try {
        await fs.unlink(resumePath);
      } catch (cleanupError) {
        console.error('Error cleaning up failed resume upload:', cleanupError);
      }
      return NextResponse.json(
        { error: 'Failed to save resume' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: 'No valid file uploaded' },
    { status: 400 }
  );
}
