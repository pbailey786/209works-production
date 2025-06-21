'use client';

import { useState } from 'react';

import {
  User,
  Building,
  CreditCard,
  Bell,
  Users,
  Shield,
  Mail,
  Globe,
  Settings,
  ChevronRight,
  Edit,
  Save,
  Camera,
  MapPin,
  Phone,
  ExternalLink,
} from 'lucide-react';

export default function EmployerSettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');

  // Mock company data
  const [companyData, setCompanyData] = useState({
    name: 'TechCorp Solutions',
    description: 'Leading technology solutions provider in the Central Valley',
    website: 'https://techcorp.com',
    industry: 'Technology',
    size: '50-200 employees',
    location: 'Stockton, CA',
    phone: '(209) 555-0123',
    email: 'hr@techcorp.com',
    logo: null,
  });

  const settingsCategories = [
    {
      id: 'profile',
      title: 'Company Profile',
      description: 'Manage your company information and branding',
      icon: Building,
      href: '/employers/settings/profile',
    },
    {
      id: 'team',
      title: 'Team Management',
      description: 'Add team members and manage permissions',
      icon: Users,
      href: '/employers/settings/team',
    },
    {
      id: 'billing',
      title: 'Billing & Subscription',
      description: 'Manage your subscription and payment methods',
      icon: CreditCard,
      href: '/employers/settings/billing',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Configure email and alert preferences',
      icon: Bell,
      href: '/employers/settings/alerts',
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      description: 'Two-factor authentication and privacy settings',
      icon: Shield,
      href: '/employers/settings/security',
    },
    // Temporarily hidden - will add back later
    // {
    //   id: "integrations",
    //   title: "Integrations",
    //   description: "Connect with HR systems and third-party tools",
    //   icon: Globe,
    //   href: "/employers/settings/payment-integration"
    // }
  ];

  const handleSave = () => {
    console.log('Saving company data:', companyData);
    // Handle save logic here
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">
          Manage your company profile, team, billing, and platform preferences
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">Settings Categories</h3>
            <nav className="space-y-2">
              {settingsCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveSection(category.id)}
                  className={`flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors ${
                    activeSection === category.id
                      ? 'border border-blue-200 bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <category.icon className="h-5 w-5" />
                    <div>
                      <div className="font-medium">{category.title}</div>
                      <div className="text-xs text-gray-500">
                        {category.description}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ))}
            </nav>

            <div className="mt-6 border-t pt-6">
              <Link
                href="/employers/contact"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-500"
              >
                <Mail className="h-4 w-4" />
                <span>Contact Support</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeSection === 'profile' && (
            <div className="space-y-6">
              {/* Company Profile */}
              <div className="rounded-lg border bg-white p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Company Profile</h3>
                  <Link
                    href="/employers/settings/profile"
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-500"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Details</span>
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Company Logo */}
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Company Logo
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-200">
                        {companyData.logo ? (
                          <img
                            src={companyData.logo}
                            alt="Company logo"
                            className="h-full w-full rounded-lg object-cover"
                          />
                        ) : (
                          <Building className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <button className="flex items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50">
                        <Camera className="h-4 w-4" />
                        <span>Upload Logo</span>
                      </button>
                    </div>
                  </div>

                  {/* Company Name */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={companyData.name}
                      onChange={e =>
                        setCompanyData({ ...companyData, name: e.target.value })
                      }
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Industry */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Industry
                    </label>
                    <select
                      value={companyData.industry}
                      onChange={e =>
                        setCompanyData({
                          ...companyData,
                          industry: e.target.value,
                        })
                      }
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>Technology</option>
                      <option>Healthcare</option>
                      <option>Finance</option>
                      <option>Manufacturing</option>
                      <option>Retail</option>
                      <option>Other</option>
                    </select>
                  </div>

                  {/* Company Size */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Company Size
                    </label>
                    <select
                      value={companyData.size}
                      onChange={e =>
                        setCompanyData({ ...companyData, size: e.target.value })
                      }
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>1-10 employees</option>
                      <option>11-50 employees</option>
                      <option>50-200 employees</option>
                      <option>200-1000 employees</option>
                      <option>1000+ employees</option>
                    </select>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={companyData.location}
                        onChange={e =>
                          setCompanyData({
                            ...companyData,
                            location: e.target.value,
                          })
                        }
                        className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Website
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Globe className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="url"
                        value={companyData.website}
                        onChange={e =>
                          setCompanyData({
                            ...companyData,
                            website: e.target.value,
                          })
                        }
                        className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        value={companyData.phone}
                        onChange={e =>
                          setCompanyData({
                            ...companyData,
                            phone: e.target.value,
                          })
                        }
                        className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Contact Email
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={companyData.email}
                        onChange={e =>
                          setCompanyData({
                            ...companyData,
                            email: e.target.value,
                          })
                        }
                        className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Company Description
                    </label>
                    <textarea
                      rows={4}
                      value={companyData.description}
                      onChange={e =>
                        setCompanyData({
                          ...companyData,
                          description: e.target.value,
                        })
                      }
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tell candidates about your company..."
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Other sections show overview cards */}
          {activeSection !== 'profile' && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {settingsCategories
                .filter(cat => cat.id === activeSection)
                .map(category => (
                  <div key={category.id} className="md:col-span-2">
                    <div className="rounded-lg border bg-white p-6">
                      <div className="mb-4 flex items-center space-x-3">
                        <div className="rounded-lg bg-blue-100 p-2">
                          <category.icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">
                            {category.title}
                          </h3>
                          <p className="text-gray-600">
                            {category.description}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {category.id === 'team' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                              <div>
                                <p className="font-medium">Team Members</p>
                                <p className="text-sm text-gray-600">
                                  3 active members
                                </p>
                              </div>
                              <Link
                                href={category.href}
                                className="text-blue-600 hover:text-blue-500"
                              >
                                Manage →
                              </Link>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                              <div>
                                <p className="font-medium">Permissions</p>
                                <p className="text-sm text-gray-600">
                                  Role-based access control
                                </p>
                              </div>
                              <Link
                                href={category.href}
                                className="text-blue-600 hover:text-blue-500"
                              >
                                Configure →
                              </Link>
                            </div>
                          </div>
                        )}

                        {category.id === 'billing' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                              <div>
                                <p className="font-medium">Current Plan</p>
                                <p className="text-sm text-gray-600">
                                  Professional - $99/month
                                </p>
                              </div>
                              <Link
                                href={category.href}
                                className="text-blue-600 hover:text-blue-500"
                              >
                                Manage →
                              </Link>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                              <div>
                                <p className="font-medium">Payment Method</p>
                                <p className="text-sm text-gray-600">
                                  •••• •••• •••• 4242
                                </p>
                              </div>
                              <Link
                                href={category.href}
                                className="text-blue-600 hover:text-blue-500"
                              >
                                Update →
                              </Link>
                            </div>
                          </div>
                        )}

                        {category.id === 'notifications' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                              <div>
                                <p className="font-medium">
                                  Email Notifications
                                </p>
                                <p className="text-sm text-gray-600">
                                  Application alerts enabled
                                </p>
                              </div>
                              <Link
                                href={category.href}
                                className="text-blue-600 hover:text-blue-500"
                              >
                                Configure →
                              </Link>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                              <div>
                                <p className="font-medium">SMS Alerts</p>
                                <p className="text-sm text-gray-600">
                                  Urgent notifications only
                                </p>
                              </div>
                              <Link
                                href={category.href}
                                className="text-blue-600 hover:text-blue-500"
                              >
                                Manage →
                              </Link>
                            </div>
                          </div>
                        )}

                        {category.id === 'security' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                              <div>
                                <p className="font-medium">
                                  Two-Factor Authentication
                                </p>
                                <p className="text-sm text-green-600">
                                  Enabled
                                </p>
                              </div>
                              <Link
                                href={category.href}
                                className="text-blue-600 hover:text-blue-500"
                              >
                                Manage →
                              </Link>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                              <div>
                                <p className="font-medium">Login Sessions</p>
                                <p className="text-sm text-gray-600">
                                  2 active sessions
                                </p>
                              </div>
                              <Link
                                href={category.href}
                                className="text-blue-600 hover:text-blue-500"
                              >
                                Review →
                              </Link>
                            </div>
                          </div>
                        )}

                        {/* Integrations section temporarily hidden */}
                      </div>

                      <div className="mt-6">
                        <Link
                          href={category.href}
                          className="flex w-fit items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Open {category.title}</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
