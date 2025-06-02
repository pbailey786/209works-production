import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import authOptions from "../../api/auth/authOptions";
import { prisma } from "../../api/auth/prisma";
import ProfileSettingsClient from "./ProfileSettingsClient";

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
    redirect("/signin");
  }

  // Get user by email since session.user.id doesn't exist by default
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });

  if (!user) {
    redirect("/signin");
  }

  const userSettings = await getUserSettings(user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">Manage your profile information, security settings, and preferences.</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-8">
          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
              <p className="text-sm text-gray-500 mt-1">Update your personal information and profile details.</p>
            </div>
            <div className="p-6">
              <ProfileSettingsClient userSettings={userSettings} />
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Security</h2>
              <p className="text-sm text-gray-500 mt-1">Manage your password and security preferences.</p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* Password Change */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Change Password</h3>
                  <div className="max-w-md">
                    <button className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      Change Password
                    </button>
                  </div>
                </div>

                {/* Two-Factor Authentication */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between max-w-md">
                    <div>
                      <p className="text-sm text-gray-600">
                        {userSettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <button className="ml-4 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                      {userSettings.twoFactorEnabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>

                {/* Email Verification */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Email Verification</h3>
                  <div className="flex items-center justify-between max-w-md">
                    <div>
                      <p className="text-sm text-gray-600">
                        {userSettings.isEmailVerified ? 'Verified' : 'Not verified'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Verify your email address to secure your account
                      </p>
                    </div>
                    {!userSettings.isEmailVerified && (
                      <button className="ml-4 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Verify Email
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Email Preferences */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Email Preferences</h2>
              <p className="text-sm text-gray-500 mt-1">Choose what email notifications you'd like to receive.</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Job Alerts</h3>
                    <p className="text-sm text-gray-500">Receive email notifications for new job matches</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Application Updates</h3>
                    <p className="text-sm text-gray-500">Get notified about application status changes</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Weekly Summary</h3>
                    <p className="text-sm text-gray-500">Receive a weekly summary of your job search activity</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Marketing Emails</h3>
                    <p className="text-sm text-gray-500">Receive updates about new features and tips</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Account Management */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Account Management</h2>
              <p className="text-sm text-gray-500 mt-1">Manage your account data and preferences.</p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* Account Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Account Information</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Account created:</span> {new Date(userSettings.createdAt).toLocaleDateString()}</p>
                    <p><span className="font-medium">Account type:</span> {userSettings.role || 'Job Seeker'}</p>
                    <p><span className="font-medium">User ID:</span> {userSettings.id}</p>
                  </div>
                </div>

                {/* Data Export */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Export Data</h3>
                  <p className="text-sm text-gray-600 mb-3">Download a copy of your account data including saved jobs, applications, and search history.</p>
                  <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Export My Data
                  </button>
                </div>

                {/* Delete Account */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-medium text-red-900 mb-3">Delete Account</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <button className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
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