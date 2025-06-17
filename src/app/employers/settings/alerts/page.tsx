import PlaceholderPage from '@/components/PlaceholderPage';

export default function EmployerAlertsSettingsPage() {
  return (
    <PlaceholderPage
      title="Alerts & Notification Preferences"
      description="Configure notification settings, alert preferences, and communication channels to stay informed about applications, hiring activities, and platform updates without overwhelming your inbox."
      icon="🔔"
      sections={[
        {
          title: 'Application Notifications',
          description: 'Settings for new applications and candidate activities',
          wireframeType: 'list',
          items: [
            'New Application Received',
            'Application Status Changes',
            'Candidate Profile Updates',
            'Resume Downloads',
            'Application Withdrawals',
            'Bulk Application Actions',
            'Application Deadlines',
            'Quality Score Alerts',
          ],
        },
        {
          title: 'Job Posting Alerts',
          description: 'Notifications related to your job postings',
          wireframeType: 'list',
          items: [
            'Job Post Approved/Rejected',
            'Job Post Expiring Soon',
            'Low Application Volume',
            'High Application Volume',
            'Job Post Performance',
            'SEO Optimization Suggestions',
            'Competitor Job Analysis',
            'Market Salary Updates',
          ],
        },
        {
          title: 'Communication Preferences',
          description: 'Choose how and when you receive notifications',
          wireframeType: 'form',
          items: [
            'Email Notifications',
            'SMS Text Messages',
            'In-App Notifications',
            'Desktop Push Notifications',
            'Slack Integration',
            'Microsoft Teams Integration',
            'Frequency Settings',
            'Quiet Hours Configuration',
          ],
        },
        {
          title: 'Team Collaboration Alerts',
          description: 'Notifications for team activities and collaboration',
          wireframeType: 'list',
          items: [
            'Team Member Actions',
            'Candidate Comments Added',
            'Interview Scheduled/Modified',
            'Hiring Decision Updates',
            'Permission Changes',
            'New Team Member Joined',
            'Collaboration Requests',
            'Workflow Status Changes',
          ],
        },
        {
          title: 'System & Billing Alerts',
          description: 'Important platform and account notifications',
          wireframeType: 'list',
          items: [
            'Payment Processing',
            'Subscription Changes',
            'Usage Limit Warnings',
            'Security Notifications',
            'Platform Maintenance',
            'Feature Updates',
            'API Rate Limit Alerts',
            'Data Export Completion',
          ],
        },
      ]}
      quickActions={[
        {
          title: 'Save Preferences',
          label: 'Save Preferences',
          description: 'Update your notification settings',
          icon: '💾',
        },
        {
          title: 'Test Notifications',
          label: 'Test Notifications',
          description: 'Send test alerts to verify your settings',
          icon: '🧪',
        },
        {
          title: 'Bulk Enable/Disable',
          label: 'Bulk Enable/Disable',
          description: 'Quickly enable or disable all notifications',
          icon: '🔄',
        },
        {
          title: 'Export Settings',
          label: 'Export Settings',
          description: 'Download your current notification configuration',
          icon: '📥',
        },
        {
          title: 'Smart Suggestions',
          label: 'Smart Suggestions',
          description: 'Get AI-recommended notification settings',
          icon: '🤖',
          disabled: true,
        },
        {
          title: 'Slack Integration',
          label: 'Slack Integration',
          description: 'Connect your Slack workspace for notifications',
          icon: '💬',
          disabled: true,
        },
        {
          title: 'Custom Webhooks',
          label: 'Custom Webhooks',
          description: 'Set up custom notification endpoints',
          icon: '🔗',
          disabled: true,
        },
        {
          title: 'Notification Analytics',
          label: 'Notification Analytics',
          description: 'View insights on notification engagement',
          icon: '📊',
          disabled: true,
        },
      ]}
    />
  );
}
