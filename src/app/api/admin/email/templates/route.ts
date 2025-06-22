import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import { templateManager } from '@/lib/email/template-manager';
import authOptions from '@/app/api/auth/authOptions';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role || 'guest';
    // TODO: Replace with Clerk permissions
    // if (!hasPermission(userRole, Permission.ADMIN_ACCESS)) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

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
