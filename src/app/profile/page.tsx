"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
  PaperAirplaneIcon
} from "@heroicons/react/24/outline";
import Input from "../../components/Input";
import Button from "../../components/Button";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [resumeSuccess, setResumeSuccess] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [profilePicLoading, setProfilePicLoading] = useState(false);
  const [profilePicError, setProfilePicError] = useState("");
  const [profilePicSuccess, setProfilePicSuccess] = useState("");
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [currentJobTitle, setCurrentJobTitle] = useState("");
  const [preferredJobTypes, setPreferredJobTypes] = useState<string[]>([]);
  const [skills, setSkills] = useState("");
  const [workAuthorization, setWorkAuthorization] = useState("");
  const [educationExperience, setEducationExperience] = useState("");
  const [isProfilePublic, setIsProfilePublic] = useState(false);
  const jobTypeOptions = ["full-time", "part-time", "remote", "contract"];
  // Tab state for job tracking widgets
  const [activeTab, setActiveTab] = useState("Saved Jobs");
  const tabs = [
    { label: "Saved Jobs", key: "Saved Jobs" },
    { label: "Applications History", key: "Applications History" },
    { label: "Alerts & Notifications", key: "Alerts & Notifications" },
    { label: "Resume Versions", key: "Resume Versions" },
    { label: "Cover Letters", key: "Cover Letters" },
  ];

  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setProfile(data.user);
          setName(data.user.name || "");
          setResumeUrl(data.user.resumeUrl || null);
          setProfilePictureUrl(data.user.profilePictureUrl || null);
          setLocation(data.user.location || "");
          setPhoneNumber(data.user.phoneNumber || "");
          setLinkedinUrl(data.user.linkedinUrl || "");
          setCurrentJobTitle(data.user.currentJobTitle || "");
          setPreferredJobTypes(data.user.preferredJobTypes || []);
          setSkills((data.user.skills || []).join(", "));
          setWorkAuthorization(data.user.workAuthorization || "");
          setEducationExperience(data.user.educationExperience || "");
          setIsProfilePublic(!!data.user.isProfilePublic);
        }
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name !== profile?.name ? name : undefined,
          currentPassword: newPassword ? currentPassword : undefined,
          newPassword: newPassword || undefined,
          location,
          phoneNumber,
          linkedinUrl,
          currentJobTitle,
          preferredJobTypes,
          skills: skills.split(",").map(s => s.trim()).filter(Boolean),
          workAuthorization,
          educationExperience,
          isProfilePublic,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Profile updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setError(data.error || "Update failed");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResumeUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResumeLoading(true);
    setResumeError("");
    setResumeSuccess("");
    const form = e.target as HTMLFormElement;
    const fileInput = form.elements.namedItem("resume") as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) {
      setResumeError("Please select a file.");
      setResumeLoading(false);
      return;
    }
    const formData = new FormData();
    formData.append("resume", fileInput.files[0]);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.resumeUrl) {
        setResumeUrl(data.resumeUrl);
        setResumeSuccess("Resume uploaded successfully.");
      } else {
        setResumeError(data.error || "Upload failed");
      }
    } catch (err) {
      setResumeError("Upload failed");
    } finally {
      setResumeLoading(false);
    }
  }

  async function handleResumeDelete() {
    setResumeLoading(true);
    setResumeError("");
    setResumeSuccess("");
    try {
      const res = await fetch("/api/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        setResumeUrl(null);
        setResumeSuccess("Resume deleted.");
      } else {
        setResumeError(data.error || "Delete failed");
      }
    } catch (err) {
      setResumeError("Delete failed");
    } finally {
      setResumeLoading(false);
    }
  }

  async function handleProfilePicUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfilePicLoading(true);
    setProfilePicError("");
    setProfilePicSuccess("");
    const form = e.target as HTMLFormElement;
    const fileInput = form.elements.namedItem("profilePicture") as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) {
      setProfilePicError("Please select an image file.");
      setProfilePicLoading(false);
      return;
    }
    const file = fileInput.files[0];
    // Show preview
    setProfilePicPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append("profilePicture", file);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.profilePictureUrl) {
        setProfilePictureUrl(data.profilePictureUrl);
        setProfilePicSuccess("Profile picture updated successfully.");
        setProfilePicPreview(null);
      } else {
        setProfilePicError(data.error || "Upload failed");
      }
    } catch (err) {
      setProfilePicError("Upload failed");
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600 mt-1">Manage your account and job preferences</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isProfilePublic
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {isProfilePublic ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Public Profile
                  </>
                ) : (
                  <>
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    Private Profile
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Profile Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
            >
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-8 text-white">
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <img
                      src={profilePicPreview || profilePictureUrl || "/default-avatar.svg"}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg bg-gray-100"
                    />
                    {profilePicLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-full">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                      </div>
                    )}
                    <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors">
                      <PencilIcon className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                  <h2 className="text-xl font-bold">{name || profile.email}</h2>
                  <p className="text-purple-100 text-sm">{currentJobTitle || 'Job Seeker'}</p>
                  {location && (
                    <div className="flex items-center mt-2 text-purple-100 text-sm">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {location}
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Stats */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
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
                    className="flex items-center justify-between w-full p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center">
                      <BriefcaseIcon className="h-5 w-5 text-purple-600 mr-3" />
                      <span className="text-gray-900 font-medium">Browse Jobs</span>
                    </div>
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-400 group-hover:text-purple-600" />
                  </Link>

                  <Link
                    href="/profile/saved"
                    className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center">
                      <BookmarkIcon className="h-5 w-5 text-gray-600 mr-3" />
                      <span className="text-gray-900 font-medium">Saved Jobs</span>
                    </div>
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  </Link>

                  <Link
                    href="/profile/applications"
                    className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-gray-600 mr-3" />
                      <span className="text-gray-900 font-medium">Applications</span>
                    </div>
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  </Link>
                </div>

                {/* Profile Picture Upload */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <form onSubmit={handleProfilePicUpload} className="space-y-3">
                    <input
                      type="file"
                      name="profilePicture"
                      accept="image/*"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                      onChange={handleProfilePicChange}
                    />
                    <button
                      type="submit"
                      disabled={profilePicLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                      {profilePicLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                          Update Photo
                        </>
                      )}
                    </button>
                  </form>
                  {profilePicError && <div className="text-red-600 text-sm mt-2">{profilePicError}</div>}
                  {profilePicSuccess && <div className="text-green-600 text-sm mt-2">{profilePicSuccess}</div>}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <UserCircleIcon className="h-6 w-6 text-purple-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="City, State, ZIP"
                      />
                      <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="(555) 123-4567"
                      />
                      <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">LinkedIn / Portfolio</label>
                    <div className="relative">
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={e => setLinkedinUrl(e.target.value)}
                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="https://linkedin.com/in/yourname"
                      />
                      <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Current Job Title</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={currentJobTitle}
                        onChange={e => setCurrentJobTitle(e.target.value)}
                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Software Engineer, Marketing Manager, etc."
                      />
                      <BriefcaseIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Job Preferences Section */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <div className="flex items-center mb-6">
                    <BriefcaseIcon className="h-6 w-6 text-purple-600 mr-3" />
                    <h3 className="text-lg font-bold text-gray-900">Job Preferences</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Preferred Job Types</label>
                      <div className="grid grid-cols-2 gap-3">
                        {jobTypeOptions.map(jt => (
                          <label key={jt} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferredJobTypes.includes(jt)}
                              onChange={e => {
                                if (e.target.checked) setPreferredJobTypes([...preferredJobTypes, jt]);
                                else setPreferredJobTypes(preferredJobTypes.filter(t => t !== jt));
                              }}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <span className="text-sm font-medium text-gray-700 capitalize">{jt.replace('-', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Work Authorization</label>
                      <input
                        type="text"
                        value={workAuthorization}
                        onChange={e => setWorkAuthorization(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., US Citizen, Work Visa, etc."
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Skills</label>
                      <textarea
                        value={skills}
                        onChange={e => setSkills(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., React, Node.js, SQL, Project Management, etc."
                      />
                      <p className="text-sm text-gray-500">Separate skills with commas</p>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Education & Experience</label>
                      <div className="relative">
                        <textarea
                          value={educationExperience}
                          onChange={e => setEducationExperience(e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Add your education background and work experience..."
                        />
                        <AcademicCapIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <input
                          type="checkbox"
                          id="isProfilePublic"
                          checked={isProfilePublic}
                          onChange={e => setIsProfilePublic(e.target.checked)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <div>
                          <label htmlFor="isProfilePublic" className="text-sm font-medium text-gray-900">
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
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <div className="flex items-center mb-6">
                    <ShieldCheckIcon className="h-6 w-6 text-purple-600 mr-3" />
                    <h3 className="text-lg font-bold text-gray-900">Security Settings</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter current password"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter new password"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                        <span className="text-red-800 text-sm">{error}</span>
                      </div>
                    </div>
                  )}

                  {success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                        <span className="text-green-800 text-sm">{success}</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Save All Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Resume Management Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-6 w-6 text-purple-600 mr-3" />
                    <h2 className="text-xl font-bold text-gray-900">Resume Management</h2>
                  </div>
                  {resumeUrl && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Uploaded
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6">
                {resumeUrl ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-8 w-8 text-green-600 mr-3" />
                        <div>
                          <h3 className="font-medium text-gray-900">Current Resume</h3>
                          <p className="text-sm text-gray-600">Ready for job applications</p>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <a
                          href={resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          View
                        </a>
                        <button
                          onClick={handleResumeDelete}
                          disabled={resumeLoading}
                          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {resumeLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <TrashIcon className="h-4 w-4 mr-2" />
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Resume Uploaded</h3>
                    <p className="text-gray-600 mb-6">Upload your resume to start applying for jobs</p>

                    <form onSubmit={handleResumeUpload} className="space-y-4">
                      <input
                        type="file"
                        name="resume"
                        accept="application/pdf,.doc,.docx"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                      />
                      <button
                        type="submit"
                        disabled={resumeLoading}
                        className="w-full flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                      >
                        {resumeLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                            Upload Resume
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {resumeError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                      <span className="text-red-800 text-sm">{resumeError}</span>
                    </div>
                  </div>
                )}

                {resumeSuccess && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                      <span className="text-green-800 text-sm">{resumeSuccess}</span>
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
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <ClockIcon className="h-6 w-6 text-purple-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-900">Job Activity</h2>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Saved Jobs Widget */}
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <BookmarkIcon className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                          <h3 className="font-semibold text-gray-900">Saved Jobs</h3>
                          <p className="text-sm text-gray-600">Jobs you're interested in</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">0</div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Save jobs while browsing to review them later
                      </p>
                      <div className="flex space-x-3">
                        <Link
                          href="/jobs"
                          className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Browse Jobs
                        </Link>
                        <Link
                          href="/profile/saved"
                          className="flex-1 bg-white border border-blue-300 text-blue-700 text-center py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                        >
                          View Saved
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Applications Widget */}
                  <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <PaperAirplaneIcon className="h-8 w-8 text-green-600 mr-3" />
                        <div>
                          <h3 className="font-semibold text-gray-900">Applications</h3>
                          <p className="text-sm text-gray-600">Jobs you've applied to</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-600">0</div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Track your application status and follow up
                      </p>
                      <div className="flex space-x-3">
                        <Link
                          href="/jobs"
                          className="flex-1 bg-green-600 text-white text-center py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Apply Now
                        </Link>
                        <Link
                          href="/profile/applications"
                          className="flex-1 bg-white border border-green-300 text-green-700 text-center py-2 px-4 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
                        >
                          View History
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Job Alerts Widget */}
                  <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <BellIcon className="h-8 w-8 text-yellow-600 mr-3" />
                        <div>
                          <h3 className="font-semibold text-gray-900">Job Alerts</h3>
                          <p className="text-sm text-gray-600">Get notified of new jobs</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-yellow-600">0</div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Set up alerts for jobs matching your criteria
                      </p>
                      <button className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium">
                        Create Alert
                      </button>
                    </div>
                  </div>

                  {/* Profile Completion Widget */}
                  <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <UserCircleIcon className="h-8 w-8 text-purple-600 mr-3" />
                        <div>
                          <h3 className="font-semibold text-gray-900">Profile Strength</h3>
                          <p className="text-sm text-gray-600">Complete your profile</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round(
                          ((name ? 1 : 0) +
                          (location ? 1 : 0) +
                          (currentJobTitle ? 1 : 0) +
                          (skills ? 1 : 0) +
                          (resumeUrl ? 1 : 0)) / 5 * 100
                        )}%
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.round(
                              ((name ? 1 : 0) +
                              (location ? 1 : 0) +
                              (currentJobTitle ? 1 : 0) +
                              (skills ? 1 : 0) +
                              (resumeUrl ? 1 : 0)) / 5 * 100
                            )}%`
                          }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600">
                        A complete profile gets more employer attention
                      </p>
                    </div>
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