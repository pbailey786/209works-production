'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  Target,
  Users,
  Gift,
  Eye,
  X,
  Building2 as BuildingOfficeIcon,
  MapPin as MapPinIcon
} from 'lucide-react';

interface JobData {
  title: string;
  location: string;
  salary: string;
  description: string;
  responsibilities: string;
  requirements: string;
  niceToHave?: string;
  contactMethod: string;
  schedule?: string;
  benefits?: string;
  requiresDegree?: boolean;
  customQuestions?: string[];
  company?: string;
  companyLogo?: string;
  benefitOptions?: BenefitOption[];
}

interface BenefitOption {
  icon: string;
  title: string;
  description: string;
  value: boolean;
  key: string;
}

interface ONetSuggestion {
  type: 'salary' | 'requirement' | 'responsibility' | 'title';
  current: string;
  suggested: string;
  reason: string;
  marketData?: {
    average: string;
    percentile: string;
    comparison: string;
  };
}

interface GuidedJobCreationProps {
  initialData: JobData;
  onetData?: any;
  onComplete: (jobData: JobData) => void;
  onBack: () => void;
}

const SECTIONS = [
  { id: 'title', name: 'Job Title', icon: Target },
  { id: 'salary', name: 'Salary', icon: DollarSign },
  { id: 'responsibilities', name: 'Daily Tasks', icon: CheckCircle },
  { id: 'requirements', name: 'Requirements', icon: Users },
  { id: 'benefits', name: 'Benefits', icon: Gift },
];

export default function GuidedJobCreation({ 
  initialData, 
  onetData, 
  onComplete, 
  onBack 
}: GuidedJobCreationProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [jobData, setJobData] = useState<JobData>(initialData);
  const [suggestions, setSuggestions] = useState<ONetSuggestion[]>([]);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    // Generate suggestions based on O*NET data when component mounts
    if (onetData) {
      generateSuggestions();
    }
  }, [onetData]);

  const generateSuggestions = () => {
    const newSuggestions: ONetSuggestion[] = [];

    // Title suggestion
    if (onetData?.title && onetData.title !== jobData.title) {
      newSuggestions.push({
        type: 'title',
        current: jobData.title,
        suggested: onetData.title,
        reason: 'Standard industry title gets 37% more applications'
      });
    }

    // Salary suggestion
    if (onetData?.salary?.display) {
      const currentSalary = jobData.salary;
      const suggestedSalary = onetData.salary.display;
      
      if (currentSalary !== suggestedSalary) {
        newSuggestions.push({
          type: 'salary',
          current: currentSalary,
          suggested: suggestedSalary,
          reason: 'Based on DOL market data for your region',
          marketData: {
            average: suggestedSalary,
            percentile: '75th percentile',
            comparison: '15% above your current range'
          }
        });
      }
    }

    setSuggestions(newSuggestions);
  };

  const handleNext = () => {
    if (currentSection < SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      setIsPreview(true);
    }
  };

  const handlePrevious = () => {
    if (isPreview) {
      setIsPreview(false);
    } else if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const applySuggestion = (suggestion: ONetSuggestion) => {
    switch (suggestion.type) {
      case 'title':
        setJobData(prev => ({ ...prev, title: suggestion.suggested }));
        break;
      case 'salary':
        setJobData(prev => ({ ...prev, salary: suggestion.suggested }));
        break;
      // Add more cases as needed
    }
    
    // Remove applied suggestion
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  const renderSectionContent = () => {
    const section = SECTIONS[currentSection];
    const currentSuggestions = suggestions.filter(s => s.type === section.id);

    switch (section.id) {
      case 'title':
        return <TitleSection 
          jobData={jobData}
          setJobData={setJobData}
          suggestions={currentSuggestions}
          onApplySuggestion={applySuggestion}
        />;
      case 'salary':
        return <SalarySection 
          jobData={jobData}
          setJobData={setJobData}
          suggestions={currentSuggestions}
          onApplySuggestion={applySuggestion}
        />;
      case 'responsibilities':
        return <ResponsibilitiesSection 
          jobData={jobData}
          setJobData={setJobData}
          onetData={onetData}
        />;
      case 'requirements':
        return <RequirementsSection 
          jobData={jobData}
          setJobData={setJobData}
          onetData={onetData}
        />;
      case 'benefits':
        return <BenefitsSection 
          jobData={jobData}
          setJobData={setJobData}
        />;
      default:
        return null;
    }
  };

  if (isPreview) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Final Preview</h2>
              <div className="flex gap-3">
                <button
                  onClick={handlePrevious}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={() => onComplete(jobData)}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Publish Job
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <JobPreview jobData={jobData} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={currentSection === 0 ? onBack : handlePrevious}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            {currentSection === 0 ? 'Back to Input' : 'Previous'}
          </button>
          
          <div className="text-sm text-gray-500">
            Step {currentSection + 1} of {SECTIONS.length}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {SECTIONS.map((section, index) => {
            const Icon = section.icon;
            const isCompleted = index < currentSection;
            const isCurrent = index === currentSection;
            
            return (
              <div key={section.id} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isCurrent 
                      ? 'bg-blue-100 text-blue-700' 
                      : isCompleted 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{section.name}</span>
                  {isCompleted && <CheckCircle className="w-4 h-4" />}
                </div>
                {index < SECTIONS.length - 1 && (
                  <ArrowRight className="w-4 h-4 mx-2 text-gray-300" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section Content */}
      <div className="bg-white rounded-xl shadow-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-8"
          >
            {renderSectionContent()}
          </motion.div>
        </AnimatePresence>
        
        <div className="p-6 border-t bg-gray-50 flex justify-between">
          <div className="text-sm text-gray-600">
            {SECTIONS[currentSection].name} ({currentSection + 1}/{SECTIONS.length})
          </div>
          
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {currentSection === SECTIONS.length - 1 ? 'Preview Job' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Individual section components
function TitleSection({ jobData, setJobData, suggestions, onApplySuggestion }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
          <Target className="w-6 h-6 text-blue-600" />
          Job Title Optimization
        </h2>
        <p className="text-gray-600">Let's make sure your job title attracts the right candidates</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
          <input
            type="text"
            value={jobData.title}
            onChange={(e) => setJobData((prev: any) => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. Forklift Operator, Sales Associate"
          />
        </div>

        {suggestions.map((suggestion: ONetSuggestion, index: number) => (
          <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">AI Suggestion</h4>
                <p className="text-sm text-blue-700 mt-1">{suggestion.reason}</p>
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={() => onApplySuggestion(suggestion)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Use: "{suggestion.suggested}"
                  </button>
                  <button className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg text-sm hover:bg-blue-50">
                    Keep Mine
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SalarySection({ jobData, setJobData, suggestions, onApplySuggestion }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
          <DollarSign className="w-6 h-6 text-green-600" />
          Salary Market Analysis
        </h2>
        <p className="text-gray-600">Ensure your salary is competitive in the market</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
          <input
            type="text"
            value={jobData.salary}
            onChange={(e) => setJobData((prev: any) => ({ ...prev, salary: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. $18-22/hr, $40k-50k/year"
          />
        </div>

        {suggestions.map((suggestion: ONetSuggestion, index: number) => (
          <div key={index} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-orange-900">Market Intelligence</h4>
                <p className="text-sm text-orange-700 mt-1">{suggestion.reason}</p>
                {suggestion.marketData && (
                  <div className="mt-2 text-sm text-orange-700">
                    <div>Market average: {suggestion.marketData.average}</div>
                    <div>Your offer: {suggestion.marketData.comparison}</div>
                  </div>
                )}
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={() => onApplySuggestion(suggestion)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700"
                  >
                    Use Market Rate
                  </button>
                  <button className="px-4 py-2 border border-orange-300 text-orange-700 rounded-lg text-sm hover:bg-orange-50">
                    Keep Mine
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResponsibilitiesSection({ jobData, setJobData, onetData }: any) {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  // Handle task selection from O*NET suggestions
  const handleTaskToggle = (task: string, checked: boolean) => {
    let updatedTasks = [...selectedTasks];
    if (checked) {
      updatedTasks.push(task);
    } else {
      updatedTasks = updatedTasks.filter(t => t !== task);
    }
    setSelectedTasks(updatedTasks);
    
    // Update the main responsibilities text
    const currentText = jobData.responsibilities || '';
    const bulletTask = `• ${task}`;
    
    if (checked && !currentText.includes(bulletTask)) {
      const newText = currentText ? `${currentText}\n${bulletTask}` : bulletTask;
      setJobData((prev: any) => ({ ...prev, responsibilities: newText }));
    } else if (!checked) {
      const newText = currentText.replace(`\n${bulletTask}`, '').replace(bulletTask, '');
      setJobData((prev: any) => ({ ...prev, responsibilities: newText }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-purple-600" />
          Daily Responsibilities
        </h2>
        <p className="text-gray-600">Help candidates understand what they'll actually do each day</p>
      </div>

      <div className="space-y-4">
        {onetData?.responsibilities && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900">AI-Enhanced Tasks from O*NET Database</h4>
                <p className="text-sm text-purple-700">Select industry-standard daily tasks for this role:</p>
              </div>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {onetData.responsibilities.slice(0, 8).map((task: string, index: number) => (
                <label key={index} className="flex items-start gap-3 cursor-pointer hover:bg-purple-100 p-2 rounded">
                  <input 
                    type="checkbox" 
                    className="rounded mt-1" 
                    onChange={(e) => handleTaskToggle(task, e.target.checked)}
                  />
                  <span className="text-sm text-purple-700 flex-1">{task}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  const allTasks = onetData.responsibilities.slice(0, 5);
                  const taskText = allTasks.map((t: string) => `• ${t}`).join('\n');
                  setJobData((prev: any) => ({ ...prev, responsibilities: taskText }));
                  setSelectedTasks(allTasks);
                }}
                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
              >
                Add Top 5
              </button>
              <button
                onClick={() => {
                  setJobData((prev: any) => ({ ...prev, responsibilities: '' }));
                  setSelectedTasks([]);
                }}
                className="px-3 py-1 border border-purple-300 text-purple-700 rounded text-sm hover:bg-purple-50"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Daily Tasks & Responsibilities
          </label>
          <textarea
            value={jobData.responsibilities || ''}
            onChange={(e) => setJobData((prev: any) => ({ ...prev, responsibilities: e.target.value }))}
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="• Describe specific daily tasks&#10;• Include equipment/tools they'll use&#10;• Mention customer interaction if applicable&#10;• Add any safety requirements"
          />
        </div>
      </div>
    </div>
  );
}

function RequirementsSection({ jobData, setJobData, onetData }: any) {
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);

  // Handle requirement selection from O*NET suggestions
  const handleRequirementToggle = (requirement: string, checked: boolean) => {
    let updatedReqs = [...selectedRequirements];
    if (checked) {
      updatedReqs.push(requirement);
    } else {
      updatedReqs = updatedReqs.filter(r => r !== requirement);
    }
    setSelectedRequirements(updatedReqs);
    
    // Update the main requirements text
    const currentText = jobData.requirements || '';
    const bulletReq = `• ${requirement}`;
    
    if (checked && !currentText.includes(bulletReq)) {
      const newText = currentText ? `${currentText}\n${bulletReq}` : bulletReq;
      setJobData((prev: any) => ({ ...prev, requirements: newText }));
    } else if (!checked) {
      const newText = currentText.replace(`\n${bulletReq}`, '').replace(bulletReq, '');
      setJobData((prev: any) => ({ ...prev, requirements: newText }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
          <Users className="w-6 h-6 text-red-600" />
          Requirements & Qualifications
        </h2>
        <p className="text-gray-600">Define what candidates need to succeed in this role</p>
      </div>

      <div className="space-y-4">
        {onetData?.requirements && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900">Standard Industry Requirements</h4>
                <p className="text-sm text-red-700">Select typical qualifications for this role:</p>
              </div>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {onetData.requirements.slice(0, 6).map((req: string, index: number) => (
                <label key={index} className="flex items-start gap-3 cursor-pointer hover:bg-red-100 p-2 rounded">
                  <input 
                    type="checkbox" 
                    className="rounded mt-1" 
                    onChange={(e) => handleRequirementToggle(req, e.target.checked)}
                  />
                  <span className="text-sm text-red-700 flex-1">{req}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  const essentialReqs = onetData.requirements.slice(0, 4);
                  const reqText = essentialReqs.map((r: string) => `• ${r}`).join('\n');
                  setJobData((prev: any) => ({ ...prev, requirements: reqText }));
                  setSelectedRequirements(essentialReqs);
                }}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Add Essential
              </button>
              <button
                onClick={() => {
                  setJobData((prev: any) => ({ ...prev, requirements: '' }));
                  setSelectedRequirements([]);
                }}
                className="px-3 py-1 border border-red-300 text-red-700 rounded text-sm hover:bg-red-50"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Split into required vs preferred */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="text-red-600">*</span> Required Qualifications
            </label>
            <textarea
              value={jobData.requirements || ''}
              onChange={(e) => setJobData((prev: any) => ({ ...prev, requirements: e.target.value }))}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="• Must be 18+ with valid ID&#10;• High school diploma or equivalent&#10;• Previous experience in similar role&#10;• Ability to lift 50 lbs"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Qualifications
            </label>
            <textarea
              value={jobData.niceToHave || ''}
              onChange={(e) => setJobData((prev: any) => ({ ...prev, niceToHave: e.target.value }))}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="• Previous warehouse experience&#10;• Bilingual English/Spanish&#10;• Forklift certification&#10;• Computer skills"
            />
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Requirements Tip</h4>
              <p className="text-sm text-blue-700 mt-1">
                Keep requirements realistic for the Central Valley market. Too many requirements can reduce applications by 50%. Focus on truly essential skills.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BenefitsSection({ jobData, setJobData }: any) {
  // Central Valley specific benefits (from JobAdBuilderEnhanced)
  const BENEFIT_OPTIONS: BenefitOption[] = [
    { key: 'health', icon: '🏥', title: 'Health Insurance', description: 'Medical, dental, vision coverage', value: false },
    { key: 'pto', icon: '🌴', title: 'Paid Time Off', description: 'Vacation and sick days', value: false },
    { key: 'retirement', icon: '💰', title: '401(k) Plan', description: 'Retirement savings with match', value: false },
    { key: 'parking', icon: '🚗', title: 'Free Parking', description: 'On-site parking provided', value: false },
    { key: 'training', icon: '📚', title: 'Training', description: 'On-the-job training programs', value: false },
    { key: 'overtime', icon: '⏰', title: 'Overtime Pay', description: 'Time and a half after 40 hours', value: false },
    { key: 'meals', icon: '🍽️', title: 'Meal Benefits', description: 'Free or discounted meals', value: false },
    { key: 'uniform', icon: '👔', title: 'Uniform Provided', description: 'Company provides work attire', value: false },
    { key: 'tools', icon: '🔧', title: 'Tools Provided', description: 'All necessary equipment', value: false },
    { key: 'flexible', icon: '⏱️', title: 'Flexible Schedule', description: 'Work-life balance options', value: false },
    { key: 'bonus', icon: '🎯', title: 'Performance Bonus', description: 'Earn extra based on results', value: false },
    { key: 'commute', icon: '🚌', title: 'Commute Assistance', description: 'Gas cards or transit passes', value: false },
  ];

  // Initialize benefits if not already set
  const currentBenefits = jobData.benefitOptions || BENEFIT_OPTIONS.map(b => ({ ...b }));

  const handleBenefitToggle = (index: number) => {
    const newBenefits = [...currentBenefits];
    newBenefits[index] = { ...newBenefits[index], value: !newBenefits[index].value };
    setJobData((prev: any) => ({ ...prev, benefitOptions: newBenefits }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
          <Gift className="w-6 h-6 text-green-600" />
          Benefits & Perks
        </h2>
        <p className="text-gray-600">Select the benefits you offer to attract top candidates</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentBenefits.map((benefit: BenefitOption, index: number) => (
            <label
              key={benefit.key}
              className={`
                flex items-center p-3 border rounded-lg cursor-pointer transition-all
                ${benefit.value 
                  ? 'bg-green-50 border-green-300 ring-2 ring-green-200' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              <input
                type="checkbox"
                checked={benefit.value}
                onChange={() => handleBenefitToggle(index)}
                className="sr-only"
              />
              <span className="text-2xl mr-3">{benefit.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-sm">{benefit.title}</div>
                <div className="text-xs text-gray-600">{benefit.description}</div>
              </div>
              {benefit.value && (
                <CheckCircle className="w-5 h-5 text-green-600 ml-2" />
              )}
            </label>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Benefits Tip</h4>
              <p className="text-sm text-blue-700 mt-1">
                Job posts with 3+ benefits get 67% more applications. Free parking and flexible schedules are especially popular in the Central Valley.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function JobPreview({ jobData }: { jobData: JobData }) {
  const selectedBenefits = jobData.benefitOptions?.filter(b => b.value) || [];
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{jobData.title || 'Job Title'}</h1>
            <div className="flex items-center gap-4 text-blue-100">
              <span className="flex items-center gap-1">
                <BuildingOfficeIcon className="w-5 h-5" />
                {jobData.company || 'Company Name'}
              </span>
              <span className="flex items-center gap-1">
                <MapPinIcon className="w-5 h-5" />
                {jobData.location || 'Location'}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-5 h-5" />
                {jobData.salary || 'Salary Range'}
              </span>
            </div>
          </div>
          {jobData.companyLogo && (
            <img 
              src={jobData.companyLogo} 
              alt="Company Logo" 
              className="w-16 h-16 bg-white rounded-lg p-2"
            />
          )}
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* About This Role */}
        {jobData.description && (
          <div>
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              💼 About This Role
            </h3>
            <p className="text-gray-700 leading-relaxed">{jobData.description}</p>
          </div>
        )}
        
        {/* What You'll Do */}
        {jobData.responsibilities && (
          <div>
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              ⚡ What You'll Do
            </h3>
            <div className="text-gray-700 whitespace-pre-line leading-relaxed">{jobData.responsibilities}</div>
          </div>
        )}
        
        {/* What We're Looking For */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobData.requirements && (
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                🎯 Required Qualifications
              </h3>
              <div className="text-gray-700 whitespace-pre-line leading-relaxed">{jobData.requirements}</div>
            </div>
          )}
          
          {jobData.niceToHave && (
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                ⭐ Preferred Qualifications
              </h3>
              <div className="text-gray-700 whitespace-pre-line leading-relaxed">{jobData.niceToHave}</div>
            </div>
          )}
        </div>

        {/* What We Offer */}
        {selectedBenefits.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              🎁 What We Offer
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedBenefits.map((benefit: BenefitOption, index: number) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl mr-3">{benefit.icon}</span>
                  <div>
                    <div className="font-medium text-sm">{benefit.title}</div>
                    <div className="text-xs text-gray-600">{benefit.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How to Apply */}
        {jobData.contactMethod && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 text-blue-900">How to Apply</h3>
            <p className="text-blue-800">{jobData.contactMethod}</p>
          </div>
        )}
      </div>
    </div>
  );
}