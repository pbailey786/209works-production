// Mock version for testing while Stripe key is being fixed
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

    // Mock Stripe checkout session URL
    const mockSessionId = `cs_test_mock_${Date.now()}_${normalizedPlan}`;
    const mockCheckoutUrl = `https://checkout.stripe.com/pay/${mockSessionId}`;

    // For testing, we'll return a mock URL that redirects to success
    const testSuccessUrl = success_url || `https://209.works/employers/dashboard?success=true&plan=${normalizedPlan}`;
    
    // Return mock response (in production, this would be the real Stripe URL)
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        url: testSuccessUrl, // For testing, redirect directly to success
        sessionId: mockSessionId,
        plan: normalizedPlan,
        mock: true,
        message: 'This is a mock response while Stripe is being configured'
      }),
    };

  } catch (error) {
    console.error('Mock Checkout Session Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Internal server error. Please try again.',
        debug: error.message
      }),
    };
  }
};
