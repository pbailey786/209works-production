# Deployment Checklist: .works Domains Launch

## Pre-Deployment Requirements

### 1. Domain Registration ✅

- [ ] Register `209.works` (primary domain)
- [ ] Register `916.works`
- [ ] Register `510.works`
- [ ] Register `norcal.works`

### 2. Development Environment Setup ✅

- [ ] All domain configuration files are in place
- [ ] Local testing with `localhost` works correctly
- [ ] Environment variables configured for development
- [ ] Database schema is ready

## Deployment Steps

### Phase 1: Initial Deployment

#### 1. Vercel Project Setup

- [ ] Create new Vercel project
- [ ] Connect to GitHub repository
- [ ] Configure build settings:
  ```bash
  Build Command: npm run build
  Output Directory: .next
  Install Command: npm install
  ```

#### 2. Environment Variables in Vercel

Copy these to Vercel Dashboard → Settings → Environment Variables:

**Production:**

```bash
NEXT_PUBLIC_APP_URL=https://209.works
NEXTAUTH_URL=https://209.works
ALLOWED_ORIGINS=https://209.works,https://916.works,https://510.works,https://norcal.works
API_ALLOWED_ORIGINS=https://209.works,https://916.works,https://510.works,https://norcal.works
```

**Preview/Development:**

```bash
NEXT_PUBLIC_APP_URL=https://your-vercel-preview-url.vercel.app
NEXTAUTH_URL=https://your-vercel-preview-url.vercel.app
ALLOWED_ORIGINS=https://your-vercel-preview-url.vercel.app
API_ALLOWED_ORIGINS=https://your-vercel-preview-url.vercel.app
```

- [ ] Add all database credentials
- [ ] Add authentication secrets
- [ ] Add email configuration
- [ ] Add API keys (OpenAI, Stripe, etc.)

#### 3. Initial Deployment Test

- [ ] Deploy to Vercel (will get a `.vercel.app` URL first)
- [ ] Test basic functionality on preview URL
- [ ] Verify database connections work
- [ ] Test API endpoints
- [ ] Check that domain detection defaults to 209.works

### Phase 2: Domain Configuration

#### 1. Add Custom Domains to Vercel

In Vercel Dashboard → Settings → Domains:

- [ ] Add `209.works` (set as primary)
- [ ] Add `916.works`
- [ ] Add `510.works`
- [ ] Add `norcal.works`

#### 2. DNS Configuration

For each domain, configure DNS records as instructed by Vercel:

- [ ] `209.works` → A record or CNAME
- [ ] `916.works` → A record or CNAME
- [ ] `510.works` → A record or CNAME
- [ ] `norcal.works` → A record or CNAME

#### 3. SSL Certificate Verification

- [ ] `209.works` SSL active
- [ ] `916.works` SSL active
- [ ] `510.works` SSL active
- [ ] `norcal.works` SSL active

### Phase 3: Domain Testing

#### 1. Basic Functionality Test

Test each domain individually:

**209.works (Central Valley)**

- [ ] Domain loads correctly
- [ ] Shows "209 Jobs" branding
- [ ] Blue color scheme (#3B82F6)
- [ ] Job filtering shows Central Valley cities
- [ ] SEO meta tags include "Central Valley"

**916.works (Sacramento Metro)**

- [ ] Domain loads correctly
- [ ] Shows "916 Jobs" branding
- [ ] Green color scheme (#059669)
- [ ] Job filtering shows Sacramento area cities
- [ ] SEO meta tags include "Sacramento Metro"

**510.works (East Bay)**

- [ ] Domain loads correctly
- [ ] Shows "510 Jobs" branding
- [ ] Red color scheme (#DC2626)
- [ ] Job filtering shows East Bay cities
- [ ] SEO meta tags include "East Bay"

**norcal.works (Northern California Hub)**

- [ ] Domain loads correctly
- [ ] Shows "NorCal Jobs" branding
- [ ] Purple color scheme (#7C3AED)
- [ ] Job filtering shows all Northern California
- [ ] SEO meta tags include "Northern California"

#### 2. Cross-Domain Features

- [ ] Email templates use correct domain in links
- [ ] Job alerts reference correct domain
- [ ] Social media links are domain-specific
- [ ] API responses include correct domain context

#### 3. SEO & Analytics Setup

- [ ] Google Search Console verified for each domain
- [ ] Google Analytics tracking works for each domain
- [ ] Sitemap.xml generated for each domain
- [ ] Robots.txt configured correctly

### Phase 4: Content & Marketing

#### 1. Social Media Setup

- [ ] Create Facebook pages for each region
- [ ] Create Instagram accounts for each region
- [ ] Create Twitter accounts for each region
- [ ] Update social links in domain config

#### 2. Content Preparation

- [ ] Regional job content ready
- [ ] Local employer outreach planned
- [ ] Press release for launch prepared
- [ ] Email announcement to existing users

#### 3. Marketing Materials

- [ ] Business cards updated with new domains
- [ ] Email signatures updated
- [ ] Marketing campaigns reference correct domains

## Post-Launch Monitoring

### Week 1: Critical Monitoring

- [ ] Monitor error rates across all domains
- [ ] Check domain resolution and SSL status
- [ ] Verify email delivery rates
- [ ] Monitor user feedback and support requests
- [ ] Track traffic distribution across domains

### Week 2-4: Optimization

- [ ] Analyze regional job application patterns
- [ ] Optimize job filtering algorithms
- [ ] A/B test domain-specific features
- [ ] Monitor SEO rankings for regional keywords

### Month 2+: Growth

- [ ] Plan expansion to additional area codes
- [ ] Analyze which domains perform best
- [ ] Optimize regional marketing strategies
- [ ] Consider additional .works domains

## Rollback Plan

If critical issues arise:

### Immediate Actions

1. **Disable problematic domains** in Vercel
2. **Revert to single domain** if needed
3. **Check error logs** in Vercel dashboard
4. **Verify environment variables** are correct

### Emergency Contacts

- **Domain Issues**: Domain registrar support
- **SSL Issues**: Vercel support
- **Database Issues**: Database provider support
- **Email Issues**: Email service provider support

## Success Metrics

Launch is successful when:

- [ ] All domains resolve with HTTPS
- [ ] Regional job filtering works accurately
- [ ] Email delivery rates >95%
- [ ] Page load times <3 seconds
- [ ] Zero critical errors in first 24 hours
- [ ] User feedback is positive

## Next Steps After Launch

1. **Monitor and optimize** for 30 days
2. **Gather user feedback** on regional features
3. **Plan marketing campaigns** for each region
4. **Consider additional domains** (415.works, 408.works)
5. **Scale infrastructure** as traffic grows

---

**Note**: Since this is a fresh deployment, you have the advantage of setting everything up correctly from the start without needing to migrate existing users or content!
