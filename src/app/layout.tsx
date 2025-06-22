import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { headers } from 'next/headers';
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

  // Default to 209 Works
  let title = '209 Works - Local Jobs in Central Valley';
  let description = 'Find local jobs in Stockton, Modesto, Tracy and the Central Valley. Built for the 209. Made for the people who work here.';
  let displayName = '209 Works';

  if (hostname.includes('916')) {
    title = '916 Jobs - Local Jobs in Sacramento Metro';
    description = 'Find local jobs in Sacramento, Elk Grove, Roseville and the Sacramento Metro area. Built for the 916.';
    displayName = '916 Jobs';
  } else if (hostname.includes('510')) {
    title = '510 Jobs - Local Jobs in East Bay';
    description = 'Find local jobs in Oakland, Berkeley, Fremont and the East Bay area. Built for the 510.';
    displayName = '510 Jobs';
  } else if (hostname.includes('925')) {
    title = '925 Works - Local Jobs in Tri-Valley';
    description = 'Find local jobs in Concord, Walnut Creek, Pleasanton and the Tri-Valley area. Built for the 925.';
    displayName = '925 Works';
  } else if (hostname.includes('559')) {
    title = '559 Jobs - Local Jobs in Fresno';
    description = 'Find local jobs in Fresno, Visalia, Clovis and the Central Valley South. Built for the 559.';
    displayName = '559 Jobs';
  }

  return {
    title,
    description,
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: displayName,
    },
    openGraph: {
      title,
      description,
      siteName: displayName,
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
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
}: {
  children: React.ReactNode;
}) {
  // Check if we have valid Clerk keys
  const hasValidClerkKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_placeholder_key_for_build' &&
    process.env.CLERK_SECRET_KEY &&
    process.env.CLERK_SECRET_KEY !== 'sk_test_placeholder_key_for_build';

  return (
    <html lang="en">
      <head>
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
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${inter.variable} antialiased`}>
        {hasValidClerkKeys ? (
          <ClerkProvider>
            {children}
          </ClerkProvider>
        ) : (
          <div>
            {children}
          </div>
        )}
      </body>
    </html>
  );
}