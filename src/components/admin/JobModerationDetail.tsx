import { useState } from '@/components/ui/card';
import { Badge } from '@/components/ui/card';
import { Button } from '@/components/ui/card';
import { Textarea } from '@/components/ui/card';
import { Label } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

'use client';

  import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
  import {
  Check,
  X,
  Flag,
  Eye,
  MapPin,
  Building,
  DollarSign,
  Clock,
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
  AlertTriangle,
  FileText,
  Users,
} from 'lucide-react';

interface JobModerationDetailProps {
  job: {
    id: string;
    title: string;
    description: string;
    requirements: string;
    benefits?: string;
    location: string;
    jobType: string;
    salaryMin?: number;
    salaryMax?: number;
    createdAt: Date;
    updatedAt: Date;
    company: {
      name: string;
      logo?: string;
      website?: string;
    } | null;
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    };
    _count: {
      jobApplications: number;
    };
  };
  onAction: (action: string, reason?: string) => void;
  isLoading?: boolean;
}

export default function JobModerationDetail({
  job,
  onAction,
  isLoading = false,
}: JobModerationDetailProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [showReasonDialog, setShowReasonDialog] = useState(false);

  const handleActionClick = (action: string) => {
    if (action === 'reject' || action === 'flag') {
      setSelectedAction(action);
      setShowReasonDialog(true);
    } else {
      onAction(action);
    }
  };

  const handleSubmitWithReason = () => {
    if (selectedAction) {
      onAction(selectedAction, reason);
      setShowReasonDialog(false);
      setReason('');
      setSelectedAction(null);
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Not specified';
    if (min && max)
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    return `Up to $${max?.toLocaleString()}`;
  };

  const getJobAge = (createdAt: Date) => {
    const now = new Date();
    const diff = now.getTime() - createdAt.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getModerationStatus = () => {
    const hoursSinceCreated =
      (Date.now() - job.createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreated < 24) {
      return {
        status: 'pending',
        label: 'Pending Review',
        color: 'bg-yellow-100 text-yellow-800',
      };
    } else if (hoursSinceCreated < 72) {
      return {
        status: 'flagged',
        label: 'Needs Attention',
        color: 'bg-red-100 text-red-800',
      };
    } else {
      return {
        status: 'approved',
        label: 'Approved',
        color: 'bg-green-100 text-green-800',
      };
    }
  };

  const moderationStatus = getModerationStatus();

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-xl">{job.title}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Building className="mr-1 h-4 w-4" />
                  {job.company?.name || 'Unknown Company'}
                </div>
                <div className="flex items-center">
                  <MapPin className="mr-1 h-4 w-4" />
                  {job.location}
                </div>
                <div className="flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  {getJobAge(job.createdAt)}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={moderationStatus.color}>
                {moderationStatus.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-3">
            <Button
              onClick={() => handleActionClick('approve')}
              disabled={isLoading}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button
              onClick={() => handleActionClick('reject')}
              disabled={isLoading}
              variant="destructive"
            >
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button
              onClick={() => handleActionClick('flag')}
              disabled={isLoading}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Flag className="mr-2 h-4 w-4" />
              Flag for Review
            </Button>
            <Button
              onClick={() => window.open(`/jobs/${job.id}`, '_blank')}
              variant="outline"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Public Page
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Job Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Job Information */}
          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Job Type
                  </Label>
                  <p className="mt-1 capitalize">
                    {job.jobType.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Salary Range
                  </Label>
                  <p className="mt-1">
                    {formatSalary(job.salaryMin, job.salaryMax)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Applications
                  </Label>
                  <p className="mt-1 flex items-center">
                    <Users className="mr-1 h-4 w-4" />
                    {job._count.jobApplications} applications
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Posted
                  </Label>
                  <p className="mt-1 flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">
                  {job.description}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">
                  {job.requirements}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits (if available) */}
          {job.benefits && (
            <Card>
              <CardHeader>
                <CardTitle>Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700">
                    {job.benefits}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                {job.company?.logo ? (
                  <img
                    src={job.company.logo}
                    alt={job.company.name}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-200">
                    <Building className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium">
                    {job.company?.name || 'Unknown Company'}
                  </h3>
                  {job.company?.website && (
                    <a
                      href={job.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Globe className="mr-1 h-3 w-3" />
                      Visit Website
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Poster Information */}
          <Card>
            <CardHeader>
              <CardTitle>Posted By</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="text-sm">{job.user.name}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="text-sm">{job.user.email}</span>
                </div>
                {job.user.phone && (
                  <div className="flex items-center">
                    <Phone className="mr-2 h-4 w-4 text-gray-400" />
                    <span className="text-sm">{job.user.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Moderation Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Moderation Notes</CardTitle>
              <CardDescription>
                Internal notes for moderation team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                  <div className="flex items-start">
                    <AlertTriangle className="mr-2 mt-0.5 h-4 w-4 text-yellow-600" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">
                        Review Required
                      </p>
                      <p className="text-yellow-700">
                        This job posting requires manual review before approval.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Placeholder for moderation history */}
                <div className="text-sm text-gray-500">
                  No previous moderation actions recorded.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reason Dialog */}
      {showReasonDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="mx-4 w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {selectedAction === 'reject' ? 'Reject Job' : 'Flag Job'}
              </CardTitle>
              <CardDescription>
                Please provide a reason for this action.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Enter the reason for this moderation action..."
                  rows={4}
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={handleSubmitWithReason}
                  disabled={!reason.trim() || isLoading}
                  className={
                    selectedAction === 'reject'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }
                >
                  {selectedAction === 'reject' ? 'Reject Job' : 'Flag Job'}
                </Button>
                <Button
                  onClick={() => {
                    setShowReasonDialog(false);
                    setReason('');
                    setSelectedAction(null);
                  }}
                  variant="outline"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
