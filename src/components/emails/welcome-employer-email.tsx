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

interface WelcomeEmployerEmailProps {
  companyName: string;
  contactName: string;
  loginUrl?: string;
  unsubscribeUrl?: string;
}

export default function WelcomeEmployerEmail({
  companyName = 'Your Company',
  contactName = 'Hiring Manager',
  loginUrl = 'https://209.works/employer/signin',
  unsubscribeUrl = 'https://209.works/unsubscribe',
}: WelcomeEmployerEmailProps) {
  const previewText = `Welcome to 209 Works, ${companyName}! Start hiring local talent today.`;

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
            <Text style={greeting}>Welcome to 209 Works, {contactName}!</Text>
            
            <Text style={paragraph}>
              Thank you for joining 209 Works on behalf of <strong>{companyName}</strong>. 
              We're excited to help you connect with talented professionals right here in the Central Valley.
            </Text>

            <Text style={paragraph}>
              <strong>Why local businesses choose 209 Works:</strong>
            </Text>

            <Section style={featureList}>
              <Text style={feature}>🎯 <strong>Local Talent Pool:</strong> Access candidates specifically from Stockton, Modesto, Turlock, and surrounding 209 communities</Text>
              <Text style={feature}>💼 <strong>Simplified Hiring:</strong> Post jobs, review applications, and manage candidates all in one place</Text>
              <Text style={feature}>🤖 <strong>AI-Enhanced Matching:</strong> Our JobsGPT helps candidates find your opportunities</Text>
              <Text style={feature}>📊 <strong>Hiring Analytics:</strong> Track your job performance and optimize your postings</Text>
            </Section>

            <Section style={ctaSection}>
              <Button style={button} href={loginUrl}>
                Access Your Dashboard
              </Button>
            </Section>

            <Text style={paragraph}>
              Ready to start hiring? Log in to your employer dashboard to:
            </Text>

            <Section style={stepsList}>
              <Text style={step}>1. Complete your company profile</Text>
              <Text style={step}>2. Post your first job (starting at just $50)</Text>
              <Text style={step}>3. Review incoming applications</Text>
              <Text style={step}>4. Connect with local talent</Text>
            </Section>

            <Hr style={divider} />

            <Text style={paragraph}>
              <strong>Simple, transparent pricing:</strong>
            </Text>

            <Section style={pricingList}>
              <Text style={pricing}>• $50 for 1 job posting</Text>
              <Text style={pricing}>• $99 for 3 job postings</Text>
              <Text style={pricing}>• $200 for 10 job postings</Text>
            </Section>

            <Text style={paragraph}>
              <strong>Optional add-ons:</strong> Social media promotion ($29), Featured placement ($29), or both for $50.
            </Text>

            <Hr style={divider} />

            <Text style={paragraph}>
              Questions about getting started? Reply to this email or visit our <Link href="https://209.works/employer/help" style={link}>Employer Help Center</Link>.
            </Text>

            <Text style={signature}>
              Best regards,<br />
              The 209 Works Team
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              209 Works - Connecting Central Valley businesses with local talent
            </Text>
            <Text style={footerText}>
              <Link href="https://209.works" style={footerLink}>209.works</Link> | 
              <Link href="https://209.works/contact" style={footerLink}> Contact Us</Link> | 
              <Link href={unsubscribeUrl} style={footerLink}> Unsubscribe</Link>
            </Text>
            <Text style={footerDisclaimer}>
              This email was sent to you because you created an employer account on 209 Works. 
              If you did not create this account, please contact us immediately.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles (same as job seeker email for consistency)
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

const pricingList = {
  margin: '16px 0',
  paddingLeft: '16px',
};

const pricing = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 8px 0',
  fontWeight: '500',
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
