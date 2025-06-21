'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { useRouter } from 'lucide-react';

interface CompanyProfile {
  name: string;
  description: string;
  website: string;
  phone: string;
  address: string;
  contactEmail: string;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
}

interface NotificationSettings {
  emailApplications: boolean;
  emailWeeklyDigest: boolean;
  emailMarketing: boolean;
}

export default function SimpleSettingsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: ''
  });

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    name: '',
    description: '',
    website: '',
    phone: '',
    address: '',
    contactEmail: ''
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailApplications: true,
    emailWeeklyDigest: true,
    emailMarketing: false
  });

  // Load user data
  useEffect(() => {
    if (session?.user) {
      setUserProfile({
        name: user?.name || '',
        email: user?.email || '',
        phone: ''
      });
      setCompanyProfile(prev => ({
        ...prev,
        contactEmail: user?.email || ''
      }));
    }
  }, [session]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      // Save user profile
      if (activeTab === 'profile') {
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userProfile)
        });
        if (!response.ok) throw new Error('Failed to save profile');
      }

      // Save company profile
      if (activeTab === 'company') {
        const response = await fetch('/api/company-profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(companyProfile)
        });
        if (!response.ok) throw new Error('Failed to save company profile');
      }

      // Save notifications
      if (activeTab === 'notifications') {
        const response = await fetch('/api/user/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notifications)
        });
        if (!response.ok) throw new Error('Failed to save notifications');
      }

      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Failed to save settings. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Your Profile', icon: User },
    { id: 'company', name: 'Company Info', icon: Building },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'billing', name: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-400 transition-colors hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Account Settings
                </h1>
                <p className="mt-1 text-gray-600">
                  Manage your profile and preferences
                </p>
              </div>
            </div>

            {activeTab !== 'billing' && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>

          {saveMessage && (
            <div
              className={`mt-4 rounded-lg p-3 ${
                saveMessage.includes('successfully')
                  ? 'border border-green-200 bg-green-50 text-green-700'
                  : 'border border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {saveMessage}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center rounded-lg px-4 py-3 text-left transition-colors ${
                      activeTab === tab.id
                        ? 'border border-blue-200 bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="mb-6 text-xl font-semibold text-gray-900">
                    Your Profile
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={userProfile.name}
                        onChange={e =>
                          setUserProfile({
                            ...userProfile,
                            name: e.target.value
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        placeholder="Your full name"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={userProfile.email}
                        onChange={e =>
                          setUserProfile({
                            ...userProfile,
                            email: e.target.value
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={userProfile.phone}
                        onChange={e =>
                          setUserProfile({
                            ...userProfile,
                            phone: e.target.value
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Company Tab */}
              {activeTab === 'company' && (
                <div>
                  <h2 className="mb-6 text-xl font-semibold text-gray-900">
                    Company Information
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={companyProfile.name}
                        onChange={e =>
                          setCompanyProfile({
                            ...companyProfile,
                            name: e.target.value
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        placeholder="Your company name"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Company Description
                      </label>
                      <textarea
                        value={companyProfile.description}
                        onChange={e =>
                          setCompanyProfile({
                            ...companyProfile,
                            description: e.target.value
                          })
                        }
                        rows={4}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        placeholder="Brief description of your company..."
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Website
                        </label>
                        <input
                          type="url"
                          value={companyProfile.website}
                          onChange={e =>
                            setCompanyProfile({
                              ...companyProfile,
                              website: e.target.value
                            })
                          }
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                          placeholder="https://yourcompany.com"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={companyProfile.phone}
                          onChange={e =>
                            setCompanyProfile({
                              ...companyProfile,
                              phone: e.target.value
                            })
                          }
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Address
                      </label>
                      <input
                        type="text"
                        value={companyProfile.address}
                        onChange={e =>
                          setCompanyProfile({
                            ...companyProfile,
                            address: e.target.value
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        placeholder="123 Main St, Stockton, CA 95202"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="mb-6 text-xl font-semibold text-gray-900">
                    Notification Preferences
                  </h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          New Applications
                        </h3>
                        <p className="text-sm text-gray-600">
                          Get notified when someone applies to your jobs
                        </p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={notifications.emailApplications}
                          onChange={e =>
                            setNotifications({
                              ...notifications,
                              emailApplications: e.target.checked
                            })
                          }
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Weekly Digest
                        </h3>
                        <p className="text-sm text-gray-600">
                          Weekly summary of your hiring activity
                        </p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={notifications.emailWeeklyDigest}
                          onChange={e =>
                            setNotifications({
                              ...notifications,
                              emailWeeklyDigest: e.target.checked
                            })
                          }
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Marketing Updates
                        </h3>
                        <p className="text-sm text-gray-600">
                          Tips and updates about 209.works
                        </p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={notifications.emailMarketing}
                          onChange={e =>
                            setNotifications({
                              ...notifications,
                              emailMarketing: e.target.checked
                            })
                          }
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <div>
                  <h2 className="mb-6 text-xl font-semibold text-gray-900">
                    Billing & Subscription
                  </h2>
                  <div className="space-y-6">
                    <div className="rounded-lg bg-gray-50 p-6">
                      <h3 className="mb-2 font-medium text-gray-900">
                        Current Plan
                      </h3>
                      <p className="mb-4 text-gray-600">
                        Basic Plan - Pay per job post
                      </p>
                      <button
                        onClick={() => router.push('/employers/pricing')}
                        className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                      >
                        Upgrade to Pro
                      </button>
                    </div>

                    <div>
                      <h3 className="mb-4 font-medium text-gray-900">
                        Billing History
                      </h3>
                      <div className="text-gray-600">
                        <p>No billing history yet.</p>
                        <p className="mt-1 text-sm">
                          Your payment history will appear here after your first
                          purchase.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
