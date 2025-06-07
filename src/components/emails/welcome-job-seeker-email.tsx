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
  Img,
} from '@react-email/components';

interface WelcomeJobSeekerEmailProps {
  userName: string;
  loginUrl?: string;
  unsubscribeUrl?: string;
}

export default function WelcomeJobSeekerEmail({
  userName = 'Job Seeker',
  loginUrl = 'https://209.works/signin',
  unsubscribeUrl = 'https://209.works/unsubscribe',
}: WelcomeJobSeekerEmailProps) {
  const previewText = `Welcome to 209 Works, ${userName}! Start your local job search today.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>209 Works</Text>
            <Text style={tagline}>Built for the 209. Made for the people who work here.</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Welcome to 209 Works, {userName}!</Text>
            
            <Text style={paragraph}>
              You've successfully joined the Central Valley's premier job platform. 
              We're excited to help you find your next opportunity right here in the 209 area.
            </Text>

            <Text style={paragraph}>
              <strong>What makes 209 Works special:</strong>
            </Text>

            <Section style={featureList}>
              <Text style={feature}>🎯 <strong>Hyper-Local Focus:</strong> Jobs specifically in Stockton, Modesto, Turlock, and surrounding 209 communities</Text>
              <Text style={feature}>🤖 <strong>AI-Powered Search:</strong> Chat with JobsGPT to find jobs that match your skills and preferences</Text>
              <Text style={feature}>📧 <strong>Smart Alerts:</strong> Get notified when new positions matching your criteria are posted</Text>
              <Text style={feature}>🏢 <strong>Local Employers:</strong> Connect directly with businesses in your community</Text>
            </Section>

            <Section style={ctaSection}>
              <Button style={button} href={loginUrl}>
                Start Your Job Search
              </Button>
            </Section>

            <Text style={paragraph}>
              Ready to get started? Log in to your account and:
            </Text>

            <Section style={stepsList}>
              <Text style={step}>1. Complete your profile</Text>
              <Text style={step}>2. Upload your resume</Text>
              <Text style={step}>3. Set up job alerts</Text>
              <Text style={step}>4. Start applying to local jobs</Text>
            </Section>

            <Hr style={divider} />

            <Text style={paragraph}>
              Questions? Reply to this email or visit our <Link href="https://209.works/faq" style={link}>FAQ page</Link>.
            </Text>

            <Text style={signature}>
              Best regards,<br />
              The 209 Works Team
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              209 Works - Connecting Central Valley talent with local opportunities
            </Text>
            <Text style={footerText}>
              <Link href="https://209.works" style={footerLink}>209.works</Link> | 
              <Link href="https://209.works/contact" style={footerLink}> Contact Us</Link> | 
              <Link href={unsubscribeUrl} style={footerLink}> Unsubscribe</Link>
            </Text>
            <Text style={footerDisclaimer}>
              This email was sent to you because you created an account on 209 Works. 
              If you did not create this account, please ignore this email.
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
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 24px',
  backgroundColor: '#2d4a3e',
  textAlign: 'center' as const,
};

const logo = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const tagline = {
  color: '#a7c4b5',
  fontSize: '14px',
  margin: '0',
};

const content = {
  padding: '24px',
};

const greeting = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#2d4a3e',
  margin: '0 0 24px 0',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 16px 0',
};

const featureList = {
  margin: '16px 0',
};

const feature = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 12px 0',
  paddingLeft: '8px',
};

const stepsList = {
  margin: '16px 0',
  paddingLeft: '16px',
};

const step = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 8px 0',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#2d4a3e',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  border: 'none',
};

const link = {
  color: '#2d4a3e',
  textDecoration: 'underline',
};

const signature = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '24px 0 0 0',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const footer = {
  padding: '24px',
  backgroundColor: '#f9fafb',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '0 0 8px 0',
};

const footerLink = {
  color: '#2d4a3e',
  textDecoration: 'none',
  margin: '0 4px',
};

const footerDisclaimer = {
  fontSize: '11px',
  color: '#9ca3af',
  margin: '16px 0 0 0',
  lineHeight: '1.4',
};
