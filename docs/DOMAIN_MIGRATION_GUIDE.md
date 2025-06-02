# Domain Migration Guide: 209jobs.com → .works Ecosystem

## Overview

This guide outlines the complete migration process from `209jobs.com` to the new `.works` domain ecosystem, including `209.works`, `916.works`, `510.works`, and `norcal.works`.

## Pre-Migration Checklist

### 1. DNS Configuration
- [ ] Purchase and configure all `.works` domains
- [ ] Set up DNS records for each domain
- [ ] Configure SSL certificates for all domains
- [ ] Test DNS propagation

### 2. Environment Variables
Update the following environment variables:

```bash
# Primary domain (update from 209jobs.com)
NEXT_PUBLIC_APP_URL=https://209.works
NEXTAUTH_URL=https://209.works

# Email configuration
EMAIL_FROM="209 Jobs <noreply@209.works>"
ALERT_EMAIL_FROM=alerts@209.works

# Allowed origins (add all .works domains)
ALLOWED_ORIGINS=https://209.works,https://916.works,https://510.works,https://norcal.works

# API allowed origins
API_ALLOWED_ORIGINS=https://209.works,https://916.works,https://510.works,https://norcal.works
```

### 3. Database Updates
No database schema changes required, but update any hardcoded domain references:

```sql
-- Update any stored URLs in the database
UPDATE "Job" SET "url" = REPLACE("url", '209jobs.com', '209.works') WHERE "url" LIKE '%209jobs.com%';
UPDATE "User" SET "website" = REPLACE("website", '209jobs.com', '209.works') WHERE "website" LIKE '%209jobs.com%';
```

## Migration Steps

### Phase 1: Infrastructure Setup

1. **Deploy Domain Configuration**
   ```bash
   # Ensure all domain config files are deployed
   git add src/lib/domain/
   git commit -m "Add domain configuration system"
   git push
   ```

2. **Update Vercel Configuration**
   - Add all `.works` domains to Vercel project
   - Configure custom domains in Vercel dashboard
   - Verify SSL certificates are active

3. **Test Domain Routing**
   ```bash
   # Test each domain responds correctly
   curl -I https://209.works
   curl -I https://916.works
   curl -I https://510.works
   curl -I https://norcal.works
   ```

### Phase 2: Application Updates

1. **Deploy Updated Application**
   ```bash
   # Deploy with domain-aware components
   npm run build
   npm run deploy
   ```

2. **Verify Domain-Specific Features**
   - [ ] Each domain shows correct branding
   - [ ] Regional job filtering works
   - [ ] SEO metadata is domain-specific
   - [ ] Email templates use correct domain

3. **Test Legacy Redirects**
   ```bash
   # Verify 209jobs.com redirects to 209.works
   curl -I https://209jobs.com
   curl -I https://www.209jobs.com
   ```

### Phase 3: Content and SEO

1. **Update Sitemaps**
   - Generate domain-specific sitemaps
   - Submit to Google Search Console for each domain

2. **Update Social Media**
   - Update Facebook pages for each region
   - Update Instagram accounts
   - Update Twitter handles

3. **Update Marketing Materials**
   - Email signatures
   - Business cards
   - Advertising campaigns

## Domain-Specific Configuration

### 209.works (Central Valley)
```typescript
{
  domain: '209.works',
  areaCode: '209',
  region: 'Central Valley',
  cities: ['Stockton', 'Modesto', 'Tracy', 'Manteca', 'Lodi'],
  primaryColor: '#3B82F6',
  accentColor: '#1E40AF'
}
```

### 916.works (Sacramento Metro)
```typescript
{
  domain: '916.works',
  areaCode: '916', 
  region: 'Sacramento Metro',
  cities: ['Sacramento', 'Elk Grove', 'Roseville', 'Folsom'],
  primaryColor: '#059669',
  accentColor: '#047857'
}
```

### 510.works (East Bay)
```typescript
{
  domain: '510.works',
  areaCode: '510',
  region: 'East Bay', 
  cities: ['Oakland', 'Berkeley', 'Fremont', 'Hayward'],
  primaryColor: '#DC2626',
  accentColor: '#B91C1C'
}
```

### norcal.works (Northern California Hub)
```typescript
{
  domain: 'norcal.works',
  areaCode: 'norcal',
  region: 'Northern California',
  cities: ['San Francisco', 'San Jose', 'Oakland', 'Sacramento'],
  primaryColor: '#7C3AED',
  accentColor: '#6D28D9'
}
```

## Testing Checklist

### Functional Testing
- [ ] Domain detection works correctly
- [ ] Regional job filtering functions
- [ ] Email templates use correct domain
- [ ] Social media links are domain-specific
- [ ] Logo variants load correctly
- [ ] Color schemes apply per domain

### SEO Testing
- [ ] Meta titles include region names
- [ ] Meta descriptions are region-specific
- [ ] Canonical URLs use correct domain
- [ ] Structured data includes regional info
- [ ] Open Graph images are domain-specific

### Performance Testing
- [ ] Page load times under 3 seconds
- [ ] Domain routing adds minimal overhead
- [ ] CDN caching works for all domains
- [ ] Images optimize correctly

## Rollback Plan

If issues arise during migration:

1. **Immediate Rollback**
   ```bash
   # Revert to previous deployment
   vercel rollback
   ```

2. **DNS Rollback**
   - Point domains back to old infrastructure
   - Update DNS TTL to 300 seconds for faster changes

3. **Database Rollback**
   ```sql
   -- Revert URL changes if needed
   UPDATE "Job" SET "url" = REPLACE("url", '209.works', '209jobs.com') WHERE "url" LIKE '%209.works%';
   ```

## Post-Migration Tasks

### Week 1
- [ ] Monitor error rates and performance
- [ ] Check search engine indexing
- [ ] Verify email delivery rates
- [ ] Monitor user feedback

### Week 2-4
- [ ] Update Google My Business listings
- [ ] Update directory listings
- [ ] Reach out to partners about domain change
- [ ] Monitor SEO rankings

### Month 2-3
- [ ] Analyze traffic patterns by domain
- [ ] Optimize regional job filtering
- [ ] A/B test domain-specific features
- [ ] Plan expansion to additional area codes

## Monitoring and Analytics

### Key Metrics to Track
- Traffic distribution across domains
- Regional job application rates
- Email engagement by domain
- Search rankings for regional keywords
- User retention by domain

### Monitoring Setup
```javascript
// Google Analytics 4 - Track domain in events
gtag('config', 'GA_MEASUREMENT_ID', {
  custom_map: {
    'custom_parameter_1': 'domain'
  }
});

// Track domain-specific events
gtag('event', 'page_view', {
  domain: window.location.hostname,
  region: domainConfig.region
});
```

## Scaling to Additional Domains

### Future Expansion Plan
1. **Research new markets**: 415.works (SF), 408.works (San Jose)
2. **Validate demand**: Survey users, analyze search data
3. **Configure new domains**: Add to domain config
4. **Launch gradually**: Soft launch → marketing → full launch

### Adding New Domains
1. Update `src/lib/domain/config.ts`
2. Add domain to Vercel project
3. Update middleware redirects
4. Create region-specific content
5. Set up monitoring and analytics

## Support and Troubleshooting

### Common Issues

**Domain not resolving**
- Check DNS propagation: `dig 209.works`
- Verify Vercel domain configuration
- Check SSL certificate status

**Wrong branding showing**
- Clear browser cache
- Check domain detection logic
- Verify domain config is deployed

**Redirects not working**
- Check middleware configuration
- Verify Next.js redirects in `next.config.ts`
- Test with curl to see actual response

### Emergency Contacts
- **DNS Issues**: Contact domain registrar
- **SSL Issues**: Contact Vercel support
- **Application Issues**: Check deployment logs
- **Database Issues**: Check connection strings

## Success Criteria

The migration is considered successful when:
- [ ] All domains resolve correctly with HTTPS
- [ ] Regional job filtering works accurately
- [ ] Email delivery rates maintain 95%+ success
- [ ] Page load times remain under 3 seconds
- [ ] SEO rankings maintain or improve within 30 days
- [ ] User complaints are minimal (<1% of traffic)
- [ ] Regional traffic distribution meets expectations

## Conclusion

This migration represents a significant evolution in the platform's positioning and capabilities. The new domain structure enables:

- **Hyperlocal positioning** in key Northern California markets
- **Improved SEO** through region-specific domains
- **Enhanced user experience** with localized content
- **Scalable architecture** for future market expansion

Regular monitoring and optimization will ensure the migration delivers the expected benefits while maintaining service quality for all users. 