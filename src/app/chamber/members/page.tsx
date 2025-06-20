import { Metadata } from '@/components/ui/card';
import { Button } from '@/components/ui/card';
import { Input } from '@/components/ui/card';
import { Badge } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  import {
  Search,
  Filter,
  MapPin,
  Users,
  Building2,
  Phone,
  Mail,
  Globe,
  Star,
  TrendingUp
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Chamber Members Directory | 209jobs',
  description:
    'Browse and connect with chamber of commerce members in the Central Valley',
};

export default function ChamberMembersPage() {
  const members = [
    {
      id: 1,
      name: 'Stockton Chamber of Commerce',
      type: 'Chamber',
      memberCount: 450,
      location: 'Stockton, CA',
      website: 'https://stocktonchamber.org',
      phone: '(209) 547-2770',
      email: 'info@stocktonchamber.org',
      description:
        'Leading business organization serving the greater Stockton area',
      logo: '/placeholder-logo.png',
      verified: true,
      activeJobs: 23,
      successfulHires: 89,
    },
    {
      id: 2,
      name: 'Valley Medical Center',
      type: 'Healthcare',
      memberCount: 1200,
      location: 'Modesto, CA',
      website: 'https://valleymedical.com',
      phone: '(209) 555-0123',
      email: 'hr@valleymedical.com',
      description: 'Premier healthcare provider in the Central Valley',
      logo: '/placeholder-logo.png',
      verified: true,
      activeJobs: 15,
      successfulHires: 34,
    },
    {
      id: 3,
      name: 'Central Valley Tech Solutions',
      type: 'Technology',
      memberCount: 85,
      location: 'Tracy, CA',
      website: 'https://cvtech.com',
      phone: '(209) 555-0456',
      email: 'contact@cvtech.com',
      description: 'Innovative technology solutions for local businesses',
      logo: '/placeholder-logo.png',
      verified: true,
      activeJobs: 8,
      successfulHires: 12,
    },
    {
      id: 4,
      name: 'Manteca Manufacturing Co.',
      type: 'Manufacturing',
      memberCount: 320,
      location: 'Manteca, CA',
      website: 'https://mantecamfg.com',
      phone: '(209) 555-0789',
      email: 'jobs@mantecamfg.com',
      description: 'Leading manufacturer of agricultural equipment',
      logo: '/placeholder-logo.png',
      verified: true,
      activeJobs: 12,
      successfulHires: 28,
    },
    {
      id: 5,
      name: 'Turlock Education Foundation',
      type: 'Education',
      memberCount: 150,
      location: 'Turlock, CA',
      website: 'https://turlockedu.org',
      phone: '(209) 555-0321',
      email: 'info@turlockedu.org',
      description: 'Supporting educational excellence in Turlock',
      logo: '/placeholder-logo.png',
      verified: true,
      activeJobs: 6,
      successfulHires: 15,
    },
    {
      id: 6,
      name: 'Lodi Agricultural Services',
      type: 'Agriculture',
      memberCount: 95,
      location: 'Lodi, CA',
      website: 'https://lodiag.com',
      phone: '(209) 555-0654',
      email: 'careers@lodiag.com',
      description: 'Comprehensive agricultural services and consulting',
      logo: '/placeholder-logo.png',
      verified: true,
      activeJobs: 9,
      successfulHires: 21,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Chamber Members Directory
        </h1>
        <p className="text-gray-600">
          Connect with chamber members and local businesses across the Central
          Valley
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="Search members by name, industry, or location..."
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter by Industry
              </Button>
              <Button variant="outline" size="sm">
                <MapPin className="mr-2 h-4 w-4" />
                Filter by Location
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">
              Across 15 industries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">73</div>
            <p className="text-xs text-muted-foreground">
              From member companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Successful Hires
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">199</div>
            <p className="text-xs text-muted-foreground">This quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,450</div>
            <p className="text-xs text-muted-foreground">Across all members</p>
          </CardContent>
        </Card>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {members.map(member => (
          <Card key={member.id} className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={member.logo}
                      alt={`${member.name} logo`}
                    />
                    <AvatarFallback>
                      {member.name
                        .split(' ')
                        .map(word => word[0])
                        .join('')
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {member.name}
                      {member.verified && (
                        <Badge variant="secondary" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {member.location}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline">{member.type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">{member.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-blue-600">
                    {member.memberCount}
                  </div>
                  <div className="text-xs text-gray-500">Employees</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-green-600">
                    {member.activeJobs}
                  </div>
                  <div className="text-xs text-gray-500">Active Jobs</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-purple-600">
                    {member.successfulHires}
                  </div>
                  <div className="text-xs text-gray-500">Hires</div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-3 w-3" />
                  <a
                    href={`tel:${member.phone}`}
                    className="hover:text-blue-600"
                  >
                    {member.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-3 w-3" />
                  <a
                    href={`mailto:${member.email}`}
                    className="hover:text-blue-600"
                  >
                    {member.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Globe className="h-3 w-3" />
                  <a
                    href={member.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600"
                  >
                    Visit Website
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button asChild size="sm" className="flex-1">
                  <Link
                    href={`/jobs?company=${encodeURIComponent(member.name)}`}
                  >
                    View Jobs ({member.activeJobs})
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/chamber/members/${member.id}`}>
                    View Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="mt-8 text-center">
        <Button variant="outline" size="lg">
          Load More Members
        </Button>
      </div>

      {/* Join CTA */}
      <Card className="mt-12 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              Join Our Chamber Network
            </h2>
            <p className="mb-6 text-gray-600">
              Connect with local businesses and access exclusive benefits for
              chamber members
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup/local-business">
                  Join as Local Business
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/signup/chamber-partner">
                  Become a Chamber Partner
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
