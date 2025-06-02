import Head from 'next/head';
import { useDomain, getDomainMetadata } from '@/lib/domain/context';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
  structuredData?: object;
  hostname?: string; // For SSR
}

export default function SEOHead({
  title,
  description,
  canonical,
  ogImage,
  noindex = false,
  structuredData,
  hostname
}: SEOHeadProps) {
  // Get domain configuration
  let domainConfig;
  let isClient = false;
  
  try {
    const { config } = useDomain();
    domainConfig = config;
    isClient = true;
  } catch {
    // Fallback for SSR or when not in DomainProvider
    if (hostname) {
      const metadata = getDomainMetadata(hostname);
      domainConfig = {
        seo: {
          title: metadata.title,
          description: metadata.description,
          keywords: metadata.keywords.split(', ')
        },
        domain: hostname,
        displayName: metadata.siteName,
        social: { twitter: metadata.twitterHandle },
        branding: { logoPath: '/logo.png' }
      };
    } else {
      // Ultimate fallback
      domainConfig = {
        seo: {
          title: "209 Jobs - Your Local Job Board for Central Valley | No Remote Jobs from Utah",
          description: "Find meaningful work close to home in Stockton, Modesto, Tracy, Manteca, Lodi, and surrounding 209 communities. 100% local focus - no remote jobs from Utah or San Francisco.",
          keywords: ['209 jobs', 'Central Valley jobs', 'Stockton jobs', 'Modesto jobs', 'local jobs', 'Tracy jobs', 'Manteca jobs', 'Lodi jobs']
        },
        domain: '209.works',
        displayName: '209 Jobs',
        social: { twitter: '@209jobs' },
        branding: { logoPath: '/logo.png' }
      };
    }
  }
  
  // Use provided values or fall back to domain defaults
  const finalTitle = title || domainConfig.seo.title;
  const finalDescription = description || domainConfig.seo.description;
  const finalCanonical = canonical || `https://${domainConfig.domain}`;
  const finalOgImage = ogImage || `https://${domainConfig.domain}/og-images/${domainConfig.domain.split('.')[0]}-og.jpg`;
  const fullTitle = finalTitle.includes(domainConfig.displayName) ? finalTitle : `${finalTitle} | ${domainConfig.displayName}`;
  
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": domainConfig.displayName,
    "alternateName": `${domainConfig.domain.split('.')[0]} Jobs`,
    "url": finalCanonical,
    "description": finalDescription,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `https://${domainConfig.domain}/jobs?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "sameAs": Object.values(domainConfig.social || {}).filter(Boolean),
    "publisher": {
      "@type": "Organization",
      "name": domainConfig.displayName,
      "url": finalCanonical,
      "logo": {
        "@type": "ImageObject",
        "url": `https://${domainConfig.domain}${domainConfig.branding.logoPath}`
      }
    },
    "audience": {
      "@type": "Audience",
      "geographicArea": {
        "@type": "Place",
        "name": domainConfig.region || "Central Valley, California",
        "containedInPlace": {
          "@type": "Place",
          "name": "California, United States"
        }
      }
    }
  };

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={domainConfig.seo.keywords.join(', ')} />
      <meta name="author" content={domainConfig.displayName} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={finalCanonical} />
      
      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={finalCanonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:site_name" content={domainConfig.displayName} />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={finalCanonical} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={finalDescription} />
      <meta property="twitter:image" content={finalOgImage} />
      <meta property="twitter:creator" content={domainConfig.social.twitter || '@209jobs'} />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Additional SEO tags */}
      <meta name="theme-color" content="#3B82F6" />
      <meta name="msapplication-TileColor" content="#3B82F6" />
      
      {/* Geo tags for local SEO */}
      <meta name="geo.region" content="US-CA" />
      <meta name="geo.placename" content="Central Valley, California" />
      <meta name="geo.position" content="37.7749;-121.4194" />
      <meta name="ICBM" content="37.7749, -121.4194" />
      
      {/* Language */}
      <meta httpEquiv="content-language" content="en-US" />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData || defaultStructuredData)
        }}
      />
      
      {/* Additional structured data for local business */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "209 Jobs",
            "description": "Local job board serving the Central Valley of California",
            "url": canonical,
            "telephone": "+1-555-209-JOBS",
            "email": `contact@${domainConfig.domain}`,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Stockton",
              "addressRegion": "CA",
              "addressCountry": "US"
            },
            "areaServed": [
              {
                "@type": "City",
                "name": "Stockton",
                "addressRegion": "CA"
              },
              {
                "@type": "City", 
                "name": "Modesto",
                "addressRegion": "CA"
              },
              {
                "@type": "City",
                "name": "Tracy",
                "addressRegion": "CA"
              },
              {
                "@type": "City",
                "name": "Manteca", 
                "addressRegion": "CA"
              },
              {
                "@type": "City",
                "name": "Lodi",
                "addressRegion": "CA"
              }
            ],
            "serviceType": "Employment Services",
            "priceRange": "Free"
          })
        }}
      />
    </Head>
  );
} 