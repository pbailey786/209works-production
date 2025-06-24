'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  UserCircleIcon,
  DocumentTextIcon,
  MapPinIcon,
  BriefcaseIcon,
  SparklesIcon,
  TrophyIcon,
  StarIcon,
  FireIcon,
  ShieldCheckIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { FEATURES } from '../../lib/feature-flags';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  condition: (user: any) => boolean;
  points: number;
}

interface ProfileCompletionTrackerProps {
  user: any;
  className?: string;
  showAchievements?: boolean;
}

const achievements: Achievement[] = [
  {
    id: 'resume_detective',
    name: 'Resume Detective',
    description: 'Uploaded your resume',
    icon: <DocumentTextIcon className="h-5 w-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    condition: (user) => !!user.resumeUrl,
    points: 20
  },
  {
    id: 'skill_master', 
    name: 'Skill Master',
    description: 'Added 5+ skills to your profile',
    icon: <StarIcon className="h-5 w-5" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    condition: (user) => user.skills && user.skills.length >= 5,
    points: 15
  },
  {
    id: 'local_expert',
    name: 'Local Expert',
    description: 'Set your location and job preferences',
    icon: <MapPinIcon className="h-5 w-5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    condition: (user) => !!(user.location && user.preferredJobTypes && user.preferredJobTypes.length > 0),
    points: 15
  },
  {
    id: 'profile_perfectionist',
    name: 'Profile Perfectionist',
    description: 'Complete profile with picture and bio',
    icon: <UserCircleIcon className="h-5 w-5" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    condition: (user) => !!(user.profilePictureUrl && user.currentJobTitle && user.name),
    points: 20
  },
  {
    id: 'career_focused',
    name: 'Career Focused',
    description: 'Set work authorization and experience level',
    icon: <BriefcaseIcon className="h-5 w-5" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    condition: (user) => !!(user.workAuthorization && user.educationExperience),
    points: 15
  },
  {
    id: 'social_connector',
    name: 'Social Connector',
    description: 'Added LinkedIn/portfolio and phone number',
    icon: <ShieldCheckIcon className="h-5 w-5" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    condition: (user) => !!(user.linkedinUrl && user.phoneNumber),
    points: 10
  }
];

const completionItems = [
  {
    id: 'name',
    label: 'Full Name',
    icon: <UserCircleIcon className="h-5 w-5" />,
    condition: (user: any) => !!user.name,
    weight: 1
  },
  {
    id: 'location',
    label: 'Location',
    icon: <MapPinIcon className="h-5 w-5" />,
    condition: (user: any) => !!user.location,
    weight: 1
  },
  {
    id: 'job_title',
    label: 'Current Job Title',
    icon: <BriefcaseIcon className="h-5 w-5" />,
    condition: (user: any) => !!user.currentJobTitle,
    weight: 1
  },
  {
    id: 'skills',
    label: 'Skills (3+)',
    icon: <StarIcon className="h-5 w-5" />,
    condition: (user: any) => user.skills && user.skills.length >= 3,
    weight: 1.5
  },
  {
    id: 'resume',
    label: 'Resume Upload',
    icon: <DocumentTextIcon className="h-5 w-5" />,
    condition: (user: any) => !!user.resumeUrl,
    weight: 2
  },
  {
    id: 'preferences',
    label: 'Job Preferences',
    icon: <BriefcaseIcon className="h-5 w-5" />,
    condition: (user: any) => user.preferredJobTypes && user.preferredJobTypes.length > 0,
    weight: 1
  },
  {
    id: 'profile_picture',
    label: 'Profile Picture',
    icon: <UserCircleIcon className="h-5 w-5" />,
    condition: (user: any) => !!user.profilePictureUrl,
    weight: 0.5
  }
];

export default function ProfileCompletionTracker({ 
  user, 
  className = '', 
  showAchievements = true 
}: ProfileCompletionTrackerProps) {
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [profileStrength, setProfileStrength] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  // Calculate completion status
  useEffect(() => {
    if (!user) return;

    const completed = completionItems.filter(item => item.condition(user));
    const completedIds = completed.map(item => item.id);
    
    // Calculate weighted completion percentage
    const totalWeight = completionItems.reduce((sum, item) => sum + item.weight, 0);
    const completedWeight = completed.reduce((sum, item) => sum + item.weight, 0);
    const strength = Math.round((completedWeight / totalWeight) * 100);

    setCompletedItems(completedIds);
    setProfileStrength(strength);

    // Check for new achievements
    const unlocked = achievements.filter(achievement => achievement.condition(user));
    const previousAchievements = user.achievements || [];
    const newAchievements = unlocked.filter(achievement => 
      !previousAchievements.includes(achievement.id)
    );

    if (newAchievements.length > 0) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
      
      // Update user achievements in database
      updateUserAchievements(unlocked.map(a => a.id), strength);
    }

    setUnlockedAchievements(unlocked);
  }, [user]);

  const updateUserAchievements = async (achievementIds: string[], strength: number) => {
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          achievements: achievementIds,
          profileStrength: strength,
          lastActivityDate: new Date()
        })
      });
    } catch (error) {
      console.error('Error updating achievements:', error);
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 90) return 'text-green-600 bg-green-100';
    if (strength >= 70) return 'text-blue-600 bg-blue-100';
    if (strength >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStrengthLabel = (strength: number) => {
    if (strength >= 90) return '🔥 Exceptional';
    if (strength >= 70) return '⭐ Strong';
    if (strength >= 50) return '📈 Good';
    return '🚀 Getting Started';
  };

  if (!FEATURES.PROFILE_GAMIFICATION) {
    return null;
  }

  return (
    <div className={className}>
      {/* Celebration Animation */}
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <motion.div
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            className="rounded-2xl bg-white p-8 text-center shadow-2xl"
          >
            <TrophyIcon className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Achievement Unlocked!</h3>
            <p className="text-gray-600">Great job building your profile!</p>
          </motion.div>
        </motion.div>
      )}

      {/* Profile Strength Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`mr-3 flex h-10 w-10 items-center justify-center rounded-lg ${getStrengthColor(profileStrength)}`}>
              <SparklesIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Profile Strength</h3>
              <p className="text-sm text-gray-600">{getStrengthLabel(profileStrength)}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{profileStrength}%</div>
            <div className="text-sm text-gray-500">Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="h-3 w-full rounded-full bg-gray-200">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${profileStrength}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-3 rounded-full ${
                profileStrength >= 90 ? 'bg-green-500' :
                profileStrength >= 70 ? 'bg-blue-500' :
                profileStrength >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
            />
          </div>
        </div>

        {/* Completion Items */}
        <div className="space-y-2">
          {completionItems.map((item) => {
            const isCompleted = completedItems.includes(item.id);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center p-2 rounded-lg transition-colors ${
                  isCompleted ? 'bg-green-50' : 'bg-gray-50'
                }`}
              >
                <div className={`mr-3 ${isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                  {isCompleted ? (
                    <CheckCircleIconSolid className="h-5 w-5" />
                  ) : (
                    item.icon
                  )}
                </div>
                <span className={`flex-1 text-sm ${
                  isCompleted ? 'text-green-900 font-medium' : 'text-gray-700'
                }`}>
                  {item.label}
                </span>
                {!isCompleted && (
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Achievements Section */}
        {showAchievements && unlockedAchievements.length > 0 && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex items-center mb-4">
              <TrophyIcon className="mr-2 h-5 w-5 text-yellow-600" />
              <h4 className="font-semibold text-gray-900">Achievements</h4>
              <span className="ml-2 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                {unlockedAchievements.length}/{achievements.length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {unlockedAchievements.slice(0, 4).map((achievement) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex items-center p-3 rounded-lg ${achievement.bgColor}`}
                >
                  <div className={`mr-2 ${achievement.color}`}>
                    {achievement.icon}
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${achievement.color}`}>
                      {achievement.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      +{achievement.points} pts
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {unlockedAchievements.length > 4 && (
              <div className="mt-3 text-center">
                <span className="text-sm text-gray-500">
                  +{unlockedAchievements.length - 4} more achievements
                </span>
              </div>
            )}
          </div>
        )}

        {/* Call to Action */}
        {profileStrength < 100 && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="flex items-center">
                <FireIcon className="mr-3 h-6 w-6 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">Boost Your Profile!</h4>
                  <p className="text-sm text-blue-700">
                    Complete {Math.ceil((100 - profileStrength) / 10)} more items to reach 100% and get maximum employer visibility.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}