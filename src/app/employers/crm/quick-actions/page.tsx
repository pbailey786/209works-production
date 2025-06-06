import PlaceholderPage from '@/components/PlaceholderPage';

export default function CRMQuickActionsPage() {
  return (
    <PlaceholderPage
      title="CRM Quick Actions"
      description="Streamline your hiring workflow with powerful quick actions. Perform batch operations, automate common tasks, and execute multi-step workflows with just a few clicks to boost your team's productivity."
      icon="⚡"
      quickActions={[
        {
          title: 'Batch Status Update',
          label: 'Batch Status Update',
          description: "Update multiple candidates' status at once",
          icon: '📝',
          disabled: true,
        },
        {
          title: 'Mass Email',
          label: 'Mass Email',
          description: 'Send emails to multiple candidates',
          icon: '📧',
          disabled: true,
        },
        {
          title: 'Quick Interview Schedule',
          label: 'Quick Interview Schedule',
          description: 'Schedule interviews for multiple candidates',
          icon: '📅',
          disabled: true,
        },
        {
          title: 'Bulk Export',
          label: 'Bulk Export',
          description: 'Export selected candidate data',
          icon: '📤',
          href: '/employers/crm/export',
        },
      ]}
      sections={[
        {
          title: 'Candidate Batch Operations',
          description: 'Perform actions on multiple candidates simultaneously',
          wireframeType: 'cards',
          items: [
            'Move to Next Stage - Advance candidates in pipeline',
            'Update Status - Change application status in bulk',
            'Assign Recruiter - Assign candidates to team members',
            'Add Tags - Apply tags to multiple candidates',
            'Schedule Interviews - Batch interview scheduling',
            'Send Messages - Mass communication with candidates',
          ],
        },
        {
          title: 'Workflow Automation',
          description: 'Automated workflows triggered by quick actions',
          wireframeType: 'list',
          items: [
            'Auto-send acknowledgment emails for new applications',
            'Automatically schedule phone screens for qualified candidates',
            'Trigger reference checks for final-stage candidates',
            'Send rejection emails to declined candidates',
            'Create tasks for hiring managers based on candidate stage',
            'Update external ATS systems when status changes',
          ],
        },
        {
          title: 'Quick Selection Tools',
          description:
            'Fast ways to select and filter candidates for batch actions',
          wireframeType: 'form',
          items: [
            'Select All in Current View',
            'Select by Job Position',
            'Select by Application Status',
            'Select by Date Range',
            'Select by Tags',
            'Select by Recruiter Assignment',
            'Custom Filter Selection',
            'Saved Selection Groups',
          ],
        },
        {
          title: 'Communication Quick Actions',
          description: 'Rapid communication tools for candidate engagement',
          wireframeType: 'buttons',
          items: [
            'Interview Invitation',
            'Status Update Email',
            'Rejection Notification',
            'Offer Letter',
            'Follow-up Reminder',
            'Reference Request',
          ],
        },
        {
          title: 'Pipeline Management',
          description: 'Quick actions for managing the candidate pipeline',
          wireframeType: 'table',
          items: [
            'Action Type',
            'Candidates Affected',
            'Stage Movement',
            'Notifications Sent',
            'Time Saved',
            'Execute',
          ],
        },
        {
          title: 'Reporting Quick Actions',
          description: 'Generate reports and analytics with one-click actions',
          wireframeType: 'cards',
          items: [
            "Weekly Pipeline Report - Current week's activity",
            'Hiring Funnel Analysis - Conversion rates by stage',
            'Time-to-Hire Report - Average hiring timeline',
            'Recruiter Performance - Individual team metrics',
            'Source Effectiveness - Best recruiting channels',
            'Custom Report Builder - Build reports on demand',
          ],
        },
        {
          title: 'Data Management Actions',
          description:
            'Quick data operations for maintaining clean candidate records',
          wireframeType: 'list',
          items: [
            'Duplicate Detection and Merge - Find and merge duplicate profiles',
            'Data Cleanup - Remove incomplete or outdated records',
            'Resume Parsing Update - Re-parse resumes with latest AI',
            'Contact Information Verification - Validate email and phone',
            'Profile Completion - Identify and fill missing information',
            'Archive Inactive Records - Clean up old candidate data',
          ],
        },
        {
          title: 'Integration Quick Actions',
          description: 'Fast integrations with external tools and platforms',
          wireframeType: 'buttons',
          items: [
            'Sync with LinkedIn',
            'Update ATS System',
            'Export to HRIS',
            'Calendar Integration',
            'Background Check',
            'Video Interview Setup',
          ],
        },
        {
          title: 'Custom Action Builder',
          description: 'Create and manage custom quick actions for your team',
          wireframeType: 'form',
          items: [
            'Action Name',
            'Trigger Conditions',
            'Steps to Execute',
            'Notification Settings',
            'Team Permissions',
            'Testing & Validation',
          ],
        },
        {
          title: 'Action History & Analytics',
          description: 'Track quick action usage and effectiveness',
          wireframeType: 'chart',
          items: [
            'Most frequently used quick actions',
            'Time saved through automation',
            'Actions performed by team member',
            'Success rates of automated workflows',
            'Error rates and troubleshooting data',
          ],
        },
        {
          title: 'Smart Suggestions',
          description:
            'AI-powered recommendations for quick actions based on context',
          wireframeType: 'cards',
          items: [
            'Suggested Next Steps - AI recommends actions for candidates',
            'Optimal Interview Times - Best scheduling suggestions',
            'Similar Candidate Actions - Actions taken on similar profiles',
            'Workflow Optimization - Improve existing action sequences',
            'Predictive Actions - Actions likely needed soon',
            'Team Collaboration - Suggested team member assignments',
          ],
        },
        {
          title: 'Mobile Quick Actions',
          description: 'Execute quick actions from mobile devices on the go',
          wireframeType: 'list',
          items: [
            'Mobile-optimized action interface',
            'Voice-activated quick actions',
            'Gesture-based candidate management',
            'Offline action queuing',
            'Push notification triggers',
            'Location-based actions (for on-site interviews)',
          ],
        },
      ]}
    />
  );
}
