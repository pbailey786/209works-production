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

const rarityStyles = {
  common: {
    gradient: 'from-slate-400 via-slate-500 to-slate-600',
    glow: 'shadow-slate-300/50',
    border: 'border-slate-300',
    text: 'text-slate-800'
  },
  uncommon: {
    gradient: 'from-green-400 via-green-500 to-green-600',
    glow: 'shadow-green-300/50',
    border: 'border-green-300',
    text: 'text-green-800'
  },
  rare: {
    gradient: 'from-blue-400 via-blue-500 to-blue-600',
    glow: 'shadow-blue-300/50',
    border: 'border-blue-300',
    text: 'text-blue-800'
  },
  epic: {
    gradient: 'from-purple-400 via-purple-500 to-purple-600',
    glow: 'shadow-purple-300/50',
    border: 'border-purple-300',
    text: 'text-purple-800'
  },
  legendary: {
    gradient: 'from-yellow-400 via-orange-500 to-red-500',
    glow: 'shadow-yellow-300/50',
    border: 'border-yellow-400',
    text: 'text-yellow-900'
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
  layout?: 'grid' | 'horizontal';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AchievementBadges({
  user,
  stats = {},
  unlockedOnly = false,
  maxDisplay,
  showPoints = true,
  layout = 'horizontal',
  size = 'md',
  className = ''
}: AchievementBadgesProps) {
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

  if (layout === 'horizontal') {
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

        {/* Horizontal Scrollable Achievement List */}
        <div className="overflow-x-auto">
          <div className="flex space-x-4 pb-2">
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
                    className={`relative group cursor-pointer flex-shrink-0 ${
                      isUnlocked ? '' : 'opacity-60'
                    }`}
                    title={isUnlocked ? achievement.description : achievement.hint}
                  >
                    <div className={`
                      flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-300 min-w-[120px] max-w-[140px]
                      ${isUnlocked 
                        ? `bg-gradient-to-br ${rarityStyle.gradient} ${rarityStyle.border} hover:shadow-lg hover:${rarityStyle.glow} text-white border-opacity-50`
                        : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-500'
                      }
                      relative overflow-hidden
                    `}>
                      {/* Glossy overlay */}
                      {isUnlocked && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-2xl" />
                      )}
                      
                      {/* Icon */}
                      <div className="relative z-10 mb-3">
                        <IconComponent className={`h-8 w-8 ${
                          isUnlocked ? 'text-white drop-shadow-lg' : 'text-gray-400'
                        }`} />
                      </div>

                      {/* Achievement Name */}
                      <div className={`relative z-10 text-xs font-bold text-center leading-tight mb-2 ${
                        isUnlocked ? 'text-white drop-shadow' : 'text-gray-600'
                      }`}>
                        {achievement.name}
                      </div>

                      {/* Points Badge */}
                      {showPoints && isUnlocked && (
                        <div className="absolute -top-2 -right-2 z-20">
                          <div className="bg-yellow-400 text-yellow-900 rounded-full px-2 py-1 text-xs font-bold shadow-lg border-2 border-yellow-300">
                            {achievement.points}
                          </div>
                        </div>
                      )}

                      {/* Rarity Gems */}
                      {isUnlocked && achievement.rarity !== 'common' && (
                        <div className="absolute bottom-2 right-2 z-10">
                          <div className={`h-2 w-2 rounded-full ${
                            achievement.rarity === 'legendary' ? 'bg-yellow-300 shadow-yellow-300/50' :
                            achievement.rarity === 'epic' ? 'bg-purple-300 shadow-purple-300/50' :
                            achievement.rarity === 'rare' ? 'bg-blue-300 shadow-blue-300/50' :
                            'bg-green-300 shadow-green-300/50'
                          } shadow-lg`} />
                        </div>
                      )}
                    </div>

                    {/* Enhanced Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 bg-gray-900 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-30 whitespace-nowrap max-w-xs shadow-xl">
                      <div className="font-semibold mb-1">{achievement.name}</div>
                      <div className="text-gray-300">
                        {isUnlocked ? achievement.description : achievement.hint}
                      </div>
                      {isUnlocked && (
                        <div className="text-yellow-400 font-semibold mt-1">
                          +{achievement.points} points
                        </div>
                      )}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Achievement Categories Legend */}
        {!unlockedOnly && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
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
              <div className="mr-1 h-2 w-2 rounded-full bg-purple-400" />
              Engagement
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

  // Grid layout (original design for comparison)
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
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
                  flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200
                  ${isUnlocked 
                    ? `bg-gradient-to-br ${rarityStyle.gradient} ${rarityStyle.border} hover:shadow-lg hover:${rarityStyle.glow} text-white` 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }
                `}>
                  {/* Icon */}
                  <div className="mb-2">
                    <IconComponent className={`h-8 w-8 ${
                      isUnlocked ? 'text-white' : 'text-gray-400'
                    }`} />
                  </div>

                  {/* Achievement Name */}
                  <div className={`text-xs font-medium text-center leading-tight ${
                    isUnlocked ? 'text-white' : 'text-gray-500'
                  }`}>
                    {achievement.name}
                  </div>

                  {/* Points Badge */}
                  {showPoints && isUnlocked && (
                    <div className="absolute -top-1 -right-1 rounded-full bg-yellow-400 px-1.5 py-0.5 text-xs font-bold text-yellow-900">
                      {achievement.points}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}