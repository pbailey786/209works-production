'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  TrophyIcon,
  StarIcon,
  FireIcon,
  SparklesIcon,
  ShieldCheckIcon,
  BoltIcon,
  HeartIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import {
  TrophyIcon as TrophyIconSolid,
  StarIcon as StarIconSolid,
  FireIcon as FireIconSolid,
  SparklesIcon as SparklesIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid,
  BoltIcon as BoltIconSolid,
  HeartIcon as HeartIconSolid,
  RocketLaunchIcon as RocketLaunchIconSolid
} from '@heroicons/react/24/solid';
import { FEATURES } from '../../lib/feature-flags';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'profile' | 'activity' | 'social' | 'milestone';
  icon: keyof typeof iconMap;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  points: number;
  unlockedAt?: Date;
  condition: (user: any, stats?: any) => boolean;
  hint?: string;
}

const iconMap = {
  trophy: { outline: TrophyIcon, solid: TrophyIconSolid },
  star: { outline: StarIcon, solid: StarIconSolid },
  fire: { outline: FireIcon, solid: FireIconSolid },
  sparkles: { outline: SparklesIcon, solid: SparklesIconSolid },
  shield: { outline: ShieldCheckIcon, solid: ShieldCheckIconSolid },
  bolt: { outline: BoltIcon, solid: BoltIconSolid },
  heart: { outline: HeartIcon, solid: HeartIconSolid },
  rocket: { outline: RocketLaunchIcon, solid: RocketLaunchIconSolid }
};

const rarityStyles = {
  common: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-700',
    glow: 'shadow-gray-200'
  },
  uncommon: {
    bg: 'bg-green-100',
    border: 'border-green-300',
    text: 'text-green-700',
    glow: 'shadow-green-200'
  },
  rare: {
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    text: 'text-blue-700',
    glow: 'shadow-blue-200'
  },
  epic: {
    bg: 'bg-purple-100',
    border: 'border-purple-300',
    text: 'text-purple-700',
    glow: 'shadow-purple-200'
  },
  legendary: {
    bg: 'bg-gradient-to-br from-yellow-100 to-orange-100',
    border: 'border-yellow-400',
    text: 'text-yellow-800',
    glow: 'shadow-yellow-300'
  }
};

// Comprehensive achievement definitions
export const allAchievements: Achievement[] = [
  // Profile Completion Achievements
  {
    id: 'resume_detective',
    name: 'Resume Detective',
    description: 'Uploaded your resume to help employers find you',
    category: 'profile',
    icon: 'shield',
    rarity: 'common',
    points: 20,
    condition: (user) => !!user.resumeUrl,
    hint: 'Upload your resume in your profile settings'
  },
  {
    id: 'skill_master',
    name: 'Skill Master',
    description: 'Added 5+ skills to showcase your expertise',
    category: 'profile',
    icon: 'star',
    rarity: 'uncommon',
    points: 25,
    condition: (user) => user.skills && user.skills.length >= 5,
    hint: 'Add more skills to your profile to unlock this achievement'
  },
  {
    id: 'local_expert',
    name: 'Local Expert',
    description: 'Set your location and job preferences for the Central Valley',
    category: 'profile',
    icon: 'fire',
    rarity: 'common',
    points: 15,
    condition: (user) => !!(user.location && user.preferredJobTypes && user.preferredJobTypes.length > 0),
    hint: 'Complete your location and job preferences'
  },
  {
    id: 'profile_perfectionist',
    name: 'Profile Perfectionist',
    description: 'Complete profile with photo, title, and contact info',
    category: 'profile',
    icon: 'sparkles',
    rarity: 'rare',
    points: 30,
    condition: (user) => !!(user.profilePictureUrl && user.currentJobTitle && user.name && user.phoneNumber),
    hint: 'Complete all profile sections including photo and contact details'
  },
  {
    id: 'social_connector',
    name: 'Social Connector',
    description: 'Connected your LinkedIn/portfolio for networking',
    category: 'social',
    icon: 'heart',
    rarity: 'uncommon',
    points: 15,
    condition: (user) => !!user.linkedinUrl,
    hint: 'Add your LinkedIn profile or portfolio URL'
  },

  // Activity Achievements
  {
    id: 'job_hunter',
    name: 'Job Hunter',
    description: 'Saved your first job for later review',
    category: 'activity',
    icon: 'bolt',
    rarity: 'common',
    points: 10,
    condition: (user, stats) => stats?.savedJobs > 0,
    hint: 'Save a job that interests you while browsing'
  },
  {
    id: 'application_starter',
    name: 'Application Starter',
    description: 'Submitted your first job application',
    category: 'activity',
    icon: 'rocket',
    rarity: 'uncommon',
    points: 25,
    condition: (user, stats) => stats?.applications > 0,
    hint: 'Apply to your first job to unlock this achievement'
  },
  {
    id: 'super_saver',
    name: 'Super Saver',
    description: 'Saved 10+ jobs to build your opportunity pipeline',
    category: 'activity',
    icon: 'fire',
    rarity: 'rare',
    points: 40,
    condition: (user, stats) => stats?.savedJobs >= 10,
    hint: 'Save 10 or more jobs to unlock this achievement'
  },
  {
    id: 'application_machine',
    name: 'Application Machine',
    description: 'Applied to 5+ jobs - you\'re on fire!',
    category: 'activity',
    icon: 'fire',
    rarity: 'epic',
    points: 60,
    condition: (user, stats) => stats?.applications >= 5,
    hint: 'Submit 5 job applications to unlock this achievement'
  },

  // Milestone Achievements
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Active on 209 Works for 7 consecutive days',
    category: 'milestone',
    icon: 'trophy',
    rarity: 'rare',
    points: 35,
    condition: (user) => {
      if (!user.lastActivityDate) return false;
      const daysSinceJoin = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceJoin >= 7;
    },
    hint: 'Stay active for a week to unlock this achievement'
  },
  {
    id: 'profile_legend',
    name: 'Profile Legend',
    description: 'Achieved 100% profile completion',
    category: 'milestone',
    icon: 'trophy',
    rarity: 'legendary',
    points: 100,
    condition: (user) => (user.profileStrength || 0) >= 100,
    hint: 'Complete your entire profile to unlock this legendary achievement'
  },
  {
    id: 'central_valley_champion',
    name: 'Central Valley Champion',
    description: 'Embraced the 209 job market with 10+ activities',
    category: 'milestone',
    icon: 'trophy',
    rarity: 'epic',
    points: 75,
    condition: (user, stats) => {
      const activities = (stats?.savedJobs || 0) + (stats?.applications || 0) + (user.achievements?.length || 0);
      return activities >= 10;
    },
    hint: 'Complete 10+ activities (saves, applications, profile items) to unlock'
  }
];

interface AchievementBadgesProps {
  user: any;
  stats?: any;
  unlockedOnly?: boolean;
  maxDisplay?: number;
  showPoints?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AchievementBadges({
  user,
  stats = {},
  unlockedOnly = false,
  maxDisplay,
  showPoints = true,
  size = 'md',
  className = ''
}: AchievementBadgesProps) {
  if (!FEATURES.PROFILE_GAMIFICATION) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const unlockedAchievements = allAchievements.filter(achievement => 
    achievement.condition(user, stats)
  );

  const displayAchievements = unlockedOnly 
    ? unlockedAchievements 
    : allAchievements;

  const achievementsToShow = maxDisplay 
    ? displayAchievements.slice(0, maxDisplay)
    : displayAchievements;

  const totalPoints = unlockedAchievements.reduce((sum, achievement) => sum + achievement.points, 0);

  return (
    <div className={className}>
      {/* Points Display */}
      {showPoints && unlockedAchievements.length > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <TrophyIconSolid className="mr-2 h-5 w-5 text-yellow-600" />
            <span className="font-semibold text-gray-900">
              {totalPoints} Achievement Points
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {unlockedAchievements.length}/{allAchievements.length} unlocked
          </span>
        </div>
      )}

      {/* Achievement Grid */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        <AnimatePresence>
          {achievementsToShow.map((achievement) => {
            const isUnlocked = achievement.condition(user, stats);
            const IconComponent = iconMap[achievement.icon]?.[isUnlocked ? 'solid' : 'outline'] || TrophyIcon;
            const rarityStyle = rarityStyles[achievement.rarity];

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                className={`relative group cursor-pointer ${
                  isUnlocked ? '' : 'opacity-50'
                }`}
                title={isUnlocked ? achievement.description : achievement.hint}
              >
                <div className={`
                  flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200
                  ${isUnlocked 
                    ? `${rarityStyle.bg} ${rarityStyle.border} hover:shadow-lg hover:${rarityStyle.glow}` 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }
                `}>
                  {/* Icon */}
                  <div className={`${sizeClasses[size]} flex items-center justify-center mb-2`}>
                    <IconComponent className={`h-full w-full ${
                      isUnlocked ? rarityStyle.text : 'text-gray-400'
                    }`} />
                  </div>

                  {/* Achievement Name */}
                  <div className={`${textSizeClasses[size]} font-medium text-center leading-tight ${
                    isUnlocked ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {achievement.name}
                  </div>

                  {/* Points Badge */}
                  {showPoints && isUnlocked && (
                    <div className="absolute -top-1 -right-1 rounded-full bg-yellow-400 px-1.5 py-0.5 text-xs font-bold text-yellow-900">
                      {achievement.points}
                    </div>
                  )}

                  {/* Rarity Indicator */}
                  {isUnlocked && achievement.rarity !== 'common' && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                      <div className={`h-2 w-2 rounded-full ${
                        achievement.rarity === 'legendary' ? 'bg-yellow-400' :
                        achievement.rarity === 'epic' ? 'bg-purple-400' :
                        achievement.rarity === 'rare' ? 'bg-blue-400' :
                        'bg-green-400'
                      }`} />
                    </div>
                  )}
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                  {isUnlocked ? achievement.description : achievement.hint}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Achievement Categories Legend */}
      {!unlockedOnly && (
        <div className="mt-6 flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center">
            <div className="mr-1 h-2 w-2 rounded-full bg-blue-400" />
            Profile
          </div>
          <div className="flex items-center">
            <div className="mr-1 h-2 w-2 rounded-full bg-green-400" />
            Activity
          </div>
          <div className="flex items-center">
            <div className="mr-1 h-2 w-2 rounded-full bg-pink-400" />
            Social
          </div>
          <div className="flex items-center">
            <div className="mr-1 h-2 w-2 rounded-full bg-yellow-400" />
            Milestone
          </div>
        </div>
      )}
    </div>
  );
}