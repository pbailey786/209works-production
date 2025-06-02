import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

console.log('🧪 Test API route loaded');

export async function GET() {
  console.log('🧪 Test API GET request received');
  
  try {
    // Check what users exist in the database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isEmailVerified: true,
        passwordHash: true,
      }
    });
    
    console.log('👥 Users in database:', users.length);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - verified: ${user.isEmailVerified}, has password: ${!!user.passwordHash}`);
    });
    
    return NextResponse.json({ 
      message: 'Database check complete',
      userCount: users.length,
      users: users.map(u => ({
        email: u.email,
        role: u.role,
        isEmailVerified: u.isEmailVerified,
        hasPassword: !!u.passwordHash
      }))
    });
  } catch (error) {
    console.error('💥 Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST() {
  console.log('🧪 Test API POST request received - Updating test user...');
  
  try {
    // Check current state
    const before = await prisma.user.findUnique({
      where: { email: 'test@test.com' },
      select: { email: true, isEmailVerified: true }
    });
    console.log('📋 Before update:', before);
    
    // Update the test user
    const updated = await prisma.user.update({
      where: { email: 'test@test.com' },
      data: { isEmailVerified: true }
    });
    console.log('✅ After update - isEmailVerified:', updated.isEmailVerified);
    
    return NextResponse.json({ 
      message: 'Test user updated!',
      wasVerified: before?.isEmailVerified,
      nowVerified: updated.isEmailVerified
    });
  } catch (error) {
    console.error('💥 Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 