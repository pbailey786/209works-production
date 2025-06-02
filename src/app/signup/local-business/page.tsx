'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Building2,
  MapPin,
  CheckCircle,
  Shield,
  Star,
  Users,
  Percent,
  Award
} from 'lucide-react'
import Link from 'next/link'
import PricingSection from '@/components/pricing/PricingSection'

// Define pricing plans
const pricingPlans = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 50,
    yearlyPrice: 50 * 12 * 0.85, // 15% discount
    yearlyDiscount: 15,
    description: 'Perfect for small businesses',
    features: [
      '1 Active Job Post',
      '30-day job listing duration',
      'Basic analytics',
      'Email support',
      'Local 209 targeting'
    ],
    chamberDiscount: 25
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 99,
    yearlyPrice: 99 * 12 * 0.85, // 15% discount
    yearlyDiscount: 15,
    description: 'Best value for growing businesses',
    features: [
      '3 Active Job Posts',
      '60-day job listing duration',
      'Advanced analytics & insights',
      'Priority support',
      'JobsGPT AI matching',
      'Resume database access'
    ],
    popular: true,
    badge: 'Most Popular',
    chamberDiscount: 25
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 200,
    yearlyPrice: 200 * 12 * 0.8, // 20% discount
    yearlyDiscount: 20,
    description: 'For established businesses',
    features: [
      '10 Active Job Posts',
      '90-day job listing duration',
      'Premium analytics dashboard',
      'Dedicated account manager',
      'Custom branding options',
      'API access'
    ],
    chamberDiscount: 25
  }
];

export default function LocalBusinessSignupPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
          Join 209 Works
        </h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Local Business Registration
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Built for the 209. Made for the people who work here. Special benefits for chamber members and local businesses.
        </p>
      </div>

      {/* Chamber Member Benefits Alert */}
      <Alert className="mb-8 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
        <Award className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>Chamber Members:</strong> Enjoy 25% off your first year, priority support, and exclusive local business features!
        </AlertDescription>
      </Alert>

      {/* Local Business Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-orange-200 hover:border-orange-300 transition-colors">
          <CardHeader className="text-center">
            <div className="w-12 h-12 mx-auto bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg flex items-center justify-center mb-3">
              <Percent className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-lg text-gray-900">Chamber Discounts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center">
              25% off for chamber members plus exclusive local business pricing
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 hover:border-blue-300 transition-colors">
          <CardHeader className="text-center">
            <div className="w-12 h-12 mx-auto bg-gradient-to-r from-blue-100 to-green-100 rounded-lg flex items-center justify-center mb-3">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg text-gray-900">Hyper-Local Focus</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center">
              Target local talent in the 209 and support your community's economic growth
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 hover:border-green-300 transition-colors">
          <CardHeader className="text-center">
            <div className="w-12 h-12 mx-auto bg-gradient-to-r from-green-100 to-blue-100 rounded-lg flex items-center justify-center mb-3">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-lg text-gray-900">Local Support</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center">
              Dedicated support team familiar with local business needs and the 209 area
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Information
            </CardTitle>
            <CardDescription>
              Tell us about your local business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input 
                id="businessName" 
                placeholder="Your Business Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agriculture">Agriculture</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="professional-services">Professional Services</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeCount">Employee Count</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-5">1-5 employees</SelectItem>
                    <SelectItem value="6-10">6-10 employees</SelectItem>
                    <SelectItem value="11-25">11-25 employees</SelectItem>
                    <SelectItem value="26-50">26-50 employees</SelectItem>
                    <SelectItem value="51-100">51-100 employees</SelectItem>
                    <SelectItem value="100+">100+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Business Website</Label>
              <Input 
                id="website" 
                type="url"
                placeholder="https://yourbusiness.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Business Description</Label>
              <Textarea 
                id="description"
                placeholder="Briefly describe your business and what you do..."
                rows={4}
              />
            </div>

            {/* Chamber Membership */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Chamber Membership</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="chamberMember" />
                  <Label htmlFor="chamberMember" className="text-sm">
                    I am a chamber of commerce member
                  </Label>
                </div>
                <div className="ml-6 space-y-2">
                  <Label htmlFor="chamberName" className="text-sm">Chamber Name</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your chamber" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stockton">Stockton Chamber of Commerce</SelectItem>
                      <SelectItem value="modesto">Modesto Chamber of Commerce</SelectItem>
                      <SelectItem value="tracy">Tracy Chamber of Commerce</SelectItem>
                      <SelectItem value="manteca">Manteca Chamber of Commerce</SelectItem>
                      <SelectItem value="turlock">Turlock Chamber of Commerce</SelectItem>
                      <SelectItem value="lodi">Lodi Chamber of Commerce</SelectItem>
                      <SelectItem value="other">Other Chamber</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location & Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location & Contact
            </CardTitle>
            <CardDescription>
              Business location and primary contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="address">Business Address *</Label>
              <Textarea 
                id="address"
                placeholder="Street address, city, state, zip"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stockton">Stockton</SelectItem>
                    <SelectItem value="modesto">Modesto</SelectItem>
                    <SelectItem value="tracy">Tracy</SelectItem>
                    <SelectItem value="manteca">Manteca</SelectItem>
                    <SelectItem value="turlock">Turlock</SelectItem>
                    <SelectItem value="lodi">Lodi</SelectItem>
                    <SelectItem value="merced">Merced</SelectItem>
                    <SelectItem value="other-209">Other (209 area)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input 
                  id="zipCode" 
                  placeholder="95202"
                  maxLength={5}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Contact First Name *</Label>
                <Input id="firstName" placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Contact Last Name *</Label>
                <Input id="lastName" placeholder="Smith" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title/Position *</Label>
              <Input 
                id="title" 
                placeholder="e.g., Owner, Manager, HR Director"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input 
                id="email" 
                type="email"
                placeholder="john@yourbusiness.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input 
                id="phone" 
                type="tel"
                placeholder="(209) 555-0123"
              />
            </div>

            {/* Business Verification */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Business Verification</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="businessLicense" />
                  <Label htmlFor="businessLicense" className="text-sm">
                    I have a valid business license
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="localBusiness" />
                  <Label htmlFor="localBusiness" className="text-sm">
                    This is a locally-owned business
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="hiringLocally" />
                  <Label htmlFor="hiringLocally" className="text-sm">
                    I plan to hire local talent
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Pricing Section */}
      <PricingSection
        plans={pricingPlans}
        title="Choose Your Plan"
        subtitle="Simple, transparent pricing for local businesses in the 209"
        showChamberToggle={true}
        onPlanSelect={(planId, billingInterval) => {
          console.log('Selected plan:', planId, 'billing:', billingInterval);
          // Handle plan selection - could redirect to checkout or store selection
        }}
        className="mt-8"
      />

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
            , and I have the authority to register this business.
          </Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox id="compliance" />
          <Label htmlFor="compliance" className="text-sm leading-relaxed">
            I confirm that my business complies with all local, state, and federal employment laws and regulations.
          </Label>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-lg">
            <Shield className="h-4 w-4 mr-2" />
            Create Local Business Account
          </Button>
          <Button variant="outline" size="lg" className="border-gray-300 hover:border-blue-300 hover:bg-blue-50" asChild>
            <Link href="/employers/signup">
              Standard Employer Signup
            </Link>
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Local business verification may take 1-2 business days. Chamber member discounts will be applied after verification.
        </p>
      </div>
    </div>
  )
} 