import PlaceholderPage from '@/components/PlaceholderPage';

export default function EmployerFAQPage() {
  return (
    <PlaceholderPage
      title="Frequently Asked Questions"
      description="Find answers to common questions about posting jobs, managing candidates, billing, and using our platform features. Can't find what you're looking for? Contact our support team."
      icon="❓"
      quickActions={[
        {
          title: 'Contact Support',
          label: 'Contact Support',
          description: 'Get help from our support team for specific questions',
          icon: '💬',
          href: '/employers/contact',
        },
        {
          title: 'Live Chat',
          label: 'Live Chat',
          description: 'Chat with support during business hours',
          icon: '💭',
          disabled: true,
        },
        {
          title: 'Video Tutorials',
          label: 'Video Tutorials',
          description: 'Watch step-by-step guides for common tasks',
          icon: '🎥',
          disabled: true,
        },
        {
          title: 'Getting Started Guide',
          label: 'Getting Started Guide',
          description: 'New to 209jobs? Start with our comprehensive guide',
          icon: '🚀',
          disabled: true,
        },
      ]}
      sections={[
        {
          title: 'Getting Started',
          description:
            'Common questions for new employers and basic platform usage',
          wireframeType: 'list',
          items: [
            'How do I create my first job posting?',
            'What information should I include in my job listing?',
            'How do I set up my company profile?',
            'How does candidate matching work?',
            'What are credits and how do I use them?',
          ],
        },
        {
          title: 'Job Posting & Management',
          description:
            'Questions about creating, editing, and managing job listings',
          wireframeType: 'list',
          items: [
            'How long do job postings stay active?',
            "Can I edit a job posting after it's published?",
            'How do I boost or promote my job listings?',
            "What's the difference between featured and standard listings?",
            'How do I repost an expired job?',
          ],
        },
        {
          title: 'Candidate Management',
          description:
            'Managing applications, screening candidates, and communication',
          wireframeType: 'list',
          items: [
            'How do I view and manage applications?',
            'Can I message candidates directly?',
            'How does the AI candidate screening work?',
            'What is the applicant pipeline and how do I use it?',
            'How do I export candidate information?',
          ],
        },
        {
          title: 'Billing & Subscription',
          description:
            'Questions about pricing, billing, credits, and subscription management',
          wireframeType: 'list',
          items: [
            'What are the different pricing plans?',
            'How does the credit system work?',
            'Can I change my subscription plan?',
            'How do I download invoices and receipts?',
            'What happens if I cancel my subscription?',
          ],
        },
        {
          title: 'Advanced Features',
          description:
            'Questions about AI tools, integrations, and premium features',
          wireframeType: 'list',
          items: [
            'How does the AI job description generator work?',
            'What integrations are available?',
            'Can I bulk upload multiple job postings?',
            'How do I use the referral program?',
            'What reporting and analytics are available?',
          ],
        },
        {
          title: 'Account & Security',
          description: 'Account management, team access, and security settings',
          wireframeType: 'list',
          items: [
            'How do I add team members to my account?',
            'What are the different user roles and permissions?',
            'How do I update my company information?',
            'Is my data secure and private?',
            'How do I reset my password?',
          ],
        },
        {
          title: 'Search & Filter Options',
          description: 'Interactive FAQ search and category filtering',
          wireframeType: 'form',
          items: ['Search FAQs', 'Filter by Category', 'Sort by Relevance'],
        },
      ]}
    />
  );
}
