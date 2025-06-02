import PlaceholderPage from "@/components/PlaceholderPage";

export default function EmployerTermsPage() {
  return (
    <PlaceholderPage
      title="Employer Terms of Service"
      description="These terms govern your use of 209jobs as an employer, including job posting, candidate management, billing, and platform obligations. Please read carefully and contact us with any questions."
      icon="📄"
      quickActions={[
        {
          title: "Download PDF",
          label: "Download PDF",
          description: "Download a PDF copy of our terms of service",
          icon: "📄",
          disabled: true
        },
        {
          title: "Contact Legal",
          label: "Contact Legal",
          description: "Questions about terms? Contact our legal team",
          icon: "⚖️",
          href: "/employers/contact"
        },
        {
          title: "Privacy Policy",
          label: "Privacy Policy",
          description: "View our privacy policy and data handling practices",
          icon: "🔒",
          href: "/employers/privacy"
        },
        {
          title: "Update Notifications",
          label: "Update Notifications",
          description: "Get notified when terms are updated",
          icon: "🔔",
          disabled: true
        }
      ]}
      sections={[
        {
          title: "Platform Usage Terms",
          description: "Terms governing how employers can use the 209jobs platform and services",
          wireframeType: "list",
          items: [
            "Account creation and verification requirements",
            "Acceptable use policy for job postings",
            "Prohibited content and discriminatory practices",
            "Platform availability and service limitations",
            "User responsibilities and conduct guidelines"
          ]
        },
        {
          title: "Job Posting Guidelines",
          description: "Rules and requirements for creating and managing job listings",
          wireframeType: "list",
          items: [
            "Job posting content requirements and standards",
            "Accuracy of job information and company details",
            "Prohibited job types and content restrictions",
            "Job posting duration and renewal policies",
            "Featured listing and promotion guidelines"
          ]
        },
        {
          title: "Billing and Payment Terms",
          description: "Terms related to subscription plans, billing, credits, and payment processing",
          wireframeType: "list",
          items: [
            "Subscription plan details and billing cycles",
            "Credit system usage and expiration policies",
            "Payment processing and refund conditions",
            "Automatic renewal and cancellation terms",
            "Pricing changes and grandfathering policies"
          ]
        },
        {
          title: "Candidate Data and Privacy",
          description: "Terms governing access to and use of candidate information",
          wireframeType: "list",
          items: [
            "Candidate data access permissions and limitations",
            "Data retention and deletion policies",
            "Sharing and export restrictions for candidate information",
            "Compliance with privacy laws and regulations",
            "Security obligations for candidate data handling"
          ]
        },
        {
          title: "Intellectual Property",
          description: "Terms related to content ownership, trademarks, and intellectual property rights",
          wireframeType: "list",
          items: [
            "Ownership of job postings and company content",
            "209jobs platform intellectual property rights",
            "License terms for platform usage",
            "Content submission and usage rights",
            "Trademark and copyright compliance"
          ]
        },
        {
          title: "Limitation of Liability",
          description: "Legal limitations, disclaimers, and liability terms",
          wireframeType: "list",
          items: [
            "Service availability disclaimers",
            "Limitation of damages and liability caps",
            "Third-party service integration disclaimers",
            "Force majeure and service interruption terms",
            "Indemnification and hold harmless clauses"
          ]
        },
        {
          title: "Termination and Suspension",
          description: "Terms governing account termination, suspension, and data handling",
          wireframeType: "list",
          items: [
            "Account termination conditions and procedures",
            "Immediate suspension circumstances",
            "Data retention after account closure",
            "Outstanding payment obligations",
            "Effect of termination on active job postings"
          ]
        },
        {
          title: "Dispute Resolution",
          description: "Process for handling disputes, complaints, and legal matters",
          wireframeType: "form",
          items: [
            "Governing Law Jurisdiction",
            "Arbitration Requirements",
            "Dispute Resolution Process",
            "Legal Notice Requirements"
          ]
        },
        {
          title: "Terms Updates and Changes",
          description: "How we communicate changes to these terms and their effective dates",
          wireframeType: "list",
          items: [
            "Notification process for terms changes",
            "Effective date policies for updates",
            "Continued use acceptance terms",
            "Grandfathering policies for existing users",
            "Historical version access and archiving"
          ]
        }
      ]}
    />
  );
} 