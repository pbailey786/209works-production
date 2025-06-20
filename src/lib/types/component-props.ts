

/**
 * Comprehensive TypeScript interfaces for component props
 * Fixes critical type safety issues identified in Task 45.15
 *
 * This file provides proper type definitions to replace unsafe 'any' types
 * and ensures runtime prop validation with default values.
 */

  safeDateFormat as safeDateFormatUtil,
import {
  import {
  safeTimeFormat,
  getRelativeTime,
  safeString,
  safeTrim,
  safeSubstring,
  safeArraySlice,
  safeNumber,
  safeToString,
  capitalizeFirst,
  capitalizeWords,
  isNonEmptyString,
  isValidURL
} from '@/lib/utils/safe-operations';

// ===== JOB-RELATED INTERFACES =====

export interface BaseJob {
  id: number | string;
  title: string;
  company: string;
  type: string;
  postedAt: string;
  description: string;
  url?: string;
  applyUrl?: string;
}

export interface JobWithOptionalFields extends BaseJob {
  isFeatured?: boolean;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  location?: string;
  categories?: string[];
  source?: string;
  isRemote?: boolean;
  experienceLevel?: string;
  requirements?: string | string[]; // Support both string and string[] for compatibility
  benefits?: string;
  skills?: string[];
  applicationDeadline?: string;
  applicantsCount?: number;
  viewsCount?: number;

  // Multi-area-code network fields
  areaCodes?: string[];
  city?: string;
  targetCities?: string[];
  lat?: number;
  lng?: number;
}

export interface CompanyInfo {
  logo?: string;
  size?: string;
  industry?: string;
  founded?: string;
  website?: string;
  description?: string;
}

export interface JobSkill {
  name: string;
  importance: 'required' | 'preferred' | 'nice-to-have';
}

export interface EmployeeTestimonial {
  text: string;
  author: string;
  role: string;
}

export interface EnhancedJobData
  extends Omit<JobWithOptionalFields, 'benefits' | 'skills'> {
  companyInfo: CompanyInfo;
  skills: JobSkill[];
  benefits?: string[];
  requirements: string[]; // Always array in enhanced data
  responsibilities: string[];
  employeeTestimonials?: EmployeeTestimonial[];
}

// ===== COMPONENT PROP INTERFACES =====

export interface JobCardProps {
  title: string;
  company: string;
  type: string;
  postedAt: string;
  description: string;
  applyUrl: string;
  isFeatured?: boolean;
  salary?: string;
  location?: string;
  categories?: string[];
  onSave?: () => void;
  saved?: boolean;
  onClick?: () => void;
  isSelected?: boolean;
  onViewDetails?: () => void;
  applied?: boolean;
  applicationStatus?: 'pending' | 'reviewing' | 'interview' | 'offer' | 'rejected' | 'withdrawn';
  appliedAt?: string;
}

// Removed duplicate interface - using the enhanced version below

export interface JobGenieProps {
  jobId: string;
  jobTitle: string;
  company: string;
  className?: string;
}

export interface JobListProps {
  jobs?: JobWithOptionalFields[];
  loading?: boolean;
  error?: string | null;
  onJobSelect?: (job: JobWithOptionalFields) => void;
  onJobSave?: (jobId: string | number) => void;
  savedJobIds?: (string | number)[];
  isAuthenticated?: boolean;
}

// ===== PLACEHOLDER PAGE INTERFACES =====

export interface WireframeSection {
  title: string;
  description: string;
  wireframeType: 'table' | 'cards' | 'form' | 'chart' | 'list' | 'buttons';
  items?: string[];
}

export interface QuickAction {
  title: string;
  label: string;
  description: string;
  icon: string;
  href?: string;
  disabled?: boolean;
}

export interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: string;
  sections?: WireframeSection[];
  quickActions?: QuickAction[];
  comingSoon?: boolean;
}

// ===== UTILITY TYPES FOR VALIDATION =====

export type JobStatus = 'active' | 'inactive' | 'expired' | 'draft';
export type JobType =
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'internship'
  | 'volunteer'
  | 'other';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'executive';

// ===== PROP VALIDATION HELPERS =====

export const validateJobProps = (job: any): JobWithOptionalFields => {
  if (!job) {
    throw new Error('Job object is required');
  }

  const requiredFields = [
    'id',
    'title',
    'company',
    'type',
    'postedAt',
    'description',
  ];
  for (const field of requiredFields) {
    if (!job[field]) {
      throw new Error(`Required field '${field}' is missing from job object`);
    }
  }

  // Validate types
  if (typeof job.title !== 'string' || job.title.trim().length === 0) {
    throw new Error('Job title must be a non-empty string');
  }

  if (typeof job.company !== 'string' || job.company.trim().length === 0) {
    throw new Error('Company name must be a non-empty string');
  }

  if (
    typeof job.description !== 'string' ||
    job.description.trim().length === 0
  ) {
    throw new Error('Job description must be a non-empty string');
  }

  // Validate optional numeric fields
  if (
    job.salaryMin !== undefined &&
    (typeof job.salaryMin !== 'number' || job.salaryMin < 0)
  ) {
    throw new Error('Salary minimum must be a positive number');
  }

  if (
    job.salaryMax !== undefined &&
    (typeof job.salaryMax !== 'number' || job.salaryMax < 0)
  ) {
    throw new Error('Salary maximum must be a positive number');
  }

  if (job.salaryMin && job.salaryMax && job.salaryMin > job.salaryMax) {
    throw new Error('Minimum salary cannot be greater than maximum salary');
  }

  // Validate date
  const postedDate = new Date(job.postedAt);
  if (isNaN(postedDate.getTime())) {
    throw new Error('Posted date must be a valid date string');
  }

  return job as JobWithOptionalFields;
};

export const validateJobCardProps = (props: any): JobCardProps => {
  const requiredFields = [
    'title',
    'company',
    'type',
    'postedAt',
    'description',
    'applyUrl',
  ];

  for (const field of requiredFields) {
    if (
      !props[field] ||
      typeof props[field] !== 'string' ||
      props[field].trim().length === 0
    ) {
      throw new Error(`Required prop '${field}' is missing or invalid`);
    }
  }

  // Validate URL - allow relative URLs for internal routes
  if (props.applyUrl) {
    try {
      // Allow relative URLs (starting with /) or full URLs
      if (!props.applyUrl.startsWith('/')) {
        new URL(props.applyUrl);
      }
    } catch {
      throw new Error('Apply URL must be a valid URL');
    }
  }

  return props as JobCardProps;
};

export const validatePlaceholderPageProps = (
  props: any
): PlaceholderPageProps => {
  if (
    !props.title ||
    typeof props.title !== 'string' ||
    props.title.trim().length === 0
  ) {
    throw new Error('Title is required and must be a non-empty string');
  }

  if (
    !props.description ||
    typeof props.description !== 'string' ||
    props.description.trim().length === 0
  ) {
    throw new Error('Description is required and must be a non-empty string');
  }

  // Validate sections array
  if (props.sections && !Array.isArray(props.sections)) {
    throw new Error('Sections must be an array');
  }

  if (props.sections) {
    for (const section of props.sections) {
      if (!section.title || !section.description || !section.wireframeType) {
        throw new Error(
          'Each section must have title, description, and wireframeType'
        );
      }

      const validWireframeTypes = [
        'table',
        'cards',
        'form',
        'chart',
        'list',
        'buttons',
      ];
      if (!validWireframeTypes.includes(section.wireframeType)) {
        throw new Error(`Invalid wireframeType: ${section.wireframeType}`);
      }
    }
  }

  // Validate quickActions array
  if (props.quickActions && !Array.isArray(props.quickActions)) {
    throw new Error('Quick actions must be an array');
  }

  if (props.quickActions) {
    for (const action of props.quickActions) {
      if (!action.label || !action.description) {
        throw new Error('Each quick action must have label and description');
      }
    }
  }

  return props as PlaceholderPageProps;
};

// ===== DEFAULT VALUES =====

export const defaultJobCardProps: Partial<JobCardProps> = {
  isFeatured: false,
  saved: false,
  isSelected: false,
  salary: undefined,
  location: undefined,
  categories: [],
};

export const defaultEnhancedJobModalProps: Partial<EnhancedJobModalProps> = {
  saved: false,
  isAuthenticated: false,
};

export const defaultPlaceholderPageProps: Partial<PlaceholderPageProps> = {
  icon: '📄',
  sections: [],
  quickActions: [],
  comingSoon: false,
};

// ===== RUNTIME VALIDATION UTILITIES =====

export const safeParseDate = (dateString: string): Date => {
  if (!dateString || typeof dateString !== 'string') {
    throw new Error('Date string is required');
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateString}`);
  }

  return date;
};

export const safeFormatSalary = (min?: number, max?: number): string => {
  const safeMin = safeNumber(min);
  const safeMax = safeNumber(max);

  try {
    if (min !== undefined && max !== undefined && safeMin > 0 && safeMax > 0) {
      return `$${safeMin.toLocaleString()} - $${safeMax.toLocaleString()}`;
    } else if (min !== undefined && safeMin > 0) {
      return `From $${safeMin.toLocaleString()}`;
    } else if (max !== undefined && safeMax > 0) {
      return `Up to $${safeMax.toLocaleString()}`;
    }
    return 'Salary not specified';
  } catch (error) {
    console.warn('Error formatting salary:', error);
    return 'Salary not specified';
  }
};

export const safeFormatDate = (
  dateString: string | Date | null | undefined
): string => {
  // Use the new safe date formatting utility with relative time
  return getRelativeTime(dateString) || 'Date unavailable';
};

// ===== ERROR HANDLING AND LOADING STATE INTERFACES =====

export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number; // 0-100 for progress bars
}

export interface ErrorState {
  hasError: boolean;
  errorMessage?: string;
  errorCode?: string;
  canRetry?: boolean;
  retryAction?: () => void;
}

export interface AsyncOperationState extends LoadingState, ErrorState {
  lastAttempt?: Date;
  attemptCount?: number;
  maxRetries?: number;
}

// Enhanced component props with loading and error states
export interface EnhancedComponentProps {
  loading?: LoadingState;
  error?: ErrorState;
  onRetry?: () => void;
  onError?: (error: Error) => void;
}

// ===== ENHANCED JOB MODAL PROPS =====

export interface EnhancedJobModalProps extends EnhancedComponentProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobWithOptionalFields | null;
  onSave?: () => Promise<void>;
  onApply?: () => Promise<void>;
  onShare?: () => Promise<void>;
  saved?: boolean;
  isAuthenticated?: boolean;
  // Enhanced loading states
  jobDataLoading?: boolean;
  saveLoading?: boolean;
  shareLoading?: boolean;
  applyLoading?: boolean;
  // Enhanced error states
  jobDataError?: string | null;
  saveError?: string | null;
  shareError?: string | null;
  applyError?: string | null;
}

// ===== ENHANCED JOB GENIE PROPS =====

export interface EnhancedJobGenieProps extends EnhancedComponentProps {
  jobId: string;
  jobTitle: string;
  company: string;
  className?: string;
  // Enhanced features
  maxRetries?: number;
  requestTimeout?: number;
  enableRetry?: boolean;
  onConnectionError?: (error: Error) => void;
  onApiError?: (error: Error) => void;
}

// ===== ENHANCED JOB CARD PROPS =====

export interface EnhancedJobCardProps
  extends JobCardProps,
    EnhancedComponentProps {
  // Enhanced loading states
  saveLoading?: boolean;
  applyLoading?: boolean;
  // Enhanced error states
  saveError?: string | null;
  applyError?: string | null;
}

// ===== ENHANCED JOB LIST PROPS =====

export interface EnhancedJobListProps extends EnhancedComponentProps {
  // Enhanced loading states
  jobsLoading?: boolean;
  searchLoading?: boolean;
  // Enhanced error states
  jobsError?: string | null;
  searchError?: string | null;
  // Enhanced features
  enableRetry?: boolean;
  retryDelay?: number;
  maxRetries?: number;
}

// ===== UTILITY FUNCTIONS FOR ERROR HANDLING =====

export const createAsyncOperationState = (
  initialState?: Partial<AsyncOperationState>
): AsyncOperationState => ({
  isLoading: false,
  hasError: false,
  canRetry: true,
  attemptCount: 0,
  maxRetries: 3,
  ...initialState,
});

export const handleAsyncError = (
  error: Error,
  state: AsyncOperationState,
  onError?: (error: Error) => void
): AsyncOperationState => {
  onError?.(error);

  return {
    ...state,
    isLoading: false,
    hasError: true,
    errorMessage: error.message,
    errorCode: (error as any).code || 'UNKNOWN_ERROR',
    lastAttempt: new Date(),
    attemptCount: (state.attemptCount || 0) + 1,
    canRetry: (state.attemptCount || 0) < (state.maxRetries || 3),
  };
};

export const startAsyncOperation = (
  state: AsyncOperationState,
  loadingMessage?: string
): AsyncOperationState => ({
  ...state,
  isLoading: true,
  hasError: false,
  errorMessage: undefined,
  errorCode: undefined,
  loadingMessage,
});

export const completeAsyncOperation = (
  state: AsyncOperationState
): AsyncOperationState => ({
  ...state,
  isLoading: false,
  hasError: false,
  errorMessage: undefined,
  errorCode: undefined,
  loadingMessage: undefined,
  attemptCount: 0,
});

// ===== RETRY UTILITIES =====

export const createRetryFunction = (
  operation: () => Promise<void>,
  maxRetries: number = 3,
  delay: number = 1000
) => {
  return async (currentAttempt: number = 0): Promise<void> => {
    try {
      await operation();
    } catch (error) {
      if (currentAttempt < maxRetries) {
        await new Promise(resolve =>
          setTimeout(resolve, delay * Math.pow(2, currentAttempt))
        );
        return createRetryFunction(
          operation,
          maxRetries,
          delay
        )(currentAttempt + 1);
      }
      throw error;
    }
  };
};

// ===== TIMEOUT UTILITIES =====

export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
};
