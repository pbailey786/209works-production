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
  hrName = 'Hiring Team',
}: ApplicationStatusEmailProps) {
  const getPreviewText = () => {
    switch (status) {
      case 'accepted':
        return `Congratulations! Your application for ${jobTitle} has been accepted`;
      case 'rejected':
        return `Thank you for your interest in ${jobTitle} at ${companyName}`;
      case 'interview_scheduled':
        return `Interview scheduled for ${jobTitle} at ${companyName}`;
      default:
        return `Application update for ${jobTitle} at ${companyName}`;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'accepted':
        return '#059669'; // Green
      case 'rejected':
        return '#dc2626'; // Red
      case 'interview_scheduled':
        return '#7c3aed'; // Purple
      default:
        return '#2563eb'; // Blue
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
        return 'Congratulations! You\'ve Been Selected';
      case 'rejected':
        return 'Application Update';
      case 'interview_scheduled':
        return 'Interview Scheduled';
      default:
        return 'Application Under Review';
    }
  };

  return (
    <Html>
      <Head />
      <Preview>{getPreviewText()}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={{...header, backgroundColor: getStatusColor()}}>
            <Text style={logo}>209 Works</Text>
            <Text style={tagline}>Connecting Talent with Opportunity</Text>
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
                    `We are thrilled to inform you that you have been selected for the ${jobTitle} position! 
                    Your background, skills, and experience make you an excellent fit for our team.`
                  }
                </Text>
                {nextSteps && (
                  <>
                    <Text style={sectionTitle}>🚀 Next Steps</Text>
                    <Text style={messageText}>{nextSteps}</Text>
                  </>
                )}
              </Section>
            )}

            {status === 'rejected' && (
              <Section style={messageCard}>
                <Text style={messageText}>
                  {personalizedMessage || 
                    `Thank you for your interest in the ${jobTitle} position and for taking the time to apply. 
                    After careful consideration, we have decided to move forward with other candidates 
                    whose experience more closely aligns with our current needs.`
                  }
                </Text>
                
                {feedbackMessage && (
                  <>
                    <Text style={sectionTitle}>💡 Feedback</Text>
                    <Text style={feedbackText}>{feedbackMessage}</Text>
                  </>
                )}

                {futureOpportunities && (
                  <Section style={encouragementCard}>
                    <Text style={encouragementTitle}>🌟 Don't Give Up!</Text>
                    <Text style={encouragementText}>
                      We were impressed with your qualifications and encourage you to apply for future 
                      positions that match your skills. We'll keep your information on file for upcoming opportunities.
                    </Text>
                  </Section>
                )}
              </Section>
            )}

            {status === 'interview_scheduled' && interviewDetails && (
              <Section style={messageCard}>
                <Text style={messageText}>
                  {personalizedMessage || 
                    `Great news! We would like to schedule an interview with you for the ${jobTitle} position.`
                  }
                </Text>
                
                <Section style={interviewCard}>
                  <Text style={sectionTitle}>📅 Interview Details</Text>
                  <Text style={detailItem}><strong>Date:</strong> {interviewDetails.date}</Text>
                  <Text style={detailItem}><strong>Time:</strong> {interviewDetails.time}</Text>
                  <Text style={detailItem}><strong>Type:</strong> {interviewDetails.type}</Text>
                  {interviewDetails.location && (
                    <Text style={detailItem}><strong>Location:</strong> {interviewDetails.location}</Text>
                  )}
                  {interviewDetails.meetingLink && (
                    <Text style={detailItem}>
                      <strong>Meeting Link:</strong>{' '}
                      <Link href={interviewDetails.meetingLink} style={linkStyle}>
                        {interviewDetails.meetingLink}
                      </Link>
                    </Text>
                  )}
                </Section>
              </Section>
            )}

            {status === 'under_review' && (
              <Section style={messageCard}>
                <Text style={messageText}>
                  {personalizedMessage || 
                    `Thank you for your application for the ${jobTitle} position. We have received your 
                    application and our team is currently reviewing it. We appreciate your patience 
                    as we carefully consider all candidates.`
                  }
                </Text>
                
                <Section style={timelineCard}>
                  <Text style={sectionTitle}>⏰ What's Next?</Text>
                  <Text style={timelineItem}>• Our team will review your application thoroughly</Text>
                  <Text style={timelineItem}>• Qualified candidates will be contacted for interviews</Text>
                  <Text style={timelineItem}>• We aim to update you within 1-2 weeks</Text>
                </Section>
              </Section>
            )}

            {/* Contact Section */}
            <Section style={contactSection}>
              <Text style={contactTitle}>Questions?</Text>
              <Text style={contactText}>
                If you have any questions about your application or this position, 
                please don't hesitate to reach out to us.
              </Text>
              <Text style={contactInfo}>
                📧 {contactEmail}<br />
                {hrName && <>👤 {hrName}</>}
              </Text>
            </Section>

            <Text style={closingText}>
              {status === 'accepted' ? 'Welcome to the team!' :
               status === 'rejected' ? 'We wish you the best in your job search!' :
               'Thank you for your interest in joining our team!'}
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
            <Text style={footerText}>
              This update was sent through 209 Works
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
  padding: '32px 20px',
  textAlign: 'center' as const,
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
  padding: '24px',
};

const greeting = {
  fontSize: '16px',
  color: '#1f2937',
  margin: '0 0 24px 0',
};

const statusCard = {
  border: '2px solid',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  backgroundColor: '#fafafa',
  textAlign: 'center' as const,
};

const statusIcon = {
  fontSize: '48px',
  margin: '0 0 16px 0',
};

const statusTitle = {
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const jobInfo = {
  fontSize: '16px',
  color: '#6b7280',
  margin: '0',
};

const messageCard = {
  padding: '20px',
  margin: '20px 0',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
};

const messageText = {
  fontSize: '15px',
  color: '#374151',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const sectionTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '20px 0 12px 0',
};

const feedbackText = {
  fontSize: '14px',
  color: '#6b7280',
  lineHeight: '1.5',
  margin: '0 0 16px 0',
  fontStyle: 'italic',
};

const encouragementCard = {
  backgroundColor: '#f0f9ff',
  border: '1px solid #0ea5e9',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
};

const encouragementTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#0c4a6e',
  margin: '0 0 8px 0',
};

const encouragementText = {
  fontSize: '14px',
  color: '#075985',
  lineHeight: '1.5',
  margin: '0',
};

const interviewCard = {
  backgroundColor: '#faf5ff',
  border: '1px solid #a855f7',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
};

const detailItem = {
  fontSize: '14px',
  color: '#1f2937',
  margin: '8px 0',
};

const linkStyle = {
  color: '#7c3aed',
  textDecoration: 'underline',
};

const timelineCard = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #22c55e',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
};

const timelineItem = {
  fontSize: '14px',
  color: '#15803d',
  margin: '6px 0',
};

const contactSection = {
  backgroundColor: '#fffbeb',
  border: '1px solid #f59e0b',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const contactTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#92400e',
  margin: '0 0 8px 0',
};

const contactText = {
  fontSize: '14px',
  color: '#b45309',
  margin: '0 0 12px 0',
};

const contactInfo = {
  fontSize: '14px',
  color: '#92400e',
  fontWeight: '500',
  lineHeight: '1.5',
  margin: '0',
};

const closingText = {
  fontSize: '15px',
  color: '#1f2937',
  fontWeight: '500',
  textAlign: 'center' as const,
  margin: '24px 0',
};

const signature = {
  fontSize: '14px',
  color: '#374151',
  margin: '24px 0 0 0',
  lineHeight: '1.5',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const footerSection = {
  padding: '0 24px',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '16px 0 8px 0',
};

const copyrightText = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '8px 0 0 0',
}; 