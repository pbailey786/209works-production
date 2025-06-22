// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '../../api/auth/authOptions';
import { prisma } from '../../api/auth/prisma';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RoleManagement from '@/components/admin/RoleManagement';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { Permission } from '@/lib/rbac/permissions';
import {
  Settings,
  Shield,
  Users,
  Database,
  Mail,
  Bell,
  Lock,
  Globe,
} from 'lucide-react';

export default async function AdminSettingsPage() {
  // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session;

  // Fetch admin users for role management
  const adminUsers = await prisma.user.findMany({
    where: {
      OR: [{ role: 'admin' }, { role: 'admin' }],
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
          <p className="mt-1 text-gray-600">
            Manage system settings, roles, and configurations
          </p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="roles" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Roles</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>System</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center space-x-2"
          >
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Lock className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Role Management Tab */}
        <TabsContent value="roles">
          <PermissionGate
            permission={Permission.MANAGE_ADMIN_ROLES}
            fallback={
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    You don't have permission to manage roles.
                  </div>
                </CardContent>
              </Card>
            }
          >
            <RoleManagement
              users={adminUsers.map(user => ({
                ...user,
                name: user.name || 'Unknown User',
                role: user.role as string,
              }))}
            />
          </PermissionGate>
        </TabsContent>

        {/* User Settings Tab */}
        <TabsContent value="users">
          <PermissionGate permission={Permission.MANAGE_USER_ROLES}>
            <Card>
              <CardHeader>
                <CardTitle>User Management Settings</CardTitle>
                <CardDescription>
                  Configure user registration, verification, and account
                  settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Registration Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">
                              Allow new registrations
                            </span>
                            <span className="text-sm text-green-600">
                              Enabled
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">
                              Email verification required
                            </span>
                            <span className="text-sm text-green-600">
                              Enabled
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">
                              Auto-approve employers
                            </span>
                            <span className="text-sm text-yellow-600">
                              Manual Review
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Account Policies
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">
                              Password minimum length
                            </span>
                            <span className="text-sm">8 characters</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Session timeout</span>
                            <span className="text-sm">24 hours</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">
                              Two-factor authentication
                            </span>
                            <span className="text-sm text-blue-600">
                              Optional
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </PermissionGate>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="system">
          <PermissionGate permission={Permission.MANAGE_SYSTEM_SETTINGS}>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                  <CardDescription>
                    Core system settings and configurations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-medium">Database</h4>
                      <div className="text-sm text-gray-600">
                        <div>Status: Connected</div>
                        <div>Pool Size: 10 connections</div>
                        <div>Query Timeout: 30s</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Cache</h4>
                      <div className="text-sm text-gray-600">
                        <div>Redis Status: Connected</div>
                        <div>Hit Rate: 94.2%</div>
                        <div>Memory Usage: 45MB</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Feature Flags</CardTitle>
                  <CardDescription>
                    Enable or disable platform features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Job scraping from external sources</span>
                      <span className="text-green-600">Enabled</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>AI-powered job matching</span>
                      <span className="text-green-600">Enabled</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Real-time notifications</span>
                      <span className="text-green-600">Enabled</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Advanced analytics</span>
                      <span className="text-blue-600">Beta</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </PermissionGate>
        </TabsContent>

        {/* Email Settings Tab */}
        <TabsContent value="email">
          <PermissionGate permission={Permission.MANAGE_EMAIL_TEMPLATES}>
            <Card>
              <CardHeader>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>
                  Manage email templates and delivery settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-medium">SMTP Settings</h4>
                      <div className="text-sm text-gray-600">
                        <div>Provider: SendGrid</div>
                        <div>Status: Connected</div>
                        <div>Daily Limit: 10,000 emails</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Email Templates</h4>
                      <div className="text-sm text-gray-600">
                        <div>Welcome Email: Active</div>
                        <div>Job Alert: Active</div>
                        <div>Password Reset: Active</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </PermissionGate>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure system notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>New user registrations</span>
                    <span className="text-green-600">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Job posting approvals needed</span>
                    <span className="text-green-600">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>System errors</span>
                    <span className="text-green-600">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Weekly analytics reports</span>
                    <span className="text-blue-600">Weekly</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <PermissionGate permission={Permission.MANAGE_SYSTEM_SETTINGS}>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Configure security policies and access controls
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <h4 className="font-medium">Authentication</h4>
                        <div className="text-sm text-gray-600">
                          <div>JWT Expiration: 24 hours</div>
                          <div>Refresh Token: 7 days</div>
                          <div>Max Login Attempts: 5</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Rate Limiting</h4>
                        <div className="text-sm text-gray-600">
                          <div>API Requests: 1000/hour</div>
                          <div>Login Attempts: 5/minute</div>
                          <div>Password Reset: 3/hour</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Audit & Compliance</CardTitle>
                  <CardDescription>
                    Security monitoring and compliance settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Audit logging</span>
                      <span className="text-green-600">Enabled</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Failed login monitoring</span>
                      <span className="text-green-600">Enabled</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Data retention policy</span>
                      <span className="text-blue-600">2 years</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>GDPR compliance</span>
                      <span className="text-green-600">Active</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </PermissionGate>
        </TabsContent>
      </Tabs>
    </div>
  );
}
