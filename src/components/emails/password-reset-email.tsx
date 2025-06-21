

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
  const previewText = '🔒 Reset your 209 Works password - secure link inside';

  return (
    <Html>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>209 Works</Text>
            <Text style={tagline}>🔒 Password Reset Request</Text>
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
              <Section style={alertContent}>
                <Text style={alertTitle}>Security Notice</Text>
                <Text style={alertText}>
                  This password reset link will expire in <strong>1 hour</strong> for your security. 
                  If you didn't request this reset, you can safely ignore this email.
                </Text>
              </Section>
            </Section>

            {/* Reset Button */}
            <Section style={buttonSection}>
              <Button style={resetButton} href={resetUrl}>
                🔑 Reset My Password
              </Button>
            </Section>

            {/* Alternative Link */}
            <Text style={alternativeText}>
              If the button above doesn't work, copy and paste this link into your browser:
            </Text>
            <Section style={linkContainer}>
              <Text style={linkText}>
                <Link href={resetUrl} style={linkStyle}>
                  {resetUrl}
                </Link>
              </Text>
            </Section>

            {/* Security Tips */}
            <Section style={tipsSection}>
              <Text style={tipsTitle}>💡 Password Security Tips</Text>
              <Section style={tipsList}>
                <Text style={tipItem}>✅ Use at least 8 characters</Text>
                <Text style={tipItem}>✅ Include uppercase and lowercase letters</Text>
                <Text style={tipItem}>✅ Add numbers and special characters</Text>
                <Text style={tipItem}>✅ Avoid using personal information</Text>
                <Text style={tipItem}>✅ Don't reuse passwords from other accounts</Text>
              </Section>
            </Section>

            {/* Help Section */}
            <Section style={helpSection}>
              <Text style={helpTitle}>Need Help? 🤝</Text>
              <Text style={helpText}>
                If you're having trouble resetting your password or didn't request this reset, 
                please contact our support team at{' '}
                <Link href="mailto:support@209.works" style={helpLink}>
                  support@209.works
                </Link>{' '}
                or visit our{' '}
                <Link href="https://209.works/contact" style={helpLink}>
                  help center
                </Link>.
              </Text>
            </Section>

            <Text style={footer}>
              Stay secure! 🛡️
              <br />
              <strong>The 209 Works Security Team</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerTitle}>209 Works</Text>
            <Text style={footerSubtitle}>Your trusted Central Valley job platform</Text>
            <Text style={footerText}>
              This email was sent because a password reset was requested for your 209 Works account.
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

// Styles with new brand colors and email-safe CSS
const main = {
  backgroundColor: '#f8fafc',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  WebkitFontSmoothing: 'antialiased' as const,
  MozOsxFontSmoothing: 'grayscale' as const,
  textRendering: 'optimizeLegibility' as const,
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

const header = {
  backgroundColor: '#2d4a3e',
  backgroundImage: 'linear-gradient(135deg, #2d4a3e 0%, #1e3329 100%)',
  padding: '40px 24px',
  textAlign: 'center' as const,
};

const logo = {
  color: '#9fdf9f',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
  letterSpacing: '-0.5px',
};

const tagline = {
  color: '#ffffff',
  fontSize: '18px',
  margin: '0',
  fontWeight: '500',
};

const content = {
  padding: '32px 24px',
};

const greeting = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1e293b',
  margin: '0 0 20px 0',
};

const intro = {
  fontSize: '16px',
  color: '#475569',
  lineHeight: '1.6',
  margin: '0 0 28px 0',
};

const alertBox = {
  display: 'flex',
  alignItems: 'flex-start',
  backgroundColor: '#fef2f2',
  border: '2px solid #fecaca',
  borderLeft: '4px solid #ff6b35',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const alertIcon = {
  fontSize: '24px',
  margin: '0 16px 0 0',
  lineHeight: '1',
  flexShrink: 0,
};

const alertContent = {
  flex: '1',
};

const alertTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#dc2626',
  margin: '0 0 8px 0',
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
  backgroundColor: '#ff6b35',
  backgroundImage: 'linear-gradient(135deg, #ff6b35 0%, #e55a2b 100%)',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  border: 'none',
  boxShadow: '0 4px 8px rgba(255, 107, 53, 0.3)',
};

const alternativeText = {
  fontSize: '14px',
  color: '#64748b',
  margin: '32px 0 12px 0',
  textAlign: 'center' as const,
};

const linkContainer = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  padding: '12px',
  margin: '0 0 32px 0',
  textAlign: 'center' as const,
};

const linkText = {
  margin: '0',
};

const linkStyle = {
  color: '#ff6b35',
  fontSize: '12px',
  wordBreak: 'break-all' as const,
  textDecoration: 'underline',
};

const tipsSection = {
  backgroundColor: '#fff7ed',
  borderRadius: '8px',
  padding: '20px',
  margin: '32px 0',
  border: '2px solid #fed7aa',
};

const tipsTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#ea580c',
  margin: '0 0 16px 0',
};

const tipsList = {
  margin: '0',
};

const tipItem = {
  fontSize: '14px',
  color: '#7c2d12',
  margin: '8px 0',
  lineHeight: '1.5',
  display: 'block',
};

const helpSection = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '20px',
  margin: '32px 0',
  border: '1px solid #bbf7d0',
};

const helpTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#2d4a3e',
  margin: '0 0 8px 0',
};

const helpText = {
  fontSize: '14px',
  color: '#166534',
  lineHeight: '1.6',
  margin: '0',
};

const helpLink = {
  color: '#ff6b35',
  textDecoration: 'underline',
  fontWeight: '500',
};

const footer = {
  fontSize: '16px',
  color: '#64748b',
  margin: '32px 0 0 0',
  textAlign: 'center' as const,
  lineHeight: '1.6',
};

const divider = {
  borderColor: '#e2e8f0',
  margin: '0',
};

const footerSection = {
  backgroundColor: '#f8fafc',
  padding: '24px',
  textAlign: 'center' as const,
};

const footerTitle = {
  color: '#2d4a3e',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 4px 0',
};

const footerSubtitle = {
  color: '#64748b',
  fontSize: '14px',
  margin: '0 0 16px 0',
};

const footerText = {
  fontSize: '12px',
  color: '#64748b',
  margin: '0 0 16px 0',
  lineHeight: '1.5',
};

const copyrightText = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '0',
  lineHeight: '1.5',
};
