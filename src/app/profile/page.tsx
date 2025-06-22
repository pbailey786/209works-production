'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Briefcase, FileText, Settings, Heart, Bell, MapPin, Calendar, DollarSign } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  location: string;
  title?: string;
  bio?: string;
  skills: string[];
  experience: string;
  profilePicture?: string;
}

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: 'pending' | 'reviewed' | 'interview' | 'rejected' | 'accepted';
  appliedAt: string;
  salary?: string;
}

interface SavedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  savedAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      // Load user profile
      const profileResponse = await fetch('/api/profile/jobseeker');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData.profile);
      }

      // Load applications
      const applicationsResponse = await fetch('/api/profile/applications');
      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json();
        setApplications(applicationsData.applications || []);
      }

      // Load saved jobs
      const savedResponse = await fetch('/api/profile/saved-jobs');
      if (savedResponse.ok) {
        const savedData = await savedResponse.json();
        setSavedJobs(savedData.savedJobs || []);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'interview': return 'bg-purple-100 text-purple-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-sm font-bold">209</span>
              </div>
              <span className="text-xl font-bold">Works</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/jobs" className="text-foreground/80 hover:text-foreground">
                Find Jobs
              </Link>
              <Link href="/chat" className="text-foreground/80 hover:text-foreground">
                JobsGPT
              </Link>
              <Link href="/profile" className="font-medium text-primary">
                Profile
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="text-center mb-6">
                <div className="mx-auto h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  {profile?.profilePicture ? (
                    <img
                      src={profile.profilePicture}
                      alt={profile.name}
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-primary" />
                  )}
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  {profile?.name || 'Your Name'}
                </h2>
                {profile?.title && (
                  <p className="text-muted-foreground">{profile.title}</p>
                )}
                {profile?.location && (
                  <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground mt-2">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Link
                  href="/profile/settings"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <span>Profile Settings</span>
                </Link>

                <Link
                  href="/profile/applications"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <span>My Applications</span>
                  {applications.length > 0 && (
                    <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                      {applications.length}
                    </span>
                  )}
                </Link>

                <Link
                  href="/profile/saved"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Heart className="h-5 w-5 text-muted-foreground" />
                  <span>Saved Jobs</span>
                  {savedJobs.length > 0 && (
                    <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                      {savedJobs.length}
                    </span>
                  )}
                </Link>

                <Link
                  href="/profile/resumes"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span>My Resumes</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{applications.length}</p>
                    <p className="text-sm text-muted-foreground">Applications</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Heart className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{savedJobs.length}</p>
                    <p className="text-sm text-muted-foreground">Saved Jobs</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {profile?.skills?.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Skills</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Applications */}
            <div className="bg-card rounded-lg border border-border">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Recent Applications</h3>
                  <Link
                    href="/profile/applications"
                    className="text-primary hover:text-primary/80 text-sm"
                  >
                    View All
                  </Link>
                </div>
              </div>

              <div className="p-6">
                {applications.length > 0 ? (
                  <div className="space-y-4">
                    {applications.slice(0, 3).map((application) => (
                      <div key={application.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{application.jobTitle}</h4>
                          <p className="text-sm text-muted-foreground">{application.company}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(application.appliedAt).toLocaleDateString()}</span>
                            </div>
                            {application.salary && (
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-3 w-3" />
                                <span>{application.salary}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h4 className="text-lg font-medium text-foreground mb-2">No Applications Yet</h4>
                    <p className="text-muted-foreground mb-4">Start applying to jobs to see your applications here.</p>
                    <Link
                      href="/jobs"
                      className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Browse Jobs
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Saved Jobs */}
            <div className="bg-card rounded-lg border border-border">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Saved Jobs</h3>
                  <Link
                    href="/profile/saved"
                    className="text-primary hover:text-primary/80 text-sm"
                  >
                    View All
                  </Link>
                </div>
              </div>

              <div className="p-6">
                {savedJobs.length > 0 ? (
                  <div className="space-y-4">
                    {savedJobs.slice(0, 3).map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{job.title}</h4>
                          <p className="text-sm text-muted-foreground">{job.company}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{job.location}</span>
                            </div>
                            {job.salary && (
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-3 w-3" />
                                <span>{job.salary}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Link
                          href={`/jobs/${job.id}`}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                        >
                          View Job
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h4 className="text-lg font-medium text-foreground mb-2">No Saved Jobs</h4>
                    <p className="text-muted-foreground mb-4">Save jobs you're interested in to view them here.</p>
                    <Link
                      href="/jobs"
                      className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Browse Jobs
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/chat"
                  className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Ask JobsGPT</h4>
                    <p className="text-sm text-muted-foreground">Get AI-powered job search help</p>
                  </div>
                </Link>

                <Link
                  href="/profile/setup"
                  className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Complete Profile</h4>
                    <p className="text-sm text-muted-foreground">Improve your job matches</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
