'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from './PermissionGate';

import { Card } from '@/components/ui/select';
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/dialog';
  AdminRole,
  Permission,
  ROLE_PERMISSIONS,
  ROLE_DISPLAY_INFO,
  getUserPermissions
} from 'lucide-react';

interface RoleManagementProps {
  users?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
  }>;
}

export default function RoleManagement({ users = [] }: RoleManagementProps) {
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const { hasPermission, userRole } = usePermissions();

  const roleStats = Object.values(AdminRole).map(role => ({
    role,
    count: users.filter(user => user.role === role).length,
    ...ROLE_DISPLAY_INFO[role]
  }));

  const handleRoleChange = async (userId: string, newRole: string) => {
    // This would typically make an API call to update the user's role
    console.log(`Updating user ${userId} to role ${newRole}`);
    // TODO: Implement API call
  };

  const RolePermissionsDialog = ({ role }: { role: AdminRole }) => {
    const permissions = ROLE_PERMISSIONS[role];
    const roleInfo = ROLE_DISPLAY_INFO[role];

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            View Permissions
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>{roleInfo.name} Permissions</span>
            </DialogTitle>
            <DialogDescription>{roleInfo.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {permissions.map(permission => (
                <div
                  key={permission}
                  className="flex items-center space-x-2 rounded bg-gray-50 p-2"
                >
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">
                    {permission.replace(/_/g, ' ').toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {/* Role Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roleStats.map(({ role, count, name, description, color }) => (
          <Card key={role}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{name}</CardTitle>
              <Shield className={`h-4 w-4 text-${color}-500`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {description}
              </p>
              <div className="mt-3">
                <RolePermissionsDialog role={role} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role Permissions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions Matrix</CardTitle>
          <CardDescription>
            Overview of permissions assigned to each role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Permission</th>
                  {Object.values(AdminRole).map(role => (
                    <th key={role} className="min-w-[120px] p-2 text-center">
                      <div className="text-xs">
                        {ROLE_DISPLAY_INFO[role].name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.values(Permission).map(permission => (
                  <tr key={permission} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">
                      {permission.replace(/_/g, ' ').toLowerCase()}
                    </td>
                    {Object.values(AdminRole).map(role => (
                      <td key={role} className="p-2 text-center">
                        {ROLE_PERMISSIONS[role].includes(permission) ? (
                          <Check className="mx-auto h-4 w-4 text-green-500" />
                        ) : (
                          <X className="mx-auto h-4 w-4 text-gray-300" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Role Management */}
      <PermissionGate permission={Permission.MANAGE_USER_ROLES}>
        <Card>
          <CardHeader>
            <CardTitle>User Role Management</CardTitle>
            <CardDescription>Manage user roles and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users
                  .filter(
                    user =>
                      user.role !== 'jobseeker' && user.role !== 'employer'
                  )
                  .map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === 'admin'
                              ? 'destructive'
                              : user.role.includes('admin')
                                ? 'default'
                                : 'secondary'
                          }
                        >
                          {ROLE_DISPLAY_INFO[user.role as AdminRole]?.name ||
                            user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Select
                            value={user.role}
                            onValueChange={newRole =>
                              handleRoleChange(user.id, newRole)
                            }
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">
                                Admin (Legacy)
                              </SelectItem>
                              {Object.values(AdminRole).map(role => (
                                <SelectItem key={role} value={role}>
                                  {ROLE_DISPLAY_INFO[role].name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </PermissionGate>

      {/* Current User Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Your Permissions</CardTitle>
          <CardDescription>
            Permissions available to your current role: {userRole}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {getUserPermissions(userRole).map(permission => (
              <div
                key={permission}
                className="flex items-center space-x-2 rounded bg-green-50 p-2"
              >
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  {permission.replace(/_/g, ' ').toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
