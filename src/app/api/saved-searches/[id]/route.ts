import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';

// Validation schemas
const updateSavedSearchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  query: z.string().min(1).max(500).optional(),
  filters: z.record(z.any()).optional(),
  alertEnabled: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/saved-searches/[id] - Get a specific saved search
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const savedSearch = await prisma.savedSearch.findFirst({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!savedSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      savedSearch: {
        ...savedSearch,
        filters: savedSearch.filters ? JSON.parse(savedSearch.filters) : null,
      },
    });
  } catch (error) {
    console.error('Error fetching saved search:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved search' },
      { status: 500 }
    );
  }
}

// PUT /api/saved-searches/[id] - Update a saved search
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const updateData = updateSavedSearchSchema.parse(body);

    // Check if the saved search exists and belongs to the user
    const existingSearch = await prisma.savedSearch.findFirst({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!existingSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      );
    }

    // If updating name, check for duplicates
    if (updateData.name && updateData.name !== existingSearch.name) {
      const duplicateName = await prisma.savedSearch.findFirst({
        where: {
          userId,
          name: updateData.name,
          isActive: true,
          id: { not: params.id },
        },
      });

      if (duplicateName) {
        return NextResponse.json(
          { error: 'A saved search with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updatePayload: any = {
      ...updateData,
      updatedAt: new Date(),
    };

    if (updateData.filters !== undefined) {
      updatePayload.filters = updateData.filters ? JSON.stringify(updateData.filters) : null;
    }

    // Update the saved search
    const updatedSearch = await prisma.savedSearch.update({
      where: { id: params.id },
      data: updatePayload,
    });

    return NextResponse.json({
      success: true,
      message: 'Saved search updated successfully',
      savedSearch: {
        ...updatedSearch,
        filters: updatedSearch.filters ? JSON.parse(updatedSearch.filters) : null,
      },
    });
  } catch (error) {
    console.error('Error updating saved search:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update saved search' },
      { status: 500 }
    );
  }
}

// DELETE /api/saved-searches/[id] - Delete a saved search
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if the saved search exists and belongs to the user
    const existingSearch = await prisma.savedSearch.findFirst({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!existingSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.savedSearch.update({
      where: { id: params.id },
      data: { 
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Saved search deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting saved search:', error);
    return NextResponse.json(
      { error: 'Failed to delete saved search' },
      { status: 500 }
    );
  }
}
