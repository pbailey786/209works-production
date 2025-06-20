import { NextRequest, NextResponse } from '@/components/ui/card';
import { auth } from '@/components/ui/card';
import { redirect } from '@/components/ui/card';
import { templateManager } from '@/components/ui/card';
import { hasPermission, Permission } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role || 'guest';
    if (!hasPermission(userRole, Permission.MANAGE_EMAIL_TEMPLATES)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all templates
    const templates = templateManager.getAllTemplates();
    
    // Convert to array format for easier frontend consumption
    const templateList = Object.entries(templates).map(([id, template]) => ({
      id,
      name: template.name,
      description: template.description,
      category: template.category,
      requiredProps: template.requiredProps,
    }));

    return NextResponse.json({
      templates: templateList,
      total: templateList.length,
    });

  } catch (error) {
    console.error('[TEMPLATES-API] Error fetching templates:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
