import { useState, useEffect } from '@/components/ui/card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/card';
import { Input } from '@/components/ui/card';
import { Label } from '@/components/ui/card';
import { Badge } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';


'use client';
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
  UserCheck, 
  Search, 
  Eye, 
  StopCircle,
  AlertTriangle,
  Clock,
  User,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface ImpersonationSession {
  id: string;
  targetUser: User;
  reason: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

export default function UserImpersonationPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<ImpersonationSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchSessions();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?limit=50');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/admin/impersonate');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startImpersonation = async () => {
    if (!selectedUser || !reason.trim()) {
      alert('Please select a user and provide a reason for impersonation.');
      return;
    }

    setIsImpersonating(true);
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          reason: reason.trim(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Store impersonation token in sessionStorage for security
        sessionStorage.setItem('impersonationToken', result.impersonationToken);
        sessionStorage.setItem('impersonationTarget', JSON.stringify(result.targetUser));
        
        alert(`Impersonation session started for ${selectedUser.email}. You can now navigate to the site as this user.`);
        
        setSelectedUser(null);
        setReason('');
        fetchSessions();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start impersonation');
      }
    } catch (error) {
      console.error('Impersonation failed:', error);
      alert(`Failed to start impersonation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImpersonating(false);
    }
  };

  const endImpersonation = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/admin/impersonate?sessionId=${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Clear impersonation data from sessionStorage
        sessionStorage.removeItem('impersonationToken');
        sessionStorage.removeItem('impersonationTarget');
        
        alert('Impersonation session ended successfully.');
        fetchSessions();
      } else {
        throw new Error('Failed to end impersonation');
      }
    } catch (error) {
      console.error('Failed to end impersonation:', error);
      alert('Failed to end impersonation session.');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeSessions = sessions.filter(session => session.isActive);

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800">Security Warning</h3>
              <p className="text-sm text-yellow-700 mt-1">
                User impersonation is a powerful debugging tool. Only use it for legitimate support and debugging purposes. 
                All impersonation sessions are logged and audited.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <UserCheck className="h-5 w-5" />
              Active Impersonation Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target User</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{session.targetUser.name}</div>
                        <div className="text-sm text-gray-500">{session.targetUser.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{session.reason}</TableCell>
                    <TableCell>{new Date(session.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{new Date(session.expiresAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => endImpersonation(session.id)}
                      >
                        <StopCircle className="mr-2 h-4 w-4" />
                        End Session
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Start New Impersonation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Start User Impersonation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Search */}
          <div>
            <Label htmlFor="userSearch">Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="userSearch"
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* User Selection */}
          {searchTerm && (
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No users found</div>
              ) : (
                filteredUsers.slice(0, 10).map((user) => (
                  <div
                    key={user.id}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedUser?.id === user.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{user.name || 'No name'}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Selected User & Reason */}
          {selectedUser && (
            <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
              <div>
                <Label>Selected User</Label>
                <div className="mt-1">
                  <div className="font-medium">{selectedUser.name}</div>
                  <div className="text-sm text-gray-600">{selectedUser.email}</div>
                  <Badge variant="secondary" className="mt-1">{selectedUser.role}</Badge>
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Reason for Impersonation *</Label>
                <Textarea
                  id="reason"
                  placeholder="Provide a detailed reason for impersonating this user (e.g., debugging login issue, testing user experience, etc.)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <Button
                onClick={startImpersonation}
                disabled={isImpersonating || !reason.trim() || selectedUser.role === 'admin'}
                className="w-full"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                {isImpersonating ? 'Starting Impersonation...' : 'Start Impersonation Session'}
              </Button>

              {selectedUser.role === 'admin' && (
                <p className="text-sm text-red-600">
                  Cannot impersonate admin users for security reasons.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
