import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Users, 
  CheckCircle, 
  Shield,
  TrendingUp,
  Handshake
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Chamber Partner Signup | 209jobs',
  description: 'Join as a Chamber of Commerce partner to support local businesses and drive regional economic growth',
}

export default function ChamberPartnerSignupPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Chamber Partner Registration
        </h1>
        <p className="text-gray-600">
          Partner with us to support local businesses and drive regional economic growth
        </p>
      </div>

      {/* Partnership Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="text-center">
            <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <CardTitle className="text-lg">Member Support</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center">
              Comprehensive onboarding and ongoing support for your chamber members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <CardTitle className="text-lg">Co-branded Marketing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center">
              Joint marketing campaigns and promotional materials featuring your chamber
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Building2 className="h-8 w-8 mx-auto text-purple-600 mb-2" />
            <CardTitle className="text-lg">Regional Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center">
              Detailed insights into regional hiring trends and economic impact
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5" />
              Partnership Information
            </CardTitle>
            <CardDescription>
              Tell us about your chamber and partnership goals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="partnershipCode">Partnership Code *</Label>
              <Input 
                id="partnershipCode" 
                placeholder="Enter your partnership code"
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                Contact us if you don't have a partnership code
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chamberName">Chamber Name *</Label>
                <Input 
                  id="chamberName" 
                  placeholder="e.g., Stockton Chamber of Commerce"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Primary Region *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="central-valley">Central Valley (209)</SelectItem>
                    <SelectItem value="sacramento">Sacramento (916)</SelectItem>
                    <SelectItem value="east-bay">East Bay (510)</SelectItem>
                    <SelectItem value="northern-ca">Northern California</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Chamber Website</Label>
              <Input 
                id="website" 
                type="url"
                placeholder="https://your-chamber.org"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberCount">Approximate Member Count</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select member count" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-50">1-50 members</SelectItem>
                  <SelectItem value="51-100">51-100 members</SelectItem>
                  <SelectItem value="101-250">101-250 members</SelectItem>
                  <SelectItem value="251-500">251-500 members</SelectItem>
                  <SelectItem value="500+">500+ members</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals">Partnership Goals</Label>
              <Textarea 
                id="goals"
                placeholder="Describe your goals for this partnership and how you'd like to support local businesses..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Primary Contact
            </CardTitle>
            <CardDescription>
              Main point of contact for the partnership
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" placeholder="Smith" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title/Position *</Label>
              <Input 
                id="title" 
                placeholder="e.g., Executive Director, President"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input 
                id="email" 
                type="email"
                placeholder="john@chamber.org"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                type="tel"
                placeholder="(209) 555-0123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Chamber Address</Label>
              <Textarea 
                id="address"
                placeholder="Street address, city, state, zip"
                rows={3}
              />
            </div>

            {/* Partnership Features */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Partnership Features</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="cobranding" defaultChecked />
                  <Label htmlFor="cobranding" className="text-sm">
                    Co-branded member portal
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="analytics" defaultChecked />
                  <Label htmlFor="analytics" className="text-sm">
                    Regional analytics dashboard
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="support" defaultChecked />
                  <Label htmlFor="support" className="text-sm">
                    Dedicated member support
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="marketing" defaultChecked />
                  <Label htmlFor="marketing" className="text-sm">
                    Joint marketing campaigns
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partnership Benefits Summary */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            What's Included in Your Partnership
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">✓</Badge>
              <span className="text-sm">Member onboarding support</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">✓</Badge>
              <span className="text-sm">Co-branded marketing materials</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">✓</Badge>
              <span className="text-sm">Regional analytics dashboard</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">✓</Badge>
              <span className="text-sm">Dedicated account manager</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">✓</Badge>
              <span className="text-sm">Member discount programs</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">✓</Badge>
              <span className="text-sm">Event coordination support</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">✓</Badge>
              <span className="text-sm">Economic impact reporting</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">✓</Badge>
              <span className="text-sm">Priority customer support</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Submit */}
      <div className="mt-8 space-y-6">
        <div className="flex items-start space-x-2">
          <Checkbox id="terms" />
          <Label htmlFor="terms" className="text-sm leading-relaxed">
            I agree to the{' '}
            <Link href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
            , and I have the authority to enter into this partnership on behalf of my chamber.
          </Label>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="flex-1">
            <Shield className="h-4 w-4 mr-2" />
            Submit Partnership Application
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/contact">
              Contact Us First
            </Link>
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Our team will review your application and contact you within 2 business days to discuss next steps.
        </p>
      </div>
    </div>
  )
} 