// Example: How to integrate the Netlify function with your pricing page buttons

// Basic usage - call from any pricing page button
async function handlePlanSelection(planName) {
  try {
    // Show loading state
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Loading...';
    button.disabled = true;

    // Call your Netlify function
    const response = await fetch(
      '/.netlify/functions/create-checkout-session',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planName, // 'starter', 'standard', 'pro'
          success_url: `${window.location.origin}/employers/dashboard?success=true&plan=${planName}`,
          cancel_url: `${window.location.origin}/employers/pricing?cancelled=true`,
          customer_email: null, // Optional: pre-fill if user is logged in
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create checkout session');
    }

    // Redirect to Stripe Checkout
    window.location.href = data.url;
  } catch (error) {
    console.error('Checkout error:', error);

    // Reset button state
    button.textContent = originalText;
    button.disabled = false;

    // Show user-friendly error
    alert('Something went wrong. Please try again or contact support.');
  }
}

// Example HTML for your pricing page
const exampleHTML = `
<!-- Starter Plan -->
<div class="pricing-card">
  <h3>Starter Tier</h3>
  <p>$99/month</p>
  <button onclick="handlePlanSelection('starter')" class="btn-primary">
    Get Started
  </button>
</div>

<!-- Standard Plan -->
<div class="pricing-card">
  <h3>Standard Tier</h3>
  <p>$199/month</p>
  <button onclick="handlePlanSelection('standard')" class="btn-primary">
    Get Started
  </button>
</div>

<!-- Pro Plan -->
<div class="pricing-card">
  <h3>Pro Tier</h3>
  <p>$350/month</p>
  <button onclick="handlePlanSelection('pro')" class="btn-primary">
    Get Started
  </button>
</div>
`;

// Advanced usage with user context
async function handlePlanSelectionAdvanced(planName, userEmail = null) {
  try {
    const response = await fetch(
      '/.netlify/functions/create-checkout-session',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planName,
          customer_email: userEmail,
          success_url: `${window.location.origin}/employers/dashboard?success=true&plan=${planName}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/employers/pricing?cancelled=true&plan=${planName}`,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create checkout session');
    }

    // Optional: Track the checkout attempt
    if (typeof gtag !== 'undefined') {
      gtag('event', 'begin_checkout', {
        currency: 'USD',
        value:
          planName === 'starter' ? 99 : planName === 'standard' ? 199 : 350,
        items: [
          {
            item_id: planName,
            item_name: `${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan`,
            category: 'subscription',
            quantity: 1,
          },
        ],
      });
    }

    // Redirect to Stripe Checkout
    window.location.href = data.url;
  } catch (error) {
    console.error('Checkout error:', error);

    // Optional: Track the error
    if (typeof gtag !== 'undefined') {
      gtag('event', 'exception', {
        description: `Checkout error: ${error.message}`,
        fatal: false,
      });
    }

    alert('Something went wrong. Please try again or contact support.');
  }
}

// React/Next.js example
const PricingButton = ({ plan, price, children }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        '/.netlify/functions/create-checkout-session',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan: plan,
            success_url: `${window.location.origin}/employers/dashboard?success=true&plan=${plan}`,
            cancel_url: `${window.location.origin}/employers/pricing?cancelled=true`,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading} className="btn-primary">
      {loading ? 'Loading...' : children}
    </button>
  );
};

// Usage in React component:
// <PricingButton plan="starter" price={99}>Get Starter Plan</PricingButton>
