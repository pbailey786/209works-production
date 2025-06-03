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

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  jobType: string;
  postedDate: string;
  url: string;
}

interface WeeklyDigestEmailProps {
  userName: string;
  jobs: Job[];
  location: string;
  unsubscribeUrl: string;
  manageAlertsUrl: string;
}

export default function WeeklyDigestEmail({
  userName = 'Job Seeker',
  jobs = [],
  location = '209 Area',
  unsubscribeUrl = '#',
  manageAlertsUrl = '#',
}: WeeklyDigestEmailProps) {
  const previewText = `Your weekly job digest: ${jobs.length} new jobs in ${location}`;

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
              Here's your weekly job digest for the {location} area. We found{' '}
              <strong>{jobs.length} new jobs</strong> that might interest you:
            </Text>

            {/* Jobs List */}
            {jobs.length > 0 ? (
              jobs.map((job, index) => (
                <Section key={job.id} style={jobCard}>
                  <Text style={jobTitleStyle}>{job.title}</Text>
                  <Text style={companyStyle}>{job.company}</Text>
                  <Text style={jobMetaStyle}>
                    📍 {job.location} • 🕒 {job.jobType} • 📅 {job.postedDate}
                  </Text>
                  {job.salary && (
                    <Text style={salaryStyle}>💰 {job.salary}</Text>
                  )}

                  <Button style={viewJobButton} href={job.url}>
                    View Job
                  </Button>

                  {index < jobs.length - 1 && <Hr style={jobDivider} />}
                </Section>
              ))
            ) : (
              <Section style={noJobsCard}>
                <Text style={noJobsText}>
                  No new jobs this week, but don't worry! We're constantly
                  adding new opportunities. Check back soon or consider
                  expanding your search criteria.
                </Text>
                <Button style={browseButton} href="https://209jobs.com/jobs">
                  Browse All Jobs
                </Button>
              </Section>
            )}

            {/* Call to Action */}
            <Section style={ctaSection}>
              <Text style={ctaText}>
                Want to customize your job alerts or change your preferences?
              </Text>
              <Button style={manageButton} href={manageAlertsUrl}>
                Manage Your Alerts
              </Button>
            </Section>

            <Text style={footer}>
              Keep searching, keep growing!
              <br />
              The 209jobs Team
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={statsText}>
              📊 This week: {jobs.length} new jobs in {location}
            </Text>
            <Text style={unsubscribeText}>
              <Link href={unsubscribeUrl} style={unsubscribeLink}>
                Unsubscribe from weekly digest
              </Link>{' '}
              |{' '}
              <Link href={manageAlertsUrl} style={unsubscribeLink}>
                Manage alerts
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
  lineHeight: '1.5',
};

const jobCard = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0',
  backgroundColor: '#fafafa',
};

const jobTitleStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 8px 0',
};

const companyStyle = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#1e40af',
  margin: '0 0 8px 0',
};

const jobMetaStyle = {
  fontSize: '13px',
  color: '#6b7280',
  margin: '0 0 8px 0',
};

const salaryStyle = {
  fontSize: '13px',
  color: '#059669',
  fontWeight: '600',
  margin: '0 0 16px 0',
};

const viewJobButton = {
  backgroundColor: '#1e40af',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 20px',
  marginTop: '12px',
};

const jobDivider = {
  borderColor: '#e5e7eb',
  margin: '16px 0',
};

const noJobsCard = {
  border: '1px solid #fbbf24',
  borderRadius: '8px',
  padding: '24px',
  margin: '16px 0',
  backgroundColor: '#fffbeb',
  textAlign: 'center' as const,
};

const noJobsText = {
  fontSize: '14px',
  color: '#92400e',
  margin: '0 0 16px 0',
  lineHeight: '1.5',
};

const browseButton = {
  backgroundColor: '#f59e0b',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 20px',
};

const ctaSection = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '24px',
  margin: '32px 0',
  textAlign: 'center' as const,
};

const ctaText = {
  fontSize: '14px',
  color: '#374151',
  margin: '0 0 16px 0',
};

const manageButton = {
  backgroundColor: '#6b7280',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 20px',
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

const statsText = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '16px 0 8px 0',
  fontWeight: '600',
};

const unsubscribeText = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '8px 0',
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
