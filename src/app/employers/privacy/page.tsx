import PlaceholderPage from '@/components/PlaceholderPage';

export default function EmployerPrivacyPage() {
  return (
    <PlaceholderPage
      title="Employer Privacy Policy"
      description="Our privacy policy outlines how we collect, use, protect, and share your company data and candidate information when you use 209jobs as an employer. We are committed to transparency and data protection."
      icon="🔒"
      quickActions={[
        {
          title: 'Download Privacy Policy',
          label: 'Download Privacy Policy',
          description: 'Download a PDF copy of our privacy policy',
          icon: '📄',
          disabled: true,
        },
        {
          title: 'Data Subject Rights',
          label: 'Data Subject Rights',
          description: 'Learn about your rights regarding your data',
          icon: '⚖️',
          disabled: true,
        },
        {
          title: 'Contact Data Protection',
          label: 'Contact Data Protection',
          description: 'Contact our data protection officer',
          icon: '👤',
          href: '/employers/contact',
        },
        {
          title: 'Terms of Service',
          label: 'Terms of Service',
          description: 'View our terms of service and legal obligations',
          icon: '📋',
          href: '/employers/terms',
        },
      ]}
      sections={[
        {
          title: 'Information We Collect',
          description:
            'Types of data we collect from employers and how we collect it',
          wireframeType: 'list',
          items: [
            'Company account information (name, address, contact details)',
            'User account details (email, password, profile information)',
            'Job posting content and company descriptions',
            'Billing and payment information (processed securely)',
            'Platform usage data and analytics (anonymized)',
            'Communication records and support interactions',
          ],
        },
        {
          title: 'How We Use Your Data',
          description:
            'Purposes for which we process your company and user data',
          wireframeType: 'list',
          items: [
            'Providing job posting and candidate management services',
            'Processing payments and managing subscriptions',
            'Improving platform functionality and user experience',
            'Sending service updates and important notifications',
            'Providing customer support and technical assistance',
            'Compliance with legal obligations and regulations',
          ],
        },
        {
          title: 'Candidate Data Handling',
          description:
            'How we handle candidate information you access through our platform',
          wireframeType: 'list',
          items: [
            'Candidate profile data (resumes, contact information)',
            'Application status and interaction history',
            'Communication records between employers and candidates',
            'AI-generated candidate scoring and matching data',
            'Export and download logs for compliance tracking',
          ],
        },
        {
          title: 'Data Sharing and Disclosure',
          description: 'When and how we share information with third parties',
          wireframeType: 'list',
          items: [
            'No sale of personal data to third parties',
            'Service providers for payment processing and infrastructure',
            'Legal compliance and law enforcement requests',
            'Business transfers or acquisitions (with notice)',
            'Aggregated, anonymized data for research and insights',
          ],
        },
        {
          title: 'Data Security Measures',
          description:
            'Security practices and technologies we use to protect your data',
          wireframeType: 'cards',
          items: [
            'Encryption in transit and at rest',
            'Regular security audits and penetration testing',
            'Access controls and multi-factor authentication',
            'Employee training and background checks',
            'Incident response and breach notification procedures',
            'Compliance with industry security standards',
          ],
        },
        {
          title: 'Your Rights and Controls',
          description:
            'Rights you have regarding your data and how to exercise them',
          wireframeType: 'form',
          items: [
            'Data Access Request',
            'Data Correction Request',
            'Data Deletion Request',
            'Data Portability Request',
            'Marketing Opt-out',
            'Cookie Preferences',
          ],
        },
        {
          title: 'Data Retention Policies',
          description: 'How long we keep different types of data and why',
          wireframeType: 'table',
          items: [
            'Account Data',
            'Job Postings',
            'Candidate Interactions',
            'Billing Records',
            'Support Communications',
            'Analytics Data',
          ],
        },
        {
          title: 'International Data Transfers',
          description:
            'How we handle data transfers across international borders',
          wireframeType: 'list',
          items: [
            'Data processing locations and jurisdictions',
            'Adequacy decisions and transfer mechanisms',
            'Standard contractual clauses for international transfers',
            'Data subject rights in different jurisdictions',
            'Cross-border law enforcement cooperation',
          ],
        },
        {
          title: 'Cookies and Tracking',
          description:
            'Information about cookies, analytics, and tracking technologies',
          wireframeType: 'list',
          items: [
            'Essential cookies for platform functionality',
            'Analytics cookies for usage insights (opt-out available)',
            'Marketing cookies for advertising (opt-out available)',
            'Third-party integrations and their privacy practices',
            'Cookie management and preference controls',
          ],
        },
        {
          title: 'Privacy Policy Updates',
          description: 'How we communicate changes to this privacy policy',
          wireframeType: 'list',
          items: [
            'Notification process for material changes',
            'Effective date policies for privacy updates',
            'Historical version access and changelog',
            'Your choices when policy changes occur',
            'Contact information for privacy questions',
          ],
        },
      ]}
    />
  );
}
