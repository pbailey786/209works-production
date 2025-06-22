# Netlify Functions - Stripe Checkout Integration

## Overview

This directory contains Netlify serverless functions for handling Stripe Checkout sessions for 209 Works pricing plans.

## Functions

### `create-checkout-session.js`

Creates Stripe Checkout sessions for subscription plans.

**Endpoint:** `/.netlify/functions/create-checkout-session`

**Method:** `POST`

**Request Body:**
```json
{
  "plan": "starter|standard|pro",
  "success_url": "https://209.works/success?plan=starter",
  "cancel_url": "https://209.works/pricing?cancelled=true",
  "customer_email": "user@example.com" // optional
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/pay/...",
  "sessionId": "cs_...",
  "plan": "starter"
}
```

## Environment Variables Required

Make sure these are set in your Netlify dashboard:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_... # or sk_test_... for testing

# Plan Price IDs (from your Stripe Dashboard)
STRIPE_PRICE_STARTER=price_1234567890abcdef
STRIPE_PRICE_STANDARD=price_0987654321fedcba
STRIPE_PRICE_PRO=price_abcdef1234567890

# Optional: Site URL (auto-detected if not set)
URL=https://209.works
```

## Setup Instructions

1. **Install Dependencies** (already done in your project):
   ```bash
   npm install stripe
   ```

2. **Set Environment Variables** in Netlify:
   - Go to your Netlify site dashboard
   - Navigate to Site settings > Environment variables
   - Add the required variables listed above

3. **Deploy** your site to Netlify:
   ```bash
   git push origin main
   ```

4. **Test the Function**:
   ```bash
   curl -X POST https://your-site.netlify.app/.netlify/functions/create-checkout-session \
     -H "Content-Type: application/json" \
     -d '{"plan": "starter"}'
   ```

## Integration Examples

### Basic HTML/JavaScript
```html
<button onclick="handlePlanSelection('starter')">
  Get Starter Plan - $99/month
</button>

<script>
async function handlePlanSelection(plan) {
  const response = await fetch('/.netlify/functions/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan })
  });
  
  const data = await response.json();
  if (data.url) {
    window.location.href = data.url;
  }
}
</script>
```

### React/Next.js
```jsx
const PricingButton = ({ plan }) => {
  const handleClick = async () => {
    const response = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan })
    });
    
    const data = await response.json();
    if (data.url) window.location.href = data.url;
  };

  return <button onClick={handleClick}>Subscribe to {plan}</button>;
};
```

## Error Handling

The function includes comprehensive error handling for:

- Invalid HTTP methods
- Missing or invalid plan names
- Missing environment variables
- Stripe API errors
- JSON parsing errors

All errors return appropriate HTTP status codes and descriptive error messages.

## Security Features

- CORS headers for cross-origin requests
- Input validation and sanitization
- Environment variable validation
- Stripe webhook signature verification (for future webhook handlers)

## Testing

### Test with curl:
```bash
# Valid request
curl -X POST https://your-site.netlify.app/.netlify/functions/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"plan": "starter", "success_url": "https://209.works/success"}'

# Invalid plan
curl -X POST https://your-site.netlify.app/.netlify/functions/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"plan": "invalid"}'
```

### Expected Responses:

**Success (200):**
```json
{
  "url": "https://checkout.stripe.com/pay/cs_...",
  "sessionId": "cs_...",
  "plan": "starter"
}
```

**Error (400):**
```json
{
  "error": "Invalid plan. Valid plans are: starter, standard, pro"
}
```

## Monitoring

Monitor function performance and errors in:
- Netlify Functions dashboard
- Stripe Dashboard > Logs
- Your application's error tracking service

## Support

For issues with this function:
1. Check Netlify function logs
2. Verify environment variables are set correctly
3. Test with Stripe's test mode first
4. Check Stripe Dashboard for any API errors
