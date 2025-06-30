import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = clerkUser.emailAddresses[0].emailAddress;

    // Get the user's employer profile
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { company: true }
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({ error: 'Not an employer account' }, { status: 403 });
    }

    const { logo } = await request.json();

    if (!logo) {
      return NextResponse.json({ error: 'No logo provided' }, { status: 400 });
    }

    // Validate base64 image
    if (!logo.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }

    // Check file size (approximate - base64 is ~33% larger than binary)
    const sizeInBytes = (logo.length * 3) / 4;
    if (sizeInBytes > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 400 });
    }

    // Update company logo if company exists
    if (user.companyId) {
      const updatedCompany = await prisma.company.update({
        where: { id: user.companyId },
        data: { logo }
      });

      return NextResponse.json({ 
        success: true, 
        logo: updatedCompany.logo,
        message: 'Logo updated successfully' 
      });
    } else {
      // If no company yet, store in user profile temporarily  
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          companyLogo: logo,
        }
      });

      return NextResponse.json({ 
        success: true, 
        logo,
        message: 'Logo saved to profile' 
      });
    }
  } catch (error) {
    console.error('Logo upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload logo' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = clerkUser.emailAddresses[0].emailAddress;

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { company: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return company logo if available, otherwise user company logo field
    const logo = user.company?.logo || user.companyLogo || null;

    return NextResponse.json({ logo });
  } catch (error) {
    console.error('Logo fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logo' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = clerkUser.emailAddresses[0].emailAddress;

    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({ error: 'Not an employer account' }, { status: 403 });
    }

    if (user.companyId) {
      await prisma.company.update({
        where: { id: user.companyId },
        data: { logo: null }
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Logo removed successfully' 
    });
  } catch (error) {
    console.error('Logo delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete logo' },
      { status: 500 }
    );
  }
}