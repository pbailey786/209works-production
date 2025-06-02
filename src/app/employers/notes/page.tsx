import PlaceholderPage from "@/components/PlaceholderPage";

export default function NotesPage() {
  return (
    <PlaceholderPage
      title="Notes & Tags Management"
      description="Organize candidate information with our powerful notes and tagging system. Add detailed notes, create custom tags, collaborate with your team, and maintain comprehensive candidate profiles throughout the hiring process."
      icon="📝"
      quickActions={[
        {
          title: "Add New Note",
          label: "Add New Note",
          description: "Create a note for a specific candidate",
          icon: "➕",
          disabled: true
        },
        {
          title: "Manage Tags",
          label: "Manage Tags",
          description: "Create and organize custom tags",
          icon: "🏷️",
          disabled: true
        },
        {
          title: "Search Notes",
          label: "Search Notes",
          description: "Find notes across all candidates",
          icon: "🔍",
          disabled: true
        },
        {
          title: "Bulk Actions",
          label: "Bulk Actions",
          description: "Apply tags or actions to multiple candidates",
          icon: "📋",
          disabled: true
        }
      ]}
      sections={[
        {
          title: "Recent Notes",
          description: "Latest notes added by your team across all candidates",
          wireframeType: "table",
          items: [
            "Candidate Name",
            "Note Preview",
            "Author",
            "Date Created",
            "Tags",
            "Actions"
          ]
        },
        {
          title: "Add New Note",
          description: "Form for creating detailed notes about candidates",
          wireframeType: "form",
          items: [
            "Candidate Selection",
            "Note Category (Interview/Skills/Culture/Other)",
            "Note Title",
            "Detailed Note Content",
            "Privacy Level (Team/Private/Manager Only)",
            "Tags Assignment",
            "Follow-up Required",
            "Attachments"
          ]
        },
        {
          title: "Tag Management",
          description: "Create and organize custom tags for candidate categorization",
          wireframeType: "cards",
          items: [
            "Skills Tags (JavaScript, Python, Design, etc.)",
            "Status Tags (Hot Lead, On Hold, Follow Up)",
            "Quality Tags (Excellent, Good, Needs Work)",
            "Source Tags (LinkedIn, Referral, Job Board)",
            "Custom Tags (Remote Preferred, Quick Start)",
            "Department Tags (Engineering, Marketing, Sales)"
          ]
        },
        {
          title: "Search & Filter",
          description: "Advanced search and filtering options for notes and candidates",
          wireframeType: "form",
          items: [
            "Search by Note Content",
            "Filter by Tags",
            "Filter by Author",
            "Date Range Selection",
            "Note Category Filter",
            "Candidate Status Filter"
          ]
        },
        {
          title: "Note Categories",
          description: "Predefined categories to organize different types of notes",
          wireframeType: "list",
          items: [
            "Interview Notes - Feedback from interview sessions",
            "Skills Assessment - Technical and soft skills evaluation",
            "Cultural Fit - Alignment with company values and team",
            "Reference Checks - Feedback from previous employers",
            "Background Verification - Education and employment history",
            "Compensation Discussion - Salary expectations and negotiations",
            "Follow-up Actions - Required next steps and deadlines",
            "General Notes - Miscellaneous observations and comments"
          ]
        },
        {
          title: "Team Collaboration",
          description: "Share notes and collaborate with your hiring team",
          wireframeType: "cards",
          items: [
            "Shared Notes - Visible to entire hiring team",
            "Private Notes - Personal observations and thoughts",
            "Manager Notes - Restricted to management level",
            "Department Notes - Visible to specific departments",
            "Note Comments - Team discussions on specific notes",
            "Note Mentions - Tag team members in notes"
          ]
        },
        {
          title: "Note Templates",
          description: "Pre-formatted templates for common note types",
          wireframeType: "buttons",
          items: [
            "Interview Feedback Template",
            "Phone Screen Template",
            "Reference Check Template",
            "Skills Assessment Template",
            "Cultural Fit Template",
            "Final Decision Template"
          ]
        },
        {
          title: "Bulk Tag Operations",
          description: "Apply tags and actions to multiple candidates efficiently",
          wireframeType: "form",
          items: [
            "Select Multiple Candidates",
            "Choose Tags to Apply/Remove",
            "Bulk Note Addition",
            "Status Updates",
            "Export Selected Data",
            "Archive/Delete Options"
          ]
        },
        {
          title: "Notes Analytics",
          description: "Insights into note-taking patterns and team activity",
          wireframeType: "chart",
          items: [
            "Notes created per week by team member",
            "Most frequently used tags",
            "Note categories distribution",
            "Average notes per candidate",
            "Team collaboration metrics"
          ]
        },
        {
          title: "Note History & Audit",
          description: "Track changes and maintain audit trail for notes",
          wireframeType: "table",
          items: [
            "Edit History",
            "Author Changes",
            "Tag Modifications",
            "Deletion Records",
            "Access Logs",
            "Export History"
          ]
        },
        {
          title: "Advanced Features",
          description: "Additional features for power users and enterprise needs",
          wireframeType: "list",
          items: [
            "Note encryption for sensitive information",
            "Automated note creation from interview recordings",
            "AI-powered note summarization and insights",
            "Custom note fields and structured data",
            "Integration with external CRM systems",
            "Compliance and data retention policies"
          ]
        },
        {
          title: "Mobile Notes",
          description: "Access and manage notes from mobile devices",
          wireframeType: "cards",
          items: [
            "Mobile Note Creation - Quick note entry on mobile",
            "Voice Notes - Audio recordings with transcription",
            "Photo Attachments - Add images to notes",
            "Offline Access - View notes without internet",
            "Push Notifications - New note alerts",
            "Mobile Search - Find notes quickly on mobile"
          ]
        }
      ]}
    />
  );
} 