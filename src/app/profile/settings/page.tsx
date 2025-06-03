import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import authOptions from '../../api/auth/authOptions';
import { prisma } from '../../api/auth/prisma';
import ProfileSettingsClient from './ProfileSettingsClient';

// Server-side data fetching
async function getUserSettings(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        profilePictureUrl: true,
        resumeUrl: true,
        bio: true,
        location: true,
        phoneNumber: true,
        companyWebsite: true,
        role: true,
        twoFactorEnabled: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    console.error('Error fetching user settings:', error);
    throw error;
  }
}

export default async function ProfileSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/signin');
  }

  // Get user by email since session.user.id doesn't exist by default
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    redirect('/signin');
  }

  const userSettings = await getUserSettings(user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your profile information, security settings, and preferences.
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-8">
          {/* Profile Information */}
          <div className="rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">
                Profile Information
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Update your personal information and profile details.
              </p>
            </div>
            <div className="p-6">
              <ProfileSettingsClient userSettings={userSettings} />
            </div>
          </div>

          {/* Security Settings */}
          <div className="rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">Security</h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage your password and security preferences.
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* Password Change */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-gray-900">
                    Change Password
                  </h3>
                  <div className="max-w-md">
                    <button className="flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                      Change Password
                    </button>
                  </div>
                </div>

                {/* Two-Factor Authentication */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-gray-900">
                    Two-Factor Authentication
                  </h3>
                  <div className="flex max-w-md items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        {userSettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <button className="ml-4 rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">
                      {userSettings.twoFactorEnabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>

                {/* Email Verification */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-gray-900">
                    Email Verification
                  </h3>
                  <div className="flex max-w-md items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        {userSettings.isEmailVerified
                          ? 'Verified'
                          : 'Not verified'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Verify your email address to secure your account
                      </p>
                    </div>
                    {!userSettings.isEmailVerified && (
                      <button className="ml-4 rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">
                        Verify Email
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Email Preferences */}
          <div className="rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">
                Email Preferences
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Choose what email notifications you'd like to receive.
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Job Alerts
                    </h3>
                    <p className="text-sm text-gray-500">
                      Receive email notifications for new job matches
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      defaultChecked
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Application Updates
                    </h3>
                    <p className="text-sm text-gray-500">
                      Get notified about application status changes
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      defaultChecked
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Weekly Summary
                    </h3>
                    <p className="text-sm text-gray-500">
                      Receive a weekly summary of your job search activity
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" className="peer sr-only" />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Marketing Emails
                    </h3>
                    <p className="text-sm text-gray-500">
                      Receive updates about new features and tips
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" className="peer sr-only" />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Account Management */}
          <div className="rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">
                Account Management
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage your account data and preferences.
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* Account Information */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-gray-900">
                    Account Information
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Account created:</span>{' '}
                      {new Date(userSettings.createdAt).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-medium">Account type:</span>{' '}
                      {userSettings.role || 'Job Seeker'}
                    </p>
                    <p>
                      <span className="font-medium">User ID:</span>{' '}
                      {userSettings.id}
                    </p>
                  </div>
                </div>

                {/* Data Export */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-gray-900">
                    Export Data
                  </h3>
                  <p className="mb-3 text-sm text-gray-600">
                    Download a copy of your account data including saved jobs,
                    applications, and search history.
                  </p>
                  <button className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    Export My Data
                  </button>
                </div>

                {/* Delete Account */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="mb-3 text-sm font-medium text-red-900">
                    Delete Account
                  </h3>
                  <p className="mb-3 text-sm text-gray-600">
                    Permanently delete your account and all associated data.
                    This action cannot be undone.
                  </p>
                  <button className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
