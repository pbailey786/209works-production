import React, { useState } from '@/components/ui/card';
import { motion, AnimatePresence } from '@/components/ui/card';
import { X, User, MapPin, DollarSign, Briefcase, Star } from '@/components/ui/card';
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
  { value: 'temporary', label: 'Temporary' },
];

const experienceOptions = [
  { value: 0, label: 'No experience' },
  { value: 1, label: '1 year' },
  { value: 2, label: '2 years' },
  { value: 3, label: '3-5 years' },
  { value: 5, label: '5+ years' },
  { value: 10, label: '10+ years' },
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
  'Merced, CA',
];

const commonSkills = [
  'Customer Service',
  'Communication',
  'Teamwork',
  'Problem Solving',
  'Microsoft Office',
  'Data Entry',
  'Sales',
  'Leadership',
  'Time Management',
  'Organization',
  'Forklift Operation',
  'Warehouse',
  'Retail',
  'Food Service',
  'Healthcare',
  'Administrative',
  'Bilingual (Spanish)',
  'Cash Handling',
  'Inventory Management',
];

export default function QuickProfileSetup({
  isOpen,
  onClose,
  onComplete,
}: QuickProfileSetupProps) {
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
    jobTypes: [] as string[],
  });

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      topSkills: prev.topSkills.includes(skill)
        ? prev.topSkills.filter(s => s !== skill)
        : [...prev.topSkills, skill].slice(0, 5), // Max 5 skills
    }));
  };

  const handleJobTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(type)
        ? prev.jobTypes.filter(t => t !== type)
        : [...prev.jobTypes, type],
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Quick Profile Setup
              </h2>
              <p className="text-sm text-gray-600">
                Step {step} of 4 - Get better job matches
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 transition-colors hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4">
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="px-6 pb-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="mb-6 text-center">
                  <User className="mx-auto mb-3 h-12 w-12 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Tell us about yourself
                  </h3>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    What job title are you looking for?
                  </label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        jobTitle: e.target.value,
                      }))
                    }
                    placeholder="e.g., Customer Service Representative"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Years of experience
                  </label>
                  <select
                    value={formData.experienceYears}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        experienceYears: parseInt(e.target.value),
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
                <div className="mb-6 text-center">
                  <Star className="mx-auto mb-3 h-12 w-12 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Your top skills
                  </h3>
                  <p className="text-sm text-gray-600">
                    Select up to 5 skills that best describe you
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {commonSkills.map(skill => (
                    <button
                      key={skill}
                      onClick={() => handleSkillToggle(skill)}
                      className={`rounded-lg border p-3 text-sm transition-colors ${
                        formData.topSkills.includes(skill)
                          ? 'border-blue-500 bg-blue-100 text-blue-700'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>

                <p className="text-center text-xs text-gray-500">
                  Selected: {formData.topSkills.length}/5
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="mb-6 text-center">
                  <MapPin className="mx-auto mb-3 h-12 w-12 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Location preferences
                  </h3>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Preferred work location
                  </label>
                  <select
                    value={formData.preferredLocation}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        preferredLocation: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        remoteWork: e.target.checked,
                      }))
                    }
                    className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="remoteWork" className="text-sm text-gray-700">
                    I'm open to remote work
                  </label>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Job types you're interested in
                  </label>
                  <div className="space-y-2">
                    {jobTypes.map(type => (
                      <label key={type.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.jobTypes.includes(type.value)}
                          onChange={() => handleJobTypeToggle(type.value)}
                          className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {type.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="mb-6 text-center">
                  <DollarSign className="mx-auto mb-3 h-12 w-12 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Salary expectations
                  </h3>
                  <p className="text-sm text-gray-600">
                    Optional - helps us find better matches
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Minimum salary
                    </label>
                    <input
                      type="number"
                      value={formData.salaryMin}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          salaryMin: e.target.value,
                        }))
                      }
                      placeholder="30000"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Maximum salary
                    </label>
                    <input
                      type="number"
                      value={formData.salaryMax}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          salaryMax: e.target.value,
                        }))
                      }
                      placeholder="60000"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-200 p-6">
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
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
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
