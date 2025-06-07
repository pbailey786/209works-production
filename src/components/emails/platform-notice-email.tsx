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

interface PlatformNoticeEmailProps {
  recipientName?: string;
  noticeType: 'maintenance' | 'update' | 'security' | 'feature' | 'policy' | 'general';
  title: string;
  message: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  actionRequired?: boolean;
  actionText?: string;
  actionUrl?: string;
  effectiveDate?: string;
  supportUrl?: string;
}

export default function PlatformNoticeEmail({
  recipientName = 'User',
  noticeType = 'general',
  title = 'Platform Notice',
  message = 'This is an important notice from 209 Works.',
  urgencyLevel = 'medium',
  actionRequired = false,
  actionText,
  actionUrl,
  effectiveDate,
  supportUrl = 'https://209.works/contact',
}: PlatformNoticeEmailProps) {
  const getNoticeIcon = () => {
    switch (noticeType) {
      case 'maintenance':
        return '🔧';
      case 'update':
        return '🚀';
      case 'security':
        return '🔒';
      case 'feature':
        return '✨';
      case 'policy':
        return '📋';
      default:
        return '📢';
    }
  };

  const getUrgencyColor = () => {
    switch (urgencyLevel) {
      case 'critical':
        return '#dc2626'; // Red
      case 'high':
        return '#ea580c'; // Orange
      case 'medium':
        return '#ff6b35'; // Brand orange
      default:
        return '#2d4a3e'; // Brand green
    }
  };

  const getUrgencyLabel = () => {
    switch (urgencyLevel) {
      case 'critical':
        return 'CRITICAL';
      case 'high':
        return 'HIGH PRIORITY';
      case 'medium':
        return 'IMPORTANT';
      default:
        return 'NOTICE';
    }
  };

  const previewText = `${getUrgencyLabel()}: ${title} - 209 Works Platform Notice`;

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
            <Text style={tagline}>📢 Platform Notice</Text>
          </Section>

          {/* Urgency Banner */}
          <Section style={{...urgencyBanner, backgroundColor: getUrgencyColor()}}>
            <Text style={urgencyText}>
              {getUrgencyLabel()} {urgencyLevel === 'critical' && '🚨'}
            </Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Dear {recipientName},</Text>

            {/* Notice Card */}
            <Section style={{...noticeCard, borderColor: getUrgencyColor()}}>
              <Text style={noticeIcon}>{getNoticeIcon()}</Text>
              <Text style={{...noticeTitle, color: getUrgencyColor()}}>{title}</Text>
              
              {effectiveDate && (
                <Text style={effectiveText}>
                  📅 Effective: {effectiveDate}
                </Text>
              )}
            </Section>

            {/* Message Content */}
            <Section style={messageSection}>
              <Text style={messageText}>{message}</Text>
            </Section>

            {/* Action Required Section */}
            {actionRequired && (
              <Section style={actionSection}>
                <Text style={actionTitle}>⚠️ Action Required</Text>
                <Text style={actionDescription}>
                  This notice requires your attention. Please review the information above and take any necessary action.
                </Text>
                
                {actionText && actionUrl && (
                  <Section style={actionButtonContainer}>
                    <Button style={{...actionButton, backgroundColor: getUrgencyColor()}} href={actionUrl}>
                      {actionText} →
                    </Button>
                  </Section>
                )}
              </Section>
            )}

            {/* Information Sections Based on Notice Type */}
            {noticeType === 'maintenance' && (
              <Section style={infoSection}>
                <Text style={infoTitle}>🔧 What to Expect During Maintenance</Text>
                <Text style={infoItem}>• Some features may be temporarily unavailable</Text>
                <Text style={infoItem}>• Active sessions may be interrupted</Text>
                <Text style={infoItem}>• We'll restore full service as quickly as possible</Text>
                <Text style={infoItem}>• No data will be lost during this process</Text>
              </Section>
            )}

            {noticeType === 'security' && (
              <Section style={securitySection}>
                <Text style={securityTitle}>🔒 Security Best Practices</Text>
                <Text style={securityItem}>✅ Keep your password secure and unique</Text>
                <Text style={securityItem}>✅ Enable two-factor authentication if available</Text>
                <Text style={securityItem}>✅ Log out from shared or public computers</Text>
                <Text style={securityItem}>✅ Report any suspicious activity immediately</Text>
              </Section>
            )}

            {noticeType === 'feature' && (
              <Section style={featureSection}>
                <Text style={featureTitle}>✨ What's New</Text>
                <Text style={featureDescription}>
                  We're constantly improving 209 Works to provide you with the best possible experience. 
                  Check out our latest features and enhancements designed specifically for the Central Valley job market.
                </Text>
                
                <Section style={featureButtonContainer}>
                  <Button style={featureButton} href="https://209.works/features">
                    Explore New Features →
                  </Button>
                </Section>
              </Section>
            )}

            {/* Contact Support */}
            <Section style={supportSection}>
              <Text style={supportTitle}>Need Help or Have Questions? 🤝</Text>
              <Text style={supportText}>
                If you have any questions about this notice or need assistance, our support team is here to help.
              </Text>
              <Text style={supportContact}>
                📧 <Link href="mailto:support@209.works" style={supportLink}>support@209.works</Link>
                <br />
                💬 <Link href={supportUrl} style={supportLink}>Visit our help center</Link>
              </Text>
            </Section>

            <Text style={closingText}>
              Thank you for being a valued member of the 209 Works community! 🙏
            </Text>

            <Text style={signature}>
              Best regards,<br />
              <strong>The 209 Works Team</strong><br />
              Your Central Valley Job Platform
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerTitle}>209 Works</Text>
            <Text style={footerSubtitle}>Central Valley's Premier Job Platform</Text>
            <Text style={footerText}>
              This is an official platform notice from 209 Works. These notifications help keep you 
              informed about important updates and changes to our service.
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
  fontSize: '18px',
  margin: '0',
  fontWeight: '500',
};

const urgencyBanner = {
  padding: '12px 24px',
  textAlign: 'center' as const,
};

const urgencyText = {
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
};

const content = {
  padding: '32px 24px',
};

const greeting = {
  fontSize: '18px',
  color: '#1e293b',
  margin: '0 0 24px 0',
  fontWeight: '500',
};

const noticeCard = {
  border: '3px solid',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  backgroundColor: '#fafafa',
  textAlign: 'center' as const,
};

const noticeIcon = {
  fontSize: '48px',
  margin: '0 0 16px 0',
  display: 'block',
};

const noticeTitle = {
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
  lineHeight: '1.3',
};

const effectiveText = {
  fontSize: '14px',
  color: '#64748b',
  margin: '0',
  fontWeight: '500',
};

const messageSection = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const messageText = {
  fontSize: '16px',
  color: '#374151',
  lineHeight: '1.6',
  margin: '0',
};

const actionSection = {
  backgroundColor: '#fef2f2',
  border: '2px solid #fecaca',
  borderLeft: '4px solid #dc2626',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const actionTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#dc2626',
  margin: '0 0 12px 0',
};

const actionDescription = {
  fontSize: '15px',
  color: '#7f1d1d',
  lineHeight: '1.5',
  margin: '0 0 20px 0',
};

const actionButtonContainer = {
  textAlign: 'center' as const,
};

const actionButton = {
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  border: 'none',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
};

const infoSection = {
  backgroundColor: '#fff7ed',
  border: '1px solid #fed7aa',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const infoTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#ea580c',
  margin: '0 0 12px 0',
};

const infoItem = {
  fontSize: '14px',
  color: '#7c2d12',
  margin: '6px 0',
  lineHeight: '1.4',
  display: 'block',
};

const securitySection = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const securityTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#166534',
  margin: '0 0 12px 0',
};

const securityItem = {
  fontSize: '14px',
  color: '#166534',
  margin: '6px 0',
  lineHeight: '1.4',
  display: 'block',
};

const featureSection = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const featureTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#2d4a3e',
  margin: '0 0 12px 0',
};

const featureDescription = {
  fontSize: '14px',
  color: '#64748b',
  lineHeight: '1.5',
  margin: '0 0 20px 0',
};

const featureButtonContainer = {
  textAlign: 'center' as const,
};

const featureButton = {
  backgroundColor: '#2d4a3e',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  border: 'none',
};

const supportSection = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #bbf7d0',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
  textAlign: 'center' as const,
};

const supportTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#166534',
  margin: '0 0 12px 0',
};

const supportText = {
  fontSize: '15px',
  color: '#166534',
  lineHeight: '1.5',
  margin: '0 0 16px 0',
};

const supportContact = {
  fontSize: '15px',
  color: '#166534',
  fontWeight: '500',
  lineHeight: '1.8',
  margin: '0',
};

const supportLink = {
  color: '#ff6b35',
  textDecoration: 'underline',
  fontWeight: '500',
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
  margin: '0 0 12px 0',
  lineHeight: '1.4',
};

const copyrightText = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '0',
  lineHeight: '1.5',
}; 