'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  MoreHorizontal,
  Edit,
  Trash2,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Crown,
  User,
  Settings,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'recruiter' | 'viewer';
  status: 'active' | 'pending' | 'suspended';
  joinedAt: string;
  lastActive?: string;
  permissions: string[];
}

interface TeamInvitation {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'recruiter' | 'viewer';
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
}

export function TeamManagement() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'recruiter' | 'viewer'>('recruiter');
  const [isInviting, setIsInviting] = useState(false);

  const roleConfig = {
    admin: {
      label: 'Admin',
      description: 'Full access to all features and settings',
      color: 'bg-red-100 text-red-800',
      icon: Crown,
      permissions: ['manage_team', 'manage_billing', 'manage_jobs', 'view_analytics', 'manage_settings'],
    },
    manager: {
      label: 'Manager',
      description: 'Manage jobs and view analytics',
      color: 'bg-blue-100 text-blue-800',
      icon: Shield,
      permissions: ['manage_jobs', 'view_analytics', 'manage_applicants'],
    },
    recruiter: {
      label: 'Recruiter',
      description: 'Post jobs and manage applicants',
      color: 'bg-green-100 text-green-800',
      icon: User,
      permissions: ['manage_jobs', 'manage_applicants'],
    },
    viewer: {
      label: 'Viewer',
      description: 'View-only access to jobs and analytics',
      color: 'bg-gray-100 text-gray-800',
      icon: Settings,
      permissions: ['view_jobs', 'view_analytics'],
    },
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setIsLoading(true);
      const [membersResponse, invitationsResponse] = await Promise.all([
        fetch('/api/employers/team/members'),
        fetch('/api/employers/team/invitations'),
      ]);

      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setTeamMembers(membersData.members || []);
      }

      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json();
        setInvitations(invitationsData.invitations || []);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      const response = await fetch('/api/employers/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      if (response.ok) {
        setInviteEmail('');
        setShowInviteDialog(false);
        await fetchTeamData();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      alert('Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/employers/team/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        await fetchTeamData();
      } else {
        alert('Failed to update member role');
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      alert('Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      const response = await fetch(`/api/employers/team/members/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTeamData();
      } else {
        alert('Failed to remove team member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove team member');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/employers/team/invitations/${invitationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTeamData();
      } else {
        alert('Failed to cancel invitation');
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      alert('Failed to cancel invitation');
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/employers/team/invitations/${invitationId}/resend`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Invitation resent successfully');
        await fetchTeamData();
      } else {
        alert('Failed to resend invitation');
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      alert('Failed to resend invitation');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
          <p className="text-gray-600">Manage your team members and their permissions</p>
        </div>
        
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#ff6b35] hover:bg-[#e55a2b]">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {Object.entries(roleConfig).map(([role, config]) => (
                    <option key={role} value={role}>
                      {config.label} - {config.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInviteMember} disabled={isInviting}>
                  {isInviting ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({teamMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No team members yet</p>
              <p className="text-sm">Invite colleagues to help manage your hiring</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => {
                const roleInfo = roleConfig[member.role];
                const RoleIcon = roleInfo.icon;
                
                return (
                  <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <RoleIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{member.name}</h4>
                        <p className="text-sm text-gray-600">{member.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={roleInfo.color}>{roleInfo.label}</Badge>
                          <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                            {member.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </span>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUpdateMemberRole(member.id, 'admin')}>
                            <Crown className="h-4 w-4 mr-2" />
                            Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateMemberRole(member.id, 'manager')}>
                            <Shield className="h-4 w-4 mr-2" />
                            Make Manager
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateMemberRole(member.id, 'recruiter')}>
                            <User className="h-4 w-4 mr-2" />
                            Make Recruiter
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations ({invitations.filter(inv => inv.status === 'pending').length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => {
                const roleInfo = roleConfig[invitation.role];
                const isExpired = new Date(invitation.expiresAt) < new Date();
                
                return (
                  <div key={invitation.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{invitation.email}</h4>
                        <p className="text-sm text-gray-600">Invited as {roleInfo.label}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={isExpired ? 'destructive' : 'secondary'}>
                            {isExpired ? 'Expired' : 'Pending'}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!isExpired && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendInvitation(invitation.id)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Resend
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelInvitation(invitation.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(roleConfig).map(([role, config]) => {
              const RoleIcon = config.icon;
              return (
                <div key={role} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <RoleIcon className="h-5 w-5" />
                    <h4 className="font-medium">{config.label}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{config.description}</p>
                  <div className="space-y-1">
                    {config.permissions.map((permission) => (
                      <div key={permission} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-gray-600">
                          {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
