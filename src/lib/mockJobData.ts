export interface EnhancedJobData {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  url: string;
  postedAt: string;
  categories?: string[];

  // Enhanced fields for the modal
  companyInfo: {
    logo?: string;
    size?: string;
    industry?: string;
    founded?: string;
    website?: string;
    description?: string;
  };
  benefits: string[];
  requirements: string[];
  responsibilities: string[];
  skills: Array<{
    name: string;
    importance: 'required' | 'preferred' | 'nice-to-have';
  }>;
  applicationDeadline?: string;
  applicantsCount?: number;
  viewsCount?: number;
  employeeTestimonials?: Array<{
    text: string;
    author: string;
    role: string;
  }>;
  isRemote?: boolean;
  experienceLevel?: string;
}

// Mock data generator for enhanced job details
export function generateEnhancedJobData(baseJob: any): EnhancedJobData {
  const companyNames = [
    'TechCorp',
    'InnovateLabs',
    'DataFlow Inc',
    'CloudSolutions',
    'DevSpace',
  ];
  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'E-commerce',
    'Education',
  ];
  const sizes = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-1000 employees',
    '1000+ employees',
  ];

  const skillSets: Record<
    string,
    Array<{
      name: string;
      importance: 'required' | 'preferred' | 'nice-to-have';
    }>
  > = {
    'Software Engineer': [
      { name: 'JavaScript', importance: 'required' as const },
      { name: 'React', importance: 'required' as const },
      { name: 'Node.js', importance: 'preferred' as const },
      { name: 'TypeScript', importance: 'preferred' as const },
      { name: 'Docker', importance: 'nice-to-have' as const },
    ],
    'Data Analyst': [
      { name: 'SQL', importance: 'required' as const },
      { name: 'Python', importance: 'required' as const },
      { name: 'Excel', importance: 'preferred' as const },
      { name: 'Tableau', importance: 'preferred' as const },
      { name: 'R', importance: 'nice-to-have' as const },
    ],
    'Marketing Manager': [
      { name: 'Digital Marketing', importance: 'required' as const },
      { name: 'Google Analytics', importance: 'required' as const },
      { name: 'SEO/SEM', importance: 'preferred' as const },
      { name: 'Content Strategy', importance: 'preferred' as const },
      { name: 'Photoshop', importance: 'nice-to-have' as const },
    ],
    default: [
      { name: 'Communication', importance: 'required' as const },
      { name: 'Problem Solving', importance: 'required' as const },
      { name: 'Teamwork', importance: 'preferred' as const },
      { name: 'Time Management', importance: 'preferred' as const },
    ],
  };

  const benefits = [
    'Health, dental, and vision insurance',
    '401(k) with company matching',
    'Flexible working hours',
    'Remote work options',
    'Professional development budget',
    'Unlimited PTO',
    'Free snacks and drinks',
    'Gym membership reimbursement',
    'Stock options',
    'Parental leave',
  ];

  const testimonials = [
    {
      text: 'Great company culture and amazing growth opportunities!',
      author: 'Sarah Johnson',
      role: 'Senior Developer',
    },
    {
      text: 'Work-life balance is excellent here. Management really cares about employees.',
      author: 'Mike Chen',
      role: 'Product Manager',
    },
    {
      text: 'Challenging projects and supportive team environment.',
      author: 'Emily Rodriguez',
      role: 'UX Designer',
    },
  ];

  const responsibilities = [
    'Develop and maintain high-quality software solutions',
    'Collaborate with cross-functional teams to define requirements',
    'Participate in code reviews and maintain coding standards',
    'Troubleshoot and debug applications',
    'Stay up-to-date with emerging technologies and industry trends',
  ];

  const requirements = [
    "Bachelor's degree in Computer Science or related field",
    '3+ years of professional experience',
    'Strong problem-solving and analytical skills',
    'Excellent communication and teamwork abilities',
    'Experience with version control systems (Git)',
  ];

  // Get skills based on job title
  const jobTitleKey =
    Object.keys(skillSets).find(key =>
      baseJob.title?.toLowerCase().includes(key.toLowerCase())
    ) || 'default';

  // Convert requirements from string to array if needed
  const processedRequirements = Array.isArray(baseJob.requirements)
    ? baseJob.requirements
    : baseJob.requirements
      ? [baseJob.requirements]
      : requirements;

  return {
    ...baseJob,
    companyInfo: {
      logo: `/api/placeholder/80/80`, // Placeholder logo
      size: sizes[Math.floor(Math.random() * sizes.length)],
      industry: industries[Math.floor(Math.random() * industries.length)],
      founded: `${2000 + Math.floor(Math.random() * 23)}`,
      website: `https://${baseJob.company?.toLowerCase().replace(/\s+/g, '')}.com`,
      description: `${baseJob.company} is a leading company in the ${industries[Math.floor(Math.random() * industries.length)].toLowerCase()} industry, committed to innovation and excellence.`,
    },
    benefits: benefits
      .sort(() => 0.5 - Math.random())
      .slice(0, 5 + Math.floor(Math.random() * 3)),
    requirements: processedRequirements,
    responsibilities,
    skills: skillSets[jobTitleKey] || skillSets.default,
    applicationDeadline: new Date(
      Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
    ).toISOString(),
    applicantsCount: Math.floor(Math.random() * 150) + 5,
    viewsCount: Math.floor(Math.random() * 500) + 50,
    employeeTestimonials: testimonials
      .sort(() => 0.5 - Math.random())
      .slice(0, 2),
    isRemote: Math.random() > 0.5,
    experienceLevel: ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'][
      Math.floor(Math.random() * 4)
    ],
  };
}
