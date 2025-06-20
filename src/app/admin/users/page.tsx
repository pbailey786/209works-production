import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/database/prisma';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Filter,
  MoreHorizontal,
  UserPlus,
  Download,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SearchParams {
  page?: string;
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

  // Await searchParams in Next.js 15
  const params = await searchParams;

  // Parse search parameters
  const page = parseInt(params.page || '1');
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  // Build filter conditions
  const whereConditions: any = {};

  if (params.search) {
    whereConditions.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  if (params.role && params.role !== 'all') {
    whereConditions.role = params.role;
  }

  // Sorting
  const sortBy = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder || 'desc';
  const orderBy = { [sortBy]: sortOrder };

  // Fetch users and stats with error handling
  let users: any[] = [];
  let totalCount = 0;
  let userStats: any[] = [];

  try {
    [users, totalCount, userStats] = await Promise.all([
      prisma.user.findMany({
        where: whereConditions,
        skip,
        take: pageSize,
        orderBy,
        include: {
          _count: {
            select: {
              jobApplications: true,
              alerts: true,
            },
          },
        },
      }),
      prisma.user.count({ where: whereConditions }),
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          id: true,
        },
      }),
    ]);
  } catch (error) {
    console.error('Error fetching user management data:', error);
    // Use default values if database queries fail
    users = [];
    totalCount = 0;
    userStats = [];
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  // Process stats
  const stats = {
    total: totalCount,
    jobseekers: userStats.find(s => s.role === 'jobseeker')?._count.id || 0,
    employers: userStats.find(s => s.role === 'employer')?._count.id || 0,
    admins: userStats.find(s => s.role === 'admin')?._count.id || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-gray-600">
            Manage user accounts, permissions, and support issues
          </p>
        </div>

        <div className="flex space-x-3">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Job Seekers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.jobseekers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Active job seekers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.employers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered employers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.admins.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Admin users</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="Search users by name or email..."
                  className="pl-10"
                  defaultValue={params.search}
                />
              </div>
            </div>

            <Select defaultValue={params.role || 'all'}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="jobseeker">Job Seekers</SelectItem>
                <SelectItem value="employer">Employers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({totalCount.toLocaleString()})</CardTitle>
          <CardDescription>
            Showing {skip + 1}-{Math.min(skip + pageSize, totalCount)} of{' '}
            {totalCount} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead>Alerts</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.profilePictureUrl || undefined}
                        />
                        <AvatarFallback>
                          {(user.name || user.email)[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {user.name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === 'admin'
                          ? 'destructive'
                          : user.role === 'employer'
                            ? 'default'
                            : 'secondary'
                      }
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{user._count.jobApplications}</TableCell>
                  <TableCell>{user._count.alerts}</TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-green-600">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {skip + 1} to {Math.min(skip + pageSize, totalCount)} of{' '}
              {totalCount} results
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" disabled={page <= 1}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
