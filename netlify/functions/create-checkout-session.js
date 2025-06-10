const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Valid plan names that map to environment variables
const VALID_PLANS = ['starter', 'standard', 'pro'];

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({
        error: 'Method not allowed. Use POST.'
      }),
    };
  }

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  try {
    // Debug: Check environment variables
    const envCheck = {
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      hasStarterPrice: !!process.env.STRIPE_PRICE_STARTER,
      hasStandardPrice: !!process.env.STRIPE_PRICE_STANDARD,
      hasProPrice: !!process.env.STRIPE_PRICE_PRO,
      stripeKeyPrefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 7) : 'missing',
    };

    console.log('Environment check:', envCheck);
    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: 'Invalid JSON in request body' 
        }),
      };
    }

    const { 
      plan, 
      success_url, 
      cancel_url,
      customer_email 
    } = requestBody;

    // Validate required fields
    if (!plan) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: 'Plan is required' 
        }),
      };
    }

    // Validate plan name
    const normalizedPlan = plan.toLowerCase();
    if (!VALID_PLANS.includes(normalizedPlan)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: `Invalid plan. Valid plans are: ${VALID_PLANS.join(', ')}` 
        }),
      };
    }

    // Get price ID from environment variables
    const priceId = process.env[`STRIPE_PRICE_${normalizedPlan.toUpperCase()}`];
    
    if (!priceId) {
      console.error(`Missing environment variable: STRIPE_PRICE_${normalizedPlan.toUpperCase()}`);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: `Price configuration not found for plan: ${normalizedPlan}` 
        }),
      };
    }

    // Set default URLs if not provided
    const baseUrl = process.env.URL || 'https://209.works';
    const defaultSuccessUrl = `${baseUrl}/employers/dashboard?success=true&plan=${normalizedPlan}`;
    const defaultCancelUrl = `${baseUrl}/employers/pricing?cancelled=true`;

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      customer_email: customer_email || undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: success_url || defaultSuccessUrl,
      cancel_url: cancel_url || defaultCancelUrl,
      allow_promotion_codes: true,
      automatic_tax: {
        enabled: true,
      },
      subscription_data: {
        metadata: {
          plan: normalizedPlan,
          source: '209_works_employer_signup',
        },
      },
      metadata: {
        plan: normalizedPlan,
        source: '209_works_employer_signup',
      },
    });

    // Return the session URL
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        url: session.url,
        sessionId: session.id,
        plan: normalizedPlan,
      }),
    };

  } catch (error) {
    console.error('Stripe Checkout Session Error:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      stack: error.stack,
    });

    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Card error: ' + error.message
        }),
      };
    }

    if (error.type === 'StripeInvalidRequestError') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Invalid request: ' + error.message
        }),
      };
    }

    // Generic error response with more details in development
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error. Please try again.',
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
    };
  }
};
