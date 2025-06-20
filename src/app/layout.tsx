import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
// import { Toaster } from '@/components/ui/sonner';
import { headers } from 'next/headers';
import { getDomainConfig } from '@/lib/domain/config';
import { DomainProvider } from '@/lib/domain/context';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import { MobileLayout } from '@/components/mobile/MobileBottomNavigation';
import './globals.css';


const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
});

// Dynamic metadata based on domain
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const domainConfig = getDomainConfig(hostname);

  return {
    title: domainConfig.seo.title,
    description: domainConfig.seo.description,
    keywords: domainConfig.seo.keywords.join(', '),
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: domainConfig.displayName,
    },
    openGraph: {
      title: domainConfig.seo.title,
      description: domainConfig.seo.description,
      siteName: domainConfig.displayName,
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: domainConfig.seo.title,
      description: domainConfig.seo.description,
    },
    alternates: {
      canonical: `https://${domainConfig.domain}`,
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get domain context from headers
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const domainConfig = getDomainConfig(hostname);

  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --domain-primary: ${domainConfig.branding.primaryColor};
              --domain-accent: ${domainConfig.branding.accentColor};
            }
          `
        }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} min-h-screen antialiased`}
      >
        <ClerkProvider>
          <DomainProvider initialHostname={hostname}>
            <MobileLayout>
              {children}
            </MobileLayout>
            <PWAInstallPrompt />
          </DomainProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
