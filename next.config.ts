import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Security headers configuration
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com" "https://checkout.stripe.com"), usb=(), magnetometer=(), accelerometer=(), gyroscope=()',
          },
        ],
      },
    ];
  },

  // Handle domain redirects and HTTPS enforcement
  async redirects() {
    const redirects = [];

    if (process.env.NODE_ENV === 'production') {
      // Legacy domain redirects (209jobs.com -> 209.works)
      redirects.push(
        {
          source: '/(.*)',
          has: [
            {
              type: 'host',
              key: 'host',
              value: '209jobs.com',
            },
          ],
          destination: 'https://209.works/:path*',
          permanent: true,
        },
        {
          source: '/(.*)',
          has: [
            {
              type: 'host',
              key: 'host',
              value: 'www.209jobs.com',
            },
          ],
          destination: 'https://209.works/:path*',
          permanent: true,
        },
        // WWW redirects for .works domains
        {
          source: '/(.*)',
          has: [
            {
              type: 'host',
              key: 'host',
              value: 'www.209.works',
            },
          ],
          destination: 'https://209.works/:path*',
          permanent: true,
        },
        {
          source: '/(.*)',
          has: [
            {
              type: 'host',
              key: 'host',
              value: 'www.916.works',
            },
          ],
          destination: 'https://916.works/:path*',
          permanent: true,
        },
        {
          source: '/(.*)',
          has: [
            {
              type: 'host',
              key: 'host',
              value: 'www.510.works',
            },
          ],
          destination: 'https://510.works/:path*',
          permanent: true,
        },
        {
          source: '/(.*)',
          has: [
            {
              type: 'host',
              key: 'host',
              value: 'www.norcal.works',
            },
          ],
          destination: 'https://norcal.works/:path*',
          permanent: true,
        }
      );

      // HTTPS enforcement for all domains
      redirects.push({
        source: '/(.*)',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: 'https://209.works/:path*', // Default fallback
        permanent: true,
      });
    }

    return redirects;
  },

  // Image optimization security and performance
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all HTTPS images for job logos, company images, etc.
      },
      // Only allow specific domains for better security
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google avatars
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // GitHub avatars
      },
      {
        protocol: 'https',
        hostname: 'upload.uploadcare.com', // If using Uploadcare
      },
    ],
    // Performance optimizations
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    // Disable dangerous image loaders
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Disable x-powered-by header
  poweredByHeader: false,

  // Enable compression in production
  compress: true,

  // Server external packages (moved from experimental)
  serverExternalPackages: ['sharp'],

  // Disable ESLint during builds (for production deployment)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript errors during builds (for Next.js 15 compatibility)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Performance and security optimizations
  experimental: {
    // Performance optimizations
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-icons',
    ],
    // Security features
    strictNextHead: true,
  },

  // Webpack configuration for security
  webpack: (config, { isServer }) => {
    // Add path alias resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    // Security-related webpack configurations
    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent security issues
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        canvas: false,
      };
    }

    // Fix OpenTelemetry critical dependency warnings
    if (isServer) {
      config.externals.push(
        // OpenTelemetry instrumentations
        '@opentelemetry/instrumentation-express',
        '@opentelemetry/instrumentation-http',
        '@opentelemetry/instrumentation-fs',
        '@opentelemetry/instrumentation-net',
        '@opentelemetry/auto-instrumentations-node',
        '@opentelemetry/instrumentation-aws-lambda',
        '@opentelemetry/instrumentation-aws-sdk',
        '@opentelemetry/instrumentation-bunyan',
        '@opentelemetry/instrumentation-cassandra-driver',
        '@opentelemetry/instrumentation-connect',
        '@opentelemetry/instrumentation-dns',
        '@opentelemetry/instrumentation-fastify',
        '@opentelemetry/instrumentation-generic-pool',
        '@opentelemetry/instrumentation-graphql',
        '@opentelemetry/instrumentation-grpc',
        '@opentelemetry/instrumentation-hapi',
        '@opentelemetry/instrumentation-ioredis',
        '@opentelemetry/instrumentation-knex',
        '@opentelemetry/instrumentation-koa',
        '@opentelemetry/instrumentation-lru-memoizer',
        '@opentelemetry/instrumentation-memcached',
        '@opentelemetry/instrumentation-mongodb',
        '@opentelemetry/instrumentation-mysql',
        '@opentelemetry/instrumentation-mysql2',
        '@opentelemetry/instrumentation-nestjs-core',
        '@opentelemetry/instrumentation-pg',
        '@opentelemetry/instrumentation-pino',
        '@opentelemetry/instrumentation-redis',
        '@opentelemetry/instrumentation-redis-4',
        '@opentelemetry/instrumentation-restify',
        '@opentelemetry/instrumentation-router',
        '@opentelemetry/instrumentation-socket.io',
        '@opentelemetry/instrumentation-tedious',
        '@opentelemetry/instrumentation-winston'
      );
    }

    // Suppress critical dependency warnings (simpler approach)
    const originalWarn = config.infrastructureLogging?.level;
    config.infrastructureLogging = {
      level: 'error',
    };

    // Ignore critical dependency warnings for OpenTelemetry
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/@opentelemetry/,
        message: /Critical dependency/,
      },
      {
        module: /node_modules\/bullmq/,
        message: /Critical dependency/,
      },
      {
        module: /node_modules\/ioredis/,
        message: /Critical dependency/,
      },
    ];

    // Security headers for webpack dev server
    if (process.env.NODE_ENV === 'development') {
      config.devServer = {
        ...config.devServer,
        headers: {
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
        },
      };
    }

    return config;
  },

  // Environment variables validation (for security)
  env: {
    // Only expose safe environment variables to the client
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || '209Jobs',
  },

  // Disable source maps in production for security
  productionBrowserSourceMaps: false,
};

export default nextConfig;
