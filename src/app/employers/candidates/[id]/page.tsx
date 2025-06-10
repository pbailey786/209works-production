'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Star,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Download,
  FileText,
  ExternalLink,
  MessageSquare,
  UserCheck,
  UserX,
  StickyNote,
  Award,
  Briefcase,
  GraduationCap,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
} from 'lucide-react';

interface CandidateSnapshot {
  id: string;
  status: string;
  appliedAt: string;
  coverLetter?: string;
  resumeUrl?: string;
  notes?: string;
  screeningAnswers?: Array<{
    question: string;
    answer: string;
    type: 'text' | 'multiple_choice';
  }>;
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
    phoneNumber?: string;
    createdAt: string;
  };
  aiScore?: {
    overall: number;
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    breakdown: {
      strengths: string[];
      gaps: string[];
      recommendations: string[];
    };
  };
  parsedResume?: {
    skills: string[];
    experience: Array<{
      title: string;
      company: string;
      duration: string;
      description: string;
    }>;
    education: Array<{
      degree: string;
      institution: string;
      year: string;
    }>;
    summary: string;
  };
}

export default function CandidateSnapshotPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [candidate, setCandidate] = useState<CandidateSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchCandidateSnapshot();
  }, [applicationId]);

  const fetchCandidateSnapshot = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employers/candidates/${applicationId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch candidate details');
      }

      const data = await response.json();
      setCandidate(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load candidate details'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!candidate) return;

    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/employers/candidates/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setCandidate({ ...candidate, status: newStatus });
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim() || !candidate) return;

    try {
      setAddingNote(true);
      const response = await fetch(`/api/employers/candidates/${applicationId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote }),
      });

      if (!response.ok) {
        throw new Error('Failed to add note');
      }

      // Refresh candidate data
      await fetchCandidateSnapshot();
      setNewNote('');
    } catch (err) {
      console.error('Error adding note:', err);
    } finally {
      setAddingNote(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'shortlisted':
        return 'bg-green-100 text-green-800';
      case 'hired':
        return 'bg-purple-100 text-purple-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading candidate details...</p>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error || 'Candidate not found'}</p>
          <Link href="/employers/applicants" className="mt-4 text-blue-600 hover:underline">
            ← Back to Applicants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center">
          <Link
            href="/employers/applicants"
            className="mr-4 flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applicants
          </Link>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {candidate.user.name || 'Anonymous Candidate'}
            </h1>
            <div className="mt-2 flex items-center space-x-4 text-gray-600">
              {candidate.aiScore && (
                <div className="flex items-center">
                  <Star className="mr-1 h-4 w-4 text-yellow-400" />
                  <span className={`font-medium ${getScoreColor(candidate.aiScore.overall)}`}>
                    {candidate.aiScore.overall}/100
                  </span>
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                <span>
                  Applied {formatDistanceToNow(new Date(candidate.appliedAt), { addSuffix: true })}
                </span>
              </div>
              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(candidate.status)}`}>
                {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Actions Panel */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => updateStatus('shortlisted')}
              disabled={updatingStatus || candidate.status === 'shortlisted'}
              className="flex items-center rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Shortlist
            </button>
            <button
              onClick={() => updateStatus('rejected')}
              disabled={updatingStatus || candidate.status === 'rejected'}
              className="flex items-center rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              <UserX className="mr-2 h-4 w-4" />
              Reject
            </button>
            <a
              href={`mailto:${candidate.user.email}?subject=Re: ${candidate.job.title} Application`}
              className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              <Mail className="mr-2 h-4 w-4" />
              Email
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Resume Section */}
          {(candidate.resumeUrl || candidate.user.resumeUrl) && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Resume</h2>
                <a
                  href={candidate.resumeUrl || candidate.user.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </div>

              {/* Resume Preview */}
              <div className="mb-6 rounded-lg border bg-gray-50 p-4">
                <div className="flex items-center justify-center">
                  <iframe
                    src={`${candidate.resumeUrl || candidate.user.resumeUrl}#toolbar=0`}
                    className="h-96 w-full rounded border"
                    title="Resume Preview"
                  />
                </div>
              </div>

              {/* Parsed Resume Content */}
              {candidate.parsedResume && (
                <div className="space-y-6">
                  {/* Skills */}
                  {candidate.parsedResume.skills && candidate.parsedResume.skills.length > 0 && (
                    <div>
                      <h3 className="mb-3 flex items-center text-lg font-medium text-gray-900">
                        <Target className="mr-2 h-5 w-5 text-blue-500" />
                        Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {candidate.parsedResume.skills.map((skill, index) => (
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

                  {/* Experience */}
                  {candidate.parsedResume.experience && candidate.parsedResume.experience.length > 0 && (
                    <div>
                      <h3 className="mb-3 flex items-center text-lg font-medium text-gray-900">
                        <Briefcase className="mr-2 h-5 w-5 text-green-500" />
                        Experience
                      </h3>
                      <div className="space-y-4">
                        {candidate.parsedResume.experience.map((exp, index) => (
                          <div key={index} className="border-l-2 border-gray-200 pl-4">
                            <h4 className="font-medium text-gray-900">{exp.title}</h4>
                            <p className="text-sm text-gray-600">{exp.company} • {exp.duration}</p>
                            <p className="mt-1 text-sm text-gray-700">{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {candidate.parsedResume.education && candidate.parsedResume.education.length > 0 && (
                    <div>
                      <h3 className="mb-3 flex items-center text-lg font-medium text-gray-900">
                        <GraduationCap className="mr-2 h-5 w-5 text-purple-500" />
                        Education
                      </h3>
                      <div className="space-y-3">
                        {candidate.parsedResume.education.map((edu, index) => (
                          <div key={index}>
                            <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                            <p className="text-sm text-gray-600">{edu.institution} • {edu.year}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Screening Questions & Answers */}
          {candidate.screeningAnswers && candidate.screeningAnswers.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Screening Questions</h2>
              <div className="space-y-4">
                {candidate.screeningAnswers.map((qa, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <h3 className="mb-2 font-medium text-gray-900">{qa.question}</h3>
                    <p className="text-gray-700">{qa.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Score Breakdown */}
          {candidate.aiScore && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">AI Match Analysis</h2>

              {/* Score Overview */}
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(candidate.aiScore.overall)}`}>
                    {candidate.aiScore.overall}%
                  </div>
                  <div className="text-sm text-gray-600">Overall Match</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(candidate.aiScore.skillsMatch)}`}>
                    {candidate.aiScore.skillsMatch}%
                  </div>
                  <div className="text-sm text-gray-600">Skills</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(candidate.aiScore.experienceMatch)}`}>
                    {candidate.aiScore.experienceMatch}%
                  </div>
                  <div className="text-sm text-gray-600">Experience</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(candidate.aiScore.educationMatch)}`}>
                    {candidate.aiScore.educationMatch}%
                  </div>
                  <div className="text-sm text-gray-600">Education</div>
                </div>
              </div>

              {/* Strengths and Gaps */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Strengths */}
                <div>
                  <h3 className="mb-3 flex items-center text-lg font-medium text-green-700">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {candidate.aiScore.breakdown.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="mr-2 mt-0.5 h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Gaps */}
                <div>
                  <h3 className="mb-3 flex items-center text-lg font-medium text-orange-700">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Areas for Consideration
                  </h3>
                  <ul className="space-y-2">
                    {candidate.aiScore.breakdown.gaps.map((gap, index) => (
                      <li key={index} className="flex items-start">
                        <AlertTriangle className="mr-2 mt-0.5 h-4 w-4 text-orange-500" />
                        <span className="text-sm text-gray-700">{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommendations */}
              {candidate.aiScore.breakdown.recommendations.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 flex items-center text-lg font-medium text-blue-700">
                    <Award className="mr-2 h-5 w-5" />
                    Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {candidate.aiScore.breakdown.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <Eye className="mr-2 mt-0.5 h-4 w-4 text-blue-500" />
                        <span className="text-sm text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Cover Letter */}
          {candidate.coverLetter && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Cover Letter</h2>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-gray-700">{candidate.coverLetter}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Job Applied For */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Applied For</h2>
            <div>
              <h3 className="font-medium text-gray-900">{candidate.job.title}</h3>
              <p className="text-sm text-gray-600">{candidate.job.company}</p>
              <p className="text-sm text-gray-500">{candidate.job.location}</p>
              <Link
                href={`/employers/job/${candidate.job.id}`}
                className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                View Job Details
              </Link>
            </div>
          </div>

          {/* Contact Information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <Mail className="mr-3 h-4 w-4 text-gray-400" />
                <a
                  href={`mailto:${candidate.user.email}`}
                  className="text-blue-600 hover:text-blue-500"
                >
                  {candidate.user.email}
                </a>
              </div>
              {candidate.user.phoneNumber && (
                <div className="flex items-center">
                  <Phone className="mr-3 h-4 w-4 text-gray-400" />
                  <a
                    href={`tel:${candidate.user.phoneNumber}`}
                    className="text-blue-600 hover:text-blue-500"
                  >
                    {candidate.user.phoneNumber}
                  </a>
                </div>
              )}
              {candidate.user.location && (
                <div className="flex items-center">
                  <MapPin className="mr-3 h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{candidate.user.location}</span>
                </div>
              )}
              {candidate.user.linkedinUrl && (
                <div className="flex items-center">
                  <ExternalLink className="mr-3 h-4 w-4 text-gray-400" />
                  <a
                    href={candidate.user.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    LinkedIn Profile
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Add Note */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Add Note</h2>
            <div className="space-y-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about this candidate..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={4}
              />
              <button
                onClick={addNote}
                disabled={!newNote.trim() || addingNote}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {addingNote ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </div>

          {/* Existing Notes */}
          {candidate.notes && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Notes</h2>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-gray-700">{candidate.notes}</p>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Member Since</span>
                <span className="text-gray-900">
                  {formatDistanceToNow(new Date(candidate.user.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Application Status</span>
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(candidate.status)}`}>
                  {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
