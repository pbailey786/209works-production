import PlaceholderPage from "@/components/PlaceholderPage";

export default function EmployerContactPage() {
  return (
    <PlaceholderPage
      title="Contact Support"
      description="Get help with your account, billing questions, technical issues, or platform features. Our support team is here to help you succeed with hiring on 209jobs."
      icon="📞"
      quickActions={[
        {
          title: "Submit Support Ticket",
          label: "Submit Support Ticket",
          description: "Create a detailed support request for complex issues",
          icon: "🎫",
          disabled: true
        },
        {
          title: "Schedule Call",
          label: "Schedule Call",
          description: "Book a 1-on-1 call with our support team",
          icon: "📅",
          disabled: true
        },
        {
          title: "Live Chat",
          label: "Live Chat",
          description: "Get instant help during business hours (Mon-Fri 9AM-6PM PST)",
          icon: "💬",
          disabled: true
        },
        {
          title: "Emergency Support",
          label: "Emergency Support",
          description: "Priority support for critical issues (Enterprise plans only)",
          icon: "🚨",
          disabled: true
        }
      ]}
      sections={[
        {
          title: "Contact Form",
          description: "Send us a message and we'll get back to you within 24 hours",
          wireframeType: "form",
          items: [
            "Your Name",
            "Email Address",
            "Company Name",
            "Subject",
            "Issue Category",
            "Priority Level",
            "Message Details",
            "Attach Screenshots"
          ]
        },
        {
          title: "Support Channels",
          description: "Choose the best way to reach us based on your needs",
          wireframeType: "cards",
          items: [
            "Email Support (24-48h response)",
            "Live Chat (Business hours)",
            "Phone Support (Premium plans)",
            "Video Calls (Enterprise)",
            "Knowledge Base",
            "Community Forum"
          ]
        },
        {
          title: "Issue Categories",
          description: "Select the category that best describes your issue for faster resolution",
          wireframeType: "list",
          items: [
            "Technical Issues & Bugs",
            "Account & Billing Questions",
            "Job Posting Problems",
            "Candidate Management",
            "Payment & Subscription",
            "Feature Requests",
            "AI Tools Support",
            "Integration Issues"
          ]
        },
        {
          title: "Business Information",
          description: "Our company details and office locations",
          wireframeType: "cards",
          items: [
            "209jobs by Voodoo Rodeo",
            "Stockton, CA Office",
            "Business Hours: Mon-Fri 9AM-6PM PST",
            "Emergency Support Available",
            "Support Email: support@209jobs.com",
            "Sales Email: sales@209jobs.com"
          ]
        },
        {
          title: "Frequently Contacted About",
          description: "Common topics our support team helps with",
          wireframeType: "list",
          items: [
            "How to post my first job listing",
            "Understanding credit usage and billing",
            "Setting up candidate screening",
            "Troubleshooting AI tools",
            "Managing team member access",
            "Exporting candidate data",
            "Integration with HR systems",
            "Bulk uploading job postings"
          ]
        },
        {
          title: "Response Time Expectations",
          description: "Expected response times based on your plan and issue priority",
          wireframeType: "table",
          items: [
            "Plan Type",
            "Email Response",
            "Chat Availability",
            "Phone Support"
          ]
        }
      ]}
    />
  );
} 