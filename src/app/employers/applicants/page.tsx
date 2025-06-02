import PlaceholderPage from "../../../components/PlaceholderPage";
import Link from "next/link";

export default function ApplicantsPage() {
  const applicantSections = [
    {
      title: "ATS Control Panel",
      description: "Advanced filtering, search, and bulk actions for comprehensive applicant management",
      wireframeType: "form" as const,
      items: [
        "Global Search (Name/Email/Skills)", 
        "Filter by Job Position", 
        "Filter by Status (New/In Review/Interviewed/Hired/Rejected)", 
        "Filter by Rating/Score",
        "Filter by Tags", 
        "Date Range Filter",
        "Sort Options (Date, Rating, Status)"
      ]
    },
    {
      title: "Enhanced Applicant Table",
      description: "Complete candidate overview with status management, notes, and quick actions",
      wireframeType: "table" as const,
      items: [
        "📋 Status", 
        "⭐ Bookmark", 
        "👤 Candidate", 
        "💼 Applied For", 
        "📅 Date Applied", 
        "🎯 AI Score", 
        "🏷️ Tags", 
        "📝 Notes Preview",
        "⚡ Quick Actions"
      ]
    },
    {
      title: "Status Management Board",
      description: "Quick overview of candidates by status with drag-and-drop capability",
      wireframeType: "cards" as const
    },
    {
      title: "Bulk Actions Toolbar",
      description: "Manage multiple candidates efficiently with batch operations",
      wireframeType: "buttons" as const,
      items: [
        "✉️ Send Bulk Messages", 
        "📋 Update Status", 
        "🏷️ Add Tags", 
        "📊 Export Selected", 
        "📅 Schedule Interviews",
        "🗑️ Archive Candidates"
      ]
    },
    {
      title: "Notes & Communication Log",
      description: "Track all interactions and internal notes for each candidate",
      wireframeType: "list" as const,
      items: [
        "Internal notes with timestamps",
        "Email communication history", 
        "Interview feedback and scores",
        "Team member comments",
        "Status change history"
      ]
    }
  ];

  const quickActions = [
    {
      label: "📋 Switch to Pipeline View",
      description: "View candidates in Kanban-style pipeline for visual status management",
      href: "/employers/applicants/pipeline"
    },
    {
      label: "⭐ View Bookmarked Candidates",
      description: "See all starred candidates across all job positions",
      href: "/employers/applicants?filter=bookmarked"
    },
    {
      label: "🔔 Review New Applications",
      description: "Check recently submitted applications that need initial review",
      href: "/employers/applicants?status=new"
    },
    {
      label: "🎯 Export Candidate Data",
      description: "Download candidate information and application data",
      href: "/employers/applicants?export=true"
    },
    {
      label: "📅 Schedule Interview Rounds",
      description: "Set up interviews with qualified candidates using built-in scheduling",
      href: "/employers/crm/interviews"
    },
    {
      label: "✉️ Send Template Messages",
      description: "Use pre-built email templates for common candidate communications",
      href: "/employers/applicants/messages"
    },
    {
      label: "📊 Export Candidate Data",
      description: "Download applicant information for external review or reporting",
      href: "/employers/crm/export"
    },
    {
      label: "🏷️ Manage Tags & Categories",
      description: "Create and organize candidate tags for better filtering and search",
      href: "/employers/crm/notes"
    }
  ];

  // Sample candidate statuses for the status overview
  const statusOverview = [
    { status: "New Applications", count: 24, color: "bg-blue-100 text-blue-800", urgent: true },
    { status: "In Review", count: 18, color: "bg-yellow-100 text-yellow-800", urgent: false },
    { status: "Interviewed", count: 12, color: "bg-purple-100 text-purple-800", urgent: false },
    { status: "Hired", count: 8, color: "bg-green-100 text-green-800", urgent: false },
    { status: "Rejected", count: 45, color: "bg-gray-100 text-gray-800", urgent: false }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* ATS Header with Status Overview */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl">👥</span>
              <h1 className="text-3xl font-bold text-gray-900">Applicant Tracking System</h1>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                ATS Lite
              </span>
            </div>
            <p className="text-lg text-gray-600 max-w-3xl">
              Complete candidate management with status tracking, notes, AI scoring, and communication tools. 
              Streamline your hiring process from application to hire.
            </p>
          </div>
          <div className="flex space-x-3">
            <Link 
              href="/employers/applicants/pipeline"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              📋 Pipeline View
            </Link>
            <Link 
              href="/employers/crm/export"
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              📊 Export Data
            </Link>
          </div>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {statusOverview.map((item, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{item.status}</p>
                  <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                </div>
                {item.urgent && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    Action Needed
                  </span>
                )}
              </div>
              <div className="mt-2">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.color}`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">ATS Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="p-4 border border-gray-300 bg-white rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <h3 className="font-medium text-gray-900 mb-1">
                {action.label}
              </h3>
              <p className="text-sm text-gray-600">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* ATS Features Wireframes */}
      <div className="space-y-8">
        <h2 className="text-lg font-semibold text-gray-900">ATS Interface Preview</h2>
        {applicantSections.map((section, index) => (
          <div key={index}>
            <div className="mb-4">
              <h3 className="text-md font-medium text-gray-900">{section.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{section.description}</p>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 mb-3">{section.title} ({section.wireframeType === 'table' ? 'Table View' : section.wireframeType === 'cards' ? 'Card Grid' : section.wireframeType === 'form' ? 'Form' : section.wireframeType === 'list' ? 'List View' : 'Button Panel'})</div>
              
              {section.wireframeType === 'table' && (
                <div className="space-y-2">
                  <div className="flex space-x-2 text-xs font-medium text-gray-500 bg-gray-50 p-2 rounded">
                    {section.items?.map((col, i) => (
                      <div key={i} className="flex-1">{col}</div>
                    ))}
                  </div>
                  {[1, 2, 3, 4].map((row) => (
                    <div key={row} className="flex space-x-2 text-xs text-gray-400 p-2 border-b border-gray-200">
                      <div className="flex-1">🟢 New</div>
                      <div className="flex-1">⭐</div>
                      <div className="flex-1">John Doe</div>
                      <div className="flex-1">Software Engineer</div>
                      <div className="flex-1">2 days ago</div>
                      <div className="flex-1">85/100</div>
                      <div className="flex-1">JavaScript, React</div>
                      <div className="flex-1">Great experience...</div>
                      <div className="flex-1">👁️ 📝 ✉️</div>
                    </div>
                  ))}
                </div>
              )}

              {section.wireframeType === 'form' && (
                <div className="space-y-4">
                  {section.items?.map((field, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className="text-xs text-gray-500 w-48">{field}</div>
                      <div className="flex-1 h-8 bg-gray-100 border border-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              )}

              {section.wireframeType === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {statusOverview.map((status, i) => (
                    <div key={i} className="bg-gray-50 border border-gray-200 rounded p-3">
                      <div className="text-xs font-medium text-gray-600 mb-2">{status.status}</div>
                      <div className="space-y-1">
                        {[1, 2, 3].map((candidate) => (
                          <div key={candidate} className="text-xs bg-white p-2 rounded border text-gray-500">
                            Candidate {candidate}
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">+{status.count - 3} more</div>
                    </div>
                  ))}
                </div>
              )}

              {section.wireframeType === 'buttons' && (
                <div className="flex flex-wrap gap-2">
                  {section.items?.map((button, i) => (
                    <div
                      key={i}
                      className="px-3 py-1 rounded text-xs bg-blue-100 text-blue-600 border border-blue-200"
                    >
                      {button}
                    </div>
                  ))}
                </div>
              )}

              {section.wireframeType === 'list' && (
                <div className="space-y-2">
                  {section.items?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="text-xs text-gray-600">{item}</div>
                      <div className="text-xs text-gray-400">→</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Development Notes */}
      <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">🚧 ATS Development Notes</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Database Schema:</strong> Candidate status tracking, notes, tags, and communication logs</p>
          <p>• <strong>Real-time Updates:</strong> Status changes trigger notifications and update dashboards</p>
          <p>• <strong>AI Integration:</strong> Resume scoring and candidate ranking algorithms</p>
          <p>• <strong>Email Integration:</strong> Template system for candidate communications</p>
          <p>• <strong>Permissions:</strong> Role-based access for team members and recruiters</p>
          <p>• <strong>Export Features:</strong> CSV/PDF export for reporting and external systems</p>
        </div>
      </div>
    </div>
  );
} 