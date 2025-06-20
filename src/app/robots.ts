import { MetadataRoute } from '@/components/ui/card';
import { headers } from '@/components/ui/card';
import { getDomainConfig } from '@/lib/domain/config';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const hostname = headersList.get('host') || '209.works';
  const domainConfig = getDomainConfig(hostname);
  const baseUrl = `https://${domainConfig.domain}`;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/profile/',
          '/_next/',
          '/private/',
          '/temp/',
          '*.json',
          '*.xml',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
      {
        userAgent: 'anthropic-ai',
        disallow: '/',
      },
      {
        userAgent: 'Claude-Web',
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
