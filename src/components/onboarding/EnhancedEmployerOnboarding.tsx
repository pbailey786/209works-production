'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Users,
  MapPin,
  Globe,
  Phone,
  Mail,
  Upload,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Star,
  Target,
  Briefcase,
  Award,
  Clock,
  DollarSign,
  Shield,
  Camera,
  Plus,
  X,
} from 'lucide-react';

interface OnboardingData {
  // Company Information
  companyName: string;
  companyDescription: string;
  website: string;
  industry: string;
  companySize: string;
  foundedYear: string;
  headquarters: string;
  logoUrl: string;
  
  // Contact Information
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactTitle: string;
  
  // Company Culture & Benefits
  companyValues: string[];
  benefits: string[];
  workEnvironment: string;
  remotePolicy: string;
  
  // Hiring Information
  hiringGoals: string[];
  typicalRoles: string[];
  hiringVolume: string;
  urgentHiring: boolean;
  
  // Verification
  businessLicense: string;
  taxId: string;
  verificationDocuments: string[];
}

interface EnhancedEmployerOnboardingProps {
  user: any;
  onComplete?: () => void;
}

export function EnhancedEmployerOnboarding({ user, onComplete }: EnhancedEmployerOnboardingProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [data, setData] = useState<OnboardingData>({
    companyName: user?.companyName || '',
    companyDescription: '',
    website: '',
    industry: user?.industry || '',
    companySize: '',
    foundedYear: '',
    headquarters: user?.location || '',
    logoUrl: '',
    contactName: user?.name || '',
    contactEmail: user?.email || '',
    contactPhone: '',
    contactTitle: '',
    companyValues: [],
    benefits: [],
    workEnvironment: '',
    remotePolicy: '',
    hiringGoals: [],
    typicalRoles: [],
    hiringVolume: '',
    urgentHiring: false,
    businessLicense: '',
    taxId: '',
    verificationDocuments: [],
  });

  const steps = [
    {
      title: 'Company Information',
      description: 'Tell us about your company',
      icon: Building2,
      fields: ['companyName', 'companyDescription', 'website', 'industry', 'companySize', 'foundedYear', 'headquarters'],
    },
    {
      title: 'Contact Details',
      description: 'Primary contact information',
      icon: Mail,
      fields: ['contactName', 'contactEmail', 'contactPhone', 'contactTitle'],
    },
    {
      title: 'Company Culture',
      description: 'Values, benefits, and work environment',
      icon: Users,
      fields: ['companyValues', 'benefits', 'workEnvironment', 'remotePolicy'],
    },
    {
      title: 'Hiring Needs',
      description: 'Your hiring goals and requirements',
      icon: Target,
      fields: ['hiringGoals', 'typicalRoles', 'hiringVolume', 'urgentHiring'],
    },
    {
      title: 'Verification',
      description: 'Verify your business (optional)',
      icon: Shield,
      fields: ['businessLicense', 'taxId'],
    },
  ];

  const industryOptions = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing',
    'Construction', 'Transportation', 'Hospitality', 'Real Estate', 'Legal',
    'Marketing', 'Non-profit', 'Government', 'Agriculture', 'Other'
  ];

  const companySizeOptions = [
    '1-10 employees', '11-50 employees', '51-200 employees', 
    '201-500 employees', '501-1000 employees', '1000+ employees'
  ];

  const commonValues = [
    'Innovation', 'Teamwork', 'Integrity', 'Customer Focus', 'Excellence',
    'Diversity', 'Sustainability', 'Growth', 'Transparency', 'Work-Life Balance'
  ];

  const commonBenefits = [
    'Health Insurance', 'Dental Insurance', 'Vision Insurance', '401(k)',
    'Paid Time Off', 'Flexible Hours', 'Remote Work', 'Professional Development',
    'Gym Membership', 'Free Lunch', 'Stock Options', 'Tuition Reimbursement'
  ];

  const commonRoles = [
    'Software Engineer', 'Sales Representative', 'Customer Service', 'Manager',
    'Administrative Assistant', 'Marketing Specialist', 'Accountant', 'Designer',
    'Operations', 'Human Resources', 'Data Analyst', 'Project Manager'
  ];

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleArrayItem = (field: keyof OnboardingData, item: string) => {
    const currentArray = data[field] as string[];
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item];
    updateData(field, newArray);
  };

  const validateStep = (stepIndex: number): boolean => {
    const step = steps[stepIndex];
    const newErrors: Record<string, string> = {};

    step.fields.forEach(field => {
      const value = data[field as keyof OnboardingData];
      
      if (stepIndex === 0) { // Company Information
        if (field === 'companyName' && !value) {
          newErrors[field] = 'Company name is required';
        }
        if (field === 'industry' && !value) {
          newErrors[field] = 'Industry is required';
        }
      }
      
      if (stepIndex === 1) { // Contact Details
        if (field === 'contactName' && !value) {
          newErrors[field] = 'Contact name is required';
        }
        if (field === 'contactEmail' && !value) {
          newErrors[field] = 'Contact email is required';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleComplete = async () => {
    if (!validateStep(currentStep)) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/employers/enhanced-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        if (onComplete) {
          onComplete();
        } else {
          router.push('/employers/dashboard?onboarding=complete');
        }
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || 'Failed to complete onboarding' });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to complete onboarding. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Company Information
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <Input
                  value={data.companyName}
                  onChange={(e) => updateData('companyName', e.target.value)}
                  placeholder="Enter your company name"
                  className={errors.companyName ? 'border-red-500' : ''}
                />
                {errors.companyName && (
                  <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry *
                </label>
                <select
                  value={data.industry}
                  onChange={(e) => updateData('industry', e.target.value)}
                  className={`w-full p-2 border border-gray-300 rounded-md ${errors.industry ? 'border-red-500' : ''}`}
                >
                  <option value="">Select industry</option>
                  {industryOptions.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
                {errors.industry && (
                  <p className="text-red-500 text-sm mt-1">{errors.industry}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Description
              </label>
              <Textarea
                value={data.companyDescription}
                onChange={(e) => updateData('companyDescription', e.target.value)}
                placeholder="Tell us about your company, what you do, and your mission"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <Input
                  value={data.website}
                  onChange={(e) => updateData('website', e.target.value)}
                  placeholder="https://yourcompany.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Size
                </label>
                <select
                  value={data.companySize}
                  onChange={(e) => updateData('companySize', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select company size</option>
                  {companySizeOptions.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Founded Year
                </label>
                <Input
                  type="number"
                  value={data.foundedYear}
                  onChange={(e) => updateData('foundedYear', e.target.value)}
                  placeholder="2020"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Headquarters
                </label>
                <Input
                  value={data.headquarters}
                  onChange={(e) => updateData('headquarters', e.target.value)}
                  placeholder="City, State"
                />
              </div>
            </div>
          </div>
        );

      case 1: // Contact Details
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name *
                </label>
                <Input
                  value={data.contactName}
                  onChange={(e) => updateData('contactName', e.target.value)}
                  placeholder="Your full name"
                  className={errors.contactName ? 'border-red-500' : ''}
                />
                {errors.contactName && (
                  <p className="text-red-500 text-sm mt-1">{errors.contactName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title
                </label>
                <Input
                  value={data.contactTitle}
                  onChange={(e) => updateData('contactTitle', e.target.value)}
                  placeholder="HR Manager, CEO, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={data.contactEmail}
                  onChange={(e) => updateData('contactEmail', e.target.value)}
                  placeholder="your.email@company.com"
                  className={errors.contactEmail ? 'border-red-500' : ''}
                />
                {errors.contactEmail && (
                  <p className="text-red-500 text-sm mt-1">{errors.contactEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={data.contactPhone}
                  onChange={(e) => updateData('contactPhone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
        );

      case 2: // Company Culture
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Company Values (select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {commonValues.map(value => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleArrayItem('companyValues', value)}
                    className={`p-2 text-sm rounded-md border transition-colors ${
                      data.companyValues.includes(value)
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Benefits & Perks (select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {commonBenefits.map(benefit => (
                  <button
                    key={benefit}
                    type="button"
                    onClick={() => toggleArrayItem('benefits', benefit)}
                    className={`p-2 text-sm rounded-md border transition-colors ${
                      data.benefits.includes(benefit)
                        ? 'bg-green-100 border-green-500 text-green-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {benefit}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Environment
              </label>
              <Textarea
                value={data.workEnvironment}
                onChange={(e) => updateData('workEnvironment', e.target.value)}
                placeholder="Describe your work environment, culture, and what makes your company unique"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remote Work Policy
              </label>
              <select
                value={data.remotePolicy}
                onChange={(e) => updateData('remotePolicy', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select remote policy</option>
                <option value="fully-remote">Fully Remote</option>
                <option value="hybrid">Hybrid (Remote + Office)</option>
                <option value="office-only">Office Only</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
          </div>
        );

      case 3: // Hiring Needs
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Hiring Goals (select all that apply)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {['Fill immediate openings', 'Build talent pipeline', 'Seasonal hiring', 'Expansion hiring', 'Replacement hiring', 'Diversity hiring'].map(goal => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleArrayItem('hiringGoals', goal)}
                    className={`p-3 text-sm rounded-md border transition-colors text-left ${
                      data.hiringGoals.includes(goal)
                        ? 'bg-orange-100 border-orange-500 text-orange-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Typical Roles You Hire For
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {commonRoles.map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleArrayItem('typicalRoles', role)}
                    className={`p-2 text-sm rounded-md border transition-colors ${
                      data.typicalRoles.includes(role)
                        ? 'bg-purple-100 border-purple-500 text-purple-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Hiring Volume
              </label>
              <select
                value={data.hiringVolume}
                onChange={(e) => updateData('hiringVolume', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select hiring volume</option>
                <option value="1-5">1-5 hires per month</option>
                <option value="6-15">6-15 hires per month</option>
                <option value="16-30">16-30 hires per month</option>
                <option value="30+">30+ hires per month</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="urgentHiring"
                checked={data.urgentHiring}
                onChange={(e) => updateData('urgentHiring', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="urgentHiring" className="text-sm text-gray-700">
                I have urgent hiring needs (positions need to be filled within 2 weeks)
              </label>
            </div>
          </div>
        );

      case 4: // Verification
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-sm font-medium text-blue-800">Business Verification (Optional)</h3>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Verify your business to build trust with job seekers and get priority placement in search results.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business License Number
              </label>
              <Input
                value={data.businessLicense}
                onChange={(e) => updateData('businessLicense', e.target.value)}
                placeholder="Enter your business license number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax ID / EIN
              </label>
              <Input
                value={data.taxId}
                onChange={(e) => updateData('taxId', e.target.value)}
                placeholder="Enter your Tax ID or EIN"
              />
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Benefits of Verification:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Verified badge on your company profile</li>
                <li>• Higher visibility in job search results</li>
                <li>• Increased trust from job seekers</li>
                <li>• Access to premium features</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Company Profile</h1>
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

        <div className="flex justify-between mt-4">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div
                key={index}
                className={`flex flex-col items-center ${
                  index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                    index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                </div>
                <span className="text-xs text-center hidden md:block">{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(steps[currentStep].icon, { className: "h-5 w-5" })}
            {steps[currentStep].title}
          </CardTitle>
          <p className="text-gray-600">{steps[currentStep].description}</p>
        </CardHeader>
        <CardContent>
          {renderStepContent()}

          {errors.submit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{errors.submit}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {currentStep === steps.length - 1 ? (
          <Button
            onClick={handleComplete}
            disabled={isLoading}
            className="bg-[#ff6b35] hover:bg-[#e55a2b]"
          >
            {isLoading ? 'Completing...' : 'Complete Setup'}
            <CheckCircle className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
