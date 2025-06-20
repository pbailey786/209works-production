

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
  loginUrl = 'https://209.works/employers/signin',
  unsubscribeUrl = 'https://209.works/unsubscribe',
}: WelcomeEmployerEmailProps) {
  const previewText = `🤝 Welcome to 209 Works, ${companyName}! Connect with Central Valley talent today.`;

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
            <Text style={tagline}>🤝 Welcome to Our Employer Community!</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Welcome to 209 Works, {companyName}! 🌟</Text>
            
            <Text style={paragraph}>
              Hi {contactName}, we're thrilled that <strong>{companyName}</strong> has joined our platform! 
              You're now connected to the Central Valley's most comprehensive talent network, reaching 
              skilled professionals across Stockton, Modesto, Fresno, and the entire 209 area.
            </Text>

            {/* Hero CTA */}
            <Section style={heroSection}>
              <Text style={heroText}>Ready to find your next great hire? 🚀</Text>
              <Button style={primaryButton} href={loginUrl}>
                Access Your Employer Dashboard →
              </Button>
            </Section>

            <Text style={paragraph}>
              <strong>What 209 Works offers employers:</strong>
            </Text>

            {/* Features Grid */}
            <Section style={featuresContainer}>
              <Section style={featureCard}>
                <Text style={featureIcon}>🎯</Text>
                <Text style={featureTitle}>Local Talent Pool</Text>
                <Text style={featureDescription}>
                  Access motivated candidates who live and work in the Central Valley
                </Text>
              </Section>

              <Section style={featureCard}>
                <Text style={featureIcon}>⚡</Text>
                <Text style={featureTitle}>Fast Hiring Process</Text>
                <Text style={featureDescription}>
                  Streamlined application management and candidate communication tools
                </Text>
              </Section>

              <Section style={featureCard}>
                <Text style={featureIcon}>💼</Text>
                <Text style={featureTitle}>Easy Job Posting</Text>
                <Text style={featureDescription}>
                  Post jobs in minutes with our intuitive job posting wizard
                </Text>
              </Section>

              <Section style={featureCard}>
                <Text style={featureIcon}>📊</Text>
                <Text style={featureTitle}>Performance Analytics</Text>
                <Text style={featureDescription}>
                  Track your job postings' performance and optimize for better results
                </Text>
              </Section>
            </Section>

            {/* Getting Started Steps */}
            <Section style={stepsSection}>
              <Text style={stepsTitle}>🚀 Your Next Steps</Text>
              <Text style={paragraph}>
                Here's how to get the most out of your 209 Works employer account:
              </Text>

              <Section style={stepsList}>
                <Section style={stepCard}>
                  <Text style={stepNumber}>1</Text>
                  <div>
                    <Text style={stepTitle}>Complete Company Profile</Text>
                    <Text style={stepDescription}>Add your company details, culture, and benefits</Text>
                  </div>
                </Section>

                <Section style={stepCard}>
                  <Text style={stepNumber}>2</Text>
                  <div>
                    <Text style={stepTitle}>Post Your First Job</Text>
                    <Text style={stepDescription}>Use our job posting wizard to attract qualified candidates</Text>
                  </div>
                </Section>

                <Section style={stepCard}>
                  <Text style={stepNumber}>3</Text>
                  <div>
                    <Text style={stepTitle}>Review Applications</Text>
                    <Text style={stepDescription}>Manage candidates and schedule interviews efficiently</Text>
                  </div>
                </Section>

                <Section style={stepCard}>
                  <Text style={stepNumber}>4</Text>
                  <div>
                    <Text style={stepTitle}>Hire Great Talent</Text>
                    <Text style={stepDescription}>Connect with the best candidates in the Central Valley</Text>
                  </div>
                </Section>
              </Section>
            </Section>

            {/* Pricing & Value */}
            <Section style={valueSection}>
              <Text style={valueTitle}>💰 Competitive Pricing, Maximum Value</Text>
              <Text style={valueText}>
                Our transparent pricing model ensures you get the best value for your hiring budget. 
                No hidden fees, no long-term contracts – just results.
              </Text>
              <Section style={buttonRow}>
                <Button style={secondaryButton} href="https://209.works/employers/pricing">
                  View Pricing
                </Button>
                <Button style={secondaryButton} href="https://209.works/employers/post-job">
                  Post a Job
                </Button>
              </Section>
            </Section>

            {/* Support Section */}
            <Section style={supportSection}>
              <Text style={supportTitle}>Need Help Getting Started? 🤝</Text>
              <Text style={supportText}>
                Our employer success team is here to help you succeed! Contact us at{' '}
                <Link href="mailto:employers@209.works" style={link}>employers@209.works</Link> or 
                visit our <Link href="https://209.works/employers/faq" style={link}>employer FAQ</Link> for 
                quick answers to common questions.
              </Text>
            </Section>

            <Text style={footer}>
              Welcome to the team! 🎉
              <br />
              <strong>The 209 Works Employer Success Team</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerTitle}>209 Works for Employers</Text>
            <Text style={footerSubtitle}>Your partner in Central Valley talent acquisition</Text>
            <Text style={footerLinks}>
              <Link href="https://209.works/employers" style={footerLink}>Employer Portal</Link> • 
              <Link href="https://209.works/employers/contact" style={footerLink}> Contact Support</Link> • 
              <Link href={unsubscribeUrl} style={unsubscribeLink}> Unsubscribe</Link>
            </Text>
            <Text style={copyrightText}>
              © {new Date().getFullYear()} 209 Works. All rights reserved.
              <br />
              This email was sent because you created an employer account on 209 Works.
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
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#2d4a3e',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 20px 0',
};

const heroSection = {
  backgroundColor: '#9fdf9f',
  backgroundImage: 'linear-gradient(135deg, #9fdf9f 0%, #7dd87d 100%)',
  borderRadius: '12px',
  padding: '32px 24px',
  margin: '32px 0',
  textAlign: 'center' as const,
};

const heroText = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#1e3329',
  margin: '0 0 20px 0',
};

const primaryButton = {
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

const featuresContainer = {
  margin: '32px 0',
};

const featureCard = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0',
  textAlign: 'center' as const,
};

const featureIcon = {
  fontSize: '32px',
  margin: '0 0 12px 0',
  display: 'block',
};

const featureTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#2d4a3e',
  margin: '0 0 8px 0',
};

const featureDescription = {
  fontSize: '14px',
  color: '#64748b',
  lineHeight: '1.5',
  margin: '0',
};

const stepsSection = {
  backgroundColor: '#fff7ed',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
  border: '2px solid #fed7aa',
};

const stepsTitle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#ea580c',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
};

const stepsList = {
  margin: '24px 0 0 0',
};

const stepCard = {
  display: 'flex',
  alignItems: 'flex-start',
  margin: '16px 0',
  padding: '16px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #fed7aa',
};

const stepNumber = {
  backgroundColor: '#ff6b35',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold',
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '16px',
  flexShrink: 0,
};

const stepTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1e293b',
  margin: '0 0 4px 0',
};

const stepDescription = {
  fontSize: '14px',
  color: '#64748b',
  margin: '0',
  lineHeight: '1.4',
};

const valueSection = {
  backgroundColor: '#f0fdf4',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
  textAlign: 'center' as const,
  border: '2px solid #bbf7d0',
};

const valueTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#2d4a3e',
  margin: '0 0 12px 0',
};

const valueText = {
  fontSize: '15px',
  color: '#166534',
  lineHeight: '1.6',
  margin: '0 0 20px 0',
};

const buttonRow = {
  display: 'flex',
  justifyContent: 'center',
  gap: '16px',
  flexWrap: 'wrap' as const,
};

const secondaryButton = {
  backgroundColor: '#2d4a3e',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  border: 'none',
  margin: '4px',
};

const supportSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  border: '1px solid #e2e8f0',
};

const supportTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#2d4a3e',
  margin: '0 0 8px 0',
};

const supportText = {
  fontSize: '14px',
  color: '#64748b',
  lineHeight: '1.5',
  margin: '0',
};

const link = {
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

const footerLinks = {
  fontSize: '14px',
  color: '#64748b',
  margin: '0 0 16px 0',
};

const footerLink = {
  color: '#64748b',
  textDecoration: 'underline',
};

const unsubscribeLink = {
  color: '#94a3b8',
  textDecoration: 'underline',
};

const copyrightText = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '0',
  lineHeight: '1.5',
};
