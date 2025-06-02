import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { prisma } from '../prisma';
import { UserRole } from '@prisma/client';

export async function POST(req: NextRequest) {
  console.log('🚀 Registration API called');
  
  try {
    const body = await req.json();
    console.log('📝 Request body received');
    
    const { email, password, role } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Basic password validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    
    // Determine role (default to jobseeker)
    const assignedRole = role || UserRole.jobseeker;
    console.log('👤 Assigned role:', assignedRole);

    // Build user data object
    const userData = {
      email,
      passwordHash: await hash(password, 10),
      isEmailVerified: true, // Set to true for testing - in production, implement email verification
      role: assignedRole,
      magicLinkToken: randomBytes(32).toString('hex'),
      magicLinkExpires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
    };

    console.log('🔍 Checking for existing user...');
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log('❌ User already exists');
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }
    
    console.log('✅ User does not exist, creating new user...');
    
    // Create user
    const user = await prisma.user.create({ data: userData });
    console.log('✅ User created successfully:', user.id);
    
    console.log('🎉 Registration completed successfully');
    return NextResponse.json(
      { message: 'User registered successfully! You can now sign in.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('💥 Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
