exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      environment: {
        hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
        stripeKeyPrefix: process.env.STRIPE_SECRET_KEY
          ? process.env.STRIPE_SECRET_KEY.substring(0, 7)
          : 'missing',
        hasStarterPrice: !!process.env.STRIPE_PRICE_STARTER,
        hasStandardPrice: !!process.env.STRIPE_PRICE_STANDARD,
        hasProPrice: !!process.env.STRIPE_PRICE_PRO,
        starterPricePrefix: process.env.STRIPE_PRICE_STARTER
          ? process.env.STRIPE_PRICE_STARTER.substring(0, 10)
          : 'missing',
        nodeVersion: process.version,
        platform: process.platform,
      },
    }),
  };
};
