import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import SessionProviderWrapper from "../components/SessionProviderWrapper";
import PerformanceProvider from "../components/PerformanceProvider";
import { Toaster } from "@/components/ui/toaster";
import { headers } from 'next/headers';
import { getDomainConfig } from '@/lib/domain/config';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const hostname = headersList.get('host') || '209.works';
  const domainConfig = getDomainConfig(hostname);
  
  return {
    title: {
      default: domainConfig.seo.title,
      template: `%s | ${domainConfig.displayName}`
    },
    description: domainConfig.seo.description,
    keywords: domainConfig.seo.keywords.join(', '),
    authors: [{ name: domainConfig.displayName }],
    creator: domainConfig.displayName,
    publisher: domainConfig.displayName,
    metadataBase: new URL(`https://${domainConfig.domain}`),
    alternates: {
      canonical: `https://${domainConfig.domain}`,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: `https://${domainConfig.domain}`,
      title: domainConfig.seo.title,
      description: domainConfig.seo.description,
      siteName: domainConfig.displayName,
      images: [
        {
          url: `https://${domainConfig.domain}/og-images/${domainConfig.areaCode}-og.jpg`,
          width: 1200,
          height: 630,
          alt: `${domainConfig.displayName} - ${domainConfig.description}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: domainConfig.seo.title,
      description: domainConfig.seo.description,
      creator: domainConfig.social.twitter || '@209jobs',
      images: [`https://${domainConfig.domain}/og-images/${domainConfig.areaCode}-og.jpg`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/favicon.svg', type: 'image/svg+xml' },
      ],
      apple: [
        { url: '/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
      ],
    },
    manifest: '/manifest.json',
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased min-h-screen`}
      >
        <SessionProviderWrapper>
          <PerformanceProvider>
            {/* Skip Navigation Link */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Skip to main content
            </a>
            <Header />
            <main id="main-content" className="min-h-screen" role="main">
              {children}
            </main>
            <Toaster />
          </PerformanceProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
