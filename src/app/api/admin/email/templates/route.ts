import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { templateManager } from '@/lib/email/template-manager';
import authOptions from '@/app/api/auth/authOptions';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import type { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.email) {
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
