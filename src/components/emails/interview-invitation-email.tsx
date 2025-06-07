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
  interviewType: 'in-person' | 'phone' | 'video';
  location?: string;
  meetingLink?: string;
  interviewerName: string;
  interviewerTitle: string;
  contactEmail: string;
  contactPhone?: string;
  instructions?: string;
}

export default function InterviewInvitationEmail({
  candidateName = 'Candidate',
  jobTitle = 'Position',
  companyName = 'Company',
  interviewDate = 'Date TBD',
  interviewTime = 'Time TBD',
  interviewType = 'video',
  location,
  meetingLink,
  interviewerName = 'Hiring Manager',
  interviewerTitle = 'Manager',
  contactEmail = 'hr@company.com',
  contactPhone,
  instructions,
}: InterviewInvitationEmailProps) {
  const previewText = `Interview invitation for ${jobTitle} at ${companyName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>209 Works</Text>
            <Text style={tagline}>Connecting Talent with Opportunity</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Dear {candidateName},</Text>
            
            <Text style={congratsText}>
              <strong>Congratulations!</strong> We're excited to invite you for an interview for the{' '}
              <strong>{jobTitle}</strong> position at <strong>{companyName}</strong>.
            </Text>

            {/* Interview Details Card */}
            <Section style={detailsCard}>
              <Text style={cardTitle}>📅 Interview Details</Text>
              
              <Section style={detailRow}>
                <Text style={detailLabel}>Date:</Text>
                <Text style={detailValue}>{interviewDate}</Text>
              </Section>
              
              <Section style={detailRow}>
                <Text style={detailLabel}>Time:</Text>
                <Text style={detailValue}>{interviewTime}</Text>
              </Section>
              
              <Section style={detailRow}>
                <Text style={detailLabel}>Type:</Text>
                <Text style={detailValue}>
                  {interviewType === 'in-person' && '🏢 In-Person Interview'}
                  {interviewType === 'phone' && '📞 Phone Interview'}
                  {interviewType === 'video' && '🎥 Video Interview'}
                </Text>
              </Section>

              {location && interviewType === 'in-person' && (
                <Section style={detailRow}>
                  <Text style={detailLabel}>Location:</Text>
                  <Text style={detailValue}>{location}</Text>
                </Section>
              )}

              {meetingLink && interviewType === 'video' && (
                <Section style={detailRow}>
                  <Text style={detailLabel}>Meeting Link:</Text>
                  <Link href={meetingLink} style={linkStyle}>{meetingLink}</Link>
                </Section>
              )}

              <Hr style={divider} />

              <Section style={detailRow}>
                <Text style={detailLabel}>Interviewer:</Text>
                <Text style={detailValue}>{interviewerName}, {interviewerTitle}</Text>
              </Section>
            </Section>

            {/* Instructions */}
            {instructions && (
              <Section style={instructionsCard}>
                <Text style={cardTitle}>📋 Additional Instructions</Text>
                <Text style={instructionsText}>{instructions}</Text>
              </Section>
            )}

            {/* What to Expect */}
            <Section style={expectationsCard}>
              <Text style={cardTitle}>💡 What to Expect</Text>
              <Text style={expectationItem}>• Discussion about your background and experience</Text>
              <Text style={expectationItem}>• Overview of the role and company culture</Text>
              <Text style={expectationItem}>• Opportunity to ask questions about the position</Text>
              <Text style={expectationItem}>• Next steps in the interview process</Text>
            </Section>

            {/* Contact Information */}
            <Section style={contactCard}>
              <Text style={cardTitle}>📞 Questions?</Text>
              <Text style={contactText}>
                If you have any questions or need to reschedule, please contact:
              </Text>
              <Text style={contactInfo}>
                <strong>{interviewerName}</strong><br />
                📧 {contactEmail}
                {contactPhone && (
                  <>
                    <br />
                    📱 {contactPhone}
                  </>
                )}
              </Text>
            </Section>

            <Text style={closingText}>
              We look forward to meeting you and learning more about your background.
              Thank you for your interest in joining our team!
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
            <Text style={footerText}>
              This interview was scheduled through 209 Works
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
  backgroundColor: '#059669',
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
  margin: '0 0 16px 0',
};

const congratsText = {
  fontSize: '16px',
  color: '#1f2937',
  lineHeight: '1.6',
  margin: '0 0 24px 0',
};

const detailsCard = {
  border: '2px solid #059669',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  backgroundColor: '#f0fdf4',
};

const instructionsCard = {
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
  backgroundColor: '#f9fafb',
};

const expectationsCard = {
  border: '1px solid #ddd6fe',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
  backgroundColor: '#faf5ff',
};

const contactCard = {
  border: '1px solid #fbbf24',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
  backgroundColor: '#fffbeb',
};

const cardTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 16px 0',
};

const detailRow = {
  margin: '12px 0',
  display: 'flex',
  alignItems: 'center',
};

const detailLabel = {
  fontSize: '14px',
  color: '#6b7280',
  fontWeight: '600',
  margin: '0 16px 0 0',
  minWidth: '80px',
  display: 'inline-block',
};

const detailValue = {
  fontSize: '14px',
  color: '#1f2937',
  fontWeight: '500',
  margin: '0',
};

const linkStyle = {
  color: '#059669',
  textDecoration: 'underline',
  fontSize: '14px',
};

const instructionsText = {
  fontSize: '14px',
  color: '#374151',
  lineHeight: '1.6',
  margin: '0',
};

const expectationItem = {
  fontSize: '14px',
  color: '#374151',
  margin: '8px 0',
  lineHeight: '1.5',
};

const contactText = {
  fontSize: '14px',
  color: '#374151',
  margin: '0 0 12px 0',
};

const contactInfo = {
  fontSize: '14px',
  color: '#1f2937',
  margin: '0',
  lineHeight: '1.5',
};

const closingText = {
  fontSize: '15px',
  color: '#1f2937',
  lineHeight: '1.6',
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