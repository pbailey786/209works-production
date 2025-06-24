'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  TrophyIcon,
  StarIcon,
  FireIcon,
  SparklesIcon,
  ShieldCheckIcon,
  BoltIcon,
  HeartIcon,
  RocketLaunchIcon,
  UserIcon,
  DocumentTextIcon,
  MapPinIcon,
  BriefcaseIcon,
  BookmarkIcon,
  PaperAirplaneIcon,
  EyeIcon,
  ClockIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  LinkIcon,
  PhoneIcon,
  CameraIcon,
  AcademicCapIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import {
  TrophyIcon as TrophyIconSolid,
  StarIcon as StarIconSolid,
  FireIcon as FireIconSolid,
  SparklesIcon as SparklesIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid,
  BoltIcon as BoltIconSolid,
  HeartIcon as HeartIconSolid,
  RocketLaunchIcon as RocketLaunchIconSolid,
  UserIcon as UserIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  MapPinIcon as MapPinIconSolid,
  BriefcaseIcon as BriefcaseIconSolid,
  BookmarkIcon as BookmarkIconSolid,
  PaperAirplaneIcon as PaperAirplaneIconSolid,
  EyeIcon as EyeIconSolid,
  ClockIcon as ClockIconSolid,
  CalendarIcon as CalendarIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  LinkIcon as LinkIconSolid,
  PhoneIcon as PhoneIconSolid,
  CameraIcon as CameraIconSolid,
  AcademicCapIcon as AcademicCapIconSolid,
  BuildingOfficeIcon as BuildingOfficeIconSolid
} from '@heroicons/react/24/solid';
import { FEATURES } from '../../lib/feature-flags';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'profile' | 'activity' | 'social' | 'milestone' | 'engagement';
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
  rocket: { outline: RocketLaunchIcon, solid: RocketLaunchIconSolid },
  user: { outline: UserIcon, solid: UserIconSolid },
  document: { outline: DocumentTextIcon, solid: DocumentTextIconSolid },
  map: { outline: MapPinIcon, solid: MapPinIconSolid },
  briefcase: { outline: BriefcaseIcon, solid: BriefcaseIconSolid },
  bookmark: { outline: BookmarkIcon, solid: BookmarkIconSolid },
  paper: { outline: PaperAirplaneIcon, solid: PaperAirplaneIconSolid },
  eye: { outline: EyeIcon, solid: EyeIconSolid },
  clock: { outline: ClockIcon, solid: ClockIconSolid },
  calendar: { outline: CalendarIcon, solid: CalendarIconSolid },
  chat: { outline: ChatBubbleLeftRightIcon, solid: ChatBubbleLeftRightIconSolid },
  search: { outline: MagnifyingGlassIcon, solid: MagnifyingGlassIconSolid },
  link: { outline: LinkIcon, solid: LinkIconSolid },
  phone: { outline: PhoneIcon, solid: PhoneIconSolid },
  camera: { outline: CameraIcon, solid: CameraIconSolid },
  academic: { outline: AcademicCapIcon, solid: AcademicCapIconSolid },
  building: { outline: BuildingOfficeIcon, solid: BuildingOfficeIconSolid }
};

const rarityColors = {
  common: {
    bg: 'bg-gray-100',
    icon: 'text-gray-600',
    border: 'border-gray-300',
    accent: 'bg-gray-500'
  },
  uncommon: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-200',
    accent: 'bg-green-500'
  },
  rare: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'border-blue-200',
    accent: 'bg-blue-500'
  },
  epic: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    border: 'border-purple-200',
    accent: 'bg-purple-500'
  },
  legendary: {
    bg: 'bg-gradient-to-br from-yellow-50 to-orange-50',
    icon: 'text-orange-600',
    border: 'border-yellow-300',
    accent: 'bg-gradient-to-r from-yellow-500 to-orange-500'
  }
};

// Comprehensive 25 achievement definitions
export const allAchievements: Achievement[] = [
  // Profile Completion Achievements (8)
  {
    id: 'resume_detective',
    name: 'Resume Detective',
    description: 'Uploaded your resume to help Central Valley employers find you',
    category: 'profile',
    icon: 'document',
    rarity: 'common',
    points: 20,
    condition: (user) => !!user.resumeUrl,
    hint: 'Upload your resume in profile settings'
  },
  {
    id: 'skill_master',
    name: 'Skill Master',
    description: 'Added 5+ skills to showcase your Central Valley expertise',
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
    description: 'Set your location and job preferences for the 209 area',
    category: 'profile',
    icon: 'map',
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
    icon: 'link',
    rarity: 'uncommon',
    points: 15,
    condition: (user) => !!user.linkedinUrl,
    hint: 'Add your LinkedIn profile or portfolio URL'
  },
  {
    id: 'contact_ready',
    name: 'Contact Ready',
    description: 'Added phone number so employers can reach you',
    category: 'profile',
    icon: 'phone',
    rarity: 'common',
    points: 10,
    condition: (user) => !!user.phoneNumber,
    hint: 'Add your phone number to your profile'
  },
  {
    id: 'photo_pro',
    name: 'Photo Pro',
    description: 'Added a professional profile picture',
    category: 'profile',
    icon: 'camera',
    rarity: 'uncommon',
    points: 15,
    condition: (user) => !!user.profilePictureUrl,
    hint: 'Upload a profile picture to stand out to employers'
  },
  {
    id: 'education_scholar',
    name: 'Education Scholar',
    description: 'Detailed your education and experience background',
    category: 'profile',
    icon: 'academic',
    rarity: 'common',
    points: 15,
    condition: (user) => !!(user.educationExperience && user.educationExperience.length > 50),
    hint: 'Add detailed education and experience information'
  },

  // Activity Achievements (8)
  {
    id: 'job_hunter',
    name: 'Job Hunter',
    description: 'Saved your first 209 area job for later review',
    category: 'activity',
    icon: 'bookmark',
    rarity: 'common',
    points: 10,
    condition: (user, stats) => stats?.savedJobs > 0,
    hint: 'Save a job that interests you while browsing'
  },
  {
    id: 'application_starter',
    name: 'Application Starter',
    description: 'Submitted your first job application in the Central Valley',
    category: 'activity',
    icon: 'paper',
    rarity: 'uncommon',
    points: 25,
    condition: (user, stats) => stats?.applicationsSubmitted > 0,
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
    icon: 'rocket',
    rarity: 'epic',
    points: 60,
    condition: (user, stats) => stats?.applicationsSubmitted >= 5,
    hint: 'Submit 5 job applications to unlock this achievement'
  },
  {
    id: 'heavy_hitter',
    name: 'Heavy Hitter',
    description: 'Applied to 15+ jobs - unstoppable!',
    category: 'activity',
    icon: 'bolt',
    rarity: 'epic',
    points: 100,
    condition: (user, stats) => stats?.applicationsSubmitted >= 15,
    hint: 'Submit 15 job applications to unlock this achievement'
  },
  {
    id: 'job_collector',
    name: 'Job Collector',
    description: 'Saved 25+ jobs - building a massive pipeline!',
    category: 'activity',
    icon: 'trophy',
    rarity: 'epic',
    points: 80,
    condition: (user, stats) => stats?.savedJobs >= 25,
    hint: 'Save 25 or more jobs to unlock this achievement'
  },
  {
    id: 'search_explorer',
    name: 'Search Explorer',
    description: 'Performed 20+ job searches to find the perfect fit',
    category: 'activity',
    icon: 'search',
    rarity: 'rare',
    points: 35,
    condition: (user, stats) => stats?.searchHistory >= 20,
    hint: 'Search for jobs 20 times to unlock this achievement'
  },
  {
    id: 'daily_grinder',
    name: 'Daily Grinder',
    description: 'Checked for new jobs 10+ days in a row',
    category: 'activity',
    icon: 'calendar',
    rarity: 'rare',
    points: 45,
    condition: (user) => {
      if (!user.lastActivityDate) return false;
      const daysSinceJoin = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceJoin >= 10;
    },
    hint: 'Stay active for 10 days to unlock this achievement'
  },

  // Engagement Achievements (4)
  {
    id: 'conversationalist',
    name: 'Conversationalist',
    description: 'Used JobsGPT 5+ times to find perfect matches',
    category: 'engagement',
    icon: 'chat',
    rarity: 'uncommon',
    points: 20,
    condition: (user, stats) => stats?.chatSessions >= 5,
    hint: 'Use the AI job chat 5 times to unlock this achievement'
  },
  {
    id: 'ai_enthusiast',
    name: 'AI Enthusiast',
    description: 'Had 15+ conversations with JobsGPT',
    category: 'engagement',
    icon: 'sparkles',
    rarity: 'rare',
    points: 50,
    condition: (user, stats) => stats?.chatSessions >= 15,
    hint: 'Have 15 conversations with JobsGPT to unlock this achievement'
  },
  {
    id: 'profile_viewer',
    name: 'Profile Viewer',
    description: 'Viewed your profile stats 10+ times',
    category: 'engagement',
    icon: 'eye',
    rarity: 'common',
    points: 15,
    condition: (user, stats) => stats?.profileViews >= 10,
    hint: 'Check your profile regularly to unlock this achievement'
  },
  {
    id: 'notification_ninja',
    name: 'Notification Ninja',
    description: 'Set up job alerts to never miss opportunities',
    category: 'engagement',
    icon: 'bolt',
    rarity: 'uncommon',
    points: 20,
    condition: (user, stats) => stats?.activeAlerts > 0,
    hint: 'Set up job alerts to unlock this achievement'
  },

  // Milestone Achievements (5)
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
    description: 'Embraced the 209 job market with 20+ activities',
    category: 'milestone',
    icon: 'trophy',
    rarity: 'epic',
    points: 75,
    condition: (user, stats) => {
      const activities = (stats?.savedJobs || 0) + (stats?.applicationsSubmitted || 0) + (user.achievements?.length || 0);
      return activities >= 20;
    },
    hint: 'Complete 20+ activities (saves, applications, profile items) to unlock'
  },
  {
    id: 'month_veteran',
    name: 'Month Veteran',
    description: 'Been part of the 209 Works community for 30+ days',
    category: 'milestone',
    icon: 'shield',
    rarity: 'epic',
    points: 60,
    condition: (user) => {
      const daysSinceJoin = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceJoin >= 30;
    },
    hint: 'Stay with us for 30 days to unlock this achievement'
  },
  {
    id: 'power_user',
    name: 'Power User',
    description: 'Unlocked 15+ achievements - you\'re a 209 Works pro!',
    category: 'milestone',
    icon: 'fire',
    rarity: 'legendary',
    points: 150,
    condition: (user) => (user.achievements?.length || 0) >= 15,
    hint: 'Unlock 15 achievements to become a power user'
  }
];

interface AchievementBadgesProps {
  user: any;
  stats?: any;
  unlockedOnly?: boolean;
  maxDisplay?: number;
  showPoints?: boolean;
  layout?: 'minimal' | 'detailed';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AchievementBadges({
  user,
  stats = {},
  unlockedOnly = false,
  maxDisplay,
  showPoints = true,
  layout = 'minimal',
  size = 'md',
  className = ''
}: AchievementBadgesProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [tooltipTimer, setTooltipTimer] = useState<NodeJS.Timeout | null>(null);

  if (!FEATURES.PROFILE_GAMIFICATION) {
    return null;
  }

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

  // Handle tooltip show/hide with timer
  const showTooltip = (achievementId: string) => {
    if (tooltipTimer) {
      clearTimeout(tooltipTimer);
    }
    setActiveTooltip(achievementId);
    
    // Auto-hide after 3 seconds
    const timer = setTimeout(() => {
      setActiveTooltip(null);
    }, 3000);
    setTooltipTimer(timer);
  };

  const hideTooltip = () => {
    if (tooltipTimer) {
      clearTimeout(tooltipTimer);
    }
    setActiveTooltip(null);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimer) {
        clearTimeout(tooltipTimer);
      }
    };
  }, [tooltipTimer]);

  // Minimal clean design with small badges
  return (
    <div className={className}>
      {/* Summary Stats */}
      {showPoints && unlockedAchievements.length > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <TrophyIconSolid className="mr-2 h-4 w-4 text-yellow-600" />
              <span className="text-sm font-semibold text-gray-700">
                {totalPoints} points
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {unlockedAchievements.length} unlocked
            </div>
          </div>
          <div className="text-xs text-gray-400">
            {allAchievements.length} total
          </div>
        </div>
      )}

      {/* Achievement Badges - Clean Grid */}
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {achievementsToShow.map((achievement) => {
            const isUnlocked = achievement.condition(user, stats);
            const IconComponent = iconMap[achievement.icon]?.[isUnlocked ? 'solid' : 'outline'] || TrophyIcon;
            const rarityStyle = rarityColors[achievement.rarity];

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`relative cursor-pointer ${
                  isUnlocked ? '' : 'opacity-40'
                }`}
                onClick={() => showTooltip(achievement.id)}
                onMouseEnter={() => showTooltip(achievement.id)}
                onMouseLeave={() => hideTooltip()}
              >
                {/* Small Badge Circle */}
                <div className={`
                  w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-200
                  ${isUnlocked 
                    ? `${rarityStyle.bg} ${rarityStyle.border} shadow-sm hover:shadow-md` 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }
                `}>
                  <IconComponent className={`w-4 h-4 ${
                    isUnlocked ? rarityStyle.icon : 'text-gray-400'
                  }`} />
                  
                  {/* Rarity Indicator */}
                  {isUnlocked && achievement.rarity !== 'common' && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white shadow-sm">
                      <div className={`w-full h-full rounded-full ${
                        achievement.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                        achievement.rarity === 'epic' ? 'bg-purple-500' :
                        achievement.rarity === 'rare' ? 'bg-blue-500' :
                        'bg-green-500'
                      }`} />
                    </div>
                  )}
                </div>

                {/* Mobile-Optimized Tooltip Card */}
                <AnimatePresence>
                  {activeTooltip === achievement.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="fixed left-1/2 top-20 -translate-x-1/2 mx-auto max-w-sm z-50 md:absolute md:bottom-full md:left-1/2 md:transform md:-translate-x-1/2 md:mb-3 md:inset-auto md:max-w-none"
                      style={{ width: '280px', maxWidth: 'calc(100vw - 2rem)' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-xl min-w-[200px] md:whitespace-nowrap">
                        {/* Close button for mobile */}
                        <button
                          onClick={hideTooltip}
                          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 md:hidden"
                        >
                          ✕
                        </button>
                        
                        {/* Achievement Header */}
                        <div className="flex items-center justify-between mb-2 pr-8 md:pr-0">
                          <div className="font-semibold text-gray-900">{achievement.name}</div>
                          {isUnlocked && (
                            <div className="flex items-center space-x-1">
                              <span className="text-xs font-medium text-yellow-600">+{achievement.points}</span>
                              <div className={`w-2 h-2 rounded-full ${
                                achievement.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                                achievement.rarity === 'epic' ? 'bg-purple-500' :
                                achievement.rarity === 'rare' ? 'bg-blue-500' :
                                achievement.rarity === 'uncommon' ? 'bg-green-500' :
                                'bg-gray-400'
                              }`} />
                            </div>
                          )}
                        </div>
                        
                        {/* Description */}
                        <div className="text-xs text-gray-600 mb-2 whitespace-normal">
                          {isUnlocked ? achievement.description : achievement.hint}
                        </div>
                        
                        {/* Category & Rarity */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="capitalize text-gray-500">{achievement.category}</span>
                          <span className={`capitalize font-medium ${
                            achievement.rarity === 'legendary' ? 'text-orange-600' :
                            achievement.rarity === 'epic' ? 'text-purple-600' :
                            achievement.rarity === 'rare' ? 'text-blue-600' :
                            achievement.rarity === 'uncommon' ? 'text-green-600' :
                            'text-gray-600'
                          }`}>
                            {achievement.rarity}
                          </span>
                        </div>
                        
                        {/* Tooltip Arrow - Desktop only */}
                        <div className="hidden md:block absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-white" />
                        <div className="hidden md:block absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-200 mt-px" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Show More Indicator */}
      {maxDisplay && allAchievements.length > maxDisplay && (
        <div className="mt-3 text-center">
          <span className="text-xs text-gray-500">
            {unlockedOnly ? 
              Math.max(0, unlockedAchievements.length - maxDisplay) > 0 ? 
                `+${Math.max(0, unlockedAchievements.length - maxDisplay)} more unlocked` :
                `${unlockedAchievements.length}/${allAchievements.length} unlocked`
              :
              `+${allAchievements.length - maxDisplay} more achievements`
            }
          </span>
        </div>
      )}
    </div>
  );
}