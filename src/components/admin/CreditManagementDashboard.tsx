'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Users, 
  TrendingUp, 
  Clock, 
  Plus, 
  Search,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface CreditData {
  totalCreditsIssued: number;
  totalCreditsUsed: number;
  totalCreditsExpired: number;
  activeCredits: number;
  recentTransactions: any[];
  topCreditUsers: any[];
  creditsByType: any[];
}

interface CreditManagementDashboardProps {
  creditData: CreditData;
}

export default function CreditManagementDashboard({ creditData }: CreditManagementDashboardProps) {
  const [isAddCreditDialogOpen, setIsAddCreditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddCredits = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/credits/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: formData.get('userEmail'),
          creditAmount: parseInt(formData.get('creditAmount') as string),
          creditType: formData.get('creditType'),
          note: formData.get('note'),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign credits');
      }

      toast.success('Credits assigned successfully!');
      setIsAddCreditDialogOpen(false);
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error assigning credits:', error);
      toast.error('Failed to assign credits. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Credits Issued',
      value: creditData.totalCreditsIssued.toLocaleString(),
      icon: CreditCard,
      color: 'bg-blue-500',
      description: 'All-time credits created',
    },
    {
      title: 'Active Credits',
      value: creditData.activeCredits.toLocaleString(),
      icon: TrendingUp,
      color: 'bg-green-500',
      description: 'Available for use',
    },
    {
      title: 'Credits Used',
      value: creditData.totalCreditsUsed.toLocaleString(),
      icon: CheckCircle,
      color: 'bg-purple-500',
      description: 'Successfully consumed',
    },
    {
      title: 'Credits Expired',
      value: creditData.totalCreditsExpired.toLocaleString(),
      icon: Clock,
      color: 'bg-orange-500',
      description: 'Unused and expired',
    },
  ];

  const filteredTransactions = creditData.recentTransactions.filter(transaction =>
    transaction.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.tier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 text-white rounded p-1 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Credit Transactions</CardTitle>
                  <CardDescription>Latest credit purchases and assignments</CardDescription>
                </div>
                <Dialog open={isAddCreditDialogOpen} onOpenChange={setIsAddCreditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Credits
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Manually Assign Credits</DialogTitle>
                      <DialogDescription>
                        Add credits to a user's account manually. This will send a confirmation email.
                      </DialogDescription>
                    </DialogHeader>
                    <form action={handleAddCredits}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="userEmail">User Email</Label>
                          <Input
                            id="userEmail"
                            name="userEmail"
                            type="email"
                            placeholder="user@example.com"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="creditAmount">Credit Amount</Label>
                          <Input
                            id="creditAmount"
                            name="creditAmount"
                            type="number"
                            min="1"
                            max="100"
                            placeholder="5"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="creditType">Credit Type</Label>
                          <Select name="creditType" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select credit type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="job_post">Job Post Credits</SelectItem>
                              <SelectItem value="featured_post">Featured Post Credits</SelectItem>
                              <SelectItem value="social_graphic">Social Graphic Credits</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="note">Note (Optional)</Label>
                          <Textarea
                            id="note"
                            name="note"
                            placeholder="Reason for manual credit assignment..."
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter className="mt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddCreditDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? 'Assigning...' : 'Assign Credits'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.slice(0, 10).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {transaction.user.name?.charAt(0) || transaction.user.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{transaction.user.name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{transaction.user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {transaction.tier.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Jobs: {transaction.jobPostCredits}</div>
                          {transaction.featuredPostCredits > 0 && (
                            <div>Featured: {transaction.featuredPostCredits}</div>
                          )}
                          {transaction.socialGraphicCredits > 0 && (
                            <div>Social: {transaction.socialGraphicCredits}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          ${transaction.totalAmount.toString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Top Credit Users */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Top Credit Users</CardTitle>
              <CardDescription>Users with the most credits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {creditData.topCreditUsers.slice(0, 8).map((user, index) => {
                  const activeCredits = user.jobPostingCredits.filter(
                    (credit: any) => !credit.isUsed && (!credit.expiresAt || new Date(credit.expiresAt) > new Date())
                  ).length;
                  
                  return (
                    <div key={user.id} className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium">
                        {index + 1}
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user.name?.charAt(0) || user.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{user.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500 truncate">{user.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{activeCredits}</div>
                        <div className="text-xs text-gray-500">active</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
