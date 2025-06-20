

import {
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
  Link
} from '@react-email/components';

interface CreditConfirmationEmailProps {
  userName: string;
  creditAmount: number;
  planType: string;
  dashboardUrl: string;
  expirationDate?: string | null;
}

export default function CreditConfirmationEmail({
  userName = 'Valued Customer',
  creditAmount = 0,
  planType = 'CREDIT PACK',
  dashboardUrl = 'https://209.works/employers/dashboard',
  expirationDate = null,
}: CreditConfirmationEmailProps) {
  const previewText = `🎉 Your ${creditAmount} 209Works credits are ready to use!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerTitle}>209 Works</Text>
            <Text style={headerSubtitle}>Built for the 209. Made for the people who work here.</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Hi {userName},</Text>
            
            <Text style={mainText}>
              🎉 Great news! Your <strong>{planType}</strong> purchase is complete and your credits are ready to use.
            </Text>

            {/* Credit Summary Box */}
            <Section style={creditBox}>
              <Text style={creditAmount as any}>{creditAmount.toString()}</Text>
              <Text style={creditLabel}>Job Posting Credits</Text>
              {expirationDate && (
                <Text style={expirationText}>
                  Valid until {expirationDate}
                </Text>
              )}
            </Section>

            <Text style={instructionText}>
              You can now post jobs, feature listings, and promote your opportunities to thousands of qualified candidates in the Central Valley.
            </Text>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={dashboardUrl}>
                Start Posting Jobs →
              </Button>
            </Section>

            <Text style={benefitsTitle}>What you can do with your credits:</Text>
            <Text style={benefitsList}>
              • Post job listings that reach local talent<br/>
              • Feature your jobs at the top of search results<br/>
              • Get social media promotion for maximum visibility<br/>
              • Access our AI-powered job optimization tools
            </Text>

            <Hr style={divider} />

            <Text style={footerText}>
              Need help getting started? Our team is here to support you every step of the way.
            </Text>

            <Text style={supportText}>
              Questions? Reply to this email or contact us at{' '}
              <Link href="mailto:admin@209.works" style={link}>
                admin@209.works
              </Link>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerBrand}>209 Works</Text>
            <Text style={footerTagline}>Connecting Central Valley talent with local opportunities</Text>
            <Text style={footerLinks}>
              <Link href="https://209.works" style={footerLink}>Visit Website</Link>
              {' • '}
              <Link href={`${dashboardUrl}?tab=settings`} style={footerLink}>Account Settings</Link>
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
  background: 'linear-gradient(135deg, #2d4a3e 0%, #1d3a2e 100%)',
  padding: '40px 20px',
  textAlign: 'center' as const,
};

const headerTitle = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  lineHeight: '1.2',
};

const headerSubtitle = {
  color: '#9fdf9f',
  fontSize: '16px',
  margin: '8px 0 0 0',
  lineHeight: '1.4',
};

const content = {
  padding: '40px 20px',
};

const greeting = {
  color: '#2d4a3e',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 20px 0',
};

const mainText = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 30px 0',
};

const creditBox = {
  backgroundColor: '#f8fffe',
  border: '2px solid #9fdf9f',
  borderRadius: '12px',
  padding: '30px 20px',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const creditAmount = {
  color: '#2d4a3e',
  fontSize: '48px',
  fontWeight: 'bold',
  margin: '0',
  lineHeight: '1',
};

const creditLabel = {
  color: '#2d4a3e',
  fontSize: '18px',
  fontWeight: '600',
  margin: '8px 0 0 0',
};

const expirationText = {
  color: '#666666',
  fontSize: '14px',
  margin: '8px 0 0 0',
};

const instructionText = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '30px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '40px 0',
};

const button = {
  backgroundColor: '#ff6b35',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  border: 'none',
  cursor: 'pointer',
};

const benefitsTitle = {
  color: '#2d4a3e',
  fontSize: '16px',
  fontWeight: '600',
  margin: '30px 0 15px 0',
};

const benefitsList = {
  color: '#333333',
  fontSize: '15px',
  lineHeight: '1.8',
  margin: '0 0 30px 0',
};

const divider = {
  borderColor: '#e6e6e6',
  margin: '40px 0',
};

const footerText = {
  color: '#666666',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 20px 0',
};

const supportText = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 30px 0',
};

const link = {
  color: '#ff6b35',
  textDecoration: 'none',
};

const footer = {
  backgroundColor: '#f8f9fa',
  padding: '30px 20px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e6e6e6',
};

const footerBrand = {
  color: '#2d4a3e',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const footerTagline = {
  color: '#666666',
  fontSize: '14px',
  margin: '0 0 20px 0',
};

const footerLinks = {
  color: '#666666',
  fontSize: '14px',
  margin: '0',
};

const footerLink = {
  color: '#666666',
  textDecoration: 'none',
};
