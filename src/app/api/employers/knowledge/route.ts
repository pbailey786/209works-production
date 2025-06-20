import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { CompanyKnowledgeService } from '@/lib/knowledge/company-knowledge';
import { prisma } from '@/lib/database/prisma';
import { prisma } from '@/lib/database/prisma';

// GET /api/employers/knowledge - Get company knowledge entries
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an employer and get their company
    const user = await prisma.user.findUnique({
      where: { email: user?.emailAddresses?.[0]?.emailAddress },
      include: { company: true },
    });

    if (!user || user.role !== 'employer' || !user.company) {
      return NextResponse.json(
        {
          error: 'Access denied. Must be an employer with a company.',
        },
        { status: 403 }
      );
    }

    // Get URL parameters
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const query = searchParams.get('query');

    // Get company knowledge
    const companyInfo = await CompanyKnowledgeService.getCompanyInfo(
      user.company.name
    );

    if (!companyInfo) {
      return NextResponse.json(
        {
          error: 'Company not found',
        },
        { status: 404 }
      );
    }

    // Filter entries if parameters provided
    let entries = companyInfo.knowledgeEntries;

    if (category) {
      entries = entries.filter(entry => entry.category === category);
    }

    if (query) {
      const searchLower = query.toLowerCase();
      entries = entries.filter(
        entry =>
          entry.title.toLowerCase().includes(searchLower) ||
          entry.content.toLowerCase().includes(searchLower) ||
          entry.keywords.some(keyword =>
            keyword.toLowerCase().includes(searchLower)
          )
      );
    }

    // Get analytics
    const analytics =
      await CompanyKnowledgeService.getCompanyKnowledgeAnalytics(
        user.company.id
      );

    return NextResponse.json({
      success: true,
      company: {
        id: companyInfo.id,
        name: companyInfo.name,
        slug: companyInfo.slug,
      },
      entries,
      analytics,
      totalEntries: companyInfo.knowledgeEntries.length,
      categories: [
        'culture',
        'benefits',
        'hiring_process',
        'perks',
        'career_growth',
        'work_environment',
        'compensation',
        'remote_policy',
        'diversity_inclusion',
        'company_values',
        'interview_process',
        'onboarding',
        'training',
        'general_info',
      ],
    });
  } catch (error) {
    console.error('Error fetching company knowledge:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST /api/employers/knowledge - Add new knowledge entry
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an employer and get their company
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true },
    });

    if (!user || user.role !== 'employer' || !user.company) {
      return NextResponse.json(
        {
          error: 'Access denied. Must be an employer with a company.',
        },
        { status: 403 }
      );
    }

    const { category, title, content, keywords, priority } = await req.json();

    // Validate required fields
    if (!category || !title || !content) {
      return NextResponse.json(
        {
          error: 'Category, title, and content are required',
        },
        { status: 400 }
      );
    }

    // Create knowledge entry
    const entry = await CompanyKnowledgeService.addCompanyKnowledge({
      companyId: user.company.id,
      category,
      title,
      content,
      keywords: keywords || [],
      source: 'company_provided',
      priority: priority || 0,
    });

    if (!entry) {
      return NextResponse.json(
        {
          error: 'Failed to create knowledge entry',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      entry,
      message: 'Knowledge entry created successfully',
    });
  } catch (error) {
    console.error('Error creating knowledge entry:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/employers/knowledge - Update knowledge entry
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an employer and get their company
    const user = await prisma.user.findUnique({
      where: { email: user?.emailAddresses?.[0]?.emailAddress },
      include: { company: true },
    });

    if (!user || user.role !== 'employer' || !user.company) {
      return NextResponse.json(
        {
          error: 'Access denied. Must be an employer with a company.',
        },
        { status: 403 }
      );
    }

    const { entryId, category, title, content, keywords, priority } =
      await req.json();

    if (!entryId) {
      return NextResponse.json(
        {
          error: 'Entry ID is required',
        },
        { status: 400 }
      );
    }

    // Verify the entry belongs to the user's company
    const existingEntry = await prisma.companyKnowledge.findFirst({
      where: {
        id: entryId,
        companyId: user.company.id,
      },
    });

    if (!existingEntry) {
      return NextResponse.json(
        {
          error: 'Knowledge entry not found or access denied',
        },
        { status: 404 }
      );
    }

    // Update the entry
    const updatedEntry = await CompanyKnowledgeService.updateCompanyKnowledge(
      entryId,
      {
        category,
        title,
        content,
        keywords,
        priority,
      }
    );

    if (!updatedEntry) {
      return NextResponse.json(
        {
          error: 'Failed to update knowledge entry',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      entry: updatedEntry,
      message: 'Knowledge entry updated successfully',
    });
  } catch (error) {
    console.error('Error updating knowledge entry:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/employers/knowledge - Delete knowledge entry
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an employer and get their company
    const user = await prisma.user.findUnique({
      where: { email: user?.emailAddresses?.[0]?.emailAddress },
      include: { company: true },
    });

    if (!user || user.role !== 'employer' || !user.company) {
      return NextResponse.json(
        {
          error: 'Access denied. Must be an employer with a company.',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const entryId = searchParams.get('entryId');

    if (!entryId) {
      return NextResponse.json(
        {
          error: 'Entry ID is required',
        },
        { status: 400 }
      );
    }

    // Verify the entry belongs to the user's company
    const existingEntry = await prisma.companyKnowledge.findFirst({
      where: {
        id: entryId,
        companyId: user.company.id,
      },
    });

    if (!existingEntry) {
      return NextResponse.json(
        {
          error: 'Knowledge entry not found or access denied',
        },
        { status: 404 }
      );
    }

    // Delete the entry
    const deleted =
      await CompanyKnowledgeService.deleteCompanyKnowledge(entryId);

    if (!deleted) {
      return NextResponse.json(
        {
          error: 'Failed to delete knowledge entry',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Knowledge entry deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting knowledge entry:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
