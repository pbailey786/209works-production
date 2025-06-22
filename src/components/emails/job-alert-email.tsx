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

interface JobAlertEmailProps {
  userName: string;
  jobTitle: string;
  companyName: string;
  location: string;
  salary?: string;
  jobType: string;
  description: string;
  jobUrl: string;
  unsubscribeUrl: string;
}

export default function JobAlertEmail({
  userName = 'Job Seeker',
  jobTitle = 'Software Developer',
  companyName = 'Tech Company',
  location = 'Remote',
  salary,
  jobType = 'Full-time',
  description = 'We are looking for a talented developer...',
  jobUrl = '#',
  unsubscribeUrl = '#',
}: JobAlertEmailProps) {
  const previewText = `🎯 New 209 Works Job Alert: ${jobTitle} at ${companyName} in ${location}`;

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
            <Text style={tagline}>🎯 New Job Alert</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Hi {userName}! 👋</Text>
            <Text style={intro}>
              Great news! We found a new job opportunity in the 209 area that matches your job search criteria:
            </Text>

            {/* Job Card */}
            <Section style={jobCard}>
              <Text style={jobTitleStyle}>{jobTitle}</Text>
              <Text style={companyStyle}>{companyName}</Text>
              
              <Section style={jobMetaContainer}>
                <Text style={locationStyle}>📍 {location}</Text>
                <Text style={jobTypeStyle}>🕒 {jobType}</Text>
                {salary && <Text style={salaryStyle}>💰 {salary}</Text>}
              </Section>

              <Hr style={cardDivider} />

              <Text style={descriptionStyle}>
                {description.length > 250
                  ? `${description.substring(0, 250)}...`
                  : description}
              </Text>

              <Section style={buttonContainer}>
                <Button style={applyButton} href={jobUrl}>
                  View Job Details & Apply →
                </Button>
              </Section>
            </Section>

            <Text style={encouragement}>
              ⚡ Don't wait – great opportunities in the Central Valley go fast!
            </Text>

            <Text style={footer}>
              Happy job hunting! 🌟
              <br />
              <strong>The 209 Works Team</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerTitle}>209 Works</Text>
            <Text style={footerSubtitle}>Connecting Central Valley talent with local opportunities</Text>
            <Text style={unsubscribeText}>
              <Link href="https://209.works/alerts" style={manageLink}>Manage job alerts</Link> • 
              <Link href={unsubscribeUrl} style={unsubscribeLink}> Unsubscribe</Link>
            </Text>
            <Text style={copyrightText}>
              © {new Date().getFullYear()} 209 Works. All rights reserved.
              <br />
              Proudly serving Stockton, Modesto, Fresno & the entire 209 area.
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
  padding: '32px 24px',
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
  fontSize: '16px',
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
  margin: '0 0 16px 0',
};

const intro = {
  fontSize: '16px',
  color: '#475569',
  lineHeight: '1.6',
  margin: '0 0 24px 0',
};

const jobCard = {
  backgroundColor: '#f8fafc',
  border: '2px solid #e2e8f0',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  borderLeft: '4px solid #ff6b35',
};

const jobTitleStyle = {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#1e293b',
  margin: '0 0 8px 0',
  lineHeight: '1.3',
};

const companyStyle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#ff6b35',
  margin: '0 0 16px 0',
};

const jobMetaContainer = {
  margin: '0 0 16px 0',
};

const locationStyle = {
  fontSize: '14px',
  color: '#64748b',
  margin: '4px 0',
  display: 'block',
};

const salaryStyle = {
  fontSize: '14px',
  color: '#059669',
  fontWeight: '600',
  margin: '4px 0',
  display: 'block',
};

const jobTypeStyle = {
  fontSize: '14px',
  color: '#64748b',
  margin: '4px 0',
  display: 'block',
};

const cardDivider = {
  borderColor: '#e2e8f0',
  margin: '16px 0',
};

const descriptionStyle = {
  fontSize: '15px',
  color: '#374151',
  lineHeight: '1.6',
  margin: '0 0 24px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
};

const applyButton = {
  backgroundColor: '#ff6b35',
  backgroundImage: 'linear-gradient(135deg, #ff6b35 0%, #e55a2b 100%)',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  border: 'none',
  boxShadow: '0 2px 4px rgba(255, 107, 53, 0.2)',
  transition: 'all 0.2s ease',
};

const encouragement = {
  fontSize: '16px',
  color: '#2d4a3e',
  fontWeight: '600',
  margin: '24px 0',
  textAlign: 'center' as const,
  backgroundColor: '#f0fdf4',
  padding: '16px',
  borderRadius: '8px',
  border: '1px solid #bbf7d0',
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

const unsubscribeText = {
  fontSize: '14px',
  color: '#64748b',
  margin: '0 0 16px 0',
};

const manageLink = {
  color: '#ff6b35',
  textDecoration: 'underline',
  fontWeight: '500',
};

const unsubscribeLink = {
  color: '#64748b',
  textDecoration: 'underline',
};

const copyrightText = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '0',
  lineHeight: '1.5',
};
