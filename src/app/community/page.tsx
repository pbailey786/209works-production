import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Users,
  Calendar,
  MapPin,
  BookOpen,
  Award,
  MessageCircle,
  TrendingUp,
  Clock,
  Star,
  Building2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Community Hub | 209 Works',
  description:
    'Connect with local professionals, attend networking events, and access career resources in the Central Valley',
};

export default function CommunityHubPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Community Hub</h1>
        <p className="text-gray-600">
          Connect with local professionals and grow your career in the Central
          Valley
        </p>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">+12% this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Events
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mentorship Matches
            </CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Active connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Success Stories
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">This quarter</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-8 lg:col-span-2">
          {/* Networking Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Networking Events
              </CardTitle>
              <CardDescription>
                Connect with local professionals and industry leaders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-semibold">Central Valley Tech Meetup</h3>
                  <Badge>Free</Badge>
                </div>
                <div className="mb-2 flex items-center text-sm text-gray-600">
                  <Calendar className="mr-1 h-4 w-4" />
                  March 15, 2024 • 6:00 PM
                </div>
                <div className="mb-3 flex items-center text-sm text-gray-600">
                  <MapPin className="mr-1 h-4 w-4" />
                  Stockton Chamber of Commerce
                </div>
                <p className="mb-3 text-sm text-gray-700">
                  Join local tech professionals for networking, presentations,
                  and discussions about the growing tech scene in the Central
                  Valley.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">47 attending</span>
                  <Button size="sm">RSVP</Button>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-semibold">
                    Healthcare Professionals Network
                  </h3>
                  <Badge variant="secondary">Members Only</Badge>
                </div>
                <div className="mb-2 flex items-center text-sm text-gray-600">
                  <Calendar className="mr-1 h-4 w-4" />
                  March 20, 2024 • 7:00 PM
                </div>
                <div className="mb-3 flex items-center text-sm text-gray-600">
                  <MapPin className="mr-1 h-4 w-4" />
                  Modesto Regional Medical Center
                </div>
                <p className="mb-3 text-sm text-gray-700">
                  Monthly gathering for healthcare professionals to discuss
                  industry trends, career opportunities, and professional
                  development.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">23 attending</span>
                  <Button size="sm">RSVP</Button>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-semibold">Young Professionals Mixer</h3>
                  <Badge>$15</Badge>
                </div>
                <div className="mb-2 flex items-center text-sm text-gray-600">
                  <Calendar className="mr-1 h-4 w-4" />
                  March 25, 2024 • 5:30 PM
                </div>
                <div className="mb-3 flex items-center text-sm text-gray-600">
                  <MapPin className="mr-1 h-4 w-4" />
                  Downtown Tracy Event Center
                </div>
                <p className="mb-3 text-sm text-gray-700">
                  Networking event for professionals under 35. Includes
                  appetizers, drinks, and structured networking activities.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">62 attending</span>
                  <Button size="sm">RSVP</Button>
                </div>
              </div>

              <Button asChild className="w-full">
                <Link href="/community/events">View All Events</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Mentorship Program */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Mentorship Program
              </CardTitle>
              <CardDescription>
                Connect with experienced professionals or share your expertise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <h3 className="mb-2 font-semibold">Find a Mentor</h3>
                  <p className="mb-3 text-sm text-gray-600">
                    Get guidance from experienced professionals in your field
                  </p>
                  <Button asChild size="sm" className="w-full">
                    <Link href="/community/mentorship/find">
                      Browse Mentors
                    </Link>
                  </Button>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="mb-2 font-semibold">Become a Mentor</h3>
                  <p className="mb-3 text-sm text-gray-600">
                    Share your expertise and help others grow their careers
                  </p>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    <Link href="/community/mentorship/apply">
                      Apply to Mentor
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Featured Mentors */}
              <div className="space-y-3">
                <h4 className="font-medium">Featured Mentors</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 rounded-lg border p-3">
                    <Avatar>
                      <AvatarImage src="/placeholder-avatar.jpg" />
                      <AvatarFallback>SM</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h5 className="font-medium">Sarah Martinez</h5>
                      <p className="text-sm text-gray-600">
                        Senior Marketing Director • 12 years experience
                      </p>
                      <div className="mt-1 flex items-center">
                        <Badge variant="secondary" className="text-xs">
                          Marketing
                        </Badge>
                        <Badge variant="secondary" className="ml-1 text-xs">
                          Leadership
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm">Connect</Button>
                  </div>

                  <div className="flex items-center space-x-3 rounded-lg border p-3">
                    <Avatar>
                      <AvatarImage src="/placeholder-avatar.jpg" />
                      <AvatarFallback>JC</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h5 className="font-medium">James Chen</h5>
                      <p className="text-sm text-gray-600">
                        Software Engineering Manager • 15 years experience
                      </p>
                      <div className="mt-1 flex items-center">
                        <Badge variant="secondary" className="text-xs">
                          Technology
                        </Badge>
                        <Badge variant="secondary" className="ml-1 text-xs">
                          Career Growth
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm">Connect</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Local Career Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Career Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Link href="/community/resources/training">
                    <Award className="mr-2 h-4 w-4" />
                    Training Programs
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Link href="/community/resources/certifications">
                    <Award className="mr-2 h-4 w-4" />
                    Certifications
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Link href="/community/resources/guides">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Career Guides
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Link href="/community/resources/salary">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Salary Reports
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Success Stories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Success Stories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="mb-2 text-sm text-gray-700">
                    "Found my dream job in healthcare through the mentorship
                    program!"
                  </p>
                  <p className="text-xs text-gray-500">
                    - Maria R., Registered Nurse
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="mb-2 text-sm text-gray-700">
                    "The networking events helped me transition into tech
                    successfully."
                  </p>
                  <p className="text-xs text-gray-500">
                    - David L., Software Developer
                  </p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <p className="mb-2 text-sm text-gray-700">
                    "Connected with local business owners and started my own
                    company!"
                  </p>
                  <p className="text-xs text-gray-500">
                    - Jennifer K., Entrepreneur
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/community/success-stories">Read More Stories</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Industry Groups */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Industry Groups
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Healthcare Professionals</span>
                <Badge variant="secondary">234 members</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tech & Innovation</span>
                <Badge variant="secondary">189 members</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Agriculture & Food</span>
                <Badge variant="secondary">156 members</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Manufacturing</span>
                <Badge variant="secondary">143 members</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Education</span>
                <Badge variant="secondary">127 members</Badge>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/community/groups">View All Groups</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/community/join">Join Community</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/community/events/create">Host an Event</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
