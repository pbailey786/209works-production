

  import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Img,
} from '@react-email/components';

interface EmployerCandidateContactProps {
  candidateName: string;
  employerName: string;
  companyName: string;
  jobTitle: string;
  message: string;
  nextSteps?: string;
  interviewLink?: string;
  employerEmail: string;
  applicationUrl: string;
}

export default function EmployerCandidateContact({
  candidateName,
  employerName,
  companyName,
  jobTitle,
  message,
  nextSteps,
  interviewLink,
  employerEmail,
  applicationUrl,
}: EmployerCandidateContactProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerText}>209 Works</Text>
            <Text style={subHeaderText}>Update on Your Application</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Hi {candidateName},</Text>

            <Text style={paragraph}>
              Great news! {employerName} from {companyName} has reached out regarding your application for the <strong>{jobTitle}</strong> position.
            </Text>

            {/* Employer Message */}
            <Section style={messageBox}>
              <Text style={messageHeader}>Message from {employerName}:</Text>
              <Text style={messageText}>{message}</Text>
            </Section>

            {/* Next Steps */}
            {nextSteps && (
              <Section style={nextStepsBox}>
                <Text style={nextStepsHeader}>Next Steps:</Text>
                <Text style={nextStepsText}>{nextSteps}</Text>
              </Section>
            )}

            {/* Interview Link */}
            {interviewLink && (
              <Section style={buttonContainer}>
                <Link href={interviewLink} style={button}>
                  Join Interview / Schedule
                </Link>
              </Section>
            )}

            {/* Action Buttons */}
            <Section style={buttonContainer}>
              <Link href={applicationUrl} style={primaryButton}>
                View Application Details
              </Link>
            </Section>

            <Text style={paragraph}>
              You can reply directly to this email to respond to {employerName}, or visit your application dashboard for more details.
            </Text>

            <Hr style={hr} />

            {/* Footer */}
            <Text style={footer}>
              This message was sent through 209 Works on behalf of {companyName}.
              <br />
              If you have any questions, please contact us at{' '}
              <Link href="mailto:support@209.works" style={link}>
                support@209.works
              </Link>
            </Text>

            <Text style={footer}>
              <Link href="https://209.works" style={link}>
                209 Works
              </Link>{' '}
              - Built for the 209. Made for the people who work here.
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
  padding: '32px 24px',
  backgroundColor: '#2d4a3e',
  textAlign: 'center' as const,
};

const headerText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const subHeaderText = {
  color: '#ffffff',
  fontSize: '16px',
  margin: '8px 0 0 0',
  opacity: 0.9,
};

const content = {
  padding: '24px',
};

const greeting = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 16px 0',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#4a4a4a',
  margin: '16px 0',
};

const messageBox = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const messageHeader = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#2d4a3e',
  margin: '0 0 12px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const messageText = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#1a1a1a',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
};

const nextStepsBox = {
  backgroundColor: '#e8f4f8',
  border: '1px solid #bee5eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const nextStepsHeader = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#0c5460',
  margin: '0 0 12px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const nextStepsText = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#0c5460',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#6c757d',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '0 8px',
};

const primaryButton = {
  backgroundColor: '#2d4a3e',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '0 8px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '1.6',
  margin: '16px 0 0 0',
  textAlign: 'center' as const,
};

const link = {
  color: '#2d4a3e',
  textDecoration: 'underline',
};
