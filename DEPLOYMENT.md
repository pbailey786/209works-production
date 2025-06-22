# 209 Works Deployment Guide

## 🚀 Quick Deployment Checklist

### ✅ **Prerequisites**
- [ ] Supabase PostgreSQL database set up
- [ ] Resend account for email services
- [ ] OpenAI API key for JobsGPT
- [ ] Netlify account (or preferred hosting platform)

### ✅ **Required Environment Variables**
Copy `.env.example` to `.env.local` and configure these **essential** variables:

```bash
# Database (Required)
DATABASE_URL="postgresql://username:password@host:port/database"

# Authentication (Required)
NEXTAUTH_SECRET="your-32-character-secret-key"
NEXTAUTH_URL="https://your-domain.netlify.app"
NEXT_PUBLIC_APP_URL="https://your-domain.netlify.app"

# Email Service (Required for contact forms)
RESEND_API_KEY="re_your_resend_api_key"

# AI Features (Required for JobsGPT)
OPENAI_API_KEY="sk_your_openai_api_key"
```

---

## 🗄️ **Database Setup**

### **1. Supabase Configuration**
1. Go to [Supabase](https://supabase.com) and create a new project
2. Get your database URL from Settings → Database
3. Set `DATABASE_URL` in your environment variables

### **2. Database Schema**
The app will automatically create tables on first run, but you can also run:
```bash
npx prisma db push
npx prisma generate
```

---

## 📧 **Email Service Setup**

### **1. Resend Configuration**
1. Sign up at [Resend](https://resend.com)
2. Create an API key
3. Add your domain for sending emails
4. Set `RESEND_API_KEY` in environment variables

### **2. Email Templates**
The contact form will send emails to `support@209.works` by default. Update this in:
- `src/app/api/contact/route.ts`
- Environment variable `SUPPORT_EMAIL`

---

## 🤖 **AI Features Setup**

### **1. OpenAI Configuration**
1. Get API key from [OpenAI](https://platform.openai.com)
2. Set `OPENAI_API_KEY` in environment variables
3. JobsGPT will automatically work with GPT-4

### **2. Job Import (Optional)**
For Adzuna job imports:
1. Register at [Adzuna API](https://developer.adzuna.com)
2. Get App ID and API key
3. Set `ADZUNA_APP_ID` and `ADZUNA_API_KEY`

---

## 🌐 **Netlify Deployment**

### **1. Connect Repository**
1. Push your code to GitHub
2. Connect repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `.next`

### **2. Environment Variables**
In Netlify dashboard → Site settings → Environment variables, add:

```bash
DATABASE_URL=your_supabase_database_url
NEXTAUTH_SECRET=your_32_character_secret
NEXTAUTH_URL=https://your-site.netlify.app
NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
RESEND_API_KEY=your_resend_api_key
OPENAI_API_KEY=your_openai_api_key
```

### **3. Build Settings**
```bash
# Build command
npm run build

# Publish directory
.next

# Node version
18.x
```

---

## 🔐 **Authentication Setup**

### **1. Admin Account Creation**
After deployment, create an admin account:
1. Sign up normally through the site
2. Manually update the user role in your database:
```sql
UPDATE "User" SET role = 'admin' WHERE email = 'your-admin-email@domain.com';
```

### **2. Access Admin Dashboard**
- Navigate to `/admin` after logging in as admin
- All admin features will be available

---

## 📊 **Analytics Setup (Optional)**

### **1. Google Analytics 4**
```bash
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
```

### **2. PostHog Analytics**
```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## 💳 **Payment Setup (Optional)**

### **1. Stripe Configuration**
```bash
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### **2. Webhook Endpoint**
Set up Stripe webhook at: `https://your-domain.netlify.app/api/webhooks/stripe`

---

## 🔧 **Post-Deployment Checklist**

### ✅ **Test Core Features**
- [ ] User registration/login works
- [ ] Contact form sends emails
- [ ] JobsGPT responds to queries
- [ ] Admin dashboard accessible
- [ ] Job search functionality
- [ ] Database connections stable

### ✅ **Admin Setup**
- [ ] Create admin account
- [ ] Test all admin pages
- [ ] Configure email templates
- [ ] Set up job import (if using Adzuna)
- [ ] Test contact form submissions

### ✅ **Performance**
- [ ] Site loads quickly
- [ ] Database queries optimized
- [ ] Error monitoring working
- [ ] Analytics tracking

---

## 🚨 **Troubleshooting**

### **Common Issues**

**Database Connection Errors:**
- Verify `DATABASE_URL` is correct
- Check Supabase project is active
- Ensure database allows connections

**Email Not Sending:**
- Verify `RESEND_API_KEY` is valid
- Check domain is verified in Resend
- Test with a simple email first

**JobsGPT Not Working:**
- Verify `OPENAI_API_KEY` is valid
- Check OpenAI account has credits
- Test API key with a simple request

**Admin Dashboard 404s:**
- Ensure all admin pages are deployed
- Check user has admin role in database
- Verify authentication is working

### **Environment Variable Issues**
```bash
# Check if variables are loaded
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
```

---

## 📞 **Support**

If you encounter issues:
1. Check the browser console for errors
2. Review Netlify build logs
3. Verify all environment variables are set
4. Test database connectivity
5. Check API key validity

---

## 🔄 **Updates & Maintenance**

### **Regular Tasks**
- Monitor error logs
- Update dependencies monthly
- Rotate API keys quarterly
- Backup database regularly
- Monitor performance metrics

### **Scaling Considerations**
- Add Redis for caching
- Implement CDN for static assets
- Set up database read replicas
- Add monitoring and alerting
- Consider serverless functions for heavy tasks

---

## 🎯 **Production Optimization**

### **Performance**
- Enable Next.js caching
- Optimize images and assets
- Use database connection pooling
- Implement proper error boundaries

### **Security**
- Use strong secrets
- Enable CORS properly
- Implement rate limiting
- Regular security audits
- Keep dependencies updated

### **Monitoring**
- Set up error tracking (Sentry)
- Monitor database performance
- Track user analytics
- Set up uptime monitoring
- Monitor API usage and costs
