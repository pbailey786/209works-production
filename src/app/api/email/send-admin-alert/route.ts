import { NextRequest, NextResponse } from '@/components/ui/card';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message } = await request.json();

    // Validate required fields
    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, message' },
        { status: 400 }
      );
    }

    // Only allow sending to admin email for security
    if (to !== 'paul@voodoo.rodeo') {
      return NextResponse.json(
        { error: 'Unauthorized recipient' },
        { status: 403 }
      );
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: '209 Works <alerts@209.works>',
      to: [to],
      subject: subject,
      text: message,
    });

    if (error) {
      console.error('Failed to send admin alert email:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    console.log('Admin alert email sent successfully:', data);
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Error in send-admin-alert API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
