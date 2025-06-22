# Netlify Environment Variables Setup for 209 Works

## 🚀 Required Environment Variables

Add these in your Netlify Dashboard → Site Settings → Environment Variables:

### **Core Application**

```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://209.works
NEXTAUTH_URL=https://209.works
NEXTAUTH_SECRET=your-super-secret-key-here
```

### **Database (Required)**

```
DATABASE_URL=postgresql://username:password@host:port/database_name
```

### **Redis (Optional - Mock is used if not set)**

```
SKIP_REDIS=true
REDIS_DISABLED=true
```

### **Email Service (Resend)**

```
RESEND_API_KEY=your-resend-api-key
RESEND_EMAIL_FROM=noreply@209.works
EMAIL_FROM=209 Works <noreply@209.works>
ALERT_EMAIL_FROM=alerts@209.works
```

### **AI Features (OpenAI)**

```
OPENAI_API_KEY=your-openai-api-key
```

### **Authentication (Google OAuth)**

```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### **Payment Processing (Stripe)**

```
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

### **Analytics (Optional)**

```
GOOGLE_ANALYTICS_ID=your-ga-id
POSTHOG_KEY=your-posthog-key
POSTHOG_HOST=https://app.posthog.com
```

### **Domain Configuration**

```
ALLOWED_ORIGINS=https://209.works,https://www.209.works
API_ALLOWED_ORIGINS=https://209.works,https://www.209.works
```

## 🔧 How to Add Environment Variables in Netlify

1. Go to your Netlify Dashboard
2. Select your 209 Works site
3. Go to **Site Settings** → **Environment Variables**
4. Click **Add Variable** for each one above
5. Set the **Key** and **Value** for each variable
6. Click **Save**

## 🗄️ Database Setup Priority

**CRITICAL**: You need to set up a PostgreSQL database first:

### Option 1: Supabase (Recommended)

1. Go to https://supabase.com
2. Create a new project
3. Get your connection string from Settings → Database
4. Use it as your `DATABASE_URL`

### Option 2: Railway

1. Go to https://railway.app
2. Create a PostgreSQL database
3. Get the connection string
4. Use it as your `DATABASE_URL`

### Option 3: Neon

1. Go to https://neon.tech
2. Create a database
3. Get the connection string
4. Use it as your `DATABASE_URL`

## 🔑 Generate Secrets

### NEXTAUTH_SECRET

```bash
# Run this in your terminal to generate a secure secret:
openssl rand -base64 32
```

### Or use online generator:

https://generate-secret.vercel.app/32

## 📧 Email Setup (Resend)

1. Go to https://resend.com
2. Sign up and verify your domain (209.works)
3. Get your API key
4. Add it as `RESEND_API_KEY`

## 🤖 AI Setup (OpenAI)

1. Go to https://platform.openai.com
2. Create an API key
3. Add it as `OPENAI_API_KEY`

## 💳 Payment Setup (Stripe)

1. Go to https://stripe.com
2. Get your publishable and secret keys
3. Set up webhook endpoint: `https://209.works/api/stripe/webhook`
4. Add webhook secret

## ⚡ Quick Start (Minimum Required)

To get your site working immediately, you only need:

1. **DATABASE_URL** (PostgreSQL connection string)
2. **NEXTAUTH_SECRET** (generated secret)
3. **NEXT_PUBLIC_APP_URL** = https://209.works
4. **NEXTAUTH_URL** = https://209.works

The rest can be added later as you enable features.

## 🚀 After Adding Environment Variables

1. Go to **Deploys** in your Netlify dashboard
2. Click **Trigger Deploy** → **Deploy Site**
3. Wait for deployment to complete
4. Test your site at your Netlify URL

## 🔍 Troubleshooting

If deployment fails:

1. Check the deploy logs in Netlify
2. Verify all required environment variables are set
3. Make sure DATABASE_URL is a valid PostgreSQL connection string
4. Ensure NEXTAUTH_SECRET is set and not empty
