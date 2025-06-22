import PlaceholderPage from '@/components/PlaceholderPage';

export default function EmployerAlertsPage() {
  return (
    <PlaceholderPage
      title="Alerts Dashboard"
      description="Monitor critical hiring alerts, system notifications, and urgent activities that require immediate attention. Stay informed about time-sensitive opportunities and potential issues."
      icon="🚨"
      sections={[
        {
          title: 'Critical Alerts',
          description: 'Urgent notifications requiring immediate action',
          wireframeType: 'cards',
          items: [
            'URGENT: Senior Developer position expires in 24 hours',
            'HIGH PRIORITY: Top candidate considering other offers',
            'PAYMENT ISSUE: Credit card payment failed',
            'SECURITY: Suspicious login attempt detected',
            'CAPACITY: Approaching monthly application limit',
            'DEADLINE: Interview reminder - scheduled in 2 hours',
          ],
        },
        {
          title: 'Job Posting Alerts',
          description: 'Time-sensitive alerts related to your job postings',
          wireframeType: 'table',
          items: [
            'Marketing Manager - Expires Tomorrow',
            'Data Scientist - Low Application Volume (Only 2 applications)',
            'UX Designer - High Competition (15 similar jobs posted today)',
            'Product Manager - Budget Alert (80% of promotion budget used)',
            'Sales Rep - Peak Performance (25% higher views than average)',
            "DevOps Engineer - Keyword Suggestion (Add 'Docker' for better reach)",
            'Content Writer - Location Expansion (Consider remote option)',
            'Frontend Developer - Salary Alert (10% below market average)',
          ],
        },
        {
          title: 'Candidate Activity Alerts',
          description: 'Urgent candidate-related notifications',
          wireframeType: 'list',
          items: [
            'Top candidate (AI Score: 98%) applied for Senior Developer',
            "High-priority candidate viewed job but didn't apply",
            'Candidate with competing offer needs response within 48 hours',
            'Star performer from previous hire referred a friend',
            'Candidate profile matched 5 of your job requirements',
            'Passive candidate showed interest in your company page',
            'Previous applicant updated skills - now matches better',
            'Recommended candidate from AI analysis needs review',
          ],
        },
        {
          title: 'System Performance Alerts',
          description: 'Platform and account monitoring alerts',
          wireframeType: 'cards',
          items: [
            'API Rate Limit: 90% of monthly quota used',
            'Data Storage: 85% capacity reached',
            'Export Processing: Large data export in progress',
            'Integration Issue: Slack notifications temporarily unavailable',
            'Maintenance Window: Scheduled for this Sunday 2-4 AM',
            'Security Update: Enhanced password requirements active',
          ],
        },
        {
          title: 'Financial Alerts',
          description: 'Billing and subscription-related alerts',
          wireframeType: 'list',
          items: [
            'Subscription renewal due in 7 days',
            'Job posting credits running low (5 remaining)',
            'Featured placement budget 90% consumed',
            'Bulk posting discount expires in 3 days',
            'Invoice #12345 payment overdue',
            'Upgrade recommendation: Unlock premium AI features',
            'Usage spike: 200% increase in API calls this week',
            'Cost optimization: Consider annual plan for 20% savings',
          ],
        },
        {
          title: 'Team & Collaboration Alerts',
          description: 'Important team-related notifications',
          wireframeType: 'table',
          items: [
            'Team Member Access Request Pending Approval',
            'Interview Conflict: Multiple interviews scheduled same time',
            'Hiring Goal Update: 75% progress toward Q4 targets',
            'Workflow Bottleneck: Applications pending review for 3+ days',
            'Permission Change: New admin privileges granted',
            'Collaboration Request: External recruiter wants access',
            'Training Reminder: New compliance requirements',
            'Performance Alert: Slow response time on applications',
          ],
        },
      ]}
      quickActions={[
        {
          title: 'Acknowledge All',
          label: 'Acknowledge All',
          description: 'Mark all alerts as acknowledged',
          icon: '✓',
        },
        {
          title: 'Critical Only',
          label: 'Critical Only',
          description: 'Show only high-priority alerts',
          icon: '⚠️',
        },
        {
          title: 'Set Alert Rules',
          label: 'Set Alert Rules',
          description: 'Configure custom alert conditions',
          icon: '⚙️',
        },
        {
          title: 'Escalation Settings',
          label: 'Escalation Settings',
          description: 'Manage alert escalation procedures',
          icon: '📈',
        },
        {
          title: 'Alert History',
          label: 'Alert History',
          description: 'View past alerts and resolutions',
          icon: '📋',
          disabled: true,
        },
        {
          title: 'Automated Responses',
          label: 'Automated Responses',
          description: 'Set up automatic alert responses',
          icon: '🤖',
          disabled: true,
        },
        {
          title: 'Dashboard Widgets',
          label: 'Dashboard Widgets',
          description: 'Customize alert dashboard layout',
          icon: '📊',
          disabled: true,
        },
        {
          title: 'External Integrations',
          label: 'External Integrations',
          description: 'Connect alerts to external monitoring tools',
          icon: '🔗',
          disabled: true,
        },
      ]}
    />
  );
}
