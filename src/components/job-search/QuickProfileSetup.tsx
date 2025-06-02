import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, MapPin, DollarSign, Briefcase, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickProfileSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (profile: any) => void;
}

const jobTypes = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'temporary', label: 'Temporary' }
];

const experienceOptions = [
  { value: 0, label: 'No experience' },
  { value: 1, label: '1 year' },
  { value: 2, label: '2 years' },
  { value: 3, label: '3-5 years' },
  { value: 5, label: '5+ years' },
  { value: 10, label: '10+ years' }
];

const centralValleyLocations = [
  'Stockton, CA',
  'Modesto, CA', 
  'Fresno, CA',
  'Visalia, CA',
  'Bakersfield, CA',
  'Tracy, CA',
  'Manteca, CA',
  'Lodi, CA',
  'Turlock, CA',
  'Merced, CA'
];

const commonSkills = [
  'Customer Service', 'Communication', 'Teamwork', 'Problem Solving',
  'Microsoft Office', 'Data Entry', 'Sales', 'Leadership',
  'Time Management', 'Organization', 'Forklift Operation', 'Warehouse',
  'Retail', 'Food Service', 'Healthcare', 'Administrative',
  'Bilingual (Spanish)', 'Cash Handling', 'Inventory Management'
];

export default function QuickProfileSetup({ isOpen, onClose, onComplete }: QuickProfileSetupProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    jobTitle: '',
    experienceYears: 0,
    topSkills: [] as string[],
    preferredLocation: '',
    salaryMin: '',
    salaryMax: '',
    remoteWork: false,
    jobTypes: [] as string[]
  });

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      topSkills: prev.topSkills.includes(skill)
        ? prev.topSkills.filter(s => s !== skill)
        : [...prev.topSkills, skill].slice(0, 5) // Max 5 skills
    }));
  };

  const handleJobTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(type)
        ? prev.jobTypes.filter(t => t !== type)
        : [...prev.jobTypes, type]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        onComplete(data.profile);
        onClose();
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Quick Profile Setup</h2>
              <p className="text-sm text-gray-600">Step {step} of 4 - Get better job matches</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="px-6 pb-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <User className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Tell us about yourself</h3>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What job title are you looking for?
                  </label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                    placeholder="e.g., Customer Service Representative"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of experience
                  </label>
                  <select
                    value={formData.experienceYears}
                    onChange={(e) => setFormData(prev => ({ ...prev, experienceYears: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {experienceOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <Star className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Your top skills</h3>
                  <p className="text-sm text-gray-600">Select up to 5 skills that best describe you</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {commonSkills.map(skill => (
                    <button
                      key={skill}
                      onClick={() => handleSkillToggle(skill)}
                      className={`p-3 text-sm rounded-lg border transition-colors ${
                        formData.topSkills.includes(skill)
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Selected: {formData.topSkills.length}/5
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Location preferences</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred work location
                  </label>
                  <select
                    value={formData.preferredLocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferredLocation: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a location</option>
                    {centralValleyLocations.map(location => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remoteWork"
                    checked={formData.remoteWork}
                    onChange={(e) => setFormData(prev => ({ ...prev, remoteWork: e.target.checked }))}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remoteWork" className="text-sm text-gray-700">
                    I'm open to remote work
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job types you're interested in
                  </label>
                  <div className="space-y-2">
                    {jobTypes.map(type => (
                      <label key={type.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.jobTypes.includes(type.value)}
                          onChange={() => handleJobTypeToggle(type.value)}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <DollarSign className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Salary expectations</h3>
                  <p className="text-sm text-gray-600">Optional - helps us find better matches</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum salary
                    </label>
                    <input
                      type="number"
                      value={formData.salaryMin}
                      onChange={(e) => setFormData(prev => ({ ...prev, salaryMin: e.target.value }))}
                      placeholder="30000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum salary
                    </label>
                    <input
                      type="number"
                      value={formData.salaryMax}
                      onChange={(e) => setFormData(prev => ({ ...prev, salaryMax: e.target.value }))}
                      placeholder="60000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={step === 1 ? onClose : prevStep}
              disabled={loading}
            >
              {step === 1 ? 'Skip' : 'Back'}
            </Button>

            <Button
              onClick={step === 4 ? handleSubmit : nextStep}
              disabled={loading}
              className="min-w-[100px]"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : step === 4 ? (
                'Complete Setup'
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
