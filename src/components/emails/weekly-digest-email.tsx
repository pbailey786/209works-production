

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
  Link,
} from '@react-email/components';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type: string;
  url: string;
  postedDate: string;
}

interface WeeklyDigestEmailProps {
  userName: string;
  jobs: Job[];
  totalJobs: number;
  location: string;
  unsubscribeUrl: string;
  viewAllJobsUrl: string;
}

export default function WeeklyDigestEmail({
  userName = 'Job Seeker',
  jobs = [],
  totalJobs = 0,
  location = '209 Area',
  unsubscribeUrl = '#',
  viewAllJobsUrl = 'https://209.works/jobs',
}: WeeklyDigestEmailProps) {
  const previewText = `🌟 ${totalJobs} new jobs this week in ${location} | Your 209 Works Weekly Digest`;

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
            <Text style={tagline}>📧 Your Weekly Job Digest</Text>
            <Text style={weeklyStats}>
              {totalJobs} new jobs this week in {location}
            </Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Hi {userName}! 👋</Text>
            
            {totalJobs > 0 ? (
              <>
                <Text style={intro}>
                  Here are the latest job opportunities we've found for you in the Central Valley this week:
                </Text>

                {/* Featured Jobs Section */}
                <Section style={jobsSection}>
                  <Text style={sectionTitle}>🎯 Featured Opportunities</Text>
                  
                  {jobs.slice(0, 5).map((job, index) => (
                    <Section key={job.id} style={jobCard}>
                      <Text style={jobTitleStyle}>{job.title}</Text>
                      <Text style={companyStyle}>{job.company}</Text>
                      
                      <Section style={jobMetaContainer}>
                        <Text style={locationStyle}>📍 {job.location}</Text>
                        <Text style={jobTypeStyle}>🕒 {job.type}</Text>
                        {job.salary && <Text style={salaryStyle}>💰 {job.salary}</Text>}
                        <Text style={postedStyle}>🕐 Posted {job.postedDate}</Text>
                      </Section>
                      
                      <Section style={jobButtonContainer}>
                        <Button style={jobButton} href={job.url}>
                          View Job →
                        </Button>
                      </Section>
                    </Section>
                  ))}
                </Section>

                {/* Show More Section */}
                {totalJobs > 5 && (
                  <Section style={moreJobsSection}>
                    <Text style={moreJobsText}>
                      🔥 Plus {totalJobs - 5} more opportunities waiting for you!
                    </Text>
                    <Section style={ctaContainer}>
                      <Button style={primaryButton} href={viewAllJobsUrl}>
                        View All {totalJobs} Jobs →
                      </Button>
                    </Section>
                  </Section>
                )}

                {/* Tips Section */}
                <Section style={tipsSection}>
                  <Text style={tipsTitle}>💡 Weekly Job Search Tips</Text>
                  <Text style={tipItem}>✨ Apply within 24-48 hours for the best response rates</Text>
                  <Text style={tipItem}>🎯 Customize your resume for each application</Text>
                  <Text style={tipItem}>📧 Set up more specific job alerts to catch opportunities early</Text>
                  <Text style={tipItem}>🤝 Connect with local employers on LinkedIn</Text>
                </Section>
              </>
            ) : (
              <Section style={noJobsSection}>
                <Text style={noJobsTitle}>🔍 No new matches this week</Text>
                <Text style={noJobsText}>
                  We didn't find any new jobs matching your current criteria this week, but don't worry! 
                  New opportunities are posted daily.
                </Text>
                <Text style={noJobsText}>
                  <strong>What you can do:</strong>
                </Text>
                <Text style={tipItem}>🎯 Broaden your job alert criteria</Text>
                <Text style={tipItem}>📋 Update your resume and profile</Text>
                <Text style={tipItem}>🔍 Browse all available jobs in the 209 area</Text>
                
                <Section style={ctaContainer}>
                  <Button style={primaryButton} href={viewAllJobsUrl}>
                    Browse All Jobs →
                  </Button>
                </Section>
              </Section>
            )}

            <Text style={footer}>
              Keep pushing forward! 💪
              <br />
              <strong>The 209 Works Team</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerTitle}>209 Works</Text>
            <Text style={footerSubtitle}>Your weekly dose of Central Valley opportunities</Text>
            <Text style={unsubscribeText}>
              <Link href="https://209.works/alerts" style={manageLink}>Manage job alerts</Link> • 
              <Link href={unsubscribeUrl} style={unsubscribeLink}> Unsubscribe from weekly digest</Link>
            </Text>
            <Text style={copyrightText}>
              © {new Date().getFullYear()} 209 Works. All rights reserved.
              <br />
              Proudly connecting talent with opportunity across the Central Valley.
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
  margin: '0 0 12px 0',
  fontWeight: '500',
};

const weeklyStats = {
  color: '#9fdf9f',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  padding: '8px 16px',
  borderRadius: '20px',
  display: 'inline-block',
};

const content = {
  padding: '32px 24px',
};

const greeting = {
  fontSize: '22px',
  fontWeight: '600',
  color: '#1e293b',
  margin: '0 0 16px 0',
};

const intro = {
  fontSize: '16px',
  color: '#475569',
  lineHeight: '1.6',
  margin: '0 0 32px 0',
};

const jobsSection = {
  margin: '0 0 32px 0',
};

const sectionTitle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#2d4a3e',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const jobCard = {
  backgroundColor: '#f8fafc',
  border: '2px solid #e2e8f0',
  borderRadius: '12px',
  padding: '20px',
  margin: '0 0 20px 0',
  borderLeft: '4px solid #ff6b35',
};

const jobTitleStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1e293b',
  margin: '0 0 6px 0',
  lineHeight: '1.3',
};

const companyStyle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#ff6b35',
  margin: '0 0 12px 0',
};

const jobMetaContainer = {
  margin: '0 0 16px 0',
};

const locationStyle = {
  fontSize: '13px',
  color: '#64748b',
  margin: '2px 0',
  display: 'block',
};

const jobTypeStyle = {
  fontSize: '13px',
  color: '#64748b',
  margin: '2px 0',
  display: 'block',
};

const salaryStyle = {
  fontSize: '13px',
  color: '#059669',
  fontWeight: '600',
  margin: '2px 0',
  display: 'block',
};

const postedStyle = {
  fontSize: '13px',
  color: '#64748b',
  margin: '2px 0',
  display: 'block',
};

const jobButtonContainer = {
  textAlign: 'center' as const,
};

const jobButton = {
  backgroundColor: '#ff6b35',
  backgroundImage: 'linear-gradient(135deg, #ff6b35 0%, #e55a2b 100%)',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 20px',
  border: 'none',
  boxShadow: '0 2px 4px rgba(255, 107, 53, 0.2)',
};

const moreJobsSection = {
  backgroundColor: '#f0fdf4',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
  border: '2px solid #bbf7d0',
  textAlign: 'center' as const,
};

const moreJobsText = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#2d4a3e',
  margin: '0 0 20px 0',
};

const ctaContainer = {
  textAlign: 'center' as const,
  margin: '20px 0',
};

const primaryButton = {
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
};

const tipsSection = {
  backgroundColor: '#fff7ed',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
  border: '2px solid #fed7aa',
};

const tipsTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#ea580c',
  margin: '0 0 16px 0',
};

const tipItem = {
  fontSize: '14px',
  color: '#7c2d12',
  margin: '8px 0',
  lineHeight: '1.5',
  display: 'block',
};

const noJobsSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  padding: '32px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '1px solid #e2e8f0',
};

const noJobsTitle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#2d4a3e',
  margin: '0 0 16px 0',
};

const noJobsText = {
  fontSize: '16px',
  color: '#475569',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
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
