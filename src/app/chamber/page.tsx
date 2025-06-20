import { Metadata } from '@/components/ui/card';
import { Button } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
  Users,
  TrendingUp,
  Building2,
  BarChart3,
  UserPlus,
  Calendar,
  DollarSign,
  Target,
  CheckCircle,
  Handshake,
  Award,
  MapPin,
  Star,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Chamber Partnership | 209jobs',
  description:
    'Partner with 209jobs to support local businesses and drive regional economic growth in the Central Valley',
};

export default function ChamberLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative mx-auto max-w-6xl text-center">
          <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-6xl">
            Partner with{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              209jobs
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-600">
            Join forces with the Central Valley's premier job platform to
            support local businesses, drive economic growth, and strengthen your
            community's workforce.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="px-8 text-lg">
              <Link href="/signup/chamber-partner">Become a Partner</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="px-8 text-lg"
            >
              <Link href="/contact">Schedule a Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Our Regional Impact
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mb-2 text-3xl font-bold text-gray-900">247</div>
              <p className="text-gray-600">Active Chamber Members</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Building2 className="h-8 w-8 text-green-600" />
              </div>
              <div className="mb-2 text-3xl font-bold text-gray-900">1,234</div>
              <p className="text-gray-600">Jobs Posted by Partners</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <Target className="h-8 w-8 text-purple-600" />
              </div>
              <div className="mb-2 text-3xl font-bold text-gray-900">89</div>
              <p className="text-gray-600">Successful Hires This Month</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="mb-2 text-3xl font-bold text-gray-900">$2.1M</div>
              <p className="text-gray-600">Estimated Economic Impact</p>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Benefits */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Partnership Benefits
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Card className="border-blue-200 transition-shadow hover:shadow-lg">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Member Support</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span>Comprehensive onboarding for your members</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span>Dedicated support team</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span>Training and best practices</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span>Priority customer service</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-green-200 transition-shadow hover:shadow-lg">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Co-branded Marketing</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span>Joint marketing campaigns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span>Co-branded promotional materials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span>Event coordination support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span>Social media collaboration</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-purple-200 transition-shadow hover:shadow-lg">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Regional Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span>Detailed hiring trend insights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span>Economic impact reporting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span>Member engagement metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span>Custom dashboard access</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Success Stories
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">
                      Stockton Chamber of Commerce
                    </h3>
                    <p className="mb-4 text-gray-600">
                      "Our partnership with 209jobs has helped our members fill
                      over 150 positions in the last year. The platform's focus
                      on local talent has been a game-changer for our business
                      community."
                    </p>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-current text-yellow-500" />
                      <span className="text-sm text-gray-500">
                        450+ member businesses
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">
                      Modesto Chamber of Commerce
                    </h3>
                    <p className="mb-4 text-gray-600">
                      "The co-branded marketing campaigns have increased our
                      member engagement by 40%. 209jobs truly understands the
                      needs of local businesses and job seekers."
                    </p>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-current text-yellow-500" />
                      <span className="text-sm text-gray-500">
                        320+ member businesses
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold">
            How Partnership Works
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Apply</h3>
              <p className="text-gray-600">
                Submit your partnership application with chamber details
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Setup</h3>
              <p className="text-gray-600">
                We configure your co-branded portal and member benefits
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Launch</h3>
              <p className="text-gray-600">
                Begin onboarding your members with dedicated support
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                <span className="text-2xl font-bold text-yellow-600">4</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Grow</h3>
              <p className="text-gray-600">
                Track impact and expand your community's economic growth
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Regional Focus */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold">
            Supporting Central Valley Communities
          </h2>
          <p className="mb-8 text-xl opacity-90">
            We're committed to strengthening local economies across the 209,
            from Stockton to Merced
          </p>
          <div className="mb-8 grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="flex items-center justify-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>Stockton</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>Modesto</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>Tracy</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>Manteca</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>Turlock</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>Merced</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>Lodi</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>& More</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            Ready to Partner with Us?
          </h2>
          <p className="mb-8 text-xl text-gray-600">
            Join leading chambers across the Central Valley in supporting local
            business growth
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="px-8 text-lg">
              <Link href="/signup/chamber-partner">
                <Handshake className="mr-2 h-5 w-5" />
                Become a Partner
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="px-8 text-lg"
            >
              <Link href="/contact">Schedule a Consultation</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Our team will contact you within 2 business days to discuss
            partnership opportunities
          </p>
        </div>
      </section>
    </div>
  );
}
