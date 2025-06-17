import PlaceholderPage from '@/components/PlaceholderPage';

export default function EmployerTransactionsPage() {
  return (
    <PlaceholderPage
      title="Transaction History"
      description="View and manage your complete billing history, payment records, invoices, and transaction details. Track all payments processed through our secure payment system and download receipts for accounting."
      icon="📊"
      sections={[
        {
          title: 'Recent Transactions',
          description: 'Your latest payments and billing activities',
          wireframeType: 'table',
          items: [
            'Jan 15, 2024 - Professional Plan - $299.00 - Completed',
            'Jan 12, 2024 - Job Credits (50x) - $225.00 - Completed',
            'Jan 8, 2024 - Featured Boost - $75.00 - Completed',
            'Dec 15, 2023 - Professional Plan - $299.00 - Completed',
            'Dec 10, 2023 - AI Screening Credits - $150.00 - Completed',
            'Dec 5, 2023 - Job Credits (100x) - $400.00 - Completed',
          ],
        },
        {
          title: 'Payment Methods Used',
          description: 'Payment sources for your transactions',
          wireframeType: 'cards',
          items: [
            'Visa ****1234 (Primary) - 75% of transactions',
            'Mastercard ****5678 (Backup) - 20% of transactions',
            'ACH Bank Transfer - 3% of transactions',
            'Apple Pay - 2% of transactions',
            'PayPal - Linked but not used recently',
            'Corporate Card - For enterprise purchases',
          ],
        },
        {
          title: 'Invoice & Receipt Management',
          description: 'Download and manage your billing documents',
          wireframeType: 'list',
          items: [
            'Invoice #INV-2024-001 - Jan 15, 2024 - $299.00 - [Download PDF]',
            'Receipt #RCP-2024-007 - Jan 12, 2024 - $225.00 - [Download PDF]',
            'Invoice #INV-2023-012 - Dec 15, 2023 - $299.00 - [Download PDF]',
            'Receipt #RCP-2023-045 - Dec 10, 2023 - $150.00 - [Download PDF]',
            'Bulk Download: All 2024 documents',
            'Auto-forward to accounting@company.com',
            'Tax Summary Report Available',
            'Expense Report Integration',
          ],
        },
        {
          title: 'Stripe Transaction Details',
          description: 'Detailed payment processing information',
          wireframeType: 'table',
          items: [
            'Transaction ID: pi_3abc123stripe456',
            'Payment Intent Status: Succeeded',
            'Processing Fee: $9.17 (3.2% + $0.30)',
            'Net Amount: $289.83',
            'Currency: USD',
            '3D Secure: Authenticated',
            'Risk Level: Normal',
            'Dispute Status: No disputes',
          ],
        },
        {
          title: 'Failed & Pending Transactions',
          description: 'Track and resolve payment issues',
          wireframeType: 'cards',
          items: [
            'No failed transactions in the last 6 months',
            'No pending transactions currently',
            'Payment retry attempts: 0',
            'Declined transactions: 0',
            'Chargeback/disputes: 0',
            'Automatic retry enabled for failed payments',
          ],
        },
        {
          title: 'Financial Analytics',
          description: 'Spending patterns and cost analysis',
          wireframeType: 'chart',
          items: [
            'Monthly Spending Trend: $524 average',
            'Year-to-Date Total: $1,573.00',
            'Cost per Hire: $45.50 average',
            'ROI on Featured Posts: 240%',
            'Credit Utilization: 87% efficiency',
            'Seasonal Spending Patterns',
            'Budget vs. Actual Comparison',
            'Forecast: Next month $480 estimated',
          ],
        },
      ]}
      quickActions={[
        {
          title: 'Download All Invoices',
          label: 'Download All Invoices',
          description: 'Export all billing documents as ZIP',
          icon: '📥',
        },
        {
          title: 'Generate Tax Summary',
          label: 'Generate Tax Summary',
          description: 'Create annual tax report for accounting',
          icon: '📊',
        },
        {
          title: 'Export Transaction Data',
          label: 'Export Transaction Data',
          description: 'Download transaction history as CSV/Excel',
          icon: '📋',
        },
        {
          title: 'Update Payment Method',
          label: 'Update Payment Method',
          description: 'Modify billing information',
          icon: '💳',
          href: '/employers/settings/billing',
        },
        {
          title: 'Dispute Transaction',
          label: 'Dispute Transaction',
          description: 'Report billing issues or errors',
          icon: '⚠️',
          href: '/employers/contact',
        },
        {
          title: 'Setup Payment Alerts',
          label: 'Setup Payment Alerts',
          description: 'Configure transaction notifications',
          icon: '🔔',
          disabled: true,
        },
        {
          title: 'Accounting Integration',
          label: 'Accounting Integration',
          description: 'Connect to QuickBooks, Xero, or other systems',
          icon: '🔗',
          disabled: true,
        },
        {
          title: 'Spending Analytics',
          label: 'Spending Analytics',
          description: 'Advanced cost analysis and insights',
          icon: '📈',
          disabled: true,
        },
      ]}
    />
  );
}
