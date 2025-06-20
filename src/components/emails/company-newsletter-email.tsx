

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
  Img
} from '@react-email/components';

interface NewsletterItem {
  id: string;
  title: string;
  excerpt: string;
  readMoreUrl: string;
  imageUrl?: string;
  date?: string;
  category: 'feature' | 'news' | 'tip' | 'spotlight';
}

interface CompanyNewsletterEmailProps {
  recipientName?: string;
  newsletterTitle: string;
  edition: string;
  date: string;
  featuredStory: {
    title: string;
    content: string;
    imageUrl?: string;
    ctaText: string;
    ctaUrl: string;
  };
  newsItems: NewsletterItem[];
  jobSpotlight?: {
    title: string;
    company: string;
    location: string;
    salary?: string;
    url: string;
  };
  platformStats?: {
    newJobs: number;
    newCompanies: number;
    newJobSeekers: number;
  };
  upcomingEvents?: Array<{
    title: string;
    date: string;
    location: string;
    url: string;
  }>;
  unsubscribeUrl: string;
  webViewUrl: string;
}

export default function CompanyNewsletterEmail({
  recipientName,
  newsletterTitle = '209 Works Monthly Newsletter',
  edition = 'January 2024',
  date = new Date().toLocaleDateString(),
  featuredStory,
  newsItems = [],
  jobSpotlight,
  platformStats,
  upcomingEvents,
  unsubscribeUrl = '#',
  webViewUrl = '#',
}: CompanyNewsletterEmailProps) {
  const previewText = `📰 ${newsletterTitle} - ${edition} | Central Valley job market insights & opportunities`;

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
            <Text style={tagline}>📰 {newsletterTitle}</Text>
            <Text style={editionStyle}>{edition} • {date}</Text>
          </Section>

          {/* Web View Banner */}
          <Section style={webViewBanner}>
            <Text style={webViewText}>
              Having trouble viewing this email?{' '}
              <Link href={webViewUrl} style={webViewLink}>View in browser</Link>
            </Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Hi {recipientName}! 👋</Text>
            
            <Text style={intro}>
              Welcome to your monthly dose of Central Valley job market insights, success stories, 
              and career opportunities. We're excited to share what's happening in the 209 area!
            </Text>

            {/* Featured Story */}
            <Section style={featuredSection}>
              <Text style={featuredLabel}>🌟 Featured Story</Text>
              <Text style={featuredTitle}>{featuredStory.title}</Text>
              <Text style={featuredContent}>{featuredStory.content}</Text>
              
              <Section style={featuredCTA}>
                <Button style={primaryButton} href={featuredStory.ctaUrl}>
                  {featuredStory.ctaText} →
                </Button>
              </Section>
            </Section>

            {/* News Items */}
            {newsItems.length > 0 && (
              <Section style={newsSection}>
                <Text style={sectionTitle}>📈 Central Valley Job Market Updates</Text>
                
                {newsItems.map((item, index) => (
                  <Section key={index} style={newsItem}>
                    <Text style={newsItemTitle}>{item.title}</Text>
                    {item.date && <Text style={newsItemDate}>{item.date}</Text>}
                    <Text style={newsItemSummary}>{item.excerpt}</Text>
                    {item.readMoreUrl && (
                      <Link href={item.readMoreUrl} style={newsItemLink}>
                        Read more →
                      </Link>
                    )}
                  </Section>
                ))}
              </Section>
            )}

            {/* Job Market Stats */}
            <Section style={statsSection}>
              <Text style={statsTitle}>📊 This Month's Highlights</Text>
              
              <Section style={statsGrid}>
                <Section style={statItem}>
                  <Text style={statNumber}>{platformStats?.newJobs.toLocaleString()}</Text>
                  <Text style={statLabel}>New Jobs Posted</Text>
                </Section>
                <Section style={statItem}>
                  <Text style={statNumber}>{platformStats?.newCompanies.toLocaleString()}</Text>
                  <Text style={statLabel}>New Companies</Text>
                </Section>
                <Section style={statItem}>
                  <Text style={statNumber}>{platformStats?.newJobSeekers.toLocaleString()}</Text>
                  <Text style={statLabel}>Successful Hires</Text>
                </Section>
              </Section>
            </Section>

            {/* Success Story */}
            <Section style={successSection}>
              <Text style={successTitle}>🎉 Success Story of the Month</Text>
              <Text style={successContent}>
                "Thanks to 209 Works, I found my dream job as a Marketing Manager right here in Modesto! 
                The platform made it so easy to connect with local employers who value Central Valley talent. 
                I couldn't be happier with my new position and the opportunity to grow my career close to home."
              </Text>
              <Text style={successAttribution}>
                - Sarah M., Marketing Manager at Central Valley Growth Partners
              </Text>
            </Section>

            {/* Job Categories */}
            <Section style={categoriesSection}>
              <Text style={categoriesTitle}>🔥 Hot Job Categories This Month</Text>
              
              <Section style={categoryGrid}>
                <Section style={categoryItem}>
                  <Text style={categoryEmoji}>💼</Text>
                  <Text style={categoryName}>Business & Finance</Text>
                  <Text style={categoryCount}>45 openings</Text>
                </Section>
                <Section style={categoryItem}>
                  <Text style={categoryEmoji}>🏥</Text>
                  <Text style={categoryName}>Healthcare</Text>
                  <Text style={categoryCount}>38 openings</Text>
                </Section>
                <Section style={categoryItem}>
                  <Text style={categoryEmoji}>🔧</Text>
                  <Text style={categoryName}>Manufacturing</Text>
                  <Text style={categoryCount}>32 openings</Text>
                </Section>
                <Section style={categoryItem}>
                  <Text style={categoryEmoji}>💻</Text>
                  <Text style={categoryName}>Technology</Text>
                  <Text style={categoryCount}>28 openings</Text>
                </Section>
              </Section>
              
              <Section style={categoryButtonContainer}>
                <Button style={secondaryButton} href="https://209.works/jobs">
                  Browse All Jobs →
                </Button>
              </Section>
            </Section>

            {/* Tips Section */}
            <Section style={tipsSection}>
              <Text style={tipsTitle}>💡 Career Tips from the Central Valley</Text>
              
              <Section style={tipsList}>
                <Text style={tipItem}>🎯 <strong>Local Networking:</strong> Attend Central Valley Chamber events to connect with employers</Text>
                <Text style={tipItem}>📱 <strong>Mobile Applications:</strong> 60% of job seekers in our area use mobile to apply</Text>
                <Text style={tipItem}>🔄 <strong>Skill Updates:</strong> Consider certifications in high-demand local industries</Text>
                <Text style={tipItem}>⚡ <strong>Quick Apply:</strong> Respond to job postings within 48 hours for best results</Text>
              </Section>
            </Section>

            {/* CTA Section */}
            <Section style={ctaSection}>
              <Text style={ctaTitle}>Ready to Take Your Career to the Next Level? 🚀</Text>
              <Text style={ctaText}>
                Join thousands of Central Valley professionals who have found their perfect job through 209 Works.
              </Text>
              
              <Section style={ctaButtons}>
                <Button style={primaryButton} href="https://209.works/jobs">
                  Find Jobs
                </Button>
                <Button style={secondaryButton} href="https://209.works/employers">
                  Post Jobs
                </Button>
              </Section>
            </Section>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerTitle}>209 Works</Text>
            <Text style={footerSubtitle}>Central Valley's Premier Job Platform</Text>
            
            <Text style={footerContent}>
              Proudly serving Stockton, Modesto, Fresno, Turlock, and the entire 209 area with 
              quality job opportunities and career resources.
            </Text>
            
            <Text style={footerLinks}>
              <Link href="https://209.works" style={footerLink}>Website</Link> • 
              <Link href="https://209.works/about" style={footerLink}> About Us</Link> • 
              <Link href="https://209.works/contact" style={footerLink}> Contact</Link> • 
              <Link href={unsubscribeUrl} style={unsubscribeLink}> Unsubscribe</Link>
            </Text>
            
            <Text style={copyrightText}>
              © {new Date().getFullYear()} 209 Works. All rights reserved.
              <br />
              This newsletter was sent to {recipientName || 'you'} because you're subscribed to our updates.
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
  fontSize: '20px',
  margin: '0 0 8px 0',
  fontWeight: '600',
};

const editionStyle = {
  color: '#9fdf9f',
  fontSize: '14px',
  margin: '0',
  fontWeight: '500',
};

const webViewBanner = {
  backgroundColor: '#f1f5f9',
  padding: '12px 24px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e2e8f0',
};

const webViewText = {
  fontSize: '12px',
  color: '#64748b',
  margin: '0',
};

const webViewLink = {
  color: '#ff6b35',
  textDecoration: 'underline',
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
  margin: '0 0 32px 0',
};

const featuredSection = {
  backgroundColor: '#9fdf9f',
  backgroundImage: 'linear-gradient(135deg, #9fdf9f 0%, #7dd87d 100%)',
  borderRadius: '12px',
  padding: '32px 24px',
  margin: '32px 0',
};

const featuredLabel = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1e3329',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const featuredTitle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1e3329',
  margin: '0 0 16px 0',
  lineHeight: '1.3',
};

const featuredContent = {
  fontSize: '16px',
  color: '#1e3329',
  lineHeight: '1.6',
  margin: '0 0 24px 0',
};

const featuredCTA = {
  textAlign: 'center' as const,
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
  boxShadow: '0 4px 8px rgba(255, 107, 53, 0.3)',
};

const newsSection = {
  margin: '40px 0',
};

const sectionTitle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#2d4a3e',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const newsItem = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0',
  borderLeft: '4px solid #ff6b35',
};

const newsItemTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1e293b',
  margin: '0 0 8px 0',
};

const newsItemDate = {
  fontSize: '12px',
  color: '#64748b',
  margin: '0 0 8px 0',
};

const newsItemSummary = {
  fontSize: '14px',
  color: '#475569',
  lineHeight: '1.5',
  margin: '0 0 12px 0',
};

const newsItemLink = {
  color: '#ff6b35',
  textDecoration: 'underline',
  fontSize: '14px',
  fontWeight: '500',
};

const statsSection = {
  backgroundColor: '#fff7ed',
  border: '2px solid #fed7aa',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
  textAlign: 'center' as const,
};

const statsTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#ea580c',
  margin: '0 0 20px 0',
};

const statsGrid = {
  display: 'flex',
  justifyContent: 'space-around',
  flexWrap: 'wrap' as const,
  margin: '0',
};

const statItem = {
  textAlign: 'center' as const,
  margin: '8px',
  minWidth: '120px',
};

const statNumber = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#ea580c',
  margin: '0 0 4px 0',
  display: 'block',
};

const statLabel = {
  fontSize: '12px',
  color: '#7c2d12',
  margin: '0',
  display: 'block',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const successSection = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #bbf7d0',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
};

const successTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#166534',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
};

const successContent = {
  fontSize: '15px',
  color: '#166534',
  lineHeight: '1.6',
  margin: '0 0 12px 0',
  fontStyle: 'italic',
};

const successAttribution = {
  fontSize: '14px',
  color: '#166534',
  fontWeight: '500',
  textAlign: 'right' as const,
  margin: '0',
};

const categoriesSection = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
};

const categoriesTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#2d4a3e',
  margin: '0 0 20px 0',
  textAlign: 'center' as const,
};

const categoryGrid = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  justifyContent: 'space-between',
  margin: '0 0 20px 0',
};

const categoryItem = {
  textAlign: 'center' as const,
  margin: '8px',
  flex: '1 1 120px',
  minWidth: '120px',
};

const categoryEmoji = {
  fontSize: '32px',
  margin: '0 0 8px 0',
  display: 'block',
};

const categoryName = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1e293b',
  margin: '0 0 4px 0',
  display: 'block',
};

const categoryCount = {
  fontSize: '12px',
  color: '#64748b',
  margin: '0',
  display: 'block',
};

const categoryButtonContainer = {
  textAlign: 'center' as const,
};

const secondaryButton = {
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
  margin: '4px',
};

const tipsSection = {
  backgroundColor: '#f1f5f9',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const tipsTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#334155',
  margin: '0 0 16px 0',
};

const tipsList = {
  margin: '0',
};

const tipItem = {
  fontSize: '14px',
  color: '#475569',
  margin: '8px 0',
  lineHeight: '1.5',
  display: 'block',
};

const ctaSection = {
  backgroundColor: '#9fdf9f',
  backgroundImage: 'linear-gradient(135deg, #9fdf9f 0%, #7dd87d 100%)',
  borderRadius: '12px',
  padding: '32px 24px',
  margin: '40px 0',
  textAlign: 'center' as const,
};

const ctaTitle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#1e3329',
  margin: '0 0 12px 0',
};

const ctaText = {
  fontSize: '16px',
  color: '#1e3329',
  margin: '0 0 24px 0',
  lineHeight: '1.6',
};

const ctaButtons = {
  display: 'flex',
  justifyContent: 'center',
  gap: '16px',
  flexWrap: 'wrap' as const,
};

const divider = {
  borderColor: '#e2e8f0',
  margin: '0',
};

const footerSection = {
  backgroundColor: '#f8fafc',
  padding: '32px 24px',
  textAlign: 'center' as const,
};

const footerTitle = {
  color: '#2d4a3e',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 4px 0',
};

const footerSubtitle = {
  color: '#64748b',
  fontSize: '14px',
  margin: '0 0 16px 0',
  fontWeight: '500',
};

const footerContent = {
  fontSize: '14px',
  color: '#64748b',
  lineHeight: '1.5',
  margin: '0 0 20px 0',
};

const footerLinks = {
  fontSize: '14px',
  color: '#64748b',
  margin: '0 0 20px 0',
};

const footerLink = {
  color: '#64748b',
  textDecoration: 'underline',
};

const unsubscribeLink = {
  color: '#94a3b8',
  textDecoration: 'underline',
};

const copyrightText = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '0',
  lineHeight: '1.5',
}; 