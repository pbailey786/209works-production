import PlaceholderPage from '@/components/PlaceholderPage';

export default function EmployerBillingSettingsPage() {
  return (
    <PlaceholderPage
      title="Billing & Subscription Management"
      description="Manage your subscription plan, payment methods, billing information, invoices, and usage tracking for transparent cost management and financial control."
      icon="💳"
      sections={[
        {
          title: 'Current Subscription',
          description: 'Your active plan and usage summary',
          wireframeType: 'cards',
          items: [
            'Professional Plan - $299/month',
            'Job Posts Used: 15/50',
            'Team Members: 5/10',
            'Next Billing: Jan 15, 2024',
            'Credits Remaining: 150',
            'Storage Used: 2.3GB/10GB',
          ],
        },
        {
          title: 'Payment Methods',
          description: 'Manage your payment information and billing details',
          wireframeType: 'form',
          items: [
            'Primary Payment Method',
            'Backup Payment Method',
            'Cardholder Name',
            'Billing Address',
            'Tax ID/VAT Number',
            'Invoice Email',
            'Auto-Pay Settings',
            'Payment History',
          ],
        },
        {
          title: 'Invoice History',
          description: 'Download and manage your billing invoices',
          wireframeType: 'table',
          items: [
            'Invoice Date',
            'Amount',
            'Status',
            'Description',
            'Download',
          ],
        },
        {
          title: 'Usage Analytics',
          description: 'Track your platform usage and optimize costs',
          wireframeType: 'chart',
          items: [
            'Monthly Job Post Trends',
            'Applicant Volume Analytics',
            'Feature Usage Breakdown',
            'Cost per Hire Metrics',
          ],
        },
        {
          title: 'Plan Comparison',
          description: 'Compare available plans and upgrade options',
          wireframeType: 'cards',
          items: [
            'Starter - $99/month',
            'Professional - $299/month (Current)',
            'Enterprise - Custom Pricing',
            'Add-ons Available',
          ],
        },
      ]}
      quickActions={[
        {
          title: 'Update Payment Method',
          label: 'Update Payment Method',
          description: 'Add or change your payment information',
          icon: '💳',
        },
        {
          title: 'Download Invoice',
          label: 'Download Invoice',
          description: 'Get your latest billing statement',
          icon: '📄',
        },
        {
          title: 'Upgrade Plan',
          label: 'Upgrade Plan',
          description: 'Access more features with a higher-tier plan',
          icon: '⬆️',
          href: '/employers/upgrade',
        },
        {
          title: 'Purchase Credits',
          label: 'Purchase Credits',
          description: 'Buy additional job posting credits',
          icon: '💰',
          href: '/employers/credits',
        },
        {
          title: 'Billing Support',
          label: 'Billing Support',
          description: 'Get help with billing questions',
          icon: '💬',
          href: '/employers/contact',
        },
        {
          title: 'Setup Auto-Pay',
          label: 'Setup Auto-Pay',
          description: 'Enable automatic subscription renewal',
          icon: '🔄',
        },
        {
          title: 'Tax Settings',
          label: 'Tax Settings',
          description: 'Configure tax information for invoicing',
          icon: '📊',
          disabled: true,
        },
        {
          title: 'Usage Alerts',
          label: 'Usage Alerts',
          description: 'Set notifications for usage limits',
          icon: '🔔',
          disabled: true,
        },
      ]}
    />
  );
}
