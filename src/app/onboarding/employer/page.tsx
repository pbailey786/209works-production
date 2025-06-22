'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Users, MapPin, ArrowRight, ArrowLeft, Briefcase } from 'lucide-react';

export default function EmployerOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    companySize: '',
    location: '',
    hiringNeeds: '',
    budget: ''
  });

  const industries = [
    'Manufacturing',
    'Healthcare',
    'Retail',
    'Logistics & Warehousing',
    'Construction',
    'Transportation',
    'Food Service',
    'Professional Services',
    'Education',
    'Technology',
    'Agriculture',
    'Other'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleComplete = async () => {
    try {
      const response = await fetch('/api/employers/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userType: 'employer'
        }),
      });

      if (response.ok) {
        router.push('/employers/dashboard?welcome=true');
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
            Welcome to 209 Works Employers! 
          </h1>
          <p className="text-lg text-muted-foreground">
            Let's get your company set up to find great local talent
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
            
            {/* Step 1: Company Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-foreground">Tell us about your company</h2>
                  <p className="text-muted-foreground">We'll help you create a compelling employer profile</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Your company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Industry
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select your industry</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Company Size
                  </label>
                  <select
                    value={formData.companySize}
                    onChange={(e) => handleInputChange('companySize', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select company size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Primary Location
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select location</option>
                    <option value="Stockton">Stockton</option>
                    <option value="Modesto">Modesto</option>
                    <option value="Tracy">Tracy</option>
                    <option value="Manteca">Manteca</option>
                    <option value="Lodi">Lodi</option>
                    <option value="Turlock">Turlock</option>
                    <option value="Merced">Merced</option>
                    <option value="Multiple 209">Multiple 209 locations</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Hiring Needs */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Briefcase className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-foreground">What are your hiring needs?</h2>
                  <p className="text-muted-foreground">This helps us recommend the right plan for you</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    How often do you hire?
                  </label>
                  <select
                    value={formData.hiringNeeds}
                    onChange={(e) => handleInputChange('hiringNeeds', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select hiring frequency</option>
                    <option value="first-time">First time hiring</option>
                    <option value="occasionally">Occasionally (1-2 times per year)</option>
                    <option value="regularly">Regularly (monthly)</option>
                    <option value="constantly">Constantly hiring</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    What's your typical hiring budget per month?
                  </label>
                  <select
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select budget range</option>
                    <option value="under-100">Under $100</option>
                    <option value="100-300">$100 - $300</option>
                    <option value="300-500">$300 - $500</option>
                    <option value="500-1000">$500 - $1,000</option>
                    <option value="1000+">$1,000+</option>
                  </select>
                </div>

                <div className="bg-primary/10 p-4 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">💡 Our Recommendation</h3>
                  <p className="text-sm text-muted-foreground">
                    Based on your needs, we'll suggest the best pricing plan to maximize your hiring success in the 209 area.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Ready to Start */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <ArrowRight className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-foreground">You're all set!</h2>
                  <p className="text-muted-foreground">Ready to start finding great local talent?</p>
                </div>

                <div className="bg-primary/10 p-6 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-4">What's next?</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-muted-foreground">Post your first job (takes 2 minutes)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-muted-foreground">Browse resumes from local candidates</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-muted-foreground">Manage applications from your dashboard</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-muted-foreground">Get insights on your hiring performance</span>
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>209 Works Advantage:</strong> Your jobs will be seen by thousands of local workers who are 
                    specifically looking for opportunities in the Central Valley. No national competition - just local talent.
                  </p>
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
                    (currentStep === 1 && (!formData.companyName || !formData.industry || !formData.companySize || !formData.location)) ||
                    (currentStep === 2 && (!formData.hiringNeeds || !formData.budget))
                  }
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Start Hiring
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
