import { NextRequest, NextResponse } from 'next/server';
import { templateManager } from '@/lib/email/template-manager';
import { requireAuth } from '@/app/api/auth/requireAuth';
import { requireRole } from '@/app/api/auth/requireRole';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roleResult = await requireRole(authResult.user, 'admin');
    if (!roleResult.success) {
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
