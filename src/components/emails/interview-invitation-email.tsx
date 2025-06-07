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

interface InterviewInvitationEmailProps {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  interviewDate: string;
  interviewTime: string;
  interviewType: 'in-person' | 'video' | 'phone';
  location?: string;
  meetingLink?: string;
  interviewerName: string;
  interviewerTitle: string;
  interviewDuration: string;
  specialInstructions?: string;
  contactEmail: string;
  confirmationRequired?: boolean;
  confirmationDeadline?: string;
}

export default function InterviewInvitationEmail({
  candidateName = 'Candidate',
  jobTitle = 'Position',
  companyName = 'Company',
  interviewDate = 'Monday, January 15, 2024',
  interviewTime = '2:00 PM PST',
  interviewType = 'in-person',
  location,
  meetingLink,
  interviewerName = 'Hiring Manager',
  interviewerTitle = 'Department Head',
  interviewDuration = '45 minutes',
  specialInstructions,
  contactEmail = 'hr@company.com',
  confirmationRequired = true,
  confirmationDeadline,
}: InterviewInvitationEmailProps) {
  const previewText = `🎉 Interview invitation for ${jobTitle} at ${companyName} - ${interviewDate}`;

  const getInterviewTypeIcon = () => {
    switch (interviewType) {
      case 'video':
        return '💻';
      case 'phone':
        return '📞';
      default:
        return '🏢';
    }
  };

  const getInterviewTypeText = () => {
    switch (interviewType) {
      case 'video':
        return 'Video Interview';
      case 'phone':
        return 'Phone Interview';
      default:
        return 'In-Person Interview';
    }
  };

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
            <Text style={tagline}>🎉 Interview Invitation</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Dear {candidateName},</Text>
            
            <Text style={intro}>
              Congratulations! We were impressed with your application for the <strong>{jobTitle}</strong> position 
              at <strong>{companyName}</strong>. We would like to invite you to the next step in our hiring process.
            </Text>

            {/* Interview Hero Card */}
            <Section style={heroCard}>
              <Text style={heroIcon}>🌟</Text>
              <Text style={heroTitle}>You're Invited to Interview!</Text>
              <Text style={heroSubtitle}>We're excited to learn more about you</Text>
            </Section>

            {/* Interview Details */}
            <Section style={detailsCard}>
              <Text style={detailsTitle}>📅 Interview Details</Text>
              
              <Section style={detailGrid}>
                <Section style={detailItem}>
                  <Text style={detailLabel}>📆 Date:</Text>
                  <Text style={detailValue}>{interviewDate}</Text>
                </Section>
                
                <Section style={detailItem}>
                  <Text style={detailLabel}>⏰ Time:</Text>
                  <Text style={detailValue}>{interviewTime}</Text>
                </Section>
                
                <Section style={detailItem}>
                  <Text style={detailLabel}>{getInterviewTypeIcon()} Type:</Text>
                  <Text style={detailValue}>{getInterviewTypeText()}</Text>
                </Section>
                
                <Section style={detailItem}>
                  <Text style={detailLabel}>⌛ Duration:</Text>
                  <Text style={detailValue}>{interviewDuration}</Text>
                </Section>
                
                {location && (
                  <Section style={detailItem}>
                    <Text style={detailLabel}>📍 Location:</Text>
                    <Text style={detailValue}>{location}</Text>
                  </Section>
                )}
                
                {meetingLink && (
                  <Section style={detailItem}>
                    <Text style={detailLabel}>🔗 Meeting Link:</Text>
                    <Text style={detailValue}>
                      <Link href={meetingLink} style={linkStyle}>
                        Join Interview
                      </Link>
                    </Text>
                  </Section>
                )}
                
                <Section style={detailItem}>
                  <Text style={detailLabel}>👤 Interviewer:</Text>
                  <Text style={detailValue}>{interviewerName}</Text>
                  <Text style={detailSubValue}>{interviewerTitle}</Text>
                </Section>
              </Section>
            </Section>

            {/* Confirmation Section */}
            {confirmationRequired && (
              <Section style={confirmationCard}>
                <Text style={confirmationTitle}>✅ Please Confirm Your Attendance</Text>
                <Text style={confirmationText}>
                  Please reply to this email to confirm your attendance by{' '}
                  {confirmationDeadline || 'as soon as possible'}. If you need to reschedule, 
                  please let us know at least 24 hours in advance.
                </Text>
                
                <Section style={buttonContainer}>
                  <Button style={confirmButton} href={`mailto:${contactEmail}?subject=Interview Confirmation - ${jobTitle}&body=I confirm my attendance for the interview on ${interviewDate} at ${interviewTime}.`}>
                    Confirm Interview
                  </Button>
                </Section>
              </Section>
            )}

            {/* Preparation Tips */}
            <Section style={preparationCard}>
              <Text style={preparationTitle}>📝 Interview Preparation Tips</Text>
              <Text style={preparationText}>To help you prepare for your interview:</Text>
              
              <Section style={tipsList}>
                <Text style={tipItem}>✅ Review the job description and requirements thoroughly</Text>
                <Text style={tipItem}>✅ Prepare specific examples of your relevant experience</Text>
                <Text style={tipItem}>✅ Research {companyName} and our presence in the Central Valley</Text>
                <Text style={tipItem}>✅ Prepare thoughtful questions about the role and company</Text>
                <Text style={tipItem}>✅ Test your technology (for video interviews)</Text>
                <Text style={tipItem}>✅ Plan to arrive 10-15 minutes early</Text>
              </Section>
            </Section>

            {/* Special Instructions */}
            {specialInstructions && (
              <Section style={instructionsCard}>
                <Text style={instructionsTitle}>📋 Special Instructions</Text>
                <Text style={instructionsText}>{specialInstructions}</Text>
              </Section>
            )}

            {/* What to Expect */}
            <Section style={expectationCard}>
              <Text style={expectationTitle}>🎯 What to Expect</Text>
              <Text style={expectationText}>
                During the interview, we'll discuss your background, experience, and how you can contribute 
                to our team. This is also a great opportunity for you to ask questions and learn more about 
                the position and our company culture.
              </Text>
            </Section>

            {/* Contact Information */}
            <Section style={contactCard}>
              <Text style={contactTitle}>Need to Reschedule or Have Questions? 🤝</Text>
              <Text style={contactText}>
                If you need to reschedule or have any questions about the interview process, 
                please don't hesitate to contact us.
              </Text>
              <Text style={contactInfo}>
                📧 {contactEmail}<br />
                👤 {interviewerName}, {interviewerTitle}
              </Text>
            </Section>

            <Text style={closingText}>
              We're looking forward to meeting you and learning more about your qualifications! 😊
            </Text>

            <Text style={signature}>
              Best regards,<br />
              <strong>{interviewerName}</strong><br />
              {interviewerTitle}<br />
              {companyName}
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerTitle}>209 Works</Text>
            <Text style={footerSubtitle}>Connecting Central Valley talent with local opportunities</Text>
            <Text style={footerText}>
              This interview invitation was sent through 209 Works, the Central Valley's premier job platform.
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
  fontSize: '18px',
  margin: '0',
  fontWeight: '500',
};

const content = {
  padding: '32px 24px',
};

const greeting = {
  fontSize: '18px',
  color: '#1e293b',
  margin: '0 0 20px 0',
  fontWeight: '500',
};

const intro = {
  fontSize: '16px',
  color: '#374151',
  lineHeight: '1.6',
  margin: '0 0 32px 0',
};

const heroCard = {
  backgroundColor: '#9fdf9f',
  backgroundImage: 'linear-gradient(135deg, #9fdf9f 0%, #7dd87d 100%)',
  borderRadius: '16px',
  padding: '32px 24px',
  margin: '32px 0',
  textAlign: 'center' as const,
};

const heroIcon = {
  fontSize: '48px',
  margin: '0 0 16px 0',
  display: 'block',
};

const heroTitle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1e3329',
  margin: '0 0 8px 0',
};

const heroSubtitle = {
  fontSize: '16px',
  color: '#1e3329',
  margin: '0',
  opacity: 0.8,
};

const detailsCard = {
  backgroundColor: '#f8fafc',
  border: '2px solid #e2e8f0',
  borderLeft: '4px solid #ff6b35',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
};

const detailsTitle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#1e293b',
  margin: '0 0 20px 0',
};

const detailGrid = {
  margin: '0',
};

const detailItem = {
  margin: '12px 0',
  display: 'block',
};

const detailLabel = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#64748b',
  margin: '0 0 4px 0',
  display: 'block',
};

const detailValue = {
  fontSize: '16px',
  fontWeight: '500',
  color: '#1e293b',
  margin: '0',
  display: 'block',
};

const detailSubValue = {
  fontSize: '14px',
  color: '#64748b',
  margin: '2px 0 0 0',
  display: 'block',
};

const linkStyle = {
  color: '#ff6b35',
  textDecoration: 'underline',
  fontWeight: '500',
};

const confirmationCard = {
  backgroundColor: '#fff7ed',
  border: '2px solid #fed7aa',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
  textAlign: 'center' as const,
};

const confirmationTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#ea580c',
  margin: '0 0 12px 0',
};

const confirmationText = {
  fontSize: '15px',
  color: '#7c2d12',
  lineHeight: '1.5',
  margin: '0 0 20px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '20px 0',
};

const confirmButton = {
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
  boxShadow: '0 4px 8px rgba(255, 107, 53, 0.3)',
};

const preparationCard = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #bbf7d0',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
};

const preparationTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#166534',
  margin: '0 0 12px 0',
};

const preparationText = {
  fontSize: '15px',
  color: '#166534',
  margin: '0 0 16px 0',
};

const tipsList = {
  margin: '0',
};

const tipItem = {
  fontSize: '14px',
  color: '#166534',
  margin: '8px 0',
  lineHeight: '1.4',
  display: 'block',
};

const instructionsCard = {
  backgroundColor: '#f1f5f9',
  border: '2px solid #cbd5e1',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
};

const instructionsTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#334155',
  margin: '0 0 12px 0',
};

const instructionsText = {
  fontSize: '15px',
  color: '#475569',
  lineHeight: '1.5',
  margin: '0',
};

const expectationCard = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const expectationTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#2d4a3e',
  margin: '0 0 8px 0',
};

const expectationText = {
  fontSize: '14px',
  color: '#64748b',
  lineHeight: '1.5',
  margin: '0',
};

const contactCard = {
  backgroundColor: '#fff7ed',
  border: '2px solid #fed7aa',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
  textAlign: 'center' as const,
};

const contactTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#ea580c',
  margin: '0 0 12px 0',
};

const contactText = {
  fontSize: '15px',
  color: '#7c2d12',
  lineHeight: '1.5',
  margin: '0 0 16px 0',
};

const contactInfo = {
  fontSize: '15px',
  color: '#7c2d12',
  fontWeight: '500',
  lineHeight: '1.6',
  margin: '0',
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
  border: '1px solid #bbf7d0',
};

const signature = {
  fontSize: '15px',
  color: '#374151',
  margin: '24px 0 0 0',
  lineHeight: '1.5',
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
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 4px 0',
};

const footerSubtitle = {
  color: '#64748b',
  fontSize: '12px',
  margin: '0 0 12px 0',
};

const footerText = {
  fontSize: '12px',
  color: '#64748b',
  margin: '0 0 8px 0',
  lineHeight: '1.4',
};

const copyrightText = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '0',
}; 