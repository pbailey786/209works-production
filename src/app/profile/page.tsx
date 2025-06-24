'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  UserCircleIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  BookmarkIcon,
  ClockIcon,
  BellIcon,
  CogIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  MapPinIcon,
  PhoneIcon,
  LinkIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  CloudArrowUpIcon,
  PaperAirplaneIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ProfileCompletionTracker from '../../components/profile/ProfileCompletionTracker';
import AchievementBadges from '../../components/profile/AchievementBadges';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [resumeSuccess, setResumeSuccess] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null
  );
  const [profilePicLoading, setProfilePicLoading] = useState(false);
  const [profilePicError, setProfilePicError] = useState('');
  const [profilePicSuccess, setProfilePicSuccess] = useState('');
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(
    null
  );
  const [stats, setStats] = useState({
    savedJobs: 0,
    applications: 0,
    alerts: 0,
  });
  const [coverLetterUrl, setCoverLetterUrl] = useState<string | null>(null);
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [coverLetterError, setCoverLetterError] = useState('');
  const [coverLetterSuccess, setCoverLetterSuccess] = useState('');
  const [location, setLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [currentJobTitle, setCurrentJobTitle] = useState('');
  const [preferredJobTypes, setPreferredJobTypes] = useState<string[]>([]);
  const [skills, setSkills] = useState('');
  const [workAuthorization, setWorkAuthorization] = useState('');
  const [educationExperience, setEducationExperience] = useState('');
  const [isProfilePublic, setIsProfilePublic] = useState(false);
  const jobTypeOptions = ['full-time', 'part-time', 'remote', 'contract'];
  // Tab state for job tracking widgets
  const [activeTab, setActiveTab] = useState('Saved Jobs');
  const tabs = [
    { label: 'Saved Jobs', key: 'Saved Jobs' },
    { label: 'Applications History', key: 'Applications History' },
    { label: 'Alerts & Notifications', key: 'Alerts & Notifications' },
    { label: 'Resume Versions', key: 'Resume Versions' },
    { label: 'Cover Letters', key: 'Cover Letters' },
  ];

  useEffect(() => {
    // Load profile data
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setProfile(data.user);
          setName(data.user.name || '');
          setResumeUrl(data.user.resumeUrl || null);
          setProfilePictureUrl(data.user.profilePictureUrl || null);
          setCoverLetterUrl(data.user.coverLetterUrl || null);
          setLocation(data.user.location || '');
          setPhoneNumber(data.user.phoneNumber || '');
          setLinkedinUrl(data.user.linkedinUrl || '');
          setCurrentJobTitle(data.user.currentJobTitle || '');
          setPreferredJobTypes(data.user.preferredJobTypes || []);
          setSkills((data.user.skills || []).join(', '));
          setWorkAuthorization(data.user.workAuthorization || '');
          setEducationExperience(data.user.educationExperience || '');
          setIsProfilePublic(!!data.user.isProfilePublic);
        }
      });

    // Load dashboard stats for profile widgets
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(data => {
        if (data.stats) {
          setStats({
            savedJobs: data.stats.savedJobs || 0,
            applications: data.stats.applicationsSubmitted || 0,
            alerts: data.stats.activeAlerts || 0,
          });
        }
      })
      .catch(error => {
        console.error('Error loading profile stats:', error);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name !== profile?.name ? name : undefined,
          currentPassword: newPassword ? currentPassword : undefined,
          newPassword: newPassword || undefined,
          location,
          phoneNumber,
          linkedinUrl,
          currentJobTitle,
          preferredJobTypes,
          skills: skills
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
          workAuthorization,
          educationExperience,
          isProfilePublic,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Profile updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setError(data.error || 'Update failed');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResumeUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResumeLoading(true);
    setResumeError('');
    setResumeSuccess('');
    const form = e.target as HTMLFormElement;
    const fileInput = form.elements.namedItem('resume') as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) {
      setResumeError('Please select a file.');
      setResumeLoading(false);
      return;
    }
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('type', 'resume');
    try {
      const res = await fetch('/api/profile/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setResumeUrl(data.url);
        setResumeSuccess(data.message || 'Resume uploaded successfully.');
      } else {
        setResumeError(data.error || 'Upload failed');
      }
    } catch (err) {
      setResumeError('Upload failed');
    } finally {
      setResumeLoading(false);
    }
  }

  async function handleResumeDelete() {
    setResumeLoading(true);
    setResumeError('');
    setResumeSuccess('');
    try {
      const res = await fetch('/api/profile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setResumeUrl(null);
        setResumeSuccess('Resume deleted.');
      } else {
        setResumeError(data.error || 'Delete failed');
      }
    } catch (err) {
      setResumeError('Delete failed');
    } finally {
      setResumeLoading(false);
    }
  }

  async function handleProfilePicUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfilePicLoading(true);
    setProfilePicError('');
    setProfilePicSuccess('');
    const form = e.target as HTMLFormElement;
    const fileInput = form.elements.namedItem(
      'file'
    ) as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) {
      setProfilePicError('Please select an image file.');
      setProfilePicLoading(false);
      return;
    }
    const file = fileInput.files[0];
    // Show preview
    setProfilePicPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append('file', file);
    try {
      formData.append('type', 'profile');
      const res = await fetch('/api/profile/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setProfilePictureUrl(data.url);
        setProfilePicSuccess('Profile picture updated successfully.');
        setProfilePicPreview(null);
      } else {
        setProfilePicError(data.error || 'Upload failed');
      }
    } catch (err) {
      setProfilePicError('Upload failed');
    } finally {
      setProfilePicLoading(false);
    }
  }

  function handleProfilePicChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setProfilePicPreview(URL.createObjectURL(e.target.files[0]));
    } else {
      setProfilePicPreview(null);
    }
  }

  async function handleCoverLetterUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCoverLetterLoading(true);
    setCoverLetterError('');
    setCoverLetterSuccess('');
    const form = e.target as HTMLFormElement;
    const fileInput = form.elements.namedItem('coverLetter') as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) {
      setCoverLetterError('Please select a cover letter file.');
      setCoverLetterLoading(false);
      return;
    }
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'cover_letter');
    try {
      const res = await fetch('/api/profile/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setCoverLetterUrl(data.url);
        setCoverLetterSuccess('Cover letter uploaded successfully.');
      } else {
        setCoverLetterError(data.error || 'Upload failed');
      }
    } catch (err) {
      setCoverLetterError('Upload failed');
    } finally {
      setCoverLetterLoading(false);
    }
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#9fdf9f]/10 via-white to-[#ff6b35]/10">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#2d4a3e]"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#9fdf9f]/10 via-white to-[#ff6b35]/10">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Profile Settings
              </h1>
              <p className="mt-1 text-gray-600">
                Manage your account and job preferences
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
              >
                <HomeIcon className="h-4 w-4" />
                Back to Dashboard
              </Link>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                  isProfilePublic
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {isProfilePublic ? (
                  <>
                    <CheckCircleIcon className="mr-1 h-4 w-4" />
                    Public Profile
                  </>
                ) : (
                  <>
                    <ExclamationTriangleIcon className="mr-1 h-4 w-4" />
                    Private Profile
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Sidebar - Profile Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg"
            >
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-[#2d4a3e] to-[#1d3a2e] px-6 py-8 text-white">
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <img
                      src={
                        profilePicPreview ||
                        profilePictureUrl ||
                        '/default-avatar.svg'
                      }
                      alt="Profile"
                      className="h-24 w-24 rounded-full border-4 border-white bg-gray-100 object-cover shadow-lg"
                    />
                    {profilePicLoading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
                        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-purple-600"></div>
                      </div>
                    )}
                    <button className="absolute bottom-0 right-0 rounded-full bg-white p-2 shadow-lg transition-colors hover:bg-gray-50">
                      <PencilIcon className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                  <h2 className="text-xl font-bold">{name || profile.email}</h2>
                  <p className="text-sm text-blue-100">
                    {currentJobTitle || 'Job Seeker'}
                  </p>
                  {location && (
                    <div className="mt-2 flex items-center text-sm text-blue-100">
                      <MapPinIcon className="mr-1 h-4 w-4" />
                      {location}
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Stats */}
              <div className="p-6">
                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">0</div>
                    <div className="text-sm text-gray-600">Applications</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">0</div>
                    <div className="text-sm text-gray-600">Saved Jobs</div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                  <Link
                    href="/jobs"
                    className="group flex w-full items-center justify-between rounded-lg bg-purple-50 p-3 transition-colors hover:bg-purple-100"
                  >
                    <div className="flex items-center">
                      <BriefcaseIcon className="mr-3 h-5 w-5 text-purple-600" />
                      <span className="font-medium text-gray-900">
                        Browse Jobs
                      </span>
                    </div>
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-400 group-hover:text-purple-600" />
                  </Link>

                  <Link
                    href="/profile/applications?tab=saved"
                    className="group flex w-full items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <BookmarkIcon className="mr-3 h-5 w-5 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        Saved Jobs
                      </span>
                    </div>
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  </Link>

                  <Link
                    href="/profile/applications"
                    className="group flex w-full items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <ClockIcon className="mr-3 h-5 w-5 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        Applications
                      </span>
                    </div>
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  </Link>
                </div>

                {/* Achievement Showcase */}
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h3 className="mb-4 font-semibold text-gray-900">Recent Achievements</h3>
                  <AchievementBadges 
                    user={profile} 
                    stats={stats}
                    unlockedOnly={true}
                    maxDisplay={6}
                    size="sm"
                    showPoints={false}
                  />
                </div>

                {/* Profile Picture Upload */}
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <form onSubmit={handleProfilePicUpload} className="space-y-3">
                    <input
                      type="file"
                      name="file"
                      accept="image/*"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-purple-700 hover:file:bg-purple-100"
                      onChange={handleProfilePicChange}
                    />
                    <button
                      type="submit"
                      disabled={profilePicLoading}
                      className="flex w-full items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
                    >
                      {profilePicLoading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <CloudArrowUpIcon className="mr-2 h-4 w-4" />
                          Update Photo
                        </>
                      )}
                    </button>
                  </form>
                  {profilePicError && (
                    <div className="mt-2 text-sm text-red-600">
                      {profilePicError}
                    </div>
                  )}
                  {profilePicSuccess && (
                    <div className="mt-2 text-sm text-green-600">
                      {profilePicSuccess}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Main Content Area */}
          <div className="space-y-8 lg:col-span-2">
            {/* Personal Information Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg"
            >
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex items-center">
                  <UserCircleIcon className="mr-3 h-6 w-6 text-[#2d4a3e]" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Personal Information
                  </h2>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-500"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-10 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                        placeholder="City, State, ZIP"
                      />
                      <MapPinIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-10 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                        placeholder="(555) 123-4567"
                      />
                      <PhoneIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      LinkedIn / Portfolio
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={e => setLinkedinUrl(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-10 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                        placeholder="https://linkedin.com/in/yourname"
                      />
                      <LinkIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Current Job Title
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={currentJobTitle}
                        onChange={e => setCurrentJobTitle(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-10 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                        placeholder="Software Engineer, Marketing Manager, etc."
                      />
                      <BriefcaseIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Job Preferences Section */}
                <div className="mt-8 border-t border-gray-200 pt-8">
                  <div className="mb-6 flex items-center">
                    <BriefcaseIcon className="mr-3 h-6 w-6 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-900">
                      Job Preferences
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Preferred Job Types
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {jobTypeOptions.map(jt => (
                          <label
                            key={jt}
                            className="flex cursor-pointer items-center space-x-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={preferredJobTypes.includes(jt)}
                              onChange={e => {
                                if (e.target.checked)
                                  setPreferredJobTypes([
                                    ...preferredJobTypes,
                                    jt,
                                  ]);
                                else
                                  setPreferredJobTypes(
                                    preferredJobTypes.filter(t => t !== jt)
                                  );
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm font-medium capitalize text-gray-700">
                              {jt.replace('-', ' ')}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Work Authorization
                      </label>
                      <input
                        type="text"
                        value={workAuthorization}
                        onChange={e => setWorkAuthorization(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., US Citizen, Work Visa, etc."
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Skills
                      </label>
                      <textarea
                        value={skills}
                        onChange={e => setSkills(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., React, Node.js, SQL, Project Management, etc."
                      />
                      <p className="text-sm text-gray-500">
                        Separate skills with commas
                      </p>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Education & Experience
                      </label>
                      <div className="relative">
                        <textarea
                          value={educationExperience}
                          onChange={e => setEducationExperience(e.target.value)}
                          rows={4}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-10 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                          placeholder="Add your education background and work experience..."
                        />
                        <AcademicCapIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-3 rounded-lg border border-purple-200 bg-purple-50 p-4">
                        <input
                          type="checkbox"
                          id="isProfilePublic"
                          checked={isProfilePublic}
                          onChange={e => setIsProfilePublic(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <label
                            htmlFor="isProfilePublic"
                            className="text-sm font-medium text-gray-900"
                          >
                            Make my profile public to employers
                          </label>
                          <p className="text-sm text-gray-600">
                            Allow employers to find and contact you directly
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Section */}
                <div className="mt-8 border-t border-gray-200 pt-8">
                  <div className="mb-6 flex items-center">
                    <ShieldCheckIcon className="mr-3 h-6 w-6 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-900">
                      Security Settings
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter current password"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter new password"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                  {error && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                      <div className="flex items-center">
                        <ExclamationTriangleIcon className="mr-2 h-5 w-5 text-red-400" />
                        <span className="text-sm text-red-800">{error}</span>
                      </div>
                    </div>
                  )}

                  {success && (
                    <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
                      <div className="flex items-center">
                        <CheckCircleIcon className="mr-2 h-5 w-5 text-green-400" />
                        <span className="text-sm text-green-800">
                          {success}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 font-semibold text-white shadow-lg transition-all duration-200 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="mr-2 h-5 w-5" />
                        Save All Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Enhanced Resume & Documents Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg"
            >
              <div className="border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DocumentTextIcon className="mr-3 h-6 w-6 text-white" />
                    <h2 className="text-xl font-bold text-white">
                      Resume & Documents
                    </h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    {resumeUrl && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                        <CheckCircleIcon className="mr-1 h-4 w-4" />
                        Resume Ready
                      </span>
                    )}
                    <button className="inline-flex items-center rounded-lg bg-white/20 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-white/30">
                      <PlusIcon className="mr-1 h-4 w-4" />
                      Add Document
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Resume Section */}
                <div className="mb-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Resume</h3>
                    <span className="text-sm text-gray-500">Primary application document</span>
                  </div>
                  
                  {resumeUrl ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border-2 border-green-200 bg-green-50 p-4">
                        <div className="flex items-center">
                          <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                            <DocumentTextIcon className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              Current Resume
                            </h4>
                            <p className="text-sm text-gray-600">
                              Ready for job applications • PDF format
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Uploaded: {new Date().toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <a
                            href={resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-lg border border-green-300 bg-white px-3 py-2 text-green-700 transition-colors hover:bg-green-50"
                          >
                            <EyeIcon className="mr-1 h-4 w-4" />
                            View
                          </a>
                          <button className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 transition-colors hover:bg-gray-50">
                            <PencilIcon className="mr-1 h-4 w-4" />
                            Replace
                          </button>
                          <button
                            onClick={handleResumeDelete}
                            disabled={resumeLoading}
                            className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Resume Analytics */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg bg-blue-50 p-3 text-center">
                          <div className="text-2xl font-bold text-blue-600">12</div>
                          <div className="text-sm text-blue-700">Applications</div>
                        </div>
                        <div className="rounded-lg bg-green-50 p-3 text-center">
                          <div className="text-2xl font-bold text-green-600">8</div>
                          <div className="text-sm text-green-700">Views</div>
                        </div>
                        <div className="rounded-lg bg-purple-50 p-3 text-center">
                          <div className="text-2xl font-bold text-purple-600">3</div>
                          <div className="text-sm text-purple-700">Downloads</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                      <DocumentTextIcon className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                      <h4 className="mb-2 text-lg font-semibold text-gray-900">
                        Upload Your Resume
                      </h4>
                      <p className="mb-6 text-gray-600">
                        Stand out to employers with a professional resume. We support PDF, DOC, and DOCX formats.
                      </p>

                      <form onSubmit={handleResumeUpload} className="space-y-4">
                        <input
                          type="file"
                          name="resume"
                          accept="application/pdf,.doc,.docx"
                          className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-50 file:px-6 file:py-3 file:text-sm file:font-medium file:text-purple-700 hover:file:bg-purple-100"
                        />
                        <button
                          type="submit"
                          disabled={resumeLoading}
                          className="flex w-full items-center justify-center rounded-lg bg-purple-600 px-6 py-3 text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
                        >
                          {resumeLoading ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <CloudArrowUpIcon className="mr-2 h-4 w-4" />
                              Upload Resume
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Cover Letter Section */}
                <div className="mb-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Cover Letter Template</h3>
                  </div>
                  
                  {/* Show existing cover letter if uploaded */}
                  {coverLetterUrl ? (
                    <div className="rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="mr-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                            <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Cover Letter Template</h4>
                            <p className="text-xs text-gray-500 mt-1">
                              Uploaded: {new Date().toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <a
                            href={coverLetterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-lg border border-green-300 bg-white px-3 py-2 text-green-700 transition-colors hover:bg-green-50"
                          >
                            <EyeIcon className="mr-1 h-4 w-4" />
                            View
                          </a>
                          <button className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 transition-colors hover:bg-gray-50">
                            <PencilIcon className="mr-1 h-4 w-4" />
                            Replace
                          </button>
                          <button
                            className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-white transition-colors hover:bg-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                      <DocumentTextIcon className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                      <h4 className="mb-2 text-lg font-semibold text-gray-900">
                        Upload Cover Letter Template
                      </h4>
                      <p className="mb-6 text-gray-600">
                        Upload a cover letter template that you can customize for different applications. We support PDF, DOC, and DOCX formats.
                      </p>

                      <form onSubmit={handleCoverLetterUpload} className="space-y-4">
                        <input
                          type="file"
                          name="coverLetter"
                          accept="application/pdf,.doc,.docx"
                          className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-50 file:px-6 file:py-3 file:text-sm file:font-medium file:text-purple-700 hover:file:bg-purple-100"
                        />
                        <button
                          type="submit"
                          disabled={coverLetterLoading}
                          className="flex w-full items-center justify-center rounded-lg bg-purple-600 px-6 py-3 text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
                        >
                          {coverLetterLoading ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <CloudArrowUpIcon className="mr-2 h-4 w-4" />
                              Upload Cover Letter
                            </>
                          )}
                        </button>
                      </form>
                      {coverLetterError && (
                        <div className="mt-2 text-sm text-red-600">
                          {coverLetterError}
                        </div>
                      )}
                      {coverLetterSuccess && (
                        <div className="mt-2 text-sm text-green-600">
                          {coverLetterSuccess}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Application Preferences */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h3 className="mb-3 font-semibold text-gray-900">Application Preferences</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Auto-attach resume to applications</span>
                      <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Include cover letter by default</span>
                      <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Track application status</span>
                      <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    </div>
                  </div>
                </div>

                {/* Status Messages */}
                {resumeError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="mr-2 h-5 w-5 text-red-400" />
                      <span className="text-sm text-red-800">{resumeError}</span>
                    </div>
                  </div>
                )}

                {resumeSuccess && (
                  <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="flex items-center">
                      <CheckCircleIcon className="mr-2 h-5 w-5 text-green-400" />
                      <span className="text-sm text-green-800">{resumeSuccess}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Job Activity Dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg"
            >
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex items-center">
                  <ClockIcon className="mr-3 h-6 w-6 text-purple-600" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Job Activity
                  </h2>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Saved Jobs Widget */}
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <BookmarkIcon className="mr-3 h-8 w-8 text-blue-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Saved Jobs
                          </h3>
                          <p className="text-sm text-gray-600">
                            Jobs you're interested in
                          </p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{stats.savedJobs}</div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Save jobs while browsing to review them later
                      </p>
                      <div className="flex space-x-3">
                        <Link
                          href="/jobs"
                          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
                        >
                          Browse Jobs
                        </Link>
                        <Link
                          href="/profile/applications?tab=saved"
                          className="flex-1 rounded-lg border border-blue-300 bg-white px-4 py-2 text-center text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50"
                        >
                          View Saved
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Applications Widget */}
                  <div className="rounded-xl border border-green-200 bg-green-50 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <PaperAirplaneIcon className="mr-3 h-8 w-8 text-green-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Applications
                          </h3>
                          <p className="text-sm text-gray-600">
                            Jobs you've applied to
                          </p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-600">{stats.applications}</div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Track your application status and follow up
                      </p>
                      <div className="flex space-x-3">
                        <Link
                          href="/jobs"
                          className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-green-700"
                        >
                          Apply Now
                        </Link>
                        <Link
                          href="/profile/applications"
                          className="flex-1 rounded-lg border border-green-300 bg-white px-4 py-2 text-center text-sm font-medium text-green-700 transition-colors hover:bg-green-50"
                        >
                          View History
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Job Alerts Widget */}
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <BellIcon className="mr-3 h-8 w-8 text-yellow-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Job Alerts
                          </h3>
                          <p className="text-sm text-gray-600">
                            Get notified of new jobs
                          </p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-yellow-600">
                        {stats.alerts}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Set up alerts for jobs matching your criteria
                      </p>
                      <button className="w-full rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-700">
                        Create Alert
                      </button>
                    </div>
                  </div>

                  {/* Enhanced Profile Completion Tracker */}
                  <div className="md:col-span-2">
                    <ProfileCompletionTracker user={profile} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
