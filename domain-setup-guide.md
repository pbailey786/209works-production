# 209 Works Regional Domain Setup Guide

## 🌐 **Domain Portfolio Overview**

You own the following domains for regional expansion:

- ✅ **209.works** - Already deployed on Netlify (Central Valley)
- 🔧 **916.works** - Sacramento Metro (Ready to configure)
- 🔧 **510.works** - East Bay (Ready to configure)
- 🔧 **925.works** - East Bay & Tri-Valley (Ready to configure)
- 🔧 **559.works** - Fresno/Central Valley South (Ready to configure)

## 🎯 **Current Status**

### ✅ **209.works (Production)**

- **Status**: Live and deployed on Netlify
- **SSL**: Automatic HTTPS via Netlify
- **DNS**: Configured and working
- **Content**: Full 209 Works platform

### 🔧 **Regional Domains (Owned but Not Configured)**

All regional domains are configured in the codebase but need DNS setup.

## 📋 **Regional Domain Setup Strategy**

### **Option 1: Immediate Setup (Recommended)**

Point all regional domains to the same Netlify deployment with domain-specific content:

**Benefits:**

- ✅ Single codebase, multiple domains
- ✅ Regional content customization
- ✅ SEO benefits for each region
- ✅ Easy maintenance

### **Option 2: Future Expansion**

Set up regional domains later as separate deployments:

**Benefits:**

- 🔄 More complex but allows regional customization
- 🔄 Separate analytics per region
- 🔄 Independent scaling

## 🚀 **Immediate Setup Instructions (Option 1)**

### **Step 1: Add Domains to Netlify**

1. **Go to Netlify Dashboard**

   - Navigate to your 209 Works site
   - Go to **Site Settings** → **Domain Management**

2. **Add Custom Domains**

   ```
   Add these domains one by one:
   - 916.works
   - 510.works
   - 925.works
   - 559.works
   ```

3. **Configure DNS for Each Domain**
   For each domain, point to Netlify:
   ```
   A Record: @ → 75.2.60.5
   CNAME: www → your-site-name.netlify.app
   ```

### **Step 2: SSL Certificates**

Netlify will automatically provision SSL certificates for each domain once DNS is configured.

### **Step 3: Verify Domain Configuration**

The application is already configured to handle multiple domains with region-specific content.

## 🔧 **DNS Configuration Details**

### **For Each Regional Domain (916.works, 510.works, etc.)**

**DNS Records to Add:**

```
Type: A
Name: @
Value: 75.2.60.5
TTL: 3600

Type: CNAME
Name: www
Value: your-netlify-site.netlify.app
TTL: 3600
```

**Optional: Email Setup**

```
Type: MX
Name: @
Value: 10 mail.your-email-provider.com
TTL: 3600
```

## 🎨 **Regional Customization Features**

### **Automatic Regional Content**

The application automatically detects the domain and shows:

- ✅ **Regional Branding**: Different colors per region
- ✅ **Local Cities**: Region-specific city lists
- ✅ **SEO Optimization**: Region-specific meta tags
- ✅ **Job Filtering**: Geographic filtering by region
- ✅ **Local Focus**: "Built for [Region]" messaging

### **Regional Configurations**

**209.works (Central Valley)**

- Primary Color: Orange (#ff6b35)
- Cities: Stockton, Modesto, Tracy, Manteca, Lodi
- Radius: 50 miles

**916.works (Sacramento Metro)**

- Primary Color: Green (#059669)
- Cities: Sacramento, Elk Grove, Roseville, Folsom, Davis
- Radius: 40 miles

**510.works (East Bay)**

- Primary Color: Red (#DC2626)
- Cities: Oakland, Berkeley, Fremont, Hayward, Richmond
- Radius: 35 miles

**925.works (East Bay & Tri-Valley)**

- Primary Color: Purple (#7c3aed)
- Cities: Concord, Walnut Creek, Pleasanton, Livermore, Antioch
- Radius: 35 miles

**559.works (Fresno/Central Valley South)**

- Primary Color: Blue (to be configured)
- Cities: Fresno, Visalia, Clovis, Madera
- Radius: 45 miles

## 📊 **SEO Benefits of Regional Domains**

### **Search Engine Optimization**

- ✅ **Local SEO**: Each domain ranks for regional keywords
- ✅ **Geographic Targeting**: Better local search visibility
- ✅ **Branded Domains**: Memorable, region-specific URLs
- ✅ **Content Relevance**: Region-specific job listings and content

### **Marketing Benefits**

- ✅ **Local Branding**: "916 Jobs" feels more local than "209 Works"
- ✅ **Word of Mouth**: Easier to remember and share
- ✅ **Regional Partnerships**: Local business partnerships
- ✅ **Social Media**: Region-specific social accounts

## 🔍 **Domain Verification Checklist**

### **Pre-Setup Verification**

- [ ] Confirm domain ownership
- [ ] Access to domain registrar DNS settings
- [ ] Netlify site access

### **Post-Setup Verification**

- [ ] DNS propagation complete (24-48 hours)
- [ ] SSL certificates active
- [ ] Regional content displaying correctly
- [ ] Job filtering working by region
- [ ] SEO meta tags correct per domain

## 🚀 **Quick Start: Set Up One Regional Domain**

### **Test with 916.works First**

1. **Add to Netlify**

   - Site Settings → Domain Management → Add Domain
   - Enter: `916.works`

2. **Configure DNS**

   ```
   A Record: @ → 75.2.60.5
   CNAME: www → your-site.netlify.app
   ```

3. **Test After DNS Propagation**

   ```bash
   # Test domain resolution
   nslookup 916.works

   # Test HTTPS
   curl -I https://916.works

   # Test regional content
   curl https://916.works | grep "916 Jobs"
   ```

4. **Verify Regional Features**
   - Visit https://916.works
   - Confirm Sacramento-specific content
   - Check green branding theme
   - Verify local city listings

## 📈 **Analytics & Monitoring Setup**

### **Google Analytics**

Set up separate GA4 properties for each domain:

- 209.works → GA4 Property 1
- 916.works → GA4 Property 2
- 510.works → GA4 Property 3
- etc.

### **Search Console**

Add each domain to Google Search Console for SEO monitoring.

### **Uptime Monitoring**

Monitor all domains for availability and performance.

## 🔄 **Future Expansion Options**

### **Phase 1: Basic Regional Domains (Current)**

- All domains point to same Netlify deployment
- Regional content via domain detection
- Shared job database with geographic filtering

### **Phase 2: Regional Customization**

- Regional admin panels
- Local employer partnerships
- Region-specific job categories

### **Phase 3: Independent Regional Sites**

- Separate deployments per region
- Regional databases
- Local team management

## 💡 **Recommendations**

### **Immediate Actions**

1. **Start with 916.works** - Test the setup process
2. **Monitor Performance** - Ensure no impact on 209.works
3. **Gradual Rollout** - Add one domain per week

### **Long-term Strategy**

1. **SEO Focus** - Optimize each domain for local search
2. **Content Strategy** - Create region-specific content
3. **Partnership Development** - Build local business relationships
4. **Analytics Tracking** - Monitor regional performance

---

**Next Steps**: Ready to configure your first regional domain? Start with 916.works as a test case, then expand to other regions based on demand and performance.
