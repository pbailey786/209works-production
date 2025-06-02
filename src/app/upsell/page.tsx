import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Check, 
  Star, 
  Zap, 
  Crown,
  Target,
  MessageSquare,
  BarChart3,
  Shield,
  Sparkles,
  ArrowRight,
  Users,
  FileText,
  Bell,
  Eye
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Upgrade to Premium | 209jobs',
  description: 'Unlock premium features and get noticed by top employers in the Central Valley. Premium membership for just $19/month.',
}

export default function UpsellPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Crown className="h-4 w-4" />
            Limited Time Offer
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Stand Out to{' '}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Top Employers
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Get premium features that help you land your dream job faster in the Central Valley
          </p>

          {/* Pricing Highlight */}
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto mb-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">$19</div>
              <div className="text-gray-500 mb-2">/month</div>
              <div className="text-sm text-green-600 font-medium">
                First month 50% off - Just $9.50!
              </div>
            </div>
          </div>

          <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8">
            <Link href="/signup?upgrade=premium">
              Upgrade to Premium
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          
          <p className="text-sm text-gray-500 mt-4">
            Cancel anytime • 30-day money-back guarantee
          </p>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Free vs Premium Features</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Free Plan */}
            <Card className="border-gray-200">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Free Account</CardTitle>
                <CardDescription>Basic job search features</CardDescription>
                <div className="text-3xl font-bold text-gray-900 mt-4">$0</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Basic job search</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Apply to jobs</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Basic profile</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Job alerts (weekly)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Save up to 10 jobs</span>
                </div>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="border-purple-200 bg-purple-50/50 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600">
                Recommended
              </Badge>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Premium Account</CardTitle>
                <CardDescription>Advanced features for serious job seekers</CardDescription>
                <div className="text-3xl font-bold text-gray-900 mt-4">$19</div>
                <div className="text-sm text-purple-600">Everything in Free, plus:</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">Priority application status</span>
                </div>
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-purple-500" />
                  <span>See who viewed your profile</span>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-purple-500" />
                  <span>Advanced job matching</span>
                </div>
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-purple-500" />
                  <span>Instant job alerts</span>
                </div>
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-purple-500" />
                  <span>Direct messaging with employers</span>
                </div>
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                  <span>Application analytics</span>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-purple-500" />
                  <span>Resume optimization tools</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-purple-500" />
                  <span>Access to networking events</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-purple-500" />
                  <span>Priority customer support</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Premium Benefits Detail */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Upgrade to Premium?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Get Noticed First</h3>
              <p className="text-gray-600">
                Premium members appear at the top of employer searches and get priority consideration for new job openings.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Track Your Success</h3>
              <p className="text-gray-600">
                See detailed analytics on your applications, profile views, and get insights on how to improve your job search.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Direct Access</h3>
              <p className="text-gray-600">
                Message employers directly, get instant notifications, and access exclusive networking events in the Central Valley.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Premium Success Stories</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-purple-600">SM</span>
                  </div>
                  <div>
                    <div className="font-semibold">Sarah Martinez</div>
                    <div className="text-sm text-gray-500">Marketing Manager at TechCorp</div>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  "Premium helped me land my dream job in just 3 weeks! The direct messaging feature let me connect with hiring managers before other candidates even knew about the position."
                </p>
                <div className="flex items-center gap-2 text-sm text-purple-600">
                  <Star className="h-4 w-4 fill-current" />
                  <span>Hired in 3 weeks</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-blue-600">JR</span>
                  </div>
                  <div>
                    <div className="font-semibold">James Rodriguez</div>
                    <div className="text-sm text-gray-500">Software Engineer at InnovateTech</div>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  "The application analytics showed me exactly what employers were looking for. I optimized my profile and got 5x more interview requests!"
                </p>
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <BarChart3 className="h-4 w-4" />
                  <span>5x more interviews</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-2">How does the 50% first month discount work?</h3>
              <p className="text-gray-600">New premium subscribers pay just $9.50 for their first month, then $19/month thereafter. The discount is applied automatically at checkout.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">Yes! You can cancel your premium subscription at any time. You'll continue to have access to premium features until the end of your current billing period.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">What's the money-back guarantee?</h3>
              <p className="text-gray-600">If you're not satisfied with premium features within your first 30 days, we'll provide a full refund, no questions asked.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Do premium features really help?</h3>
              <p className="text-gray-600">Premium members are 3x more likely to get hired and receive 5x more profile views on average. The priority placement and direct messaging features give you a significant advantage.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Accelerate Your Career?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of successful job seekers who upgraded to premium
          </p>
          
          <div className="bg-white/10 rounded-2xl p-6 max-w-md mx-auto mb-8">
            <div className="text-2xl font-bold mb-2">Limited Time: 50% Off</div>
            <div className="text-lg">First month just $9.50</div>
          </div>
          
          <Button asChild size="lg" variant="secondary" className="text-lg px-8">
            <Link href="/signup?upgrade=premium">
              Start Premium Today
              <Sparkles className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          
          <p className="text-sm opacity-75 mt-4">
            30-day money-back guarantee • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  )
} 