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

interface WelcomeEmailProps {
  userName: string;
  userType: 'job_seeker' | 'employer';
}

export default function WelcomeEmail({
  userName = 'User',
  userType = 'job_seeker',
}: WelcomeEmailProps) {
  const previewText = `Welcome to 209 Works, ${userName}!`;
  const isEmployer = userType === 'employer';

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
            
            <Text style={intro}>
              {isEmployer 
                ? "Thank you for joining our platform as an employer. You're now part of a community dedicated to connecting local talent with great opportunities in the 209 area."
                : "Thank you for joining our platform! We're excited to help you find your next career opportunity right here in the 209 area."
              }
            </Text>

            {/* Feature Highlights */}
            <Section style={featuresSection}>
              <Text style={featuresTitle}>What makes 209 Works special:</Text>
              
              <div style={featureItem}>
                <Text style={featureIcon}>🎯</Text>
                <div>
                  <Text style={featureTitle}>Hyper-Local Focus</Text>
                  <Text style={featureDescription}>
                    {isEmployer 
                      ? "Connect with talented professionals specifically in Modesto, Stockton, Turlock, and surrounding 209 communities."
                      : "Find opportunities specifically in Modesto, Stockton, Turlock, and surrounding 209 communities."
                    }
                  </Text>
                </div>
              </div>

              <div style={featureItem}>
                <Text style={featureIcon}>🤖</Text>
                <div>
                  <Text style={featureTitle}>AI-Powered JobsGPT</Text>
                  <Text style={featureDescription}>
                    {isEmployer 
                      ? "Use our AI assistant to optimize job postings and find the best candidates for your positions."
                      : "Chat with our AI assistant to find jobs that perfectly match your skills and preferences."
                    }
                  </Text>
                </div>
              </div>

              <div style={featureItem}>
                <Text style={featureIcon}>🔔</Text>
                <div>
                  <Text style={featureTitle}>Smart Notifications</Text>
                  <Text style={featureDescription}>
                    {isEmployer 
                      ? "Get instant notifications when qualified candidates apply to your job postings."
                      : "Set up job alerts to get notified when new positions matching your criteria are posted."
                    }
                  </Text>
                </div>
              </div>
            </Section>

            {/* Call to Action */}
            <Section style={ctaSection}>
              <Text style={ctaTitle}>Ready to get started?</Text>
              <Button style={ctaButton} href={isEmployer ? 'https://209.works/employers/dashboard' : 'https://209.works/jobs'}>
                {isEmployer ? 'Post Your First Job' : 'Browse Jobs Now'}
              </Button>
            </Section>

            {/* Additional Resources */}
            <Section style={resourcesSection}>
              <Text style={resourcesTitle}>Helpful Resources:</Text>
              <div style={resourcesList}>
                {isEmployer ? (
                  <>
                    <Link href="https://209.works/employers/guide" style={resourceLink}>
                      📖 Employer Guide
                    </Link>
                    <Link href="https://209.works/pricing" style={resourceLink}>
                      💰 Pricing Plans
                    </Link>
                    <Link href="https://209.works/support" style={resourceLink}>
                      🎧 Get Support
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="https://209.works/jobs" style={resourceLink}>
                      🔍 Browse All Jobs
                    </Link>
                    <Link href="https://209.works/alerts" style={resourceLink}>
                      🔔 Set Up Job Alerts
                    </Link>
                    <Link href="https://209.works/profile" style={resourceLink}>
                      👤 Complete Your Profile
                    </Link>
                  </>
                )}
              </div>
            </Section>

            <Text style={footer}>
              Welcome to the 209 Works family!
              <br />
              The 209 Works Team
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerText}>
              © {new Date().getFullYear()} 209 Works. All rights reserved.
              <br />
              Proudly serving Modesto, Stockton, Turlock, and the greater 209 area.
            </Text>
            <Text style={contactText}>
              Questions? Reply to this email or visit our{' '}
              <Link href="https://209.works/support" style={contactLink}>
                support center
              </Link>
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
  backgroundColor: '#2d4a3e',
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
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
};

const intro = {
  fontSize: '16px',
  color: '#374151',
  lineHeight: '1.6',
  margin: '0 0 32px 0',
};

const featuresSection = {
  margin: '32px 0',
};

const featuresTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 20px 0',
};

const featureItem = {
  display: 'flex',
  alignItems: 'flex-start',
  margin: '16px 0',
};

const featureIcon = {
  fontSize: '24px',
  margin: '0 12px 0 0',
  lineHeight: '1',
};

const featureTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 4px 0',
};

const featureDescription = {
  fontSize: '14px',
  color: '#6b7280',
  lineHeight: '1.5',
  margin: '0',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '40px 0',
  padding: '24px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
};

const ctaTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 16px 0',
};

const ctaButton = {
  backgroundColor: '#2d4a3e',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
};

const resourcesSection = {
  margin: '32px 0',
};

const resourcesTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 12px 0',
};

const resourcesList = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '8px',
};

const resourceLink = {
  color: '#2d4a3e',
  textDecoration: 'none',
  fontSize: '14px',
  padding: '8px 0',
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
  color: '#9ca3af',
  margin: '16px 0 8px 0',
  lineHeight: '1.5',
};

const contactText = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '8px 0 0 0',
};

const contactLink = {
  color: '#2d4a3e',
  textDecoration: 'underline',
};
