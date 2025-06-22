import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '@/app/api/auth/authOptions';
import { Resend } from 'resend';
import { z } from 'zod';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

// Lazy-load Resend client to avoid build-time errors
function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is required');
  }
  return new Resend(process.env.RESEND_API_KEY);
}

// Validation schema for support request
const supportSchema = z.object({
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  page: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.string().optional(),
});

// POST /api/support/bulk-upload - Send support message for bulk upload issues
export async function POST(request: NextRequest) {
  try {
    // TODO: Replace with Clerk
  const session = { user: { role: "admin" } } // Mock session as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = supportSchema.parse(body);
    
    const { message, page, userAgent, timestamp } = validatedData;
    
    // Get user info for context
    const userEmail = session.user.email;
    const userName = session.user.name || 'Unknown User';
    
    // Prepare support email content
    const supportEmailContent = `
New Support Request - Bulk Upload Page

User Information:
- Name: ${userName}
- Email: ${userEmail}
- Page: ${page || 'bulk-upload'}
- Timestamp: ${timestamp || new Date().toISOString()}
- User Agent: ${userAgent || 'Not provided'}

Message:
${message}

---
This message was sent from the 209 Works Bulk Upload support form.
Please respond to the user at: ${userEmail}
    `.trim();

    // Send email using Resend
    if (process.env.RESEND_API_KEY) {
      const resend = getResendClient();
      await resend.emails.send({
        from: process.env.RESEND_EMAIL_FROM || 'noreply@209.works',
        to: process.env.SUPPORT_EMAIL || 'support@209.works',
        subject: `[209 Works Support] Bulk Upload Help Request from ${userName}`,
        text: supportEmailContent,
        replyTo: userEmail,
      });
    }

    // Log the support request for tracking
    console.log('Bulk upload support request:', {
      userEmail,
      userName,
      page,
      messageLength: message.length,
      timestamp: new Date().toISOString(),
    });

    // TODO: If Genie is available, we could also try to provide an immediate AI response
    // For now, we'll just send to human support
    
    return NextResponse.json({
      success: true,
      message: 'Your support request has been sent successfully. Our team will get back to you within 24 hours.',
      ticketId: `BU-${Date.now()}`, // Simple ticket ID for reference
    });

  } catch (error) {
    console.error('Support request error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please check your message and try again.',
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'There was an error sending your support request. Please try again or email support@209.works directly.',
      },
      { status: 500 }
    );
  }
}

// GET /api/support/bulk-upload - Get support information (for future use)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return support information and FAQ
    return NextResponse.json({
      success: true,
      supportInfo: {
        email: 'support@209.works',
        responseTime: '24 hours',
        businessHours: 'Mon-Fri 9AM-6PM PST',
      },
      commonIssues: [
        {
          issue: 'File format not supported',
          solution: 'Make sure your file is in CSV, Excel (.xlsx), or JSON format.',
        },
        {
          issue: 'Jobs not processing correctly',
          solution: 'Check that your file has the required columns: title, location, description.',
        },
        {
          issue: 'Not enough credits',
          solution: 'Purchase additional credits or upgrade your subscription plan.',
        },
        {
          issue: 'Upload taking too long',
          solution: 'Try uploading smaller batches (under 100 jobs) or check your internet connection.',
        },
      ],
      genieAvailable: false, // TODO: Set to true when Genie support is implemented
    });

  } catch (error) {
    console.error('Error fetching support info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support information' },
      { status: 500 }
    );
  }
}
