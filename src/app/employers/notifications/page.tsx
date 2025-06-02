import PlaceholderPage from "@/components/PlaceholderPage";

export default function EmployerNotificationsPage() {
  return (
    <PlaceholderPage
      title="Notification Center"
      description="View, manage, and respond to all your hiring notifications, alerts, and updates in one centralized location. Stay on top of applications, candidate activities, and important platform updates."
      icon="🔔"
      sections={[
        {
          title: "Unread Notifications",
          description: "Recent notifications requiring your attention",
          wireframeType: "cards",
          items: [
            "3 New Applications for Senior Developer",
            "Application deadline approaching for Marketing Manager",
            "High-quality candidate viewed your job post",
            "Team member scheduled interview for UX Designer",
            "Payment processed successfully for job posting credits",
            "New candidate match found via AI recommendations"
          ]
        },
        {
          title: "Application Activity",
          description: "Notifications related to job applications and candidates",
          wireframeType: "list",
          items: [
            "Sarah Johnson submitted application (Senior React Developer)",
            "Mike Chen updated his profile and resume",
            "Application status changed: Maria Rodriguez moved to Interview",
            "3 candidates viewed your company profile",
            "Alex Kim withdrew application for Data Scientist role",
            "New application with 95% AI match score",
            "Candidate responded to interview invitation",
            "Resume download: Jennifer Liu (Product Manager)"
          ]
        },
        {
          title: "Job Posting Updates",
          description: "Notifications about your active job postings",
          wireframeType: "table",
          items: [
            "Senior Developer - 15 new applications this week",
            "Marketing Manager - Expires in 3 days",
            "UX Designer - Low application volume alert",
            "Data Scientist - Featured placement activated",
            "Product Manager - SEO optimization suggestions available",
            "Sales Rep - Competitor analysis report ready",
            "DevOps Engineer - Salary benchmark update",
            "Content Writer - Job post performance summary"
          ]
        },
        {
          title: "Team Collaboration",
          description: "Notifications from team members and collaborative activities",
          wireframeType: "cards",
          items: [
            "John Smith added notes to candidate profile",
            "Emily Davis scheduled interview for tomorrow",
            "Team meeting request: Discuss hiring pipeline",
            "Workflow updated: Interview process revised",
            "New team member granted access to CRM",
            "Collaborative rating completed for candidate pool"
          ]
        },
        {
          title: "System & Account Alerts",
          description: "Important platform and billing notifications",
          wireframeType: "list",
          items: [
            "Monthly usage report now available",
            "New feature: AI-powered candidate screening",
            "Security update: Password policy enhanced",
            "Subscription renewal processed successfully",
            "API usage approaching monthly limit",
            "Scheduled maintenance this weekend",
            "Data export completed and ready for download",
            "Platform performance improvements deployed"
          ]
        },
        {
          title: "AI Recommendations",
          description: "Smart suggestions and AI-powered insights",
          wireframeType: "cards",
          items: [
            "Suggested candidates for your open positions",
            "Recommended interview questions for Data Scientist role",
            "Optimal posting time for maximum visibility",
            "Salary adjustment recommendations",
            "Keywords to improve job post performance",
            "Candidate engagement insights available"
          ]
        }
      ]}
      quickActions={[
        {
          title: "Mark All Read",
          label: "Mark All Read",
          description: "Mark all notifications as read",
          icon: "✅"
        },
        {
          title: "Filter by Type",
          label: "Filter by Type",
          description: "Show specific notification categories",
          icon: "🔍"
        },
        {
          title: "Export History",
          label: "Export History",
          description: "Download notification history",
          icon: "📥"
        },
        {
          title: "Notification Settings",
          label: "Notification Settings",
          description: "Manage your notification preferences",
          icon: "⚙️"
        },
        {
          title: "Critical Alerts Only",
          label: "Critical Alerts Only",
          description: "Show only urgent notifications",
          icon: "🚨",
          disabled: true
        },
        {
          title: "Snooze All",
          label: "Snooze All",
          description: "Temporarily pause non-critical notifications",
          icon: "😴",
          disabled: true
        },
        {
          title: "AI Summary",
          label: "AI Summary",
          description: "Get AI-generated summary of recent activity",
          icon: "🤖",
          disabled: true
        },
        {
          title: "Integration Setup",
          label: "Integration Setup",
          description: "Connect external notification services",
          icon: "🔗",
          disabled: true
        }
      ]}
    />
  );
} 