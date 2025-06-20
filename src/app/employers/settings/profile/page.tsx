import { useState, useEffect } from '@/components/ui/card';
import { useUser } from '@/components/ui/card';
import { redirect } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

'use client';

  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Save,
  AlertCircle,
  CheckCircle,
  Upload,
  ArrowRight,
} from 'lucide-react';

interface CompanyProfile {
  name: string;
  description: string;
  website: string;
  industry: string;
  size: string;
  founded: string;
  headquarters: string;
  contactEmail: string;
  contactPhone: string;
  logo?: string;
}

export default function EmployerProfileSettingsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [profile, setProfile] = useState<CompanyProfile>({
    name: '',
    description: '',
    website: '',
    industry: '',
    size: '',
    founded: '',
    headquarters: '',
    contactEmail: '',
    contactPhone: '',
    logo: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isFirstTime, setIsFirstTime] = useState(false);

  const companySizes = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '501-1000 employees',
    '1000+ employees',
  ];

  const industries = [
    'Healthcare',
    'Manufacturing',
    'Retail',
    'Food Service',
    'Transportation & Logistics',
    'Construction',
    'Education',
    'Technology',
    'Finance & Banking',
    'Real Estate',
    'Professional Services',
    'Government',
    'Non-Profit',
    'Agriculture',
    'Other',
  ];

  // Load existing company profile
  useEffect(() => {
    const loadProfile = async () => {
      if (status === 'authenticated' && (session?.user as any)?.id) {
        try {
          const response = await fetch('/api/company-profile');
          if (response.ok) {
            const data = await response.json();
            if (data.company) {
              setProfile({
                name: data.company.name || '',
                description: data.company.description || '',
                website: data.company.website || '',
                industry: data.company.industry || '',
                size: data.company.size || '',
                founded: data.company.founded?.toString() || '',
                headquarters: data.company.headquarters || '',
                contactEmail:
                  data.company.contactEmail || user?.email || '',
                contactPhone: data.company.contactPhone || '',
                logo: data.company.logo || '',
              });
            } else {
              // New company profile - pre-fill with user email
              setProfile(prev => ({
                ...prev,
                contactEmail: user?.email || '',
              }));
              setIsFirstTime(true);
            }
          }
        } catch (error) {
          console.error('Error loading company profile:', error);
          setProfile(prev => ({
            ...prev,
            contactEmail: user?.email || '',
          }));
          setIsFirstTime(true);
        }
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [session, status]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/company-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Company profile saved successfully!',
        });
        setIsFirstTime(false);
      } else {
        const errorData = await response.json();
        setMessage({
          type: 'error',
          text: errorData.error || 'Failed to save profile',
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to save profile' });
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading company profile...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/employers/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Company Profile</h1>
          <p className="mt-2 text-gray-600">
            {isFirstTime
              ? 'Set up your company profile to auto-fill job posting information and attract top talent.'
              : 'Manage your company information to improve job postings and attract candidates.'}
          </p>
        </div>

        {/* Quick Benefits */}
        {isFirstTime && (
          <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h3 className="mb-3 text-lg font-semibold text-blue-900">
              🚀 Complete your profile to:
            </h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                Auto-fill company information when posting jobs
              </li>
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                Build trust with potential candidates
              </li>
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                Improve your job listing visibility
              </li>
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                Show up in local business searches
              </li>
            </ul>
          </div>
        )}

        {/* Message */}
        {message && (
          <div
            className={`mb-6 rounded-lg p-4 ${
              message.type === 'success'
                ? 'border border-green-200 bg-green-50'
                : 'border border-red-200 bg-red-50'
            }`}
          >
            <div className="flex">
              {message.type === 'success' ? (
                <CheckCircle className="mr-2 h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="mr-2 h-5 w-5 text-red-400" />
              )}
              <p
                className={
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }
              >
                {message.text}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Company Information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
              <Building2 className="mr-2 h-5 w-5" />
              Company Information
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label
                  htmlFor="company-name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Company Name *
                </label>
                <input
                  id="company-name"
                  type="text"
                  value={profile.name}
                  onChange={e =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Acme Manufacturing Co."
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="industry"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Industry *
                </label>
                <select
                  id="industry"
                  value={profile.industry}
                  onChange={e =>
                    setProfile({ ...profile, industry: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select industry</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="company-size"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Company Size
                </label>
                <select
                  id="company-size"
                  value={profile.size}
                  onChange={e =>
                    setProfile({ ...profile, size: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select size</option>
                  {companySizes.map(size => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="website"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Website
                </label>
                <input
                  id="website"
                  type="url"
                  value={profile.website}
                  onChange={e =>
                    setProfile({ ...profile, website: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="https://www.company.com"
                />
              </div>

              <div>
                <label
                  htmlFor="founded"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Founded Year
                </label>
                <input
                  id="founded"
                  type="number"
                  value={profile.founded}
                  onChange={e =>
                    setProfile({ ...profile, founded: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="2020"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Company Description
                </label>
                <textarea
                  id="description"
                  value={profile.description}
                  onChange={e =>
                    setProfile({ ...profile, description: e.target.value })
                  }
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell candidates about your company, culture, and mission..."
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
              <Mail className="mr-2 h-5 w-5" />
              Contact Information
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="contact-email"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Contact Email *
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={profile.contactEmail}
                  onChange={e =>
                    setProfile({ ...profile, contactEmail: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="hiring@company.com"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="contact-phone"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Phone Number
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  value={profile.contactPhone}
                  onChange={e =>
                    setProfile({ ...profile, contactPhone: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="(209) 555-0123"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="headquarters"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Headquarters/Main Location
                </label>
                <input
                  id="headquarters"
                  type="text"
                  value={profile.headquarters}
                  onChange={e =>
                    setProfile({ ...profile, headquarters: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="Stockton, CA"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Save Your Profile
                </h3>
                <p className="text-sm text-gray-600">
                  This information will auto-fill when posting jobs.
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Profile
                    </>
                  )}
                </button>

                {!isFirstTime && (
                  <button
                    type="button"
                    onClick={() => router.push('/employers/post-job')}
                    className="flex items-center rounded-lg bg-green-600 px-6 py-3 font-medium text-white transition-colors hover:bg-green-700"
                  >
                    Post a Job
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
