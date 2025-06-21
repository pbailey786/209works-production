

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

interface ApplicationStatusEmailProps {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  status: 'accepted' | 'rejected' | 'under_review' | 'interview_scheduled';
  personalizedMessage?: string;
  nextSteps?: string;
  feedbackMessage?: string;
  futureOpportunities?: boolean;
  interviewDetails?: {
    date: string;
    time: string;
    type: string;
    location?: string;
    meetingLink?: string;
  };
  contactEmail: string;
  hrName?: string;
}

export default function ApplicationStatusEmail({
  candidateName = 'Candidate',
  jobTitle = 'Position',
  companyName = 'Company',
  status = 'under_review',
  personalizedMessage,
  nextSteps,
  feedbackMessage,
  futureOpportunities = true,
  interviewDetails,
  contactEmail = 'hr@company.com',
  hrName = 'Hiring Team'
}: ApplicationStatusEmailProps) {
  const getPreviewText = () => {
    switch (status) {
      case 'accepted':
        return `🎉 Congratulations! Your application for ${jobTitle} at ${companyName} has been accepted`;
      case 'rejected':
        return `📝 Application update for ${jobTitle} at ${companyName} - Thank you for your interest`;
      case 'interview_scheduled':
        return `📅 Interview scheduled for ${jobTitle} at ${companyName}`;
      default:
        return `📊 Application update for ${jobTitle} at ${companyName}`;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'accepted':
        return '#ff6b35'; // Orange for success (brand primary)
      case 'rejected':
        return '#64748b'; // Neutral gray
      case 'interview_scheduled':
        return '#2d4a3e'; // Dark green (brand secondary)
      default:
        return '#9fdf9f'; // Light green (brand tertiary)
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'accepted':
        return '🎉';
      case 'rejected':
        return '📝';
      case 'interview_scheduled':
        return '📅';
      default:
        return '📊';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'accepted':
        return 'Congratulations! You\'ve Been Selected! 🌟';
      case 'rejected':
        return 'Application Update';
      case 'interview_scheduled':
        return 'Interview Scheduled! 🤝';
      default:
        return 'Application Under Review ⏳';
    }
  };

  return (
    <Html>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
      </Head>
      <Preview>{getPreviewText()}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>209 Works</Text>
            <Text style={tagline}>Connecting Central Valley Talent with Opportunity</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Dear {candidateName},</Text>

            {/* Status Card */}
            <Section style={{...statusCard, borderColor: getStatusColor()}}>
              <Text style={statusIcon}>{getStatusIcon()}</Text>
              <Text style={{...statusTitle, color: getStatusColor()}}>
                {getStatusTitle()}
              </Text>
              <Text style={jobInfo}>
                <strong>{jobTitle}</strong> at <strong>{companyName}</strong>
              </Text>
            </Section>

            {/* Status-specific content */}
            {status === 'accepted' && (
              <Section style={messageCard}>
                <Text style={messageText}>
                  {personalizedMessage || 
                    `We are absolutely thrilled to inform you that you have been selected for the ${jobTitle} position! 
                    Your background, skills, and experience make you an exceptional fit for our team, and we're excited 
                    to welcome you to ${companyName}.`
                  }
                </Text>
                {nextSteps && (
                  <>
                    <Text style={sectionTitle}>🚀 Next Steps</Text>
                    <Section style={nextStepsCard}>
                      <Text style={messageText}>{nextSteps}</Text>
                    </Section>
                  </>
                )}
                
                <Section style={celebrationCard}>
                  <Text style={celebrationTitle}>🎊 Welcome to the Team!</Text>
                  <Text style={celebrationText}>
                    We're looking forward to having you contribute to our success here in the Central Valley. 
                    Your journey with {companyName} is just beginning!
                  </Text>
                </Section>
              </Section>
            )}

            {status === 'rejected' && (
              <Section style={messageCard}>
                <Text style={messageText}>
                  {personalizedMessage || 
                    `Thank you for your interest in the ${jobTitle} position and for taking the time to apply with us. 
                    After careful consideration, we have decided to move forward with other candidates whose experience 
                    more closely aligns with our current needs.`
                  }
                </Text>
                
                {feedbackMessage && (
                  <>
                    <Text style={sectionTitle}>💡 Feedback for Your Growth</Text>
                    <Section style={feedbackCard}>
                      <Text style={feedbackText}>{feedbackMessage}</Text>
                    </Section>
                  </>
                )}

                {futureOpportunities && (
                  <Section style={encouragementCard}>
                    <Text style={encouragementTitle}>🌟 Don't Give Up!</Text>
                    <Text style={encouragementText}>
                      We were genuinely impressed with your qualifications and encourage you to apply for future 
                      positions that match your skills. The Central Valley job market is growing, and we'll keep 
                      your information on file for upcoming opportunities.
                    </Text>
                  </Section>
                )}
              </Section>
            )}

            {status === 'interview_scheduled' && interviewDetails && (
              <Section style={messageCard}>
                <Text style={messageText}>
                  {personalizedMessage || 
                    `Excellent news! We would like to schedule an interview with you for the ${jobTitle} position. 
                    We're excited to learn more about you and discuss how you can contribute to our team.`
                  }
                </Text>
                
                <Section style={interviewCard}>
                  <Text style={sectionTitle}>📅 Interview Details</Text>
                  <Text style={detailItem}><strong>📆 Date:</strong> {interviewDetails.date}</Text>
                  <Text style={detailItem}><strong>⏰ Time:</strong> {interviewDetails.time}</Text>
                  <Text style={detailItem}><strong>💼 Type:</strong> {interviewDetails.type}</Text>
                  {interviewDetails.location && (
                    <Text style={detailItem}><strong>📍 Location:</strong> {interviewDetails.location}</Text>
                  )}
                  {interviewDetails.meetingLink && (
                    <Text style={detailItem}>
                      <strong>🔗 Meeting Link:</strong>{' '}
                      <Link href={interviewDetails.meetingLink} style={linkStyle}>
                        Join Interview
                      </Link>
                    </Text>
                  )}
                </Section>

                <Section style={preparationCard}>
                  <Text style={preparationTitle}>📝 Interview Preparation Tips</Text>
                  <Text style={preparationItem}>• Review the job description and requirements</Text>
                  <Text style={preparationItem}>• Prepare specific examples of your experience</Text>
                  <Text style={preparationItem}>• Research our company and Central Valley presence</Text>
                  <Text style={preparationItem}>• Prepare thoughtful questions about the role</Text>
                </Section>
              </Section>
            )}

            {status === 'under_review' && (
              <Section style={messageCard}>
                <Text style={messageText}>
                  {personalizedMessage || 
                    `Thank you for your application for the ${jobTitle} position. We have received your 
                    application and our hiring team is currently reviewing it carefully. We appreciate your patience 
                    as we thoroughly consider all candidates for this exciting opportunity.`
                  }
                </Text>
                
                <Section style={timelineCard}>
                  <Text style={sectionTitle}>⏰ What's Next?</Text>
                  <Text style={timelineItem}>📋 Our team will review your application thoroughly</Text>
                  <Text style={timelineItem}>📞 Qualified candidates will be contacted for interviews</Text>
                  <Text style={timelineItem}>⏱️ We aim to update you within 1-2 weeks</Text>
                  <Text style={timelineItem}>📧 Keep an eye on your email for updates</Text>
                </Section>
              </Section>
            )}

            {/* Contact Section */}
            <Section style={contactSection}>
              <Text style={contactTitle}>Have Questions? We're Here to Help! 🤝</Text>
              <Text style={contactText}>
                If you have any questions about your application, this position, or our company, 
                please don't hesitate to reach out to us.
              </Text>
              <Text style={contactInfo}>
                📧 {contactEmail}<br />
                {hrName && <>👤 {hrName}</>}
              </Text>
            </Section>

            <Text style={closingText}>
              {status === 'accepted' ? 'Welcome to the Central Valley family! 🎉' :
               status === 'rejected' ? 'We wish you the very best in your job search journey! 🌟' :
               status === 'interview_scheduled' ? 'We\'re looking forward to meeting you! 😊' :
               'Thank you for your interest in joining our team! 🙏'}
            </Text>

            <Text style={signature}>
              Best regards,<br />
              <strong>{hrName}</strong><br />
              {companyName}
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerTitle}>209 Works</Text>
            <Text style={footerSubtitle}>Connecting Central Valley talent with local opportunities</Text>
            <Text style={footerText}>
              This update was sent through 209 Works, the Central Valley's premier job platform.
            </Text>
            <Text style={copyrightText}>
              © {new Date().getFullYear()} 209 Works. All rights reserved.
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
  textRendering: 'optimizeLegibility' as const
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
};

const header = {
  backgroundColor: '#2d4a3e',
  backgroundImage: 'linear-gradient(135deg, #2d4a3e 0%, #1e3329 100%)',
  padding: '32px 24px',
  textAlign: 'center' as const
};

const logo = {
  color: '#9fdf9f',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
  letterSpacing: '-0.5px'
};

const tagline = {
  color: '#ffffff',
  fontSize: '14px',
  margin: '0',
  fontWeight: '500'
};

const content = {
  padding: '32px 24px'
};

const greeting = {
  fontSize: '18px',
  color: '#1e293b',
  margin: '0 0 24px 0',
  fontWeight: '500'
};

const statusCard = {
  border: '3px solid',
  borderRadius: '16px',
  padding: '32px 24px',
  margin: '24px 0',
  backgroundColor: '#fafafa',
  textAlign: 'center' as const
};

const statusIcon = {
  fontSize: '56px',
  margin: '0 0 16px 0',
  display: 'block'
};

const statusTitle = {
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
  lineHeight: '1.2'
};

const jobInfo = {
  fontSize: '16px',
  color: '#64748b',
  margin: '0',
  lineHeight: '1.4'
};

const messageCard = {
  padding: '24px',
  margin: '24px 0',
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  border: '1px solid #e2e8f0'
};

const messageText = {
  fontSize: '16px',
  color: '#374151',
  lineHeight: '1.6',
  margin: '0 0 20px 0'
};

const sectionTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1e293b',
  margin: '24px 0 16px 0'
};

const nextStepsCard = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #bbf7d0',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0'
};

const celebrationCard = {
  backgroundColor: '#fff7ed',
  border: '2px solid #fed7aa',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
  textAlign: 'center' as const
};

const celebrationTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#ea580c',
  margin: '0 0 8px 0'
};

const celebrationText = {
  fontSize: '15px',
  color: '#7c2d12',
  lineHeight: '1.5',
  margin: '0'
};

const feedbackCard = {
  backgroundColor: '#f1f5f9',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0'
};

const feedbackText = {
  fontSize: '15px',
  color: '#475569',
  lineHeight: '1.5',
  margin: '0',
  fontStyle: 'italic'
};

const encouragementCard = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #bbf7d0',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0'
};

const encouragementTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#166534',
  margin: '0 0 8px 0'
};

const encouragementText = {
  fontSize: '15px',
  color: '#166534',
  lineHeight: '1.5',
  margin: '0'
};

const interviewCard = {
  backgroundColor: '#f8fafc',
  border: '2px solid #e2e8f0',
  borderLeft: '4px solid #2d4a3e',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0'
};

const detailItem = {
  fontSize: '15px',
  color: '#1e293b',
  margin: '8px 0',
  lineHeight: '1.4'
};

const linkStyle = {
  color: '#ff6b35',
  textDecoration: 'underline',
  fontWeight: '500'
};

const preparationCard = {
  backgroundColor: '#fff7ed',
  border: '1px solid #fed7aa',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0'
};

const preparationTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#ea580c',
  margin: '0 0 12px 0'
};

const preparationItem = {
  fontSize: '14px',
  color: '#7c2d12',
  margin: '6px 0',
  lineHeight: '1.4',
  display: 'block'
};

const timelineCard = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #bbf7d0',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0'
};

const timelineItem = {
  fontSize: '15px',
  color: '#166534',
  margin: '8px 0',
  lineHeight: '1.4',
  display: 'block'
};

const contactSection = {
  backgroundColor: '#fff7ed',
  border: '2px solid #fed7aa',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
  textAlign: 'center' as const
};

const contactTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#ea580c',
  margin: '0 0 12px 0'
};

const contactText = {
  fontSize: '15px',
  color: '#7c2d12',
  margin: '0 0 16px 0',
  lineHeight: '1.5'
};

const contactInfo = {
  fontSize: '15px',
  color: '#7c2d12',
  fontWeight: '500',
  lineHeight: '1.6',
  margin: '0'
};

const closingText = {
  fontSize: '16px',
  color: '#2d4a3e',
  fontWeight: '600',
  textAlign: 'center' as const,
  margin: '32px 0',
  padding: '16px',
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  border: '1px solid #bbf7d0'
};

const signature = {
  fontSize: '15px',
  color: '#374151',
  margin: '24px 0 0 0',
  lineHeight: '1.5'
};

const divider = {
  borderColor: '#e2e8f0',
  margin: '0'
};

const footerSection = {
  backgroundColor: '#f8fafc',
  padding: '24px',
  textAlign: 'center' as const
};

const footerTitle = {
  color: '#2d4a3e',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 4px 0'
};

const footerSubtitle = {
  color: '#64748b',
  fontSize: '12px',
  margin: '0 0 12px 0'
};

const footerText = {
  fontSize: '12px',
  color: '#64748b',
  margin: '0 0 8px 0',
  lineHeight: '1.4'
};

const copyrightText = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '0'
}; 