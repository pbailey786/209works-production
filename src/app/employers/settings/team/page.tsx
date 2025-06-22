import PlaceholderPage from '@/components/PlaceholderPage';

export default function TeamManagementPage() {
  return (
    <PlaceholderPage
      title="Team & Permission Management"
      description="Manage team members, assign roles, control access permissions, and collaborate effectively across your recruitment organization with role-based security controls."
      icon="👥"
      sections={[
        {
          title: 'Current Team Members',
          description: 'Overview of all active team members and their roles',
          wireframeType: 'table',
          items: [
            'Name & Email',
            'Role & Permissions',
            'Last Active',
            'Status',
            'Actions',
          ],
        },
        {
          title: 'Role Definitions',
          description: 'Available roles and their permission levels',
          wireframeType: 'cards',
          items: [
            'Owner - Full Access',
            'Admin - Manage Users & Settings',
            'Recruiter - Job & Candidate Management',
            'Hiring Manager - Limited Access',
            'Viewer - Read-Only Access',
            'Custom Role - Define Permissions',
          ],
        },
        {
          title: 'Invitation Management',
          description: 'Send and manage team member invitations',
          wireframeType: 'form',
          items: [
            'Email Address',
            'First Name',
            'Last Name',
            'Role Assignment',
            'Department/Team',
            'Custom Message',
            'Access Level',
            'Expiration Date',
          ],
        },
        {
          title: 'Permission Controls',
          description: 'Fine-grained access control settings',
          wireframeType: 'list',
          items: [
            'View All Jobs & Applicants',
            'Create & Edit Job Posts',
            'Delete Jobs & Applications',
            'Access Financial Information',
            'Manage Team Members',
            'Export Candidate Data',
            'Access Analytics & Reports',
            'Modify Company Settings',
            'API Access & Integrations',
          ],
        },
      ]}
      quickActions={[
        {
          title: 'Invite Team Member',
          label: 'Invite Team Member',
          description: 'Send invitation to new team member',
          icon: '👥',
        },
        {
          title: 'Bulk Import',
          label: 'Bulk Import',
          description: 'Upload multiple team members via CSV',
          icon: '📤',
          disabled: true,
        },
        {
          title: 'Audit Log',
          label: 'Audit Log',
          description: 'View team access and activity history',
          icon: '📋',
        },
        {
          title: 'SSO Configuration',
          label: 'SSO Configuration',
          description: 'Set up single sign-on for your organization',
          icon: '🔐',
          disabled: true,
        },
        {
          title: 'Department Setup',
          label: 'Department Setup',
          description: 'Create departments and assign team members',
          icon: '🏢',
          disabled: true,
        },
        {
          title: 'Permission Templates',
          label: 'Permission Templates',
          description: 'Create reusable permission sets for common roles',
          icon: '📝',
          disabled: true,
        },
      ]}
    />
  );
}
