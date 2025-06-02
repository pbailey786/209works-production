/**
 * Dynamic Regional Landing Page
 * Handles routes for /regional/209, /regional/916, /regional/510, /regional/norcal
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Building2, 
  Users, 
  TrendingUp, 
  Star,
  Briefcase,
  GraduationCap,
  Heart
} from 'lucide-react';
import Link from 'next/link';

interface RegionConfig {
  name: string;
  areaCode: string;
  description: string;
  majorCities: string[];
  keyIndustries: string[];
  stats: {
    activeJobs: number;
    companies: number;
    avgSalary: string;
    unemploymentRate: string;
  };
  highlights: string[];
  chamberPartners: string[];
}

const regionConfigs: Record<string, RegionConfig> = {
  'central-valley': {
    name: 'Central Valley',
    areaCode: '209',
    description: 'The heart of California\'s agricultural and manufacturing economy, featuring diverse opportunities from Stockton to Merced.',
    majorCities: ['Stockton', 'Modesto', 'Tracy', 'Manteca', 'Turlock', 'Merced', 'Lodi'],
    keyIndustries: ['Agriculture', 'Manufacturing', 'Healthcare', 'Logistics', 'Education'],
    stats: {
      activeJobs: 1247,
      companies: 450,
      avgSalary: '$58,000',
      unemploymentRate: '4.2%'
    },
    highlights: [
      'Major transportation hub with access to Bay Area and Sacramento',
      'Growing tech sector with UC Merced driving innovation',
      'Strong agricultural heritage with modern farming technology',
      'Affordable cost of living compared to coastal California'
    ],
    chamberPartners: ['Stockton Chamber', 'Modesto Chamber', 'Tracy Chamber', 'Greater Merced Chamber']
  },
  'sacramento': {
    name: 'Sacramento Region',
    areaCode: '916',
    description: 'California\'s capital region, home to government, healthcare, and emerging tech industries.',
    majorCities: ['Sacramento', 'Roseville', 'Folsom', 'Davis', 'Elk Grove'],
    keyIndustries: ['Government', 'Healthcare', 'Technology', 'Education', 'Finance'],
    stats: {
      activeJobs: 2156,
      companies: 780,
      avgSalary: '$72,000',
      unemploymentRate: '3.8%'
    },
    highlights: [
      'State government employment opportunities',
      'UC Davis and Sacramento State driving research',
      'Growing tech corridor in Folsom and Roseville',
      'Strong healthcare systems and medical research'
    ],
    chamberPartners: ['Sacramento Metro Chamber', 'Roseville Chamber', 'Folsom Chamber']
  },
  'east-bay': {
    name: 'East Bay',
    areaCode: '510',
    description: 'Dynamic region connecting Oakland to the Central Valley, featuring diverse industries and innovation.',
    majorCities: ['Oakland', 'Fremont', 'Hayward', 'Berkeley', 'Livermore'],
    keyIndustries: ['Technology', 'Biotechnology', 'Manufacturing', 'Logistics', 'Clean Energy'],
    stats: {
      activeJobs: 3421,
      companies: 1200,
      avgSalary: '$89,000',
      unemploymentRate: '3.2%'
    },
    highlights: [
      'Major port and logistics hub at Oakland',
      'UC Berkeley and Lawrence Livermore National Lab',
      'Growing biotech and clean energy sectors',
      'Diverse and innovative business community'
    ],
    chamberPartners: ['Oakland Chamber', 'Fremont Chamber', 'Tri-Valley Chamber']
  }
};

interface PageProps {
  params: Promise<{
    region: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { region } = await params;
  const config = regionConfigs[region];
  
  if (!config) {
    return {
      title: 'Region Not Found | 209jobs'
    };
  }

  return {
    title: `${config.name} Jobs | ${config.areaCode}jobs`,
    description: `Find jobs in ${config.name}. ${config.description}`,
  };
}

export default async function RegionalPage({ params }: PageProps) {
  const { region } = await params;
  const config = regionConfigs[region];

  if (!config) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Find Your Career in the{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {config.name}
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {config.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href={`/jobs?region=${region}`}>
                Browse {config.stats.activeJobs}+ Jobs
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/signup/jobseeker">
                Create Job Alert
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{config.stats.activeJobs.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Across all industries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Companies</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{config.stats.companies}</div>
                <p className="text-xs text-muted-foreground">
                  Hiring actively
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{config.stats.avgSalary}</div>
                <p className="text-xs text-muted-foreground">
                  Annual median
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unemployment</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{config.stats.unemploymentRate}</div>
                <p className="text-xs text-muted-foreground">
                  Below state average
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Industries */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Key Industries</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {config.keyIndustries.map((industry) => (
              <Card key={industry} className="text-center hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">{industry}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Major Cities */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Major Cities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {config.majorCities.map((city) => (
              <Button
                key={city}
                asChild
                variant="outline"
                className="h-auto p-4 flex flex-col items-center"
              >
                <Link href={`/jobs?city=${encodeURIComponent(city)}`}>
                  <MapPin className="h-5 w-5 mb-2" />
                  <span className="text-sm">{city}</span>
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Regional Highlights */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Why Work in {config.name}?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {config.highlights.map((highlight, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Heart className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-gray-700">{highlight}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Chamber Partners */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Chamber Partners</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {config.chamberPartners.map((partner) => (
              <Card key={partner} className="text-center">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-sm">{partner}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button asChild variant="outline">
              <Link href="/chamber">
                View All Chamber Partners
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Your Career in {config.name}?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of professionals who have found their dream jobs in the {config.name}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-lg px-8">
              <Link href={`/jobs?region=${region}`}>
                Browse Jobs
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 border-white text-white hover:bg-white hover:text-blue-600">
              <Link href="/signup/jobseeker">
                Create Profile
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* For Employers */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Hiring in {config.name}?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Connect with local talent and grow your business with our regional expertise
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/employers/create-job-post">
                Post a Job
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/signup/local-business">
                Local Business Signup
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export async function generateStaticParams() {
  return Object.keys(regionConfigs).map((region) => ({
    region,
  }));
} 