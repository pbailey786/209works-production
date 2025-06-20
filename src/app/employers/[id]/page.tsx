import { notFound } from '@/components/ui/card';
import { Metadata } from 'next';
import EmployerProfileClient from './EmployerProfileClient';

interface EmployerProfilePageProps {
  params: Promise<{ id: string }>;
}

// Mock employer data - in production this would come from database
const getEmployer = async (id: string) => {
  const employers = {
    'central-valley-health': {
      id: 'central-valley-health',
      name: 'Central Valley Health',
      industry: 'Healthcare',
      location: 'Stockton, CA',
      description:
        'Leading healthcare provider serving the Central Valley with opportunities in nursing, administration, and medical support. We are committed to providing exceptional patient care while fostering a supportive work environment for our team members.',
      logo: '🏥',
      website: 'https://centralvalleyhealth.com',
      founded: '1985',
      size: '500-1000 employees',
      benefits: [
        'Comprehensive health insurance',
        'Retirement savings plan',
        'Paid time off',
        'Professional development',
        'Flexible scheduling',
      ],
      culture:
        "We believe in work-life balance and supporting our employees' professional growth while delivering exceptional healthcare services to our community.",
      activeJobs: 12,
    },
    'manteca-unified': {
      id: 'manteca-unified',
      name: 'Manteca Unified School District',
      industry: 'Education',
      location: 'Manteca, CA',
      description:
        'Growing school district seeking teachers, administrators, and support staff to serve our diverse student community. We are dedicated to providing quality education and creating an inclusive learning environment.',
      logo: '🎓',
      website: 'https://mantecausd.net',
      founded: '1960',
      size: '200-500 employees',
      benefits: [
        'CalPERS retirement system',
        'Health and dental insurance',
        'Summer break',
        'Professional development opportunities',
        'Tenure track positions',
      ],
      culture:
        'Our mission is to inspire and prepare all students for success in a rapidly changing world through innovative teaching and collaborative learning.',
      activeJobs: 8,
    },
    'tracy-logistics': {
      id: 'tracy-logistics',
      name: 'Tracy Logistics Solutions',
      industry: 'Transportation & Warehousing',
      location: 'Tracy, CA',
      description:
        'Premier logistics company offering warehouse, transportation, and supply chain careers with competitive benefits. We specialize in efficient distribution and transportation solutions.',
      logo: '🚛',
      website: 'https://tracylogistics.com',
      founded: '1995',
      size: '100-200 employees',
      benefits: [
        'Competitive hourly wages',
        'Health insurance',
        'Overtime opportunities',
        'Safety bonuses',
        'Career advancement',
      ],
      culture:
        'Safety first, teamwork always. We value hard work and provide opportunities for growth in the logistics industry.',
      activeJobs: 15,
    },
    'lodi-wine-group': {
      id: 'lodi-wine-group',
      name: 'Lodi Wine Group',
      industry: 'Agriculture & Food',
      location: 'Lodi, CA',
      description:
        'Family-owned winery and agricultural business with seasonal and full-time opportunities in wine production and farming. We combine traditional winemaking with modern techniques.',
      logo: '🍇',
      website: 'https://lodiwinegroup.com',
      founded: '1978',
      size: '50-100 employees',
      benefits: [
        'Seasonal bonuses',
        'Health insurance',
        'Employee wine discounts',
        'Harvest incentives',
        'Flexible scheduling',
      ],
      culture:
        'We are passionate about winemaking and agriculture, fostering a family-like atmosphere where tradition meets innovation.',
      activeJobs: 6,
    },
    'modesto-tech': {
      id: 'modesto-tech',
      name: 'Modesto Tech Solutions',
      industry: 'Technology',
      location: 'Modesto, CA',
      description:
        'Innovative tech company providing IT services to local businesses, seeking developers, support staff, and project managers. We help businesses leverage technology for growth.',
      logo: '💻',
      website: 'https://modestotechsolutions.com',
      founded: '2010',
      size: '20-50 employees',
      benefits: [
        'Remote work options',
        'Health insurance',
        'Professional development budget',
        'Flexible hours',
        'Stock options',
      ],
      culture:
        'Innovation-driven culture with emphasis on continuous learning, collaboration, and work-life balance.',
      activeJobs: 9,
    },
    'delta-construction': {
      id: 'delta-construction',
      name: 'Delta Construction',
      industry: 'Construction',
      location: 'Stockton, CA',
      description:
        'Established construction company building homes and commercial properties throughout the Central Valley region. We pride ourselves on quality craftsmanship and timely project completion.',
      logo: '🏗️',
      website: 'https://deltaconstruction.com',
      founded: '1988',
      size: '100-200 employees',
      benefits: [
        'Union benefits',
        'Health and safety training',
        'Overtime pay',
        'Tool allowances',
        'Apprenticeship programs',
      ],
      culture:
        'Built on integrity, safety, and quality. We invest in our people and provide opportunities for skill development and career growth.',
      activeJobs: 11,
    },
  };

  return employers[id as keyof typeof employers] || null;
};

export async function generateMetadata({
  params,
}: EmployerProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const employer = await getEmployer(id);

  if (!employer) {
    return {
      title: 'Employer Not Found - 209Jobs',
    };
  }

  return {
    title: `${employer.name} - Employer Profile | 209Jobs`,
    description: `Learn about ${employer.name} and explore career opportunities in ${employer.location}. ${employer.description}`,
    openGraph: {
      title: `${employer.name} - Employer Profile`,
      description: employer.description,
      type: 'website',
    },
  };
}

export default async function EmployerProfilePage({
  params,
}: EmployerProfilePageProps) {
  const { id } = await params;
  const employer = await getEmployer(id);

  if (!employer) {
    notFound();
  }

  return <EmployerProfileClient employer={employer} />;
}
