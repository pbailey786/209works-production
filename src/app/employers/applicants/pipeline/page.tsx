import Link from "next/link";

export default function PipelineViewPage() {
  const pipelineStages = [
    {
      id: "new",
      title: "New Applications",
      count: 24,
      color: "bg-blue-50 border-blue-200",
      headerColor: "bg-blue-100 text-blue-800",
      urgent: true,
      candidates: [
        { name: "Sarah Johnson", position: "Frontend Developer", score: 92, applied: "2 hours ago", tags: ["React", "TypeScript"] },
        { name: "Mike Chen", position: "Backend Engineer", score: 88, applied: "4 hours ago", tags: ["Node.js", "Python"] },
        { name: "Lisa Rodriguez", position: "UX Designer", score: 85, applied: "6 hours ago", tags: ["Figma", "User Research"] },
        { name: "David Kim", position: "Full Stack Developer", score: 90, applied: "1 day ago", tags: ["JavaScript", "React"] }
      ]
    },
    {
      id: "reviewing",
      title: "In Review",
      count: 18,
      color: "bg-yellow-50 border-yellow-200",
      headerColor: "bg-yellow-100 text-yellow-800",
      urgent: false,
      candidates: [
        { name: "Jennifer Adams", position: "Data Analyst", score: 87, applied: "3 days ago", tags: ["SQL", "Python"] },
        { name: "Robert Taylor", position: "DevOps Engineer", score: 91, applied: "4 days ago", tags: ["AWS", "Docker"] },
        { name: "Amanda White", position: "Marketing Manager", score: 83, applied: "5 days ago", tags: ["Digital Marketing", "SEO"] }
      ]
    },
    {
      id: "interviewed",
      title: "Interviewed",
      count: 12,
      color: "bg-purple-50 border-purple-200",
      headerColor: "bg-purple-100 text-purple-800",
      urgent: false,
      candidates: [
        { name: "James Wilson", position: "Senior Developer", score: 94, applied: "1 week ago", tags: ["Team Lead", "Architecture"] },
        { name: "Emily Davis", position: "Product Manager", score: 89, applied: "1 week ago", tags: ["Agile", "Strategy"] }
      ]
    },
    {
      id: "offer",
      title: "Offer Extended",
      count: 6,
      color: "bg-indigo-50 border-indigo-200",
      headerColor: "bg-indigo-100 text-indigo-800",
      urgent: true,
      candidates: [
        { name: "Alex Martinez", position: "Lead Designer", score: 96, applied: "2 weeks ago", tags: ["Leadership", "Design Systems"] }
      ]
    },
    {
      id: "hired",
      title: "Hired",
      count: 8,
      color: "bg-green-50 border-green-200",
      headerColor: "bg-green-100 text-green-800",
      urgent: false,
      candidates: [
        { name: "Christina Lee", position: "Software Engineer", score: 93, applied: "3 weeks ago", tags: ["Full Stack", "React"] },
        { name: "Thomas Brown", position: "Data Scientist", score: 91, applied: "1 month ago", tags: ["ML", "Python"] }
      ]
    }
  ];

  const bulkActions = [
    { label: "Move Selected", icon: "↔️", description: "Move multiple candidates to a different stage" },
    { label: "Send Messages", icon: "✉️", description: "Send bulk messages to selected candidates" },
    { label: "Add Tags", icon: "🏷️", description: "Add tags to multiple candidates at once" },
    { label: "Export Selected", icon: "📊", description: "Export selected candidate data" },
    { label: "Schedule Interviews", icon: "📅", description: "Schedule interviews for multiple candidates" }
  ];

  return (
    <div className="max-w-full mx-auto h-screen flex flex-col">
      {/* Pipeline Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/employers/applicants"
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to Applicants
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <span>📋</span>
                <span>Recruitment Pipeline</span>
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  Kanban View
                </span>
              </h1>
              <p className="text-gray-600">Drag and drop candidates between stages to update their status</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option>All Jobs</option>
              <option>Frontend Developer</option>
              <option>Backend Engineer</option>
              <option>UX Designer</option>
            </select>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
              📊 Pipeline Analytics
            </button>
          </div>
        </div>

        {/* Pipeline Stats */}
        <div className="flex items-center space-x-6 mt-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Total Candidates:</span> {pipelineStages.reduce((acc, stage) => acc + stage.count, 0)}
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Active Jobs:</span> 12
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Avg. Time to Hire:</span> 18 days
          </div>
          <div className="text-sm text-red-600">
            <span className="font-medium">⚠️ Urgent Actions:</span> 30 candidates need attention
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Bulk Actions:</span>
            {bulkActions.map((action, index) => (
              <button
                key={index}
                className="flex items-center space-x-1 px-3 py-1 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Pipeline</button>
            <Link href="/employers/applicants" className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-50">
              Table
            </Link>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto bg-gray-100">
        <div className="flex h-full min-w-max">
          {pipelineStages.map((stage, stageIndex) => (
            <div key={stage.id} className="w-80 flex-shrink-0 bg-white mx-2 my-4 rounded-lg shadow-sm border">
              {/* Stage Header */}
              <div className={`p-4 rounded-t-lg border-b-2 ${stage.color}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{stage.title}</h3>
                  {stage.urgent && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      Urgent
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${stage.headerColor}`}>
                    {stage.count} candidates
                  </span>
                  <button className="text-gray-400 hover:text-gray-600">
                    ⚙️
                  </button>
                </div>
              </div>

              {/* Candidates List */}
              <div className="p-2 space-y-2 h-full overflow-y-auto">
                {stage.candidates.map((candidate, candidateIndex) => (
                  <div
                    key={candidateIndex}
                    className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-move"
                  >
                    {/* Candidate Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{candidate.name}</h4>
                        <p className="text-xs text-gray-600">{candidate.position}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button className="text-gray-400 hover:text-yellow-500">⭐</button>
                        <button className="text-gray-400 hover:text-gray-600">•••</button>
                      </div>
                    </div>

                    {/* AI Score */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">AI Score:</span>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          candidate.score >= 90 ? 'bg-green-100 text-green-800' :
                          candidate.score >= 80 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {candidate.score}/100
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{candidate.applied}</span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {candidate.tags.map((tag, tagIndex) => (
                        <span 
                          key={tagIndex}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex space-x-2">
                        <button className="text-xs text-blue-600 hover:text-blue-800">👁️ View</button>
                        <button className="text-xs text-blue-600 hover:text-blue-800">📝 Notes</button>
                        <button className="text-xs text-blue-600 hover:text-blue-800">✉️ Message</button>
                      </div>
                      <button className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200">
                        Move →
                      </button>
                    </div>
                  </div>
                ))}

                {/* Show more indicator */}
                {stage.count > stage.candidates.length && (
                  <div className="text-center py-2">
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      + {stage.count - stage.candidates.length} more candidates
                    </button>
                  </div>
                )}

                {/* Drop Zone */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                  <span className="text-sm">Drop candidates here</span>
                </div>
              </div>
            </div>
          ))}

          {/* Add Stage Column */}
          <div className="w-80 flex-shrink-0 mx-2 my-4">
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg h-32 flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
              <div className="text-center text-gray-500">
                <div className="text-2xl mb-1">+</div>
                <div className="text-sm">Add Custom Stage</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>💡 Tip: Drag candidates between columns to update their status</span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="text-sm text-blue-600 hover:text-blue-800">📊 Export Pipeline Data</button>
            <button className="text-sm text-blue-600 hover:text-blue-800">⚙️ Customize Stages</button>
          </div>
        </div>
      </div>

      {/* Development Notes */}
      <div className="mx-6 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">🚧 Pipeline Development Notes</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Drag & Drop:</strong> Implement with React DnD or similar library for smooth interactions</p>
          <p>• <strong>Real-time Updates:</strong> WebSocket integration for live status changes across team members</p>
          <p>• <strong>Custom Stages:</strong> Allow employers to create custom pipeline stages beyond the defaults</p>
          <p>• <strong>Pipeline Analytics:</strong> Track conversion rates, bottlenecks, and time-in-stage metrics</p>
          <p>• <strong>Bulk Operations:</strong> Multi-select with checkbox system for batch candidate management</p>
          <p>• <strong>Filtering:</strong> Advanced filters by job, date range, score, tags, and custom criteria</p>
        </div>
      </div>
    </div>
  );
} 