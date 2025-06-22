'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Briefcase, User, ArrowRight, ArrowLeft } from 'lucide-react';

export default function JobSeekerOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    city: '',
    jobInterests: [] as string[],
    experienceLevel: '',
    availability: ''
  });

  const jobCategories = [
    'Warehouse & Logistics',
    'Retail & Customer Service', 
    'Healthcare',
    'Manufacturing',
    'Office & Administrative',
    'Construction & Trades',
    'Transportation',
    'Food Service',
    'Security',
    'Education'
  ];

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleJobInterestToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      jobInterests: prev.jobInterests.includes(category)
        ? prev.jobInterests.filter(c => c !== category)
        : [...prev.jobInterests, category]
    }));
  };

  const handleComplete = async () => {
    try {
      const response = await fetch('/api/profile/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userType: 'jobseeker'
        }),
      });

      if (response.ok) {
        router.push('/dashboard?welcome=true');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to 209 Works
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome to the 209 Workforce! 
          </h1>
          <p className="text-lg text-muted-foreground">
            Let's get you set up to find your next opportunity
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Step {currentStep} of 3</span>
            <span className="text-sm font-medium text-muted-foreground">{Math.round((currentStep / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Steps */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <User className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-foreground">Tell us about yourself</h2>
                  <p className="text-muted-foreground">We'll use this info to personalize your job search</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Your last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    What city are you in?
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select your city</option>
                    <option value="Stockton">Stockton</option>
                    <option value="Modesto">Modesto</option>
                    <option value="Tracy">Tracy</option>
                    <option value="Manteca">Manteca</option>
                    <option value="Lodi">Lodi</option>
                    <option value="Turlock">Turlock</option>
                    <option value="Merced">Merced</option>
                    <option value="Other 209">Other (209 area)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Job Interests */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Briefcase className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-foreground">What kind of work interests you?</h2>
                  <p className="text-muted-foreground">Select all that apply - we'll show you relevant jobs</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {jobCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleJobInterestToggle(category)}
                      className={`p-3 text-left border rounded-lg transition-all ${
                        formData.jobInterests.includes(category)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="font-medium">{category}</span>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Experience Level
                  </label>
                  <select
                    value={formData.experienceLevel}
                    onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select experience level</option>
                    <option value="entry">Entry Level (0-2 years)</option>
                    <option value="mid">Mid Level (3-5 years)</option>
                    <option value="senior">Senior Level (5+ years)</option>
                    <option value="any">Open to any level</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: Availability */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <ArrowRight className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-foreground">When can you start?</h2>
                  <p className="text-muted-foreground">This helps employers know your availability</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Availability
                  </label>
                  <select
                    value={formData.availability}
                    onChange={(e) => handleInputChange('availability', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select availability</option>
                    <option value="immediately">Available immediately</option>
                    <option value="two-weeks">Two weeks notice</option>
                    <option value="one-month">One month notice</option>
                    <option value="flexible">Flexible timing</option>
                  </select>
                </div>

                <div className="bg-primary/10 p-4 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">What's next?</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Browse jobs tailored to your interests</li>
                    <li>• Chat with JobsGPT for personalized advice</li>
                    <li>• Apply to jobs with one click</li>
                    <li>• Track your applications in your dashboard</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {currentStep < 3 ? (
                <button
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && (!formData.firstName || !formData.lastName || !formData.city)) ||
                    (currentStep === 2 && (!formData.jobInterests.length || !formData.experienceLevel))
                  }
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={!formData.availability}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Complete Setup
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
