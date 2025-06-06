import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Link,
} from '@react-email/components';

interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
}

export default function PasswordResetEmail({
  userName = 'User',
  resetUrl = '#',
}: PasswordResetEmailProps) {
  const previewText = 'Reset your 209 Works password';

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>209 Works</Text>
            <Text style={tagline}>Password Reset Request</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Hi {userName},</Text>
            
            <Text style={intro}>
              We received a request to reset your password for your 209 Works account. 
              If you made this request, click the button below to create a new password.
            </Text>

            {/* Security Alert Box */}
            <Section style={alertBox}>
              <Text style={alertIcon}>🔒</Text>
              <div>
                <Text style={alertTitle}>Security Notice</Text>
                <Text style={alertText}>
                  This password reset link will expire in 1 hour for your security. 
                  If you didn't request this reset, you can safely ignore this email.
                </Text>
              </div>
            </Section>

            {/* Reset Button */}
            <Section style={buttonSection}>
              <Button style={resetButton} href={resetUrl}>
                Reset My Password
              </Button>
            </Section>

            {/* Alternative Link */}
            <Text style={alternativeText}>
              If the button above doesn't work, copy and paste this link into your browser:
            </Text>
            <Text style={linkText}>
              <Link href={resetUrl} style={linkStyle}>
                {resetUrl}
              </Link>
            </Text>

            {/* Security Tips */}
            <Section style={tipsSection}>
              <Text style={tipsTitle}>Password Security Tips:</Text>
              <div style={tipsList}>
                <Text style={tipItem}>• Use at least 8 characters</Text>
                <Text style={tipItem}>• Include uppercase and lowercase letters</Text>
                <Text style={tipItem}>• Add numbers and special characters</Text>
                <Text style={tipItem}>• Avoid using personal information</Text>
                <Text style={tipItem}>• Don't reuse passwords from other accounts</Text>
              </div>
            </Section>

            {/* Help Section */}
            <Section style={helpSection}>
              <Text style={helpTitle}>Need Help?</Text>
              <Text style={helpText}>
                If you're having trouble resetting your password or didn't request this reset, 
                please contact our support team at{' '}
                <Link href="mailto:support@209.works" style={helpLink}>
                  support@209.works
                </Link>{' '}
                or visit our{' '}
                <Link href="https://209.works/support" style={helpLink}>
                  help center
                </Link>.
              </Text>
            </Section>

            <Text style={footer}>
              Stay secure,
              <br />
              The 209 Works Security Team
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerText}>
              This email was sent to you because a password reset was requested for your 209 Works account.
              <br />
              If you didn't make this request, please ignore this email or contact support.
            </Text>
            <Text style={copyrightText}>
              © {new Date().getFullYear()} 209 Works. All rights reserved.
              <br />
              Serving the 209 area with secure, local job connections.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 20px',
  textAlign: 'center' as const,
  backgroundColor: '#dc2626',
  color: '#ffffff',
};

const logo = {
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
};

const tagline = {
  fontSize: '14px',
  margin: '8px 0 0 0',
  opacity: 0.9,
};

const content = {
  padding: '20px',
};

const greeting = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 16px 0',
};

const intro = {
  fontSize: '16px',
  color: '#374151',
  lineHeight: '1.6',
  margin: '0 0 24px 0',
};

const alertBox = {
  display: 'flex',
  alignItems: 'flex-start',
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const alertIcon = {
  fontSize: '20px',
  margin: '0 12px 0 0',
  lineHeight: '1',
};

const alertTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#dc2626',
  margin: '0 0 4px 0',
};

const alertText = {
  fontSize: '14px',
  color: '#7f1d1d',
  lineHeight: '1.5',
  margin: '0',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const resetButton = {
  backgroundColor: '#dc2626',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
};

const alternativeText = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '24px 0 8px 0',
  textAlign: 'center' as const,
};

const linkText = {
  textAlign: 'center' as const,
  margin: '0 0 24px 0',
};

const linkStyle = {
  color: '#dc2626',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
};

const tipsSection = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  margin: '32px 0',
};

const tipsTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 12px 0',
};

const tipsList = {
  margin: '0',
};

const tipItem = {
  fontSize: '14px',
  color: '#374151',
  margin: '4px 0',
  lineHeight: '1.5',
};

const helpSection = {
  margin: '32px 0',
};

const helpTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 8px 0',
};

const helpText = {
  fontSize: '14px',
  color: '#6b7280',
  lineHeight: '1.6',
  margin: '0',
};

const helpLink = {
  color: '#dc2626',
  textDecoration: 'underline',
};

const footer = {
  fontSize: '16px',
  color: '#6b7280',
  margin: '32px 0 0 0',
  textAlign: 'center' as const,
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
};

const footerSection = {
  padding: '0 20px',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '16px 0 8px 0',
  lineHeight: '1.5',
};

const copyrightText = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '8px 0 0 0',
  lineHeight: '1.5',
};
