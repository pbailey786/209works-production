'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'lucide-react';

// Import step components

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  onboardingCompleted: boolean;
  location: string | null;
  currentJobTitle: string | null;
  experienceLevel: string | null;
  skills: string[];
  preferredJobTypes: string[];
  phoneNumber: string | null;
  resumeUrl: string | null;
  createdAt: Date | string;
}

interface JobSeekerOnboardingClientProps {
  user: User;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
}

interface FormData {
  // Resume parsing results
  name: string;
  email: string;
  phoneNumber: string;
  zipCode: string;
  workHistory: string[];
  skills: string[];
  education: string;
  
  // Availability
  availabilityDays: string[];
  availabilityShifts: string[];
  distanceWillingToTravel: number;
  
  // Job preferences
  jobTypes: string[];
  whatAreYouGoodAt: string;
  skillsCertifications: string[];
  
  // Career goals
  careerGoal: string;
  
  // Opt-ins
  optInEmailAlerts: boolean;
  optInSmsAlerts: boolean;
  allowEmployerMessages: boolean;
}

export default function JobSeekerOnboardingClient({ user }: JobSeekerOnboardingClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    // Pre-populate with existing user data
    name: user.name || '',
    email: user.email,
    phoneNumber: user.phoneNumber || '',
    zipCode: '',
    workHistory: [],
    skills: user.skills || [],
    education: '',
    
    availabilityDays: [],
    availabilityShifts: [],
    distanceWillingToTravel: 25,
    
    jobTypes: user.preferredJobTypes || [],
    whatAreYouGoodAt: '',
    skillsCertifications: user.skills || [],
    
    careerGoal: '',
    
    optInEmailAlerts: false,
    optInSmsAlerts: false,
    allowEmployerMessages: false
  });

  const steps: OnboardingStep[] = [
    {
      id: 'resume',
      title: 'Upload Your Resume',
      description: 'Let us extract your information automatically',
      icon: Upload,
      component: ResumeUploadStep
    },
    {
      id: 'review',
      title: 'Review & Edit',
      description: 'Verify and update your information',
      icon: User,
      component: ReviewEditStep
    },
    {
      id: 'availability',
      title: 'Availability',
      description: 'When can you work?',
      icon: Clock,
      component: AvailabilityStep
    },
    {
      id: 'preferences',
      title: 'Job Preferences',
      description: 'What kind of work interests you?',
      icon: Briefcase,
      component: JobPreferencesStep
    },
    {
      id: 'goals',
      title: 'Career Goals',
      description: 'What are you looking for?',
      icon: Target,
      component: CareerGoalsStep
    },
    {
      id: 'optin',
      title: 'Stay Connected',
      description: 'Get job alerts and updates',
      icon: Bell,
      component: OptInStep
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Save job seeker profile
      const response = await fetch('/api/profile/jobseeker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // Mark onboarding as completed
        await fetch('/api/profile/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ onboardingCompleted: true })
        });
        
        router.push('/dashboard');
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Failed to complete onboarding. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
            <span className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          
          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center mb-2
                    ${isCompleted ? 'bg-green-500 text-white' : 
                      isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}
                  `}>
                    {isCompleted ? <CheckCircle size={20} /> : <Icon size={20} />}
                  </div>
                  <span className={`text-xs text-center ${isCurrent ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current step content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {steps[currentStep].title}
            </h2>
            <p className="text-gray-600">
              {steps[currentStep].description}
            </p>
          </div>

          <CurrentStepComponent
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onPrev={handlePrev}
            onComplete={handleComplete}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
