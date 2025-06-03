// Accessibility utilities for managing text alternatives and ARIA attributes

export interface AccessibleIconProps {
  'aria-label'?: string;
  'aria-hidden'?: boolean;
  role?: string;
  title?: string;
}

/**
 * Creates accessible props for decorative icons
 * Decorative icons should be hidden from screen readers
 */
export function createDecorativeIconProps(): AccessibleIconProps {
  return {
    'aria-hidden': true,
    role: 'presentation',
  };
}

/**
 * Creates accessible props for informative icons
 * Informative icons should have descriptive labels
 */
export function createInformativeIconProps(label: string): AccessibleIconProps {
  return {
    'aria-label': label,
    role: 'img',
  };
}

/**
 * Creates accessible props for interactive icons (buttons, links)
 * Interactive icons should have descriptive labels but not role="img"
 */
export function createInteractiveIconProps(label: string): AccessibleIconProps {
  return {
    'aria-label': label,
  };
}

/**
 * Generates appropriate alt text for different types of images
 */
export function generateAltText(
  type: 'logo' | 'avatar' | 'decorative' | 'informative',
  context?: {
    companyName?: string;
    userName?: string;
    description?: string;
  }
): string {
  switch (type) {
    case 'logo':
      return context?.companyName
        ? `${context.companyName} logo`
        : 'Company logo';
    case 'avatar':
      return context?.userName
        ? `${context.userName}'s profile picture`
        : 'User profile picture';
    case 'decorative':
      return ''; // Empty alt for decorative images
    case 'informative':
      return context?.description || 'Informative image';
    default:
      return '';
  }
}

/**
 * Common accessible icon configurations
 */
export const ACCESSIBLE_ICONS = {
  // Navigation and UI
  menu: createInformativeIconProps('Menu'),
  close: createInformativeIconProps('Close'),
  search: createInformativeIconProps('Search'),
  filter: createInformativeIconProps('Filter'),
  sort: createInformativeIconProps('Sort'),

  // Actions
  save: createInformativeIconProps('Save'),
  bookmark: createInformativeIconProps('Bookmark'),
  share: createInformativeIconProps('Share'),
  edit: createInformativeIconProps('Edit'),
  delete: createInformativeIconProps('Delete'),
  download: createInformativeIconProps('Download'),

  // Status and feedback
  success: createInformativeIconProps('Success'),
  error: createInformativeIconProps('Error'),
  warning: createInformativeIconProps('Warning'),
  info: createInformativeIconProps('Information'),
  loading: createInformativeIconProps('Loading'),

  // Social and external
  facebook: createInformativeIconProps('Facebook'),
  twitter: createInformativeIconProps('Twitter'),
  instagram: createInformativeIconProps('Instagram'),
  linkedin: createInformativeIconProps('LinkedIn'),
  email: createInformativeIconProps('Email'),
  phone: createInformativeIconProps('Phone'),

  // Job-specific
  location: createInformativeIconProps('Location'),
  calendar: createInformativeIconProps('Date'),
  briefcase: createInformativeIconProps('Job type'),
  building: createInformativeIconProps('Company'),
  salary: createInformativeIconProps('Salary'),

  // Visibility toggles
  showPassword: createInformativeIconProps('Show password'),
  hidePassword: createInformativeIconProps('Hide password'),

  // Decorative (should be hidden from screen readers)
  decorative: createDecorativeIconProps(),
} as const;

/**
 * Validates that multimedia content has proper accessibility attributes
 */
export function validateMultimediaAccessibility(element: {
  type: 'video' | 'audio' | 'iframe';
  hasCaption?: boolean;
  hasTranscript?: boolean;
  hasAltDescription?: boolean;
  title?: string;
}): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  switch (element.type) {
    case 'video':
      if (!element.hasCaption) {
        issues.push('Video missing captions');
        recommendations.push('Add closed captions for all video content');
      }
      if (!element.hasTranscript) {
        recommendations.push(
          'Consider providing a transcript for better accessibility'
        );
      }
      break;

    case 'audio':
      if (!element.hasTranscript) {
        issues.push('Audio missing transcript');
        recommendations.push('Provide a text transcript for all audio content');
      }
      break;

    case 'iframe':
      if (!element.title) {
        issues.push('iframe missing title attribute');
        recommendations.push(
          'Add a descriptive title attribute to iframe elements'
        );
      }
      break;
  }

  return {
    isValid: issues.length === 0,
    issues,
    recommendations,
  };
}

/**
 * Creates accessible props for form elements with icons
 */
export function createFormIconProps(
  purpose: 'validation' | 'action' | 'decoration',
  label?: string
): AccessibleIconProps {
  switch (purpose) {
    case 'validation':
      return createInformativeIconProps(label || 'Validation status');
    case 'action':
      return createInteractiveIconProps(label || 'Action');
    case 'decoration':
      return createDecorativeIconProps();
    default:
      return createDecorativeIconProps();
  }
}
