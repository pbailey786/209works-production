# Environment Configuration for .works Domains

Create a `.env.local` file in your project root with these variables:

```bash
# Domain Configuration
NEXT_PUBLIC_APP_URL=https://209.works
NEXTAUTH_URL=https://209.works

# Database
DATABASE_URL="your-database-url-here"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret-here"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email Configuration
EMAIL_FROM="209 Jobs <noreply@209.works>"
ALERT_EMAIL_FROM="alerts@209.works"
SMTP_HOST="your-smtp-host"
SMTP_PORT=587
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"

# Allowed Origins (all .works domains)
ALLOWED_ORIGINS=https://209.works,https://916.works,https://510.works,https://norcal.works

# API Allowed Origins
API_ALLOWED_ORIGINS=https://209.works,https://916.works,https://510.works,https://norcal.works

# OpenAI (if using AI features)
OPENAI_API_KEY="your-openai-key"

# Stripe (if using payments)
STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"

# Analytics
GOOGLE_ANALYTICS_ID="your-ga-id"

# Social Media Links (domain-specific)
FACEBOOK_209=https://www.facebook.com/209jobs
INSTAGRAM_209=https://www.instagram.com/209jobs
TWITTER_209=@209jobs

FACEBOOK_916=https://www.facebook.com/916jobs
INSTAGRAM_916=https://www.instagram.com/916jobs
TWITTER_916=@916jobs

FACEBOOK_510=https://www.facebook.com/510jobs
INSTAGRAM_510=https://www.instagram.com/510jobs
TWITTER_510=@510jobs

FACEBOOK_NORCAL=https://www.facebook.com/norcaljobs
INSTAGRAM_NORCAL=https://www.instagram.com/norcaljobs
TWITTER_NORCAL=@norcaljobs
```

## Vercel Environment Variables

When deploying to Vercel, add these environment variables in your Vercel dashboard:

### Production Environment
- `NEXT_PUBLIC_APP_URL`: `https://209.works`
- `NEXTAUTH_URL`: `https://209.works`
- `ALLOWED_ORIGINS`: `https://209.works,https://916.works,https://510.works,https://norcal.works`
- `API_ALLOWED_ORIGINS`: `https://209.works,https://916.works,https://510.works,https://norcal.works`

### Development Environment
- `NEXT_PUBLIC_APP_URL`: `http://localhost:3000`
- `NEXTAUTH_URL`: `http://localhost:3000`
- `ALLOWED_ORIGINS`: `http://localhost:3000`
- `API_ALLOWED_ORIGINS`: `http://localhost:3000`

## Domain Setup in Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Domains
3. Add each domain:
   - `209.works`
   - `916.works`
   - `510.works`
   - `norcal.works`
4. Configure DNS records as instructed by Vercel
5. Wait for SSL certificates to be issued 