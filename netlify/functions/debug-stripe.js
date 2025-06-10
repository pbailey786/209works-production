exports.handler = async (event, context) => {
  try {
    // Test basic functionality
    const result = {
      step: 'starting',
      environment: {
        hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
        stripeKeyPrefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 7) : 'missing',
        hasStarterPrice: !!process.env.STRIPE_PRICE_STARTER,
        starterPrice: process.env.STRIPE_PRICE_STARTER,
      }
    };

    // Test Stripe import
    try {
      result.step = 'importing stripe';
      const Stripe = require('stripe');
      result.stripeImported = true;
      
      result.step = 'initializing stripe';
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      result.stripeInitialized = true;
      
      // Test a simple Stripe API call
      result.step = 'testing stripe api';
      const prices = await stripe.prices.list({ limit: 1 });
      result.stripeApiWorking = true;
      result.pricesCount = prices.data.length;
      
    } catch (stripeError) {
      result.stripeError = {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Debug function failed',
        message: error.message,
        stack: error.stack,
      }),
    };
  }
};
