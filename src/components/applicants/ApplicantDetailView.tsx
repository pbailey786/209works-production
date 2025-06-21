'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from 'lucide-react';

interface ApplicantDetailProps {
  applicationId: string;
  onStatusUpdate?: (newStatus: string) => void;
  onClose?: () => void;
}

interface ApplicantData {
  application: {
    id: string;
    status: string;
    appliedAt: string;
    coverLetter?: string;
    resumeUrl?: string;
    notes?: string;
    rating?: number;
    tags?: string[];
    job: {
      id: string;
      title: string;
      company: string;
      location: string;
    };
  };
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    location?: string;
    bio?: string;
    skills?: string[];
    experience?: string;
    currentJobTitle?: string;
    yearsOfExperience?: number;
    linkedinUrl?: string;
    portfolioUrl?: string;
    resumeUrl?: string;
  };
  communicationHistory?: Array<{
    id: string;
    type: 'email' | 'phone' | 'interview' | 'note';
    subject?: string;
    content: string;
    createdAt: string;
  }>;
  otherApplications?: Array<{
    id: string;
    job: {
      title: string;
      company: string;
    };
    status: string;
    appliedAt: string;
  }>;
}

export function ApplicantDetailView({ applicationId, onStatusUpdate, onClose }: ApplicantDetailProps) {
  const [data, setData] = useState<ApplicantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  useEffect(() => {
    const fetchApplicantData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/employers/applicants/${applicationId}`);
        
        if (response.ok) {
          const applicantData = await response.json();
          setData(applicantData);
          setNotes(applicantData.application.notes || '');
          setRating(applicantData.application.rating || 0);
          setTags(applicantData.application.tags || []);
        } else {
          console.error('Failed to fetch applicant data');
        }
      } catch (error) {
        console.error('Error fetching applicant data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicantData();
  }, [applicationId]);

  const updateApplicationData = async (updates: any) => {
    try {
      const response = await fetch(`/api/employers/applicants/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedData = await response.json();
        setData(prev => prev ? { ...prev, application: { ...prev.application, ...updatedData.application } } : null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating application:', error);
      return false;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const success = await updateApplicationData({ status: newStatus });
    if (success && onStatusUpdate) {
      onStatusUpdate(newStatus);
    }
  };

  const handleSaveNotes = async () => {
    const success = await updateApplicationData({ notes });
    if (success) {
      setIsEditingNotes(false);
    }
  };

  const handleSaveRating = async (newRating: number) => {
    const success = await updateApplicationData({ rating: newRating });
    if (success) {
      setRating(newRating);
    }
  };

  const handleAddTag = async () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      const success = await updateApplicationData({ tags: updatedTags });
      if (success) {
        setTags(updatedTags);
        setNewTag('');
      }
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    const success = await updateApplicationData({ tags: updatedTags });
    if (success) {
      setTags(updatedTags);
    }
  };

  const handleAddNote = async () => {
    if (newNote.trim()) {
      try {
        const response = await fetch(`/api/employers/applicants/${applicationId}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newNote, type: 'note' })
        });

        if (response.ok) {
          setNewNote('');
          setIsAddingNote(false);
          // Refresh data to show new note
          window.location.reload();
        }
      } catch (error) {
        console.error('Error adding note:', error);
      }
    }
  };

  const sendEmail = async (template: string) => {
    try {
      const response = await fetch(`/api/employers/contact-applicant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          template,
          subject: `Regarding your application for ${data?.application.job.title}`,
          message: 'Thank you for your interest in this position.'
        })
      });

      if (response.ok) {
        alert('Email sent successfully!');
      } else {
        alert('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">Unable to load applicant data</p>
      </div>
    );
  }

  const { application, user, communicationHistory, otherApplications } = data;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-gray-600">Applied for {application.job.title}</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{user.email}</span>
                <Button size="sm" variant="outline" onClick={() => sendEmail('custom')}>
                  Send Email
                </Button>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{user.phone}</span>
                </div>
              )}
              {user.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{user.location}</span>
                </div>
              )}
              {user.linkedinUrl && (
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-gray-500" />
                  <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    LinkedIn Profile
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Professional Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Professional Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.currentJobTitle && (
                <p className="font-medium text-gray-900 mb-2">{user.currentJobTitle}</p>
              )}
              {user.yearsOfExperience && (
                <p className="text-sm text-gray-600 mb-3">{user.yearsOfExperience} years of experience</p>
              )}
              {user.bio && (
                <p className="text-gray-700">{user.bio}</p>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          {user.skills && user.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cover Letter */}
          {application.coverLetter && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Cover Letter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-gray-700">
                  {application.coverLetter}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                value={application.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="pending">Pending</option>
                <option value="reviewing">Under Review</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>

              <div className="space-y-2">
                <Button className="w-full" onClick={() => sendEmail('interview_invitation')}>
                  Schedule Interview
                </Button>
                <Button variant="outline" className="w-full" onClick={() => sendEmail('status_update')}>
                  Send Update
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rating */}
          <Card>
            <CardHeader>
              <CardTitle>Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleSaveRating(star)}
                    className={`p-1 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <Star className="h-5 w-5 fill-current" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button size="sm" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resume */}
          {(application.resumeUrl || user.resumeUrl) && (
            <Card>
              <CardHeader>
                <CardTitle>Resume</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <a href={application.resumeUrl || user.resumeUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download Resume
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
