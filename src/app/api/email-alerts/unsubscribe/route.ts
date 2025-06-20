import { NextRequest, NextResponse } from '@/components/ui/card';
import { z } from '@/components/ui/card';
import { randomBytes } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';

// Validation schemas
const unsubscribeSchema = z.object({
  email: z.string().email(),
  types: z.array(z.string()).optional(), // Specific email types to unsubscribe from
  unsubscribeAll: z.boolean().default(false),
  reason: z.string().optional(),
});

const tokenUnsubscribeSchema = z.object({
  token: z.string(),
  types: z.array(z.string()).optional(),
  unsubscribeAll: z.boolean().default(false),
  reason: z.string().optional(),
});

// POST /api/email-alerts/unsubscribe - Unsubscribe from emails
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (token) {
      // Token-based unsubscribe (from email links)
      const validatedData = tokenUnsubscribeSchema.parse({ ...body, token });

      // Find existing unsubscribe record by token
      let unsubscribeRecord = await prisma.emailUnsubscribe.findUnique({
        where: { unsubscribeToken: token },
        include: { user: true },
      });

      if (!unsubscribeRecord) {
        return NextResponse.json(
          { error: 'Invalid unsubscribe token' },
          { status: 400 }
        );
      }

      // Update unsubscribe preferences
      const updatedRecord = await prisma.emailUnsubscribe.update({
        where: { id: unsubscribeRecord.id },
        data: {
          unsubscribeFrom: validatedData.types || [],
          unsubscribeAll: validatedData.unsubscribeAll,
          reason: validatedData.reason,
          unsubscribedAt: new Date(),
        },
      });

      // If unsubscribing from all, disable all alerts for the user
      if (validatedData.unsubscribeAll && unsubscribeRecord?.userId) {
        await prisma.alert.updateMany({
          where: { userId: unsubscribeRecord.userId },
          data: { emailEnabled: false },
        });
      }

      return NextResponse.json({
        message: 'Successfully unsubscribed',
        unsubscribedFrom: validatedData.unsubscribeAll
          ? 'all emails'
          : validatedData.types || [],
      });
    } else {
      // Email-based unsubscribe
      const validatedData = unsubscribeSchema.parse(body);

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      // Generate unsubscribe token
      const unsubscribeToken = randomBytes(32).toString('hex');

      // Create or update unsubscribe record
      const unsubscribeRecord = await prisma.emailUnsubscribe.upsert({
        where: { email: validatedData.email },
        update: {
          unsubscribeFrom: validatedData.types || [],
          unsubscribeAll: validatedData.unsubscribeAll,
          reason: validatedData.reason,
          unsubscribedAt: new Date(),
        },
        create: {
          email: validatedData.email,
          userId: user?.id,
          unsubscribeFrom: validatedData.types || [],
          unsubscribeAll: validatedData.unsubscribeAll,
          unsubscribeToken,
          reason: validatedData.reason,
        },
      });

      // If unsubscribing from all and user exists, disable all alerts
      if (validatedData.unsubscribeAll && user) {
        await prisma.alert.updateMany({
          where: { userId: user.id },
          data: { emailEnabled: false },
        });
      }

      return NextResponse.json({
        message: 'Successfully unsubscribed',
        unsubscribedFrom: validatedData.unsubscribeAll
          ? 'all emails'
          : validatedData.types || [],
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/email-alerts/unsubscribe?token=xxx - Show unsubscribe page
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  const type = searchParams.get('type') || 'all';
  const token = searchParams.get('token');

  if (!email) {
    return new NextResponse(
      createUnsubscribeHTML(
        'Error',
        'Email address is required for unsubscription.'
      ),
      {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }

  // If token is provided, process unsubscription immediately
  if (token) {
    try {
      const unsubscribe = await prisma.emailUnsubscribe.findUnique({
        where: { unsubscribeToken: token },
      });

      if (!unsubscribe) {
        return new NextResponse(
          createUnsubscribeHTML('Error', 'Invalid unsubscribe token.'),
          {
            status: 400,
            headers: { 'Content-Type': 'text/html' },
          }
        );
      }

      if (unsubscribe.email !== email) {
        return new NextResponse(
          createUnsubscribeHTML(
            'Error',
            'Email address does not match the unsubscribe token.'
          ),
          {
            status: 400,
            headers: { 'Content-Type': 'text/html' },
          }
        );
      }

      // User is already unsubscribed
      const unsubscribeTypes =
        type === 'all' ? ['job_alert', 'weekly_digest'] : [type];
      const message =
        type === 'all'
          ? 'You have been unsubscribed from all emails.'
          : `You have been unsubscribed from ${type.replace('_', ' ')} emails.`;

      return new NextResponse(
        createUnsubscribeHTML('Unsubscribed', message, {
          showResubscribe: true,
          email,
          types: unsubscribeTypes,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    } catch (error) {
      console.error('Unsubscribe error:', error);
      return new NextResponse(
        createUnsubscribeHTML(
          'Error',
          'Failed to process unsubscription. Please try again.'
        ),
        {
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }
  }

  // Show unsubscribe confirmation page
  return new NextResponse(
    createUnsubscribeHTML('Confirm Unsubscription', null, {
      showConfirmation: true,
      email,
      type,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    }
  );
}

function createUnsubscribeHTML(
  title: string,
  message?: string | null,
  options?: {
    showConfirmation?: boolean;
    showResubscribe?: boolean;
    email?: string;
    type?: string;
    types?: string[];
  }
): string {
  const { showConfirmation, showResubscribe, email, type, types } =
    options || {};

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - 209jobs</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            padding: 40px;
            max-width: 500px;
            width: 100%;
            text-align: center;
        }
        
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 30px;
        }
        
        .title {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 30px;
            line-height: 1.5;
        }
        
        .form {
            margin: 30px 0;
        }
        
        .form-group {
            margin-bottom: 20px;
            text-align: left;
        }
        
        label {
            display: block;
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
        }
        
        input, select, textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.2s;
        }
        
        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #1e40af;
        }
        
        .checkbox-group {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .checkbox-group input[type="checkbox"] {
            width: auto;
            margin: 0;
        }
        
        .checkbox-group label {
            margin: 0;
            font-weight: normal;
            cursor: pointer;
        }
        
        .button {
            background: #1e40af;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
            margin: 10px;
        }
        
        .button:hover {
            background: #1e3a8a;
        }
        
        .button.secondary {
            background: #6b7280;
        }
        
        .button.secondary:hover {
            background: #4b5563;
        }
        
        .success {
            color: #059669;
        }
        
        .error {
            color: #dc2626;
        }
        
        .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #9ca3af;
        }
        
        .footer a {
            color: #1e40af;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">209jobs</div>
        <h1 class="title ${title.toLowerCase().includes('error') ? 'error' : title.toLowerCase().includes('unsubscribed') ? 'success' : ''}">${title}</h1>
        
        ${message ? `<p class="message">${message}</p>` : ''}
        
        ${
          showConfirmation
            ? `
        <div class="form">
            <p class="message">Are you sure you want to unsubscribe from ${type === 'all' ? 'all emails' : (type || 'unknown').replace('_', ' ') + ' emails'}?</p>
            
            <form id="unsubscribeForm">
                <div class="form-group">
                    <label for="reason">Reason for unsubscribing (optional):</label>
                    <select id="reason" name="reason">
                        <option value="">Select a reason</option>
                        <option value="too_many_emails">Too many emails</option>
                        <option value="not_relevant">Content not relevant</option>
                        <option value="found_job">Found a job</option>
                        <option value="changed_mind">Changed my mind</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="other_reason">Additional comments (optional):</label>
                    <textarea id="other_reason" name="other_reason" rows="3" placeholder="Tell us more..."></textarea>
                </div>
                
                <button type="submit" class="button">Confirm Unsubscribe</button>
                <a href="/" class="button secondary">Keep My Subscription</a>
            </form>
        </div>
        `
            : ''
        }
        
        ${
          showResubscribe
            ? `
        <div class="form">
            <p class="message">Changed your mind? You can resubscribe at any time.</p>
            <button id="resubscribeBtn" class="button secondary">Resubscribe</button>
        </div>
        `
            : ''
        }
        
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} 209jobs. All rights reserved.</p>
            <p><a href="/">Return to 209jobs</a> | <a href="/privacy">Privacy Policy</a></p>
        </div>
    </div>
    
    <script>
        ${
          showConfirmation
            ? `
        document.getElementById('unsubscribeForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const reason = document.getElementById('reason').value;
            const otherReason = document.getElementById('other_reason').value;
            const finalReason = reason === 'other' ? otherReason : reason;
            
            try {
                const response = await fetch('/api/email-alerts/unsubscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: '${email}',
                        type: '${type}',
                        reason: finalReason,
                    }),
                });
                
                const data = await response.json();
                
                if (data.success) {
                    document.querySelector('.container').innerHTML = \`
                        <div class="logo">209jobs</div>
                        <h1 class="title success">Successfully Unsubscribed</h1>
                        <p class="message">\${data.message}</p>
                        <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} 209jobs. All rights reserved.</p>
                            <p><a href="/">Return to 209jobs</a></p>
                        </div>
                    \`;
                } else {
                    alert('Failed to unsubscribe: ' + data.error);
                }
            } catch (error) {
                alert('Failed to unsubscribe. Please try again.');
            }
        });
        `
            : ''
        }
        
        ${
          showResubscribe
            ? `
        document.getElementById('resubscribeBtn').addEventListener('click', function() {
            // In a real implementation, you'd handle resubscription here
            alert('Resubscription feature coming soon! For now, please contact support or create a new account.');
        });
        `
            : ''
        }
    </script>
</body>
</html>
  `;
}
