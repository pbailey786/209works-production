import { NextRequest, NextResponse } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';
import bcrypt from 'bcryptjs';
import { EmailHelpers } from '@/lib/email/email-helpers';

console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
console.log('🔥 EMPLOYER SIGNUP API ROUTE LOADED! 🔥');
console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
console.log('🔍 DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log(
  '🔍 DATABASE_URL starts with postgresql:',
  process.env.DATABASE_URL?.startsWith('postgresql://')
);

export async function GET() {
  console.log('📞📞📞 GET REQUEST TO SIGNUP ENDPOINT! 📞📞📞');
  return NextResponse.json({
    message: 'Signup endpoint exists. Use POST to create an account.',
  });
}

export async function POST(req: NextRequest) {
  try {
    console.log('🚀🚀🚀 POST REQUEST TO SIGNUP STARTED! 🚀🚀🚀');
    console.log('🔍 DATABASE_URL check:', !!process.env.DATABASE_URL);

    const data = await req.json();
    console.log('📦 Data received:', data);

    const { email: rawEmail, password, fullName } = data;

    // Normalize email to lowercase
    const email = rawEmail?.toLowerCase();

    // TODO: Validate all required employer fields (companyName, etc.)
    if (!email || !password || !fullName) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    console.log('🔍 Existing user check:', existing);
    if (existing) {
      console.log('❌ Email already in use');
      return NextResponse.json(
        { message: 'Email already in use' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('🔒 Password hashed successfully');

    // Create employer user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name: fullName,
        role: 'employer',
        isEmailVerified: true,
        // TODO: Add other employer fields (companyName, companySize, etc.)
      },
    });
    console.log('✅ User created successfully!');

    // Send welcome email
    try {
      await EmailHelpers.sendWelcomeEmail(user.email, {
        userName: user.name || user.email.split('@')[0],
        userType: 'employer',
      }, {
        userId: user.id,
        priority: 'high',
      });
      console.log('📧 Welcome email sent successfully');
    } catch (emailError) {
      console.error('📧 Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    return NextResponse.json({ message: 'Account created' });
  } catch (error) {
    console.error('💥💥💥 SIGNUP ERROR:', error);
    return NextResponse.json(
      { message: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
