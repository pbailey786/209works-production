import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

// GET /api/company-profile - Get company profile for authenticated user
export async function GET() {
  try {
    console.log('🏢 Company profile API - GET request started');
    // TODO: Replace with Clerk
  const session = { user: { role: "admin" } } // Mock session as Session | null;
    console.log('🏢 Session check:', {
      hasSession: !!session,
      userEmail: session?.user?.email,
      userId: (session?.user as any)?.id,
    });

    if (!(session?.user as any)?.id) {
      console.log('❌ Company profile API - No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has employer role
    const user = await prisma.user.findUnique({
      where: { id: (session?.user as any)?.id },
      include: {
        company: true,
      },
    });

    console.log('🏢 User lookup result:', {
      userFound: !!user,
      userRole: user?.role,
      hasCompany: !!user?.company,
      companyName: user?.company?.name,
    });

    if (!user || (user.role !== 'employer' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - must be employer' },
        { status: 403 }
      );
    }

    console.log('✅ Company profile API - Returning company data');
    return NextResponse.json({
      company: user.company,
      hasProfile: !!user.company,
    });
  } catch (error) {
    console.error('Error fetching company profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/company-profile - Create or update company profile
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      website,
      industry,
      size,
      founded,
      headquarters,
      contactEmail,
      contactPhone,
      logo,
    } = body;

    // Validate required fields
    if (!name || !industry || !contactEmail) {
      return NextResponse.json(
        {
          error: 'Company name, industry, and contact email are required',
        },
        { status: 400 }
      );
    }

    // Check if user has employer role
    const user = await prisma.user.findUnique({
      where: { id: (session?.user as any)?.id },
    });

    if (!user || (user.role !== 'employer' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - must be employer' },
        { status: 403 }
      );
    }

    // Create slug from company name
    const createSlug = (name: string) => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    };

    const slug = createSlug(name);

    // Check if company with this name/slug already exists (but not for this user)
    const existingCompany = await prisma.company.findFirst({
      where: {
        OR: [{ name: { equals: name, mode: 'insensitive' } }, { slug: slug }],
        users: {
          none: {
            id: (session?.user as any)?.id,
          },
        },
      },
    });

    if (existingCompany) {
      return NextResponse.json(
        {
          error: 'A company with this name already exists',
        },
        { status: 400 }
      );
    }

    let company;

    if (user.companyId) {
      // Update existing company
      company = await prisma.company.update({
        where: { id: user.companyId },
        data: {
          name,
          slug: createSlug(name),
          description: description || null,
          website: website || null,
          industry: industry || null,
          size: size || null,
          founded: founded ? parseInt(founded) : null,
          headquarters: headquarters || null,
          contactEmail: contactEmail || null,
          contactPhone: contactPhone || null,
          logo: logo || null,
        },
      });
    } else {
      // Create new company and link to user
      company = await prisma.company.create({
        data: {
          name,
          slug,
          description: description || null,
          website: website || null,
          industry: industry || null,
          size: size || null,
          founded: founded ? parseInt(founded) : null,
          headquarters: headquarters || null,
          contactEmail: contactEmail || null,
          contactPhone: contactPhone || null,
          logo: logo || null,
          users: {
            connect: { id: (session?.user as any)?.id },
          },
        },
      });

      // Update user with company ID
      await prisma.user.update({
        where: { id: (session?.user as any)?.id },
        data: { companyId: company.id },
      });
    }

    return NextResponse.json({
      message: 'Company profile saved successfully',
      company,
    });
  } catch (error) {
    console.error('Error saving company profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
