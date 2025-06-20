

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
  const previewText = `🎉 Welcome to 209 Works, ${userName}! Your Central Valley career journey starts here.`;

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
            <Text style={tagline}>🎉 Welcome to Your Local Career Platform!</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Welcome to 209 Works, {userName}! 🌟</Text>
            
            <Text style={paragraph}>
              You've just joined the Central Valley's premier job platform! We're thrilled to help you 
              discover amazing career opportunities right here in the 209 area – from Stockton to Modesto, 
              Fresno to Turlock, and everywhere in between.
            </Text>

            {/* Hero CTA */}
            <Section style={heroSection}>
              <Text style={heroText}>Ready to find your dream job? 🚀</Text>
              <Button style={primaryButton} href={loginUrl}>
                Start Your Job Search →
              </Button>
            </Section>

            <Text style={paragraph}>
              <strong>What makes 209 Works special:</strong>
            </Text>

            {/* Features Grid */}
            <Section style={featuresContainer}>
              <Section style={featureCard}>
                <Text style={featureIcon}>🎯</Text>
                <Text style={featureTitle}>Hyper-Local Focus</Text>
                <Text style={featureDescription}>
                  Jobs specifically in Stockton, Modesto, Turlock, Fresno, and surrounding 209 communities
                </Text>
              </Section>

              <Section style={featureCard}>
                <Text style={featureIcon}>🤖</Text>
                <Text style={featureTitle}>AI-Powered Search</Text>
                <Text style={featureDescription}>
                  Chat with JobsGPT to find positions that perfectly match your skills and preferences
                </Text>
              </Section>

              <Section style={featureCard}>
                <Text style={featureIcon}>📧</Text>
                <Text style={featureTitle}>Smart Job Alerts</Text>
                <Text style={featureDescription}>
                  Get instant notifications when new positions matching your criteria are posted
                </Text>
              </Section>

              <Section style={featureCard}>
                <Text style={featureIcon}>🏢</Text>
                <Text style={featureTitle}>Local Employers</Text>
                <Text style={featureDescription}>
                  Connect directly with businesses in your community who are actively hiring
                </Text>
              </Section>
            </Section>

            {/* Getting Started Steps */}
            <Section style={stepsSection}>
              <Text style={stepsTitle}>🚀 Your Next Steps</Text>
              <Text style={paragraph}>
                Ready to get started? Here's how to make the most of your 209 Works experience:
              </Text>

              <Section style={stepsList}>
                <Section style={stepCard}>
                  <Text style={stepNumber}>1</Text>
                  <div>
                    <Text style={stepTitle}>Complete Your Profile</Text>
                    <Text style={stepDescription}>Add your skills, experience, and career preferences</Text>
                  </div>
                </Section>

                <Section style={stepCard}>
                  <Text style={stepNumber}>2</Text>
                  <div>
                    <Text style={stepTitle}>Upload Your Resume</Text>
                    <Text style={stepDescription}>Let employers discover your talent and experience</Text>
                  </div>
                </Section>

                <Section style={stepCard}>
                  <Text style={stepNumber}>3</Text>
                  <div>
                    <Text style={stepTitle}>Set Up Job Alerts</Text>
                    <Text style={stepDescription}>Never miss a perfect opportunity in your area</Text>
                  </div>
                </Section>

                <Section style={stepCard}>
                  <Text style={stepNumber}>4</Text>
                  <div>
                    <Text style={stepTitle}>Start Applying</Text>
                    <Text style={stepDescription}>Apply to local jobs and connect with employers</Text>
                  </div>
                </Section>
              </Section>
            </Section>

            {/* Quick Actions */}
            <Section style={actionsSection}>
              <Text style={actionsTitle}>Quick Actions</Text>
              <Section style={buttonRow}>
                <Button style={secondaryButton} href="https://209.works/jobs">
                  Browse Jobs
                </Button>
                <Button style={secondaryButton} href="https://209.works/alerts">
                  Set Up Alerts
                </Button>
              </Section>
            </Section>

            {/* Support Section */}
            <Section style={supportSection}>
              <Text style={supportTitle}>Need Help Getting Started? 🤝</Text>
              <Text style={supportText}>
                Our team is here to help! Visit our <Link href="https://209.works/faq" style={link}>FAQ page</Link> for 
                common questions, or <Link href="https://209.works/contact" style={link}>contact our support team</Link> directly.
              </Text>
            </Section>

            <Text style={footer}>
              Welcome to the family! 🎉
              <br />
              <strong>The 209 Works Team</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerTitle}>209 Works</Text>
            <Text style={footerSubtitle}>Connecting Central Valley talent with local opportunities</Text>
            <Text style={footerLinks}>
              <Link href="https://209.works" style={footerLink}>Visit Website</Link> • 
              <Link href="https://209.works/contact" style={footerLink}> Contact Us</Link> • 
              <Link href={unsubscribeUrl} style={unsubscribeLink}> Unsubscribe</Link>
            </Text>
            <Text style={copyrightText}>
              © {new Date().getFullYear()} 209 Works. All rights reserved.
              <br />
              This email was sent because you created an account on 209 Works.
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

const actionsSection = {
  backgroundColor: '#f0fdf4',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
  textAlign: 'center' as const,
};

const actionsTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#2d4a3e',
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
