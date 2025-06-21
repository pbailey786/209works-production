'use client';

import { useState, useEffect } from 'react';
import { motion } from 'lucide-react';

interface JobSeekerProfile {
  id?: string;
  zipCode?: string;
  distanceWillingToTravel?: number;
  availabilityDays?: string[];
  availabilityShifts?: string[];
  jobTypes?: string[];
  skills?: string[];
  careerGoal?: string;
  optInEmailAlerts?: boolean;
  optInSmsAlerts?: boolean;
  allowEmployerMessages?: boolean;
  whatAreYouGoodAt?: string;
  resumeData?: {
    workHistory?: string[];
    education?: string;
    skills?: string[];
  };
}

interface JobSeekerProfileSetupProps {
  initialProfile?: JobSeekerProfile;
  onSave?: (profile: JobSeekerProfile) => void;
  onCancel?: () => void;
}

const AVAILABILITY_DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const AVAILABILITY_SHIFTS = [
  'Morning (6AM-12PM)', 'Afternoon (12PM-6PM)', 'Evening (6PM-12AM)', 'Night (12AM-6AM)'
];

const JOB_TYPES = [
  'Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Remote'
];

const COMMON_SKILLS = [
  'Customer Service', 'Sales', 'Data Entry', 'Microsoft Office', 'Communication',
  'Problem Solving', 'Teamwork', 'Time Management', 'Leadership', 'Organization',
  'Computer Skills', 'Cash Handling', 'Inventory Management', 'Social Media',
  'Marketing', 'Project Management', 'Training', 'Bilingual', 'Driving'
];

export default function JobSeekerProfileSetup({
  initialProfile,
  onSave,
  onCancel
}: JobSeekerProfileSetupProps) {
  const [profile, setProfile] = useState<JobSeekerProfile>(
    initialProfile || {
      zipCode: '',
      distanceWillingToTravel: 25,
      availabilityDays: [],
      availabilityShifts: [],
      jobTypes: [],
      skills: [],
      careerGoal: '',
      optInEmailAlerts: false,
      optInSmsAlerts: false,
      allowEmployerMessages: false,
      whatAreYouGoodAt: '',
      resumeData: {
        workHistory: [],
        education: '',
        skills: []
      }
    }
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [customSkill, setCustomSkill] = useState('');

  const totalSteps = 5;

  const updateProfile = (updates: Partial<JobSeekerProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !profile.skills?.includes(customSkill.trim())) {
      updateProfile({
        skills: [...(profile.skills || []), customSkill.trim()]
      });
      setCustomSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    updateProfile({
      skills: profile.skills?.filter(s => s !== skill) || []
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/profile/jobseeker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      const data = await response.json();
      onSave?.(data.profile);
    } catch (error) {
      console.error('Error saving profile:', error);
      // Handle error (show toast, etc.)
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <MapPin className="mx-auto mb-4 h-12 w-12 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Location & Travel</h3>
              <p className="text-gray-600">Help us find jobs in your area</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={profile.zipCode || ''}
                  onChange={(e) => updateProfile({ zipCode: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="95209"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Distance willing to travel: {profile.distanceWillingToTravel} miles
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={profile.distanceWillingToTravel || 25}
                  onChange={(e) => updateProfile({ distanceWillingToTravel: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>5 miles</span>
                  <span>50 miles</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Settings className="mx-auto mb-4 h-12 w-12 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Availability</h3>
              <p className="text-gray-600">When are you available to work?</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Available Days
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABILITY_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => updateProfile({
                        availabilityDays: toggleArrayItem(profile.availabilityDays || [], day)
                      })}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        profile.availabilityDays?.includes(day)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Preferred Shifts
                </label>
                <div className="space-y-2">
                  {AVAILABILITY_SHIFTS.map((shift) => (
                    <button
                      key={shift}
                      type="button"
                      onClick={() => updateProfile({
                        availabilityShifts: toggleArrayItem(profile.availabilityShifts || [], shift)
                      })}
                      className={`w-full p-3 rounded-lg border text-sm font-medium transition-colors text-left ${
                        profile.availabilityShifts?.includes(shift)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {shift}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Briefcase className="mx-auto mb-4 h-12 w-12 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Job Preferences</h3>
              <p className="text-gray-600">What type of work are you looking for?</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Job Types
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {JOB_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateProfile({
                        jobTypes: toggleArrayItem(profile.jobTypes || [], type)
                      })}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        profile.jobTypes?.includes(type)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Career Goal
                </label>
                <textarea
                  value={profile.careerGoal || ''}
                  onChange={(e) => updateProfile({ careerGoal: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  placeholder="What are your career goals? What type of role are you hoping to find?"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <GraduationCap className="mx-auto mb-4 h-12 w-12 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Skills & Experience</h3>
              <p className="text-gray-600">Tell us about your skills and what you're good at</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Your Skills
                </label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {COMMON_SKILLS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => updateProfile({
                        skills: toggleArrayItem(profile.skills || [], skill)
                      })}
                      className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                        profile.skills?.includes(skill)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>

                {/* Custom Skill Input */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Add a custom skill..."
                    onKeyPress={(e) => e.key === 'Enter' && addCustomSkill()}
                  />
                  <button
                    type="button"
                    onClick={addCustomSkill}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Selected Skills */}
                {profile.skills && profile.skills.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What are you good at?
                </label>
                <textarea
                  value={profile.whatAreYouGoodAt || ''}
                  onChange={(e) => updateProfile({ whatAreYouGoodAt: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe your strengths, achievements, or what makes you stand out..."
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Bell className="mx-auto mb-4 h-12 w-12 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Notifications & Privacy</h3>
              <p className="text-gray-600">Choose how you'd like to be contacted about opportunities</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Email Job Alerts</h4>
                    <p className="text-sm text-gray-600">Get notified about new job matches via email</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={profile.optInEmailAlerts || false}
                      onChange={(e) => updateProfile({ optInEmailAlerts: e.target.checked })}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                    <p className="text-sm text-gray-600">Receive urgent job alerts via text message</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={profile.optInSmsAlerts || false}
                      onChange={(e) => updateProfile({ optInSmsAlerts: e.target.checked })}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Allow Employer Messages</h4>
                    <p className="text-sm text-gray-600">Let employers contact you directly about opportunities</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={profile.allowEmployerMessages || false}
                      onChange={(e) => updateProfile({ allowEmployerMessages: e.target.checked })}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                  </label>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Globe className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-medium text-blue-900">Privacy Notice</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Your profile information will only be shared with employers when you apply to jobs or opt-in to direct messages.
                      You can update these preferences at any time in your account settings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round((currentStep / totalSteps) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm"
      >
        {renderStepContent()}
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex space-x-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          )}

          {currentStep < totalSteps ? (
            <button
              onClick={nextStep}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Complete Profile'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
