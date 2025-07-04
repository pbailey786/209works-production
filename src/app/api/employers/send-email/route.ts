import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Check authentication with Clerk
    const clerkUser = await currentUser();

    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = clerkUser.emailAddresses[0].emailAddress;

    // Get the current user from database
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        employerProfile: true,
      },
    });

    if (!user || (user.role !== 'employer' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { 
      to, 
      subject, 
      message, 
      candidateId,
      templateUsed 
    } = await request.json();

    if (!to || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get employer profile for sender information
    const employerProfile = user.employerProfile;
    const senderName = employerProfile?.companyName || user.name || 'Employer';
    const replyTo = user.email;

    // Send email using Resend (if configured)
    let emailResult = null;
    let emailStatus = 'sent';
    let errorMessage = null;

    if (process.env.RESEND_API_KEY) {
      try {
        emailResult = await resend.emails.send({
          from: `${senderName} <noreply@209.works>`,
          to: [to],
          replyTo: replyTo,
          subject: subject,
          text: message,
          html: message.replace(/\n/g, '<br>'),
        });
      } catch (emailError) {
        console.error('Failed to send email via Resend:', emailError);
        emailStatus = 'failed';
        errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error';
      }
    } else {
      // In development mode without Resend, simulate successful send
      console.log('Email would be sent:', { to, subject, message });
      emailResult = { data: { id: 'dev-' + Date.now() } };
    }

    // Log the email in database for history tracking
    if (candidateId) {
      try {
        await prisma.emailLog.create({
          data: {
            toEmail: to,
            userId: user.id,
            subject,
            emailType: 'employer_candidate_communication',
            templateName: templateUsed || null,
            resendId: emailResult?.data?.id || null,
            status: emailStatus === 'sent' ? 'sent' : 'failed',
            statusMessage: errorMessage,
            sentAt: emailStatus === 'sent' ? new Date() : null,
            metadata: {
              candidateId,
              message,
            },
          },
        });
      } catch (dbError) {
        console.error('Failed to log email in database:', dbError);
        // Don't fail the request if logging fails
      }
    }

    if (emailStatus === 'failed') {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      messageId: emailResult?.data?.id 
    });

  } catch (error) {
    console.error('Error in send email API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
