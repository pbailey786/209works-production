'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, 
  ArrowRight, 
  X,
  User,
  MapPin,
  Briefcase,
  FileText,
  Bell,
  Building2,
  Target,
  Star,
  TrendingUp
} from 'lucide-react';

interface WelcomeBannerProps {
  userRole: 'jobseeker' | 'employer';
  userName?: string;
  profileCompleteness: number;
  completedSteps: string[];
  onDismiss?: () => void;
}

interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export default function WelcomeBanner({ 
  userRole, 
  userName, 
  profileCompleteness, 
  completedSteps,
  onDismiss 
}: WelcomeBannerProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [showTasks, setShowTasks] = useState(false);

  const jobseekerTasks: OnboardingTask[] = [
    {
      id: 'profile',
      title: 'Complete your profile',
      description: 'Add your name, location, and contact info',
      icon: User,
      href: '/profile/settings',
      completed: completedSteps.includes('profile'),
      priority: 'high'
    },
    {
      id: 'resume',
      title: 'Upload your resume',
      description: 'Make it easy for employers to find you',
      icon: FileText,
      href: '/profile/resume',
      completed: completedSteps.includes('resume'),
      priority: 'high'
    },
    {
      id: 'skills',
      title: 'Add your skills',
      description: 'Help us match you with relevant jobs',
      icon: Briefcase,
      href: '/profile/settings',
      completed: completedSteps.includes('skills'),
      priority: 'medium'
    },
    {
      id: 'alerts',
      title: 'Set up job alerts',
      description: 'Get notified about new opportunities',
      icon: Bell,
      href: '/alerts',
      completed: completedSteps.includes('alerts'),
      priority: 'medium'
    }
  ];

  const employerTasks: OnboardingTask[] = [
    {
      id: 'company',
      title: 'Complete company profile',
      description: 'Add company info and branding',
      icon: Building2,
      href: '/employers/settings/profile',
      completed: completedSteps.includes('company'),
      priority: 'high'
    },
    {
      id: 'first-job',
      title: 'Post your first job',
      description: 'Start attracting qualified candidates',
      icon: Target,
      href: '/employers/create-job-post',
      completed: completedSteps.includes('first-job'),
      priority: 'high'
    },
    {
      id: 'billing',
      title: 'Set up billing',
      description: 'Choose your plan and payment method',
      icon: Star,
      href: '/employers/billing',
      completed: completedSteps.includes('billing'),
      priority: 'medium'
    }
  ];

  const tasks = userRole === 'jobseeker' ? jobseekerTasks : employerTasks;
  const incompleteTasks = tasks.filter(task => !task.completed);
  const highPriorityTasks = incompleteTasks.filter(task => task.priority === 'high');

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleTaskClick = (href: string) => {
    router.push(href);
  };

  if (!isVisible || profileCompleteness >= 80) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Welcome Message */}
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                {userRole === 'jobseeker' ? (
                  <User className="w-6 h-6 text-blue-600" />
                ) : (
                  <Building2 className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Welcome to 209jobs{userName ? `, ${userName}` : ''}! 🎉
                </h2>
                <p className="text-gray-600">
                  {userRole === 'jobseeker' 
                    ? 'Let\'s get your profile set up to find great opportunities'
                    : 'Let\'s get your company set up to find great candidates'
                  }
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Profile completion
                </span>
                <span className="text-sm text-gray-600">
                  {profileCompleteness}% complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${profileCompleteness}%` }}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              {highPriorityTasks.slice(0, 2).map((task) => {
                const IconComponent = task.icon;
                return (
                  <button
                    key={task.id}
                    onClick={() => handleTaskClick(task.href)}
                    className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <IconComponent className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">
                      {task.title}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400 ml-2" />
                  </button>
                );
              })}
              
              {incompleteTasks.length > 2 && (
                <button
                  onClick={() => setShowTasks(!showTasks)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span className="text-sm font-medium">
                    {showTasks ? 'Hide' : 'View all'} tasks ({incompleteTasks.length})
                  </span>
                  <ArrowRight className={`w-4 h-4 ml-2 transition-transform ${showTasks ? 'rotate-90' : ''}`} />
                </button>
              )}
            </div>

            {/* Expanded Task List */}
            {showTasks && (
              <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Complete your setup
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tasks.map((task) => {
                    const IconComponent = task.icon;
                    return (
                      <div
                        key={task.id}
                        className={`flex items-start p-4 rounded-lg border transition-colors ${
                          task.completed
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100 cursor-pointer'
                        }`}
                        onClick={() => !task.completed && handleTaskClick(task.href)}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          task.completed
                            ? 'bg-green-100'
                            : task.priority === 'high'
                            ? 'bg-red-100'
                            : 'bg-blue-100'
                        }`}>
                          {task.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <IconComponent className={`w-5 h-5 ${
                              task.priority === 'high' ? 'text-red-600' : 'text-blue-600'
                            }`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h4 className={`font-medium ${
                              task.completed ? 'text-green-900' : 'text-gray-900'
                            }`}>
                              {task.title}
                            </h4>
                            {task.priority === 'high' && !task.completed && (
                              <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                Important
                              </span>
                            )}
                          </div>
                          <p className={`text-sm ${
                            task.completed ? 'text-green-700' : 'text-gray-600'
                          }`}>
                            {task.completed ? 'Completed' : task.description}
                          </p>
                        </div>
                        {!task.completed && (
                          <ArrowRight className="w-4 h-4 text-gray-400 ml-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Benefits Reminder */}
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
              <span>
                {userRole === 'jobseeker' 
                  ? 'Complete profiles get 3x more views from employers'
                  : 'Complete company profiles attract 5x more quality candidates'
                }
              </span>
            </div>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss welcome banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 