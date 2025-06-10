# Stripe Embedded Checkout Setup

## Environment Variables Required

Add these to your Netlify environment variables:

### Existing (you already have these):
```bash
STRIPE_SECRET_KEY=sk_test_... # or sk_live_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_STANDARD=price_...
STRIPE_PRICE_PRO=price_...
```

### New - Required for Embedded Checkout:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_...
```

## How to Get Your Publishable Key:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy the **Publishable key** (starts with `pk_test_` or `pk_live_`)
3. Add it to Netlify as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## What's Changed:

### ✅ Embedded Checkout Flow:
1. **Pricing Page** → Click "Get Started"
2. **Checkout Page** → Embedded Stripe form (stays on your site)
3. **Dashboard** → Success page after payment

### ✅ Components Created:
- `EmbeddedCheckout.tsx` - The embedded Stripe checkout component
- Updated `checkout/page.tsx` - Dedicated checkout page
- Updated Netlify function for embedded mode

### ✅ Benefits:
- Users stay on your site (better UX)
- More control over the checkout experience
- Better branding consistency
- Reduced redirect friction

## Testing:

1. **Add the publishable key** to Netlify
2. **Fix the Stripe secret key** (remove extra characters)
3. **Test the flow**: Pricing → Checkout → Payment

## Fallback:

If you need to revert to hosted checkout, change the Netlify function back to:
```javascript
// Remove: ui_mode: 'embedded'
// Add back: success_url and cancel_url
```

The embedded checkout provides a much better user experience!
