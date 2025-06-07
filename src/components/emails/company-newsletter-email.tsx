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
  Img,
} from '@react-email/components';

interface NewsletterItem {
  id: string;
  title: string;
  excerpt: string;
  readMoreUrl: string;
  imageUrl?: string;
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
  const previewText = `${newsletterTitle} - ${edition}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Section style={headerTop}>
              <Text style={webViewText}>
                <Link href={webViewUrl} style={webViewLink}>View this email in your browser</Link>
              </Text>
            </Section>
            <Section style={headerMain}>
              <Text style={logo}>209 Works</Text>
              <Text style={newsletterTitleStyle}>{newsletterTitle}</Text>
              <Text style={editionText}>{edition} • {date}</Text>
            </Section>
          </Section>

          {/* Greeting */}
          <Section style={greetingSection}>
            <Text style={greeting}>
              {recipientName ? `Hi ${recipientName},` : 'Hello there,'}
            </Text>
            <Text style={intro}>
              Welcome to your monthly update from 209 Works! We're excited to share the latest 
              news, opportunities, and insights from the Central Valley job market.
            </Text>
          </Section>

          {/* Featured Story */}
          {featuredStory && (
            <Section style={featuredSection}>
              <Text style={sectionTitle}>🌟 Featured Story</Text>
              <Section style={featuredCard}>
                {featuredStory.imageUrl && (
                  <Img
                    src={featuredStory.imageUrl}
                    alt={featuredStory.title}
                    style={featuredImage}
                  />
                )}
                <Section style={featuredContent}>
                  <Text style={featuredTitle}>{featuredStory.title}</Text>
                  <Text style={featuredText}>{featuredStory.content}</Text>
                  <Button style={featuredCta} href={featuredStory.ctaUrl}>
                    {featuredStory.ctaText}
                  </Button>
                </Section>
              </Section>
            </Section>
          )}

          {/* Platform Stats */}
          {platformStats && (
            <Section style={statsSection}>
              <Text style={sectionTitle}>📊 This Month's Highlights</Text>
              <Section style={statsGrid}>
                <Section style={statItem}>
                  <Text style={statNumber}>{platformStats.newJobs.toLocaleString()}</Text>
                  <Text style={statLabel}>New Job Postings</Text>
                </Section>
                <Section style={statItem}>
                  <Text style={statNumber}>{platformStats.newCompanies.toLocaleString()}</Text>
                  <Text style={statLabel}>New Companies</Text>
                </Section>
                <Section style={statItem}>
                  <Text style={statNumber}>{platformStats.newJobSeekers.toLocaleString()}</Text>
                  <Text style={statLabel}>New Job Seekers</Text>
                </Section>
              </Section>
            </Section>
          )}

          {/* Job Spotlight */}
          {jobSpotlight && (
            <Section style={spotlightSection}>
              <Text style={sectionTitle}>💼 Job Spotlight</Text>
              <Section style={jobCard}>
                <Text style={jobTitle}>{jobSpotlight.title}</Text>
                <Text style={jobCompany}>{jobSpotlight.company}</Text>
                <Text style={jobLocation}>📍 {jobSpotlight.location}</Text>
                {jobSpotlight.salary && (
                  <Text style={jobSalary}>💰 {jobSpotlight.salary}</Text>
                )}
                <Button style={jobButton} href={jobSpotlight.url}>
                  View Position
                </Button>
              </Section>
            </Section>
          )}

          {/* News Items */}
          {newsItems.length > 0 && (
            <Section style={newsSection}>
              <Text style={sectionTitle}>📰 Latest News & Updates</Text>
              {newsItems.map((item, index) => (
                <Section key={item.id} style={newsItem}>
                  <Text style={newsCategory}>
                    {item.category === 'feature' && '⭐ Featured'}
                    {item.category === 'news' && '📢 News'}
                    {item.category === 'tip' && '💡 Tip'}
                    {item.category === 'spotlight' && '🔦 Spotlight'}
                  </Text>
                  <Text style={newsTitle}>{item.title}</Text>
                  <Text style={newsExcerpt}>{item.excerpt}</Text>
                  <Link href={item.readMoreUrl} style={newsLink}>
                    Read more →
                  </Link>
                  {index < newsItems.length - 1 && <Hr style={newsDivider} />}
                </Section>
              ))}
            </Section>
          )}

          {/* Upcoming Events */}
          {upcomingEvents && upcomingEvents.length > 0 && (
            <Section style={eventsSection}>
              <Text style={sectionTitle}>📅 Upcoming Events</Text>
              {upcomingEvents.map((event, index) => (
                <Section key={index} style={eventItem}>
                  <Text style={eventTitle}>{event.title}</Text>
                  <Text style={eventDetails}>
                    📅 {event.date} • 📍 {event.location}
                  </Text>
                  <Link href={event.url} style={eventLink}>
                    Learn more →
                  </Link>
                </Section>
              ))}
            </Section>
          )}

          {/* Call to Action */}
          <Section style={ctaSection}>
            <Text style={ctaTitle}>Ready to Take the Next Step?</Text>
            <Text style={ctaText}>
              Whether you're looking for your next opportunity or seeking top talent, 
              209 Works is here to help you succeed in the Central Valley.
            </Text>
            <Section style={ctaButtons}>
              <Button style={primaryCta} href="https://209.works/jobs">
                Browse Jobs
              </Button>
              <Button style={secondaryCta} href="https://209.works/employers">
                Post a Job
              </Button>
            </Section>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerTitle}>Stay Connected</Text>
            <Text style={footerText}>
              Follow us on social media for daily job updates and career tips!
            </Text>
            
            <Section style={socialLinks}>
              <Link href="#" style={socialLink}>LinkedIn</Link>
              <Text style={socialDivider}>•</Text>
              <Link href="#" style={socialLink}>Twitter</Link>
              <Text style={socialDivider}>•</Text>
              <Link href="#" style={socialLink}>Facebook</Link>
            </Section>

            <Hr style={footerDivider} />

            <Text style={unsubscribeText}>
              <Link href={unsubscribeUrl} style={unsubscribeLink}>
                Unsubscribe from this newsletter
              </Link>
            </Text>
            
            <Text style={copyrightText}>
              © {new Date().getFullYear()} 209 Works. All rights reserved.<br />
              Your Local Job Platform • Modesto, CA
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  border: '1px solid #e2e8f0',
};

const header = {
  backgroundColor: '#1e40af',
  color: '#ffffff',
};

const headerTop = {
  backgroundColor: '#1e3a8a',
  padding: '8px 20px',
  textAlign: 'center' as const,
};

const webViewText = {
  fontSize: '12px',
  margin: '0',
};

const webViewLink = {
  color: '#93c5fd',
  textDecoration: 'underline',
};

const headerMain = {
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const logo = {
  fontSize: '36px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const newsletterTitleStyle = {
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 4px 0',
  opacity: 0.9,
};

const editionText = {
  fontSize: '14px',
  margin: '0',
  opacity: 0.8,
};

const greetingSection = {
  padding: '24px',
};

const greeting = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 12px 0',
};

const intro = {
  fontSize: '15px',
  color: '#4b5563',
  lineHeight: '1.6',
  margin: '0',
};

const sectionTitle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 16px 0',
  borderBottom: '2px solid #1e40af',
  paddingBottom: '8px',
};

const featuredSection = {
  padding: '0 24px 24px',
};

const featuredCard = {
  border: '2px solid #3b82f6',
  borderRadius: '12px',
  overflow: 'hidden',
  backgroundColor: '#f8fafc',
};

const featuredImage = {
  width: '100%',
  height: 'auto',
  display: 'block',
};

const featuredContent = {
  padding: '24px',
};

const featuredTitle = {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 12px 0',
};

const featuredText = {
  fontSize: '15px',
  color: '#4b5563',
  lineHeight: '1.6',
  margin: '0 0 20px 0',
};

const featuredCta = {
  backgroundColor: '#1e40af',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const statsSection = {
  padding: '0 24px 24px',
};

const statsGrid = {
  display: 'flex',
  justifyContent: 'space-between',
  backgroundColor: '#f1f5f9',
  borderRadius: '8px',
  padding: '20px',
};

const statItem = {
  textAlign: 'center' as const,
  flex: '1',
};

const statNumber = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#1e40af',
  margin: '0 0 4px 0',
};

const statLabel = {
  fontSize: '12px',
  color: '#64748b',
  fontWeight: '500',
  margin: '0',
};

const spotlightSection = {
  padding: '0 24px 24px',
};

const jobCard = {
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '20px',
  backgroundColor: '#fefefe',
};

const jobTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 8px 0',
};

const jobCompany = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1e40af',
  margin: '0 0 8px 0',
};

const jobLocation = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0 0 4px 0',
};

const jobSalary = {
  fontSize: '14px',
  color: '#059669',
  fontWeight: '600',
  margin: '0 0 16px 0',
};

const jobButton = {
  backgroundColor: '#10b981',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 20px',
};

const newsSection = {
  padding: '0 24px 24px',
};

const newsItem = {
  margin: '0 0 20px 0',
};

const newsCategory = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#7c3aed',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
};

const newsTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 8px 0',
};

const newsExcerpt = {
  fontSize: '14px',
  color: '#4b5563',
  lineHeight: '1.5',
  margin: '0 0 8px 0',
};

const newsLink = {
  fontSize: '14px',
  color: '#1e40af',
  fontWeight: '600',
  textDecoration: 'none',
};

const newsDivider = {
  borderColor: '#e5e7eb',
  margin: '16px 0',
};

const eventsSection = {
  padding: '0 24px 24px',
};

const eventItem = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  padding: '16px',
  margin: '0 0 12px 0',
};

const eventTitle = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 6px 0',
};

const eventDetails = {
  fontSize: '13px',
  color: '#6b7280',
  margin: '0 0 8px 0',
};

const eventLink = {
  fontSize: '13px',
  color: '#1e40af',
  fontWeight: '500',
  textDecoration: 'none',
};

const ctaSection = {
  backgroundColor: '#f1f5f9',
  padding: '32px 24px',
  textAlign: 'center' as const,
  margin: '24px 0',
};

const ctaTitle = {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 12px 0',
};

const ctaText = {
  fontSize: '15px',
  color: '#4b5563',
  lineHeight: '1.6',
  margin: '0 0 24px 0',
};

const ctaButtons = {
  display: 'flex',
  justifyContent: 'center',
  gap: '12px',
};

const primaryCta = {
  backgroundColor: '#1e40af',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '0 6px',
};

const secondaryCta = {
  backgroundColor: '#10b981',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '0 6px',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '0',
};

const footerSection = {
  padding: '24px',
  textAlign: 'center' as const,
  backgroundColor: '#f8fafc',
};

const footerTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 8px 0',
};

const footerText = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0 0 16px 0',
};

const socialLinks = {
  margin: '0 0 16px 0',
};

const socialLink = {
  fontSize: '14px',
  color: '#1e40af',
  fontWeight: '500',
  textDecoration: 'none',
  margin: '0 8px',
};

const socialDivider = {
  fontSize: '14px',
  color: '#9ca3af',
  margin: '0 4px',
};

const footerDivider = {
  borderColor: '#e5e7eb',
  margin: '16px 0',
};

const unsubscribeText = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '0 0 12px 0',
};

const unsubscribeLink = {
  color: '#1e40af',
  textDecoration: 'underline',
};

const copyrightText = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '0',
  lineHeight: '1.4',
}; 