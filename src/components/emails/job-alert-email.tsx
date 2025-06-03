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
  const previewText = `New job alert: ${jobTitle} at ${companyName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>209jobs</Text>
            <Text style={tagline}>Your Career, Our Priority</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Hi {userName},</Text>
            <Text style={intro}>
              We found a new job that matches your alerts:
            </Text>

            {/* Job Card */}
            <Section style={jobCard}>
              <Text style={jobTitleStyle}>{jobTitle}</Text>
              <Text style={companyStyle}>{companyName}</Text>
              <Text style={locationStyle}>📍 {location}</Text>
              {salary && <Text style={salaryStyle}>💰 {salary}</Text>}
              <Text style={jobTypeStyle}>🕒 {jobType}</Text>

              <Hr style={divider} />

              <Text style={descriptionStyle}>
                {description.length > 200
                  ? `${description.substring(0, 200)}...`
                  : description}
              </Text>

              <Button style={applyButton} href={jobUrl}>
                View Job Details
              </Button>
            </Section>

            <Text style={footer}>
              Happy job hunting!
              <br />
              The 209jobs Team
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={unsubscribeText}>
              <Link href={unsubscribeUrl} style={unsubscribeLink}>
                Unsubscribe from job alerts
              </Link>
            </Text>
            <Text style={copyrightText}>
              © {new Date().getFullYear()} 209jobs. All rights reserved.
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
  backgroundColor: '#1e40af',
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
  opacity: 0.8,
};

const content = {
  padding: '20px',
};

const greeting = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 16px 0',
};

const intro = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0 0 24px 0',
};

const jobCard = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '24px',
  margin: '16px 0',
  backgroundColor: '#fafafa',
};

const jobTitleStyle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 8px 0',
};

const companyStyle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1e40af',
  margin: '0 0 12px 0',
};

const locationStyle = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '4px 0',
};

const salaryStyle = {
  fontSize: '14px',
  color: '#059669',
  fontWeight: '600',
  margin: '4px 0',
};

const jobTypeStyle = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '4px 0',
};

const descriptionStyle = {
  fontSize: '14px',
  color: '#374151',
  lineHeight: '1.5',
  margin: '16px 0 24px 0',
};

const applyButton = {
  backgroundColor: '#1e40af',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  width: '100%',
};

const footer = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '24px 0 0 0',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
};

const footerSection = {
  padding: '0 20px',
  textAlign: 'center' as const,
};

const unsubscribeText = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '16px 0 8px 0',
};

const unsubscribeLink = {
  color: '#1e40af',
  textDecoration: 'underline',
};

const copyrightText = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '8px 0 0 0',
};
