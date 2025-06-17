export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    jobId?: string;
    companyName?: string;
    searchQuery?: string;
    userId?: string;
  };
}

export type ConversationIntent =
  | 'job_search'
  | 'company_info'
  | 'career_guidance'
  | 'application_help'
  | 'market_insights'
  | 'job_comparison'
  | 'general_chat';

export interface JobContext {
  jobId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  requirements?: string;
  benefits?: string;
}

export interface UserProfile {
  userId?: string;
  skills?: string[];
  experience?: string;
  location?: string;
  preferences?: {
    jobTypes?: string[];
    salaryRange?: { min?: number; max?: number };
    remoteWork?: boolean;
    industries?: string[];
  };
  careerGoals?: string[];
}

export interface ConversationContext {
  sessionId: string;
  userId?: string;
  messages: Message[];
  intent: ConversationIntent;
  context: {
    currentJobs?: JobContext[];
    targetCompanies?: string[];
    userProfile?: UserProfile;
    searchQuery?: string;
    lastJobSearch?: {
      query: string;
      filters: Record<string, any>;
      results: number;
      timestamp: Date;
    };
  };
  metadata: {
    startedAt: Date;
    lastActivity: Date;
    messageCount: number;
    userSatisfaction?: number;
  };
}

export interface ChatbotResponse {
  reply: string;
  intent: ConversationIntent;
  suggestions?: string[];
  jobRecommendations?: JobContext[];
  companyInfo?: {
    name: string;
    description?: string;
    culture?: string;
    benefits?: string[];
  };
  followUpActions?: {
    type: 'search_jobs' | 'save_job' | 'apply_job' | 'learn_more';
    data: Record<string, any>;
  }[];
  metadata?: {
    responseTime: number;
    tokensUsed?: number;
    sources?: string[];
  };
}

export interface ConversationSession {
  sessionId: string;
  userId?: string;
  context: ConversationContext;
  isActive: boolean;
  expiresAt: Date;
}
