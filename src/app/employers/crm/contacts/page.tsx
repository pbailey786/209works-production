import PlaceholderPage from '../../../../components/PlaceholderPage';

export default function ContactDatabasePage() {
  const contactSections = [
    {
      title: 'Contact Management Dashboard',
      description:
        'Overview of all team members, recruiters, and hiring contacts',
      wireframeType: 'chart' as const,
    },
    {
      title: 'Advanced Contact Search & Filters',
      description:
        'Find team members and contacts quickly using multiple criteria',
      wireframeType: 'form' as const,
      items: [
        '🔍 Search by Name/Email',
        '🏢 Filter by Company',
        '🎯 Filter by Role',
        '📍 Filter by Region/Location',
        '🏷️ Filter by Tags',
        '📅 Last Activity Date',
        '📊 Permission Level',
        '✅ Active/Inactive Status',
      ],
    },
    {
      title: 'Contact Directory Table',
      description:
        'Comprehensive contact list with role management and communication tracking',
      wireframeType: 'table' as const,
      items: [
        '👤 Contact',
        '📧 Email',
        '🏢 Company',
        '🎯 Role',
        '📍 Region',
        '🔑 Permissions',
        '📅 Last Active',
        '🏷️ Tags',
        '📊 Status',
        '⚡ Actions',
      ],
    },
    {
      title: 'Team Organization Cards',
      description:
        'Visual representation of team structure and contact hierarchy',
      wireframeType: 'cards' as const,
    },
    {
      title: 'Contact Management Tools',
      description: 'Bulk operations and advanced contact management features',
      wireframeType: 'buttons' as const,
      items: [
        '👥 Invite Team Member',
        '📧 Send Bulk Messages',
        '🔑 Update Permissions',
        '🏷️ Bulk Tag Management',
        '📊 Export Contact List',
        '🗑️ Deactivate Contacts',
      ],
    },
    {
      title: 'Communication & Activity Log',
      description:
        'Track all interactions and activities with team members and contacts',
      wireframeType: 'list' as const,
      items: [
        'Email communication history',
        'Job collaboration activity',
        'Candidate review interactions',
        'Permission changes log',
        'Login and activity tracking',
        'Meeting and call notes',
      ],
    },
  ];

  const quickActions = [
    {
      label: '👥 Invite New Team Member',
      description:
        'Send invitation to join your hiring team with appropriate permissions',
      disabled: true,
    },
    {
      label: '🎯 Manage Roles & Permissions',
      description: 'Update access levels and permissions for team members',
      href: '/employers/settings/team',
    },
    {
      label: '📧 Contact All Recruiters',
      description: 'Send bulk messages to all recruiters in your network',
      disabled: true,
    },
    {
      label: '📊 Team Activity Report',
      description: 'Generate reports on team member activity and performance',
      href: '/employers/crm/export',
    },
    {
      label: '🏷️ Organize Contact Tags',
      description: 'Create and manage tags for better contact organization',
      href: '/employers/crm/notes',
    },
    {
      label: '🔄 Sync External Contacts',
      description: 'Import contacts from email systems and other CRM platforms',
      disabled: true,
    },
    {
      label: '📱 Mobile Contact Access',
      description:
        'Generate mobile-friendly contact directory for on-the-go access',
      disabled: true,
    },
    {
      label: '🎪 Contact Integration Hub',
      description:
        'Connect with LinkedIn, email systems, and other contact sources',
      disabled: true,
    },
  ];

  // Contact stats for overview
  const contactStats = [
    {
      label: 'Total Contacts',
      value: '84',
      change: '+7 this month',
      color: 'text-blue-600',
      icon: '👥',
    },
    {
      label: 'Team Members',
      value: '12',
      change: '+2 this month',
      color: 'text-green-600',
      icon: '🎯',
    },
    {
      label: 'External Recruiters',
      value: '28',
      change: '+3 this month',
      color: 'text-purple-600',
      icon: '🤝',
    },
    {
      label: 'Hiring Managers',
      value: '8',
      change: 'No change',
      color: 'text-yellow-600',
      icon: '👔',
    },
  ];

  const roleCategories = [
    {
      name: 'Admin',
      count: 3,
      color: 'bg-red-100 text-red-800',
      description: 'Full access to all features and settings',
      permissions: [
        'All permissions',
        'User management',
        'Billing access',
        'Data export',
      ],
    },
    {
      name: 'Hiring Manager',
      count: 8,
      color: 'bg-blue-100 text-blue-800',
      description: 'Manage job posts and review candidates',
      permissions: [
        'Job management',
        'Candidate review',
        'Interview scheduling',
        'Team collaboration',
      ],
    },
    {
      name: 'Recruiter',
      count: 15,
      color: 'bg-green-100 text-green-800',
      description: 'Source and screen candidates',
      permissions: [
        'Candidate search',
        'Document access',
        'Communication',
        'Pipeline management',
      ],
    },
    {
      name: 'Viewer',
      count: 6,
      color: 'bg-gray-100 text-gray-800',
      description: 'Read-only access to hiring data',
      permissions: [
        'View candidates',
        'View reports',
        'View job posts',
        'Basic communication',
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      {/* Contact Database Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center space-x-3">
          <span className="text-2xl">📞</span>
          <h1 className="text-3xl font-bold text-gray-900">Contact Database</h1>
          <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
            CRM
          </span>
        </div>
        <p className="max-w-3xl text-lg text-gray-600">
          Manage your hiring team, recruiters, and HR contacts. Organize roles,
          permissions, and communication history for efficient collaboration and
          recruitment success.
        </p>
      </div>

      {/* Contact Statistics Dashboard */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        {contactStats.map((stat, index) => (
          <div key={index} className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{stat.icon}</span>
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
              </div>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="mt-1 text-sm text-gray-500">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Role Categories Overview */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Team Roles & Permissions
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {roleCategories.map((role, index) => (
            <div key={index} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">{role.name}</h4>
                <span
                  className={`rounded-full px-2 py-1 text-sm font-medium ${role.color}`}
                >
                  {role.count} members
                </span>
              </div>
              <p className="mb-3 text-sm text-gray-600">{role.description}</p>
              <div className="space-y-1">
                {role.permissions.map((permission, permIndex) => (
                  <div key={permIndex} className="flex items-center space-x-2">
                    <span className="text-xs text-green-600">✓</span>
                    <span className="text-xs text-gray-600">{permission}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Contact Management Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <div
              key={index}
              className={`rounded-lg border p-4 ${
                action.disabled
                  ? 'cursor-not-allowed border-gray-200 bg-gray-50'
                  : 'cursor-pointer border-gray-300 bg-white hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <h3
                className={`font-medium ${action.disabled ? 'text-gray-400' : 'text-gray-900'}`}
              >
                {action.label}
              </h3>
              <p
                className={`mt-1 text-sm ${action.disabled ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {action.description}
              </p>
              {action.disabled && (
                <span className="mt-2 inline-block text-xs text-gray-400">
                  Available in future update
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Database Features */}
      <div className="space-y-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Contact Database Interface
        </h2>
        {contactSections.map((section, index) => (
          <div key={index}>
            <div className="mb-4">
              <h3 className="text-md font-medium text-gray-900">
                {section.title}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {section.description}
              </p>
            </div>

            {/* Custom wireframe rendering for Contact Database */}
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-4">
              <div className="mb-3 text-sm font-medium text-gray-600">
                {section.title} (
                {section.wireframeType === 'table'
                  ? 'Table View'
                  : section.wireframeType === 'cards'
                    ? 'Team Cards'
                    : section.wireframeType === 'form'
                      ? 'Search Form'
                      : section.wireframeType === 'chart'
                        ? 'Analytics Dashboard'
                        : section.wireframeType === 'list'
                          ? 'Activity Log'
                          : 'Action Panel'}
                )
              </div>

              {section.wireframeType === 'chart' && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded bg-gray-50 p-4">
                    <div className="mb-2 text-xs text-gray-500">
                      Contact Distribution
                    </div>
                    <div className="flex h-24 items-center justify-center rounded bg-gray-200">
                      <span className="text-gray-400">
                        📊 Role Distribution
                      </span>
                    </div>
                  </div>
                  <div className="rounded bg-gray-50 p-4">
                    <div className="mb-2 text-xs text-gray-500">
                      Activity Overview
                    </div>
                    <div className="flex h-24 items-center justify-center rounded bg-gray-200">
                      <span className="text-gray-400">📈 Activity Chart</span>
                    </div>
                  </div>
                  <div className="rounded bg-gray-50 p-4">
                    <div className="mb-2 text-xs text-gray-500">
                      Regional Distribution
                    </div>
                    <div className="flex h-24 items-center justify-center rounded bg-gray-200">
                      <span className="text-gray-400">🗺️ Location Map</span>
                    </div>
                  </div>
                </div>
              )}

              {section.wireframeType === 'table' && (
                <div className="space-y-2">
                  <div className="flex space-x-2 rounded bg-gray-50 p-2 text-xs font-medium text-gray-500">
                    {section.items?.map((col, i) => (
                      <div key={i} className="flex-1">
                        {col}
                      </div>
                    ))}
                  </div>
                  {[
                    {
                      name: 'Sarah Johnson',
                      email: 'sarah@company.com',
                      company: '209Jobs',
                      role: 'Admin',
                      region: 'California',
                      permissions: 'Full Access',
                      active: '2 hours ago',
                      status: '🟢 Active',
                    },
                    {
                      name: 'Mike Chen',
                      email: 'mike@recruiter.com',
                      company: 'TechRecruit',
                      role: 'Recruiter',
                      region: 'Bay Area',
                      permissions: 'Limited',
                      active: '1 day ago',
                      status: '🟢 Active',
                    },
                    {
                      name: 'Lisa Rodriguez',
                      email: 'lisa@hr.com',
                      company: 'HR Solutions',
                      role: 'Hiring Manager',
                      region: 'Central Valley',
                      permissions: 'Standard',
                      active: '3 days ago',
                      status: '🟡 Away',
                    },
                    {
                      name: 'David Kim',
                      email: 'david@company.com',
                      company: '209Jobs',
                      role: 'Viewer',
                      region: 'Remote',
                      permissions: 'Read Only',
                      active: '1 week ago',
                      status: '🔴 Inactive',
                    },
                  ].map((contact, contactIndex) => (
                    <div
                      key={contactIndex}
                      className="flex space-x-2 border-b border-gray-200 p-2 text-xs text-gray-400"
                    >
                      <div className="flex-1">{contact.name}</div>
                      <div className="flex-1">{contact.email}</div>
                      <div className="flex-1">{contact.company}</div>
                      <div className="flex-1">{contact.role}</div>
                      <div className="flex-1">{contact.region}</div>
                      <div className="flex-1">{contact.permissions}</div>
                      <div className="flex-1">{contact.active}</div>
                      <div className="flex-1">HR, Recruiter</div>
                      <div className="flex-1">{contact.status}</div>
                      <div className="flex-1">👁️ ✉️ ⚙️</div>
                    </div>
                  ))}
                </div>
              )}

              {section.wireframeType === 'cards' && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map(card => (
                    <div
                      key={card}
                      className="rounded border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <span className="text-sm">👤</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-700">
                              Team Member {card}
                            </div>
                            <div className="text-xs text-gray-500">
                              Hiring Manager
                            </div>
                          </div>
                        </div>
                        <div className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                          Active
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Email:</span>
                          <span className="text-gray-600">
                            user{card}@company.com
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Role:</span>
                          <span className="text-blue-600">Standard Access</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Last Active:</span>
                          <span className="text-green-600">
                            {card} hours ago
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 border-t border-gray-200 pt-2">
                        <div className="flex space-x-2">
                          <button className="text-xs text-blue-600">
                            👁️ View
                          </button>
                          <button className="text-xs text-blue-600">
                            ✉️ Message
                          </button>
                          <button className="text-xs text-blue-600">
                            ⚙️ Settings
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {section.wireframeType === 'form' && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {section.items?.map((field, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className="w-48 text-xs text-gray-500">{field}</div>
                      <div className="h-8 flex-1 rounded border border-gray-200 bg-gray-100"></div>
                    </div>
                  ))}
                </div>
              )}

              {section.wireframeType === 'list' && (
                <div className="space-y-3">
                  {section.items?.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded bg-gray-50 p-3"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                          <span className="text-xs">📧</span>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">{item}</div>
                          <div className="text-xs text-gray-400">
                            Last updated 2 hours ago
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-blue-600">
                        View Details →
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {section.wireframeType === 'buttons' && (
                <div className="flex flex-wrap gap-2">
                  {section.items?.map((button, i) => (
                    <div
                      key={i}
                      className="rounded border border-purple-200 bg-purple-100 px-3 py-2 text-sm text-purple-600"
                    >
                      {button}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Development Notes */}
      <div className="mt-12 rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-2 text-sm font-semibold text-blue-900">
          🚧 Contact Database Development Notes
        </h3>
        <div className="space-y-1 text-sm text-blue-800">
          <p>
            • <strong>Role Management:</strong> Hierarchical permission system
            with customizable roles and access levels
          </p>
          <p>
            • <strong>Contact Sync:</strong> Integration with email systems,
            LinkedIn, and other contact sources
          </p>
          <p>
            • <strong>Activity Tracking:</strong> Log all interactions,
            communications, and system activities
          </p>
          <p>
            • <strong>Team Collaboration:</strong> Real-time updates,
            notifications, and communication tools
          </p>
          <p>
            • <strong>Data Security:</strong> Encrypted contact data with audit
            trails and access controls
          </p>
          <p>
            • <strong>Mobile Access:</strong> Responsive design and mobile app
            integration for remote access
          </p>
          <p>
            • <strong>Integration Hub:</strong> Connect with external systems
            and CRM platforms
          </p>
        </div>
      </div>
    </div>
  );
}
