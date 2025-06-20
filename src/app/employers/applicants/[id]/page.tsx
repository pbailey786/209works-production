import { useState, useEffect } from '@/components/ui/card';
import { useParams, useRouter } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

'use client';

import {
  import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  ExternalLink,
  MessageSquare,
  Star,
  Clock,
  Eye,
  Gift,
  XCircle,
  AlertCircle,
  Download,
} from 'lucide-react';

interface ApplicationDetail {
  id: string;
  status: string;
  appliedAt: string;
  coverLetter?: string;
  resumeUrl?: string;
  notes?: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    jobType: string;
    description: string;
    postedAt: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    resumeUrl?: string;
    bio?: string;
    skills?: string[];
    experience?: string;
    location?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    phoneNumber?: string;
    createdAt: string;
  };
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
    label: 'Pending',
  },
  reviewing: {
    icon: Eye,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    label: 'Under Review',
  },
  interview: {
    icon: Calendar,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    label: 'Interview',
  },
  offer: {
    icon: Gift,
    color: 'text-green-600',
    bg: 'bg-green-100',
    label: 'Offer',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-100',
    label: 'Rejected',
  },
  withdrawn: {
    icon: AlertCircle,
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    label: 'Withdrawn',
  },
};

export default function ApplicantProfilePage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [otherApplications, setOtherApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    nextSteps: '',
    interviewLink: '',
    template: 'custom',
  });
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchApplicationDetail();
  }, [applicationId]);

  const fetchApplicationDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employers/applicants/${applicationId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch application details');
      }

      const data = await response.json();
      setApplication(data.application);
      setOtherApplications(data.otherApplications || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load application details'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (newStatus: string) => {
    if (!application) return;

    try {
      const response = await fetch('/api/employers/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: application.id, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      setApplication({ ...application, status: newStatus });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update application'
      );
    }
  };

  const addNote = async () => {
    if (!application || !newNote.trim()) return;

    try {
      setAddingNote(true);
      const response = await fetch(`/api/employers/applicants/${applicationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to add note');
      }

      // Refresh application data
      await fetchApplicationDetail();
      setNewNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const sendMessage = async () => {
    if (!application || !contactForm.subject.trim() || !contactForm.message.trim()) return;

    try {
      setSendingMessage(true);
      const response = await fetch('/api/employers/contact-applicant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application.id,
          subject: contactForm.subject.trim(),
          message: contactForm.message.trim(),
          nextSteps: contactForm.nextSteps.trim() || undefined,
          interviewLink: contactForm.interviewLink.trim() || undefined,
          template: contactForm.template,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Reset form and close modal
      setContactForm({
        subject: '',
        message: '',
        nextSteps: '',
        interviewLink: '',
        template: 'custom',
      });
      setShowContactModal(false);

      // Show success message (you could add a toast notification here)
      alert('Message sent successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="animate-pulse">
          <div className="mb-6 h-8 w-1/4 rounded bg-gray-200"></div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 h-6 w-3/4 rounded bg-gray-200"></div>
            <div className="mb-4 h-4 w-1/2 rounded bg-gray-200"></div>
            <div className="h-32 w-full rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="mb-2 text-lg font-semibold text-red-800">Error</h2>
          <p className="text-red-700">{error || 'Application not found'}</p>
          <Link
            href="/employers/applicants"
            className="mt-4 inline-flex items-center text-red-600 hover:text-red-500"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[application.status as keyof typeof statusConfig];
  const StatusIcon = statusInfo?.icon || Clock;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link
            href="/employers/applicants"
            className="mr-4 flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applications
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {application.user.name || application.user.email}
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowContactModal(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            <MessageSquare className="mr-2 inline h-4 w-4" />
            Contact Candidate
          </button>
          {statusInfo && (
            <div className={`flex items-center rounded-full px-3 py-1 ${statusInfo.bg}`}>
              <StatusIcon className={`mr-2 h-4 w-4 ${statusInfo.color}`} />
              <span className={`text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Application Details */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Application Details
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">Applied for:</h3>
                <p className="text-gray-700">{application.job.title}</p>
                <p className="text-sm text-gray-500">
                  at {application.job.company} • {application.job.location}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Applied:</h3>
                <p className="text-gray-700">
                  {formatDistanceToNow(new Date(application.appliedAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              {application.coverLetter && (
                <div>
                  <h3 className="font-medium text-gray-900">Cover Letter:</h3>
                  <div className="mt-2 rounded-lg bg-gray-50 p-4">
                    <p className="whitespace-pre-wrap text-gray-700">
                      {application.coverLetter}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Candidate Profile */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Candidate Profile
            </h2>
            <div className="space-y-4">
              {application.user.bio && (
                <div>
                  <h3 className="font-medium text-gray-900">Bio:</h3>
                  <p className="text-gray-700">{application.user.bio}</p>
                </div>
              )}
              {application.user.experience && (
                <div>
                  <h3 className="font-medium text-gray-900">Experience:</h3>
                  <p className="text-gray-700">{application.user.experience}</p>
                </div>
              )}
              {application.user.skills && application.user.skills.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900">Skills:</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {application.user.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Contact Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <Mail className="mr-3 h-4 w-4 text-gray-400" />
                <a
                  href={`mailto:${application.user.email}`}
                  className="text-blue-600 hover:text-blue-500"
                >
                  {application.user.email}
                </a>
              </div>
              {application.user.phoneNumber && (
                <div className="flex items-center">
                  <Phone className="mr-3 h-4 w-4 text-gray-400" />
                  <a
                    href={`tel:${application.user.phoneNumber}`}
                    className="text-blue-600 hover:text-blue-500"
                  >
                    {application.user.phoneNumber}
                  </a>
                </div>
              )}
              {application.user.location && (
                <div className="flex items-center">
                  <MapPin className="mr-3 h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{application.user.location}</span>
                </div>
              )}
              {application.user.linkedinUrl && (
                <div className="flex items-center">
                  <ExternalLink className="mr-3 h-4 w-4 text-gray-400" />
                  <a
                    href={application.user.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    LinkedIn Profile
                  </a>
                </div>
              )}
              {application.user.portfolioUrl && (
                <div className="flex items-center">
                  <ExternalLink className="mr-3 h-4 w-4 text-gray-400" />
                  <a
                    href={application.user.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    Portfolio
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Resume */}
          {(application.resumeUrl || application.user.resumeUrl) && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Resume</h2>
              <a
                href={application.resumeUrl || application.user.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Resume
              </a>
            </div>
          )}

          {/* Status Management */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Update Status
            </h2>
            <select
              value={application.status}
              onChange={(e) => updateApplicationStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {Object.entries(statusConfig).map(([status, config]) => (
                <option key={status} value={status}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Add Note */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Add Note</h2>
            <div className="space-y-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add internal notes about this candidate..."
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={addNote}
                disabled={!newNote.trim() || addingNote}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addingNote ? 'Adding...' : 'Add Note'}
              </button>
            </div>
            {application.notes && (
              <div className="mt-4">
                <h3 className="mb-2 font-medium text-gray-900">Current Notes:</h3>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="whitespace-pre-wrap text-sm text-gray-700">
                    {application.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Contact {application?.user.name || 'Candidate'}
              </h2>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Subject
                </label>
                <input
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, subject: e.target.value })
                  }
                  placeholder="Interview invitation for Software Engineer position"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, message: e.target.value })
                  }
                  placeholder="Hi [Name], thank you for your application..."
                  rows={6}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Next Steps (Optional)
                </label>
                <textarea
                  value={contactForm.nextSteps}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, nextSteps: e.target.value })
                  }
                  placeholder="Please reply with your availability for an interview..."
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Interview/Meeting Link (Optional)
                </label>
                <input
                  type="url"
                  value={contactForm.interviewLink}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, interviewLink: e.target.value })
                  }
                  placeholder="https://zoom.us/j/..."
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowContactModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={sendMessage}
                disabled={!contactForm.subject.trim() || !contactForm.message.trim() || sendingMessage}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendingMessage ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
