import React, { useState, useEffect, Suspense } from '@/components/ui/card';
import { useUser } from '@/components/ui/card';
import { redirect } from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';

'use client';

  Crown,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Building2,
  Users,
  TrendingUp,
} from 'lucide-react';

// Component that uses search params - needs to be wrapped in Suspense
function UpgradeContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showBillingModal, setShowBillingModal] = useState(false);

  const reason = searchParams.get('reason');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || !session.user || (session!.user as any).role !== 'employer') {
      router.push('/employers/signin');
      return;
    }

    // Auto-open billing modal if redirected from job posting
    if (reason === 'job-posting') {
      setShowBillingModal(true);
    }
  }, [session, status, router, reason]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || !session.user || (session!.user as any).role !== 'employer') {
    return null;
  }

  const handleBillingSuccess = () => {
    setShowBillingModal(false);
    // Redirect based on the reason they came here
    if (reason === 'job-posting') {
      router.push('/employers/create-job-post?upgraded=true');
    } else {
      router.push('/employers/dashboard?upgraded=true');
    }
  };

  const getPageContent = () => {
    switch (reason) {
      case 'job-posting':
        return {
          title: 'Subscription Required to Post Jobs',
          description: 'To post jobs and find great candidates in the 209 area, you need an active subscription plan.',
          ctaText: 'Choose Your Plan to Post Jobs',
        };
      default:
        return {
          title: 'Upgrade Your 209 Works Account',
          description: 'Unlock powerful hiring tools and find the best local talent in the Central Valley.',
          ctaText: 'Upgrade Now',
        };
    }
  };

  const content = getPageContent();

  const features = [
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: 'AI-Powered Job Optimization',
      description: 'Transform basic job info into compelling listings that attract quality candidates',
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Local Talent Pool',
      description: 'Access to job seekers specifically in the 209 area code region',
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: 'Advanced Analytics',
      description: 'Track job performance, views, and application rates',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Priority Support',
      description: 'Get help when you need it with dedicated customer support',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-6 flex items-center justify-center">
            <div className="rounded-full bg-gradient-to-r from-blue-600 to-green-600 p-4">
              <Crown className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            {content.title}
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            {content.description}
          </p>
        </div>

        {/* Features Grid */}
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex items-center">
                <div className="mr-4 rounded-lg bg-blue-100 p-3 text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
              </div>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mb-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-green-600">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Ready to Get Started?
              </h2>
              <p className="text-gray-600">
                Join hundreds of local employers finding great talent in the 209 area.
              </p>
            </div>

            <div className="flex flex-col items-center space-y-4 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0">
              <button
                onClick={() => setShowBillingModal(true)}
                className="flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-green-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-green-700"
              >
                <Crown className="mr-2 h-5 w-5" />
                {content.ctaText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>

              <button
                onClick={() => router.push('/employers/dashboard')}
                className="flex items-center rounded-lg border border-gray-300 bg-white px-8 py-4 text-lg font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Back to Dashboard
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
              <Shield className="mr-2 h-4 w-4" />
              14-day free trial • Cancel anytime • Secure payment
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="mt-12 rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50 to-green-50 p-8">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              {[...Array(5)].map((_, i) => (
                <CheckCircle key={i} className="h-5 w-5 text-green-500" />
              ))}
            </div>
            <blockquote className="mb-4 text-lg italic text-gray-700">
              "209 Works helped us find amazing local talent. The AI job optimizer
              made our listings so much more professional and we got way more qualified applicants."
            </blockquote>
            <cite className="text-sm font-medium text-gray-900">
              — Sarah M., Local Business Owner
            </cite>
          </div>
        </div>
      </div>

      {/* BILLING REFACTOR: Billing modal for upgrade flow */}
      <BillingModal
        isOpen={showBillingModal}
        onClose={() => setShowBillingModal(false)}
        onSuccess={handleBillingSuccess}
        trigger={reason === 'job-posting' ? 'job-posting' : 'upgrade'}
        title={reason === 'job-posting' ? 'Choose Your Plan to Post Jobs' : 'Upgrade Your Account'}
        description={reason === 'job-posting'
          ? 'Select a subscription plan to start posting jobs and finding great candidates in the 209 area.'
          : 'Unlock powerful hiring tools and find the best local talent in the Central Valley.'
        }
      />
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    }>
      <UpgradeContent />
    </Suspense>
  );
}
