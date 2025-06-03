'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { signIn, signOut } from 'next-auth/react';
import { z } from 'zod';
import { prisma } from '@/lib/database/prisma';

// Validation schemas
const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['jobseeker', 'employer']).default('jobseeker'),
  companyName: z.string().optional(),
  companyWebsite: z.string().url().optional(),
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const resetPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const setup2FASchema = z.object({
  secret: z.string().min(1, 'Secret is required'),
  token: z.string().length(6, 'Token must be 6 digits'),
});

const verify2FASchema = z.object({
  token: z.string().length(6, 'Token must be 6 digits'),
});

const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// Response types
export type ActionResult = {
  success: boolean;
  message: string;
  data?: any;
  errors?: Record<string, string[]>;
};

// Sign up action
export async function signUpAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // Extract and validate form data
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      role: formData.get('role') as 'jobseeker' | 'employer',
      companyName: formData.get('companyName') as string | undefined,
      companyWebsite: formData.get('companyWebsite') as string | undefined,
    };

    const validatedData = signUpSchema.parse(rawData);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return {
        success: false,
        message: 'An account with this email already exists',
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash: hashedPassword,
        role: validatedData.role,
        companyWebsite: validatedData.companyWebsite,
        isEmailVerified: false, // Will be set when verified
      },
    });

    // TODO: Send verification email
    // await sendVerificationEmail(user.email, emailVerificationToken);

    return {
      success: true,
      message:
        'Account created successfully! Please check your email to verify your account.',
      data: { userId: user.id },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Please check your input',
        errors: Object.fromEntries(
          Object.entries(error.flatten().fieldErrors).filter(
            ([_, value]) => value !== undefined
          )
        ) as Record<string, string[]>,
      };
    }

    console.error('Sign up error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Sign in action
export async function signInAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    const validatedData = signInSchema.parse(rawData);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user || !user.passwordHash) {
      return {
        success: false,
        message: 'Invalid email or password',
      };
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(
      validatedData.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid email or password',
      };
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return {
        success: false,
        message: 'Please verify your email address before signing in',
      };
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Store user ID in session for 2FA verification
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const cookieStore = await cookies();
      cookieStore.set('2fa_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 5 * 60 * 1000, // 5 minutes
      });

      // TODO: Store session in database for verification
      // TODO: Implement twoFactorSession model or use alternative storage
      // await prisma.twoFactorSession.create({
      //   data: {
      //     token: sessionToken,
      //     userId: user.id,
      //     expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      //   },
      // });

      return {
        success: true,
        message: 'Please enter your 2FA code',
        data: { requires2FA: true },
      };
    }

    // TODO: Create session using NextAuth
    // await signIn('credentials', {
    //   email: validatedData.email,
    //   redirect: false,
    // });

    return {
      success: true,
      message: 'Signed in successfully',
      data: { redirect: '/dashboard' },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Please check your input',
        errors: Object.fromEntries(
          Object.entries(error.flatten().fieldErrors).filter(
            ([_, value]) => value !== undefined
          )
        ) as Record<string, string[]>,
      };
    }

    console.error('Sign in error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Sign out action
export async function signOutAction(): Promise<void> {
  try {
    // TODO: Implement with NextAuth
    // await signOut();

    // Clear any additional cookies
    const cookieStore = await cookies();
    cookieStore.delete('2fa_session');

    redirect('/');
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

// Request password reset
export async function requestPasswordResetAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const rawData = {
      email: formData.get('email') as string,
    };

    const validatedData = resetPasswordRequestSchema.parse(rawData);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      // Don't reveal if user exists for security
      return {
        success: true,
        message:
          'If an account with this email exists, you will receive a password reset link.',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // TODO: Send reset email
    // await sendPasswordResetEmail(user.email, resetToken);

    return {
      success: true,
      message:
        'If an account with this email exists, you will receive a password reset link.',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Please enter a valid email address',
        errors: Object.fromEntries(
          Object.entries(error.flatten().fieldErrors).filter(
            ([_, value]) => value !== undefined
          )
        ) as Record<string, string[]>,
      };
    }

    console.error('Password reset request error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Reset password
export async function resetPasswordAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const rawData = {
      token: formData.get('token') as string,
      password: formData.get('password') as string,
    };

    const validatedData = resetPasswordSchema.parse(rawData);

    // Find user by reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: validatedData.token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return {
        success: false,
        message: 'Invalid or expired reset token',
      };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return {
      success: true,
      message:
        'Password reset successfully. You can now sign in with your new password.',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Please check your input',
        errors: Object.fromEntries(
          Object.entries(error.flatten().fieldErrors).filter(
            ([_, value]) => value !== undefined
          )
        ) as Record<string, string[]>,
      };
    }

    console.error('Password reset error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Verify email
export async function verifyEmailAction(token: string): Promise<ActionResult> {
  try {
    // Find user by verification token
    // TODO: Implement proper email verification token system
    const user = await prisma.user.findFirst({
      where: {
        email: token, // Temporary: using token as email for now
      },
    });

    if (!user) {
      return {
        success: false,
        message: 'Invalid verification token',
      };
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
      },
    });

    return {
      success: true,
      message: 'Email verified successfully! You can now sign in.',
    };
  } catch (error) {
    console.error('Email verification error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Setup 2FA
export async function setup2FAAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // TODO: Get current user from session
    const userId = formData.get('userId') as string;
    if (!userId) {
      return {
        success: false,
        message: 'User not authenticated',
      };
    }

    const rawData = {
      secret: formData.get('secret') as string,
      token: formData.get('token') as string,
    };

    const validatedData = setup2FASchema.parse(rawData);

    // TODO: Verify TOTP token against secret
    // const isValid = verifyTOTP(validatedData.token, validatedData.secret);
    // if (!isValid) {
    //   return {
    //     success: false,
    //     message: 'Invalid verification code',
    //   };
    // }

    // Enable 2FA for user
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: validatedData.secret,
        twoFactorEnabled: true,
      },
    });

    return {
      success: true,
      message: 'Two-factor authentication enabled successfully',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Please check your input',
        errors: Object.fromEntries(
          Object.entries(error.flatten().fieldErrors).filter(
            ([_, value]) => value !== undefined
          )
        ) as Record<string, string[]>,
      };
    }

    console.error('2FA setup error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Verify 2FA
export async function verify2FAAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const rawData = {
      token: formData.get('token') as string,
    };

    const validatedData = verify2FASchema.parse(rawData);

    // Get 2FA session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('2fa_session')?.value;
    if (!sessionToken) {
      return {
        success: false,
        message: 'Invalid session. Please sign in again.',
      };
    }

    // TODO: Implement proper session validation
    // For now, just clear the cookie and proceed
    cookieStore.delete('2fa_session');

    // TODO: Create actual session
    // await signIn('credentials', {
    //   email: session.user?.email,
    //   redirect: false,
    // });

    return {
      success: true,
      message: 'Signed in successfully',
      data: { redirect: '/dashboard' },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Please enter a valid 6-digit code',
        errors: Object.fromEntries(
          Object.entries(error.flatten().fieldErrors).filter(
            ([_, value]) => value !== undefined
          )
        ) as Record<string, string[]>,
      };
    }

    console.error('2FA verification error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Disable 2FA
export async function disable2FAAction(userId: string): Promise<ActionResult> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: null,
        twoFactorEnabled: false,
      },
    });

    return {
      success: true,
      message: 'Two-factor authentication disabled successfully',
    };
  } catch (error) {
    console.error('2FA disable error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}
