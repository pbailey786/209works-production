import PlaceholderPage from '../../../components/PlaceholderPage';

export default function EmployerReportsPage() {
  const reportsSections = [
    {
      title: 'Key Performance Metrics',
      description: 'High-level overview of your recruitment performance',
      wireframeType: 'chart' as const,
    },
    {
      title: 'Job Performance Analytics',
      description: 'Detailed breakdown of how each job posting is performing',
      wireframeType: 'table' as const,
      items: [
        'Job Title',
        'Views',
        'Applications',
        'Click Rate',
        'Time to Fill',
        'Quality Score',
      ],
    },
    {
      title: 'Recruitment Funnel Analysis',
      description: 'Track candidates through your hiring process',
      wireframeType: 'chart' as const,
    },
    {
      title: 'Time-based Trends',
      description: 'Performance trends over time periods',
      wireframeType: 'chart' as const,
    },
    {
      title: 'Candidate Source Analysis',
      description: 'Where your best candidates are coming from',
      wireframeType: 'cards' as const,
    },
    {
      title: 'Benchmarking Data',
      description: 'Compare your performance against industry standards',
      wireframeType: 'table' as const,
      items: [
        'Metric',
        'Your Performance',
        'Industry Average',
        'Top Performers',
        'Improvement %',
      ],
    },
  ];

  const quickActions = [
    {
      title: 'Download Full Report',
      label: 'Download Full Report',
      description: 'Export comprehensive analytics data to PDF or Excel',
      icon: '📥',
      disabled: true,
    },
    {
      title: 'Schedule Weekly Reports',
      label: 'Schedule Weekly Reports',
      description:
        'Get automated performance summaries delivered to your email',
      icon: '📅',
      href: '/employers/settings/alerts',
    },
    {
      title: 'View Job Analytics',
      label: 'View Job Analytics',
      description: 'Detailed analytics for individual job postings',
      icon: '📊',
      href: '/employers/my-jobs',
    },
    {
      title: 'Upgrade for More Features',
      label: 'Upgrade for More Features',
      description: 'Get advanced analytics and reporting features',
      icon: '🚀',
      href: '/employers/upgrade',
    },
    {
      title: 'Custom Report Builder',
      label: 'Custom Report Builder',
      description: 'Create custom reports with specific metrics and filters',
      icon: '🔧',
      disabled: true,
      comingSoon: true,
    },
    {
      title: 'ROI Calculator',
      label: 'ROI Calculator',
      description: 'Calculate return on investment for your hiring activities',
      icon: '💰',
      disabled: true,
    },
  ];

  return (
    <PlaceholderPage
      title="Reports & Analytics"
      description="Comprehensive insights into your recruitment performance. Track job post effectiveness, candidate quality, and hiring ROI to optimize your recruitment strategy."
      icon="📊"
      sections={reportsSections}
      quickActions={quickActions}
    />
  );
}
