import { Target, Zap, TrendingUp, Search } from 'lucide-react';

'use client';


interface CareerGoalsStepProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const CAREER_GOALS = [
  {
    id: 'need_job_asap',
    title: 'I just need a job ASAP',
    description: 'I need to start working as soon as possible',
    icon: Zap,
  },
  {
    id: 'build_career',
    title: 'I want to build a career',
    description: 'I\'m looking for growth opportunities and long-term stability',
    icon: TrendingUp,
  },
  {
    id: 'exploring_fields',
    title: 'I\'m exploring new fields',
    description: 'I want to try different types of work and learn new skills',
    icon: Search,
  },
];

export default function CareerGoalsStep({ formData, setFormData, onNext, onPrev }: CareerGoalsStepProps) {
  const handleGoalSelect = (goalId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      careerGoal: goalId,
    }));
  };

  const canContinue = formData.careerGoal;

  return (
    <div className="space-y-8">
      {/* Career Goals */}
      <div>
        <label className="block text-lg font-medium text-gray-900 mb-6">
          <Target className="w-5 h-5 inline mr-2" />
          What best describes your current career goals? *
        </label>
        
        <div className="space-y-4">
          {CAREER_GOALS.map((goal) => {
            const isSelected = formData.careerGoal === goal.id;
            const Icon = goal.icon;
            
            return (
              <button
                key={goal.id}
                onClick={() => handleGoalSelect(goal.id)}
                className={`
                  w-full p-6 rounded-lg border-2 text-left transition-all
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-start space-x-4">
                  <div className={`
                    p-3 rounded-lg
                    ${isSelected 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`
                      text-lg font-medium mb-2
                      ${isSelected ? 'text-blue-900' : 'text-gray-900'}
                    `}>
                      {goal.title}
                    </h3>
                    <p className={`
                      text-sm
                      ${isSelected ? 'text-blue-700' : 'text-gray-600'}
                    `}>
                      {goal.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onPrev}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
        
        <button
          onClick={onNext}
          disabled={!canContinue}
          className={`px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
            canContinue
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>Continue</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
