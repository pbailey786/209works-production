import PlaceholderPage from "@/components/PlaceholderPage";

export default function EmployerCheckoutPage() {
  return (
    <PlaceholderPage
      title="Secure Checkout"
      description="Complete your subscription upgrade or credit purchase through our secure payment system powered by Stripe. Review your order and payment details before finalizing your transaction."
      icon="🛒"
      sections={[
        {
          title: "Order Summary",
          description: "Review your selected plan and billing details",
          wireframeType: "cards",
          items: [
            "Professional Plan Upgrade - $299/month",
            "Additional Team Members (3x) - $75/month",
            "Premium AI Features Add-on - $99/month",
            "Job Posting Credits (100x) - $200",
            "Subtotal: $673/month + $200 one-time",
            "Tax (8.25%): $80.37/month + $16.50",
            "Total: $753.37/month + $216.50 one-time"
          ]
        },
        {
          title: "Stripe Payment Integration",
          description: "Secure payment processing through Stripe",
          wireframeType: "form",
          items: [
            "[Stripe Elements Card Input]",
            "Cardholder Name",
            "Billing Address",
            "Country/Region",
            "Postal Code",
            "Save Card for Future Payments",
            "3D Secure Authentication",
            "PCI Compliance Badge"
          ]
        },
        {
          title: "Subscription Details",
          description: "Billing cycle and subscription terms",
          wireframeType: "list",
          items: [
            "Billing Frequency: Monthly (can change to annual)",
            "Next Billing Date: January 15, 2024",
            "Auto-Renewal: Enabled (can be disabled anytime)",
            "Proration: Applied for mid-cycle upgrade",
            "Plan Change Effective: Immediately",
            "Cancellation Policy: Cancel anytime, no penalties",
            "Refund Policy: Pro-rated refunds available",
            "Payment Retry: 3 attempts if payment fails"
          ]
        },
        {
          title: "Payment Security",
          description: "Security measures and compliance information",
          wireframeType: "cards",
          items: [
            "PCI DSS Level 1 Compliant",
            "256-bit SSL Encryption",
            "3D Secure 2.0 Authentication",
            "Fraud Detection by Stripe Radar",
            "Data Tokenization",
            "Zero Storage of Card Details"
          ]
        },
        {
          title: "Webhooks & Integration",
          description: "Automated processing and confirmations",
          wireframeType: "list",
          items: [
            "Real-time Payment Confirmation",
            "Automatic Account Upgrade",
            "Invoice Generation",
            "Email Receipt Delivery",
            "Slack/Teams Notification (if enabled)",
            "API Access Provisioning",
            "Usage Limit Updates",
            "Team Member Access Grants"
          ]
        },
        {
          title: "Post-Payment Actions",
          description: "What happens after successful payment",
          wireframeType: "table",
          items: [
            "Account Upgrade: Immediate",
            "Feature Access: Within 5 minutes",
            "Invoice Email: Within 30 minutes",
            "Subscription Confirmation: Immediate",
            "Support Ticket Priority: Upgraded",
            "API Rate Limits: Increased",
            "Team Invitations: Available",
            "Credit Balance: Updated"
          ]
        }
      ]}
      quickActions={[
        {
          title: "Complete Payment",
          label: "Complete Payment",
          description: "Process payment through Stripe",
          icon: "💳"
        },
        {
          title: "Back to Plan Selection",
          label: "Back to Plan Selection",
          description: "Modify your selected plan or add-ons",
          icon: "⬅️"
        },
        {
          title: "Apply Promo Code",
          label: "Apply Promo Code",
          description: "Enter discount or promotional code",
          icon: "🎫"
        },
        {
          title: "Change Billing Cycle",
          label: "Change Billing Cycle",
          description: "Switch between monthly and annual billing",
          icon: "🔄"
        },
        {
          title: "Payment Security Info",
          label: "Payment Security Info",
          description: "Learn about our security measures",
          icon: "🔒",
          disabled: true
        },
        {
          title: "Contact Billing Support",
          label: "Contact Billing Support",
          description: "Get help with payment issues",
          icon: "💬",
          disabled: true
        },
        {
          title: "Tax Exemption",
          label: "Tax Exemption",
          description: "Apply tax exemption certificate",
          icon: "📄",
          disabled: true
        },
        {
          title: "Custom Enterprise Pricing",
          label: "Custom Enterprise Pricing",
          description: "Request custom pricing for large teams",
          icon: "🏢",
          disabled: true
        }
      ]}
    />
  );
} 