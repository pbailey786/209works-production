# 🚀 Netlify Deployment Checklist for 209 Works

## ✅ Required Environment Variables (Must Have)

### **Core Application**

```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://209.works
NEXTAUTH_URL=https://209.works
NEXTAUTH_SECRET=your-super-secret-key-here-64-chars-minimum
```

### **Database (PostgreSQL)**

```
DATABASE_URL=postgresql://username:password@host:port/database_name
```

### **Email Service (Resend) - ✅ You have this**

```
RESEND_API_KEY=your-resend-api-key
```

## 🔧 Optional but Recommended

### **AI Features (if you want JobsGPT)**

```
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### **Job Data Import (if you want Adzuna jobs)**

```
ADZUNA_APP_ID=your-adzuna-app-id
ADZUNA_API_KEY=your-adzuna-api-key
```

### **Redis (for performance - can skip for now)**

```
SKIP_REDIS=true
REDIS_DISABLED=true
```

### **Admin Settings**

```
ADMIN_EMAILS=admin@209.works,support@209.works
SUPPORT_EMAIL=support@209.works
```

## 🛡️ Security & Performance

### **OpenTelemetry Disabling (for build fix)**

```
OTEL_SDK_DISABLED=true
NETLIFY=true
```

### **Rate Limiting (optional)**

```
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

## 📋 Pre-Deployment Checklist

- [ ] **Database**: PostgreSQL database created and accessible
- [ ] **NEXTAUTH_SECRET**: Generated secure 64+ character secret
- [ ] **Resend**: API key added (✅ you have this)
- [ ] **Domain**: 209.works domain configured in Netlify
- [ ] **Build settings**: Build command set to `npm run build`
- [ ] **Node version**: Set to 18.x or higher in Netlify

## 🔑 Generate Secure Secrets

Run this to generate a secure NEXTAUTH_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🎯 Minimum Required for Basic Functionality

**Just these 4 variables will get you running:**

1. `NODE_ENV=production`
2. `NEXT_PUBLIC_APP_URL=https://209.works`
3. `NEXTAUTH_URL=https://209.works`
4. `NEXTAUTH_SECRET=your-64-char-secret`
5. `DATABASE_URL=your-postgres-connection`
6. `RESEND_API_KEY=your-resend-key` (✅ you have this)

## 🚀 Deployment Steps

1. **Set environment variables** in Netlify Dashboard
2. **Push to main branch** (triggers auto-deploy)
3. **Monitor build logs** for any issues
4. **Test key functionality**:
   - Homepage loads
   - User registration/login
   - Password reset (uses Resend)
   - Admin dashboard access

## 🔍 Post-Deployment Testing

- [ ] Homepage loads correctly
- [ ] User can register/login
- [ ] Password reset emails work
- [ ] Admin dashboard accessible
- [ ] Contact form sends emails
- [ ] No console errors

## 📞 Need Help?

If you encounter issues:

1. Check Netlify build logs
2. Verify environment variables are set
3. Test database connectivity
4. Confirm Resend API key is working
