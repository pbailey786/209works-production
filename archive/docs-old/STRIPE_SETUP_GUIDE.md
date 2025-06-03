# Stripe Integration Setup Guide for 209Jobs

## Overview

This guide will help you complete the Stripe integration for your 209Jobs platform. The code has been set up, but you need to configure your Stripe account and environment variables.

## 1. Stripe Account Setup

### Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete the account verification process
3. Navigate to the Stripe Dashboard

### Get API Keys

1. In your Stripe Dashboard, go to **Developers** → **API keys**
2. Copy your **Publishable key** (starts with `pk_test_` for test mode)
3. Copy your **Secret key** (starts with `sk_test_` for test mode)

## 2. Environment Variables Setup

Add these variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your_actual_secret_key_here"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_actual_publishable_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# Stripe Price IDs (create these in step 3)
STRIPE_STARTER_MONTHLY_PRICE_ID="price_starter_monthly_id"
STRIPE_STARTER_YEARLY_PRICE_ID="price_starter_yearly_id"
STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID="price_professional_monthly_id"
STRIPE_PROFESSIONAL_YEARLY_PRICE_ID="price_professional_yearly_id"
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID="price_enterprise_monthly_id"
STRIPE_ENTERPRISE_YEARLY_PRICE_ID="price_enterprise_yearly_id"
STRIPE_PREMIUM_MONTHLY_PRICE_ID="price_premium_monthly_id"
STRIPE_PREMIUM_YEARLY_PRICE_ID="price_premium_yearly_id"
```

## 3. Create Products and Prices in Stripe

### For Employers:

1. **Starter Plan**

   - Go to **Products** in Stripe Dashboard
   - Click **Add product**
   - Name: "Starter Plan"
   - Create two prices:
     - Monthly: $49/month (recurring)
     - Yearly: $529/year (recurring) - 10% discount

2. **Professional Plan**

   - Name: "Professional Plan"
   - Create two prices:
     - Monthly: $99/month (recurring)
     - Yearly: $1009/year (recurring) - 15% discount

3. **Enterprise Plan**
   - Name: "Enterprise Plan"
   - Create two prices:
     - Monthly: $299/month (recurring)
     - Yearly: $2870/year (recurring) - 20% discount

### For Job Seekers:

4. **Premium Plan**
   - Name: "Premium Plan (Job Seekers)"
   - Create two prices:
     - Monthly: $19/month (recurring)
     - Yearly: $205/year (recurring) - 10% discount

### Copy Price IDs

After creating each price, copy the Price ID (starts with `price_`) and add it to your `.env` file.

## 4. Webhook Setup

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL to: `https://yourdomain.com/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.created`
   - `customer.updated`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret and add it to your `.env` file

## 5. Database Migration

Run this command to add the Stripe customer ID field to your database:

```bash
npx prisma migrate dev --name add_stripe_customer_id
```

If you encounter issues, try:

```bash
npx prisma migrate reset --force
npx prisma generate
```

## 6. Test the Integration

### Test Mode

1. Use Stripe's test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
2. Test the checkout flow on your pricing pages
3. Verify webhooks are received in Stripe Dashboard

### Production Setup

1. Switch to live mode in Stripe Dashboard
2. Update environment variables with live keys (starts with `pk_live_` and `sk_live_`)
3. Update webhook endpoint to production URL

## 7. Customer Portal Setup

1. In Stripe Dashboard, go to **Settings** → **Billing** → **Customer portal**
2. Configure the portal settings:
   - Enable subscription management
   - Enable payment method updates
   - Set your business information
   - Configure allowed actions (cancel, upgrade, etc.)

## 8. Files Created/Modified

The following files have been created or modified for Stripe integration:

### New Files:

- `src/lib/stripe.ts` - Stripe configuration and utilities
- `src/app/api/stripe/create-checkout-session/route.ts` - Checkout session API
- `src/app/api/stripe/webhook/route.ts` - Webhook handler
- `src/app/api/stripe/create-portal-session/route.ts` - Customer portal API
- `src/components/pricing/PricingCard.tsx` - Stripe-integrated pricing card

### Modified Files:

- `src/app/pricing/page.tsx` - Updated with Stripe integration
- `src/app/employers/pricing/page.tsx` - Updated with Stripe integration
- `prisma/schema.prisma` - Added `stripeCustomerId` field to User model

## 9. Features Implemented

✅ **Subscription Management**

- Create checkout sessions for all pricing tiers
- Handle subscription lifecycle events via webhooks
- Customer portal for subscription management

✅ **Payment Processing**

- Secure payment processing through Stripe
- Support for monthly and yearly billing
- Automatic tax calculation
- Promotion code support

✅ **Trial Management**

- 14-day free trial for all plans
- Automatic conversion to paid subscription

✅ **Database Integration**

- Sync subscription status with local database
- Track customer information and payment history

## 10. Next Steps

1. Complete the Stripe account setup
2. Add the environment variables
3. Create products and prices in Stripe
4. Set up webhooks
5. Test the integration thoroughly
6. Deploy to production

## 11. Troubleshooting

### Common Issues:

- **Webhook signature verification fails**: Check that `STRIPE_WEBHOOK_SECRET` is correct
- **Price ID not found**: Verify price IDs in Stripe Dashboard match your `.env` file
- **Database errors**: Run `npx prisma generate` and restart your development server

### Support:

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: Available in your Stripe Dashboard

## Security Notes

- Never commit your `.env` file to version control
- Use test keys during development
- Regularly rotate your API keys
- Monitor webhook events for suspicious activity
- Enable Stripe Radar for fraud protection

---

Your Stripe integration is now ready! Follow this guide to complete the setup and start accepting payments.
