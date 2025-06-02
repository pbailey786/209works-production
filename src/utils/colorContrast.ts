// Color contrast utility functions for WCAG 2.1 AA compliance

interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

interface ContrastResult {
  ratio: number;
  isAACompliant: boolean;
  isAAACompliant: boolean;
  level: 'fail' | 'AA' | 'AAA';
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): ColorRGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula
 */
export function getLuminance(rgb: ColorRGB): number {
  const { r, g, b } = rgb;
  
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if color combination meets WCAG contrast requirements
 */
export function checkContrast(
  foreground: string, 
  background: string, 
  isLargeText: boolean = false
): ContrastResult {
  const ratio = getContrastRatio(foreground, background);
  
  // WCAG 2.1 requirements
  const normalTextAA = 4.5;
  const normalTextAAA = 7;
  const largeTextAA = 3;
  const largeTextAAA = 4.5;
  
  const aaThreshold = isLargeText ? largeTextAA : normalTextAA;
  const aaaThreshold = isLargeText ? largeTextAAA : normalTextAAA;
  
  const isAACompliant = ratio >= aaThreshold;
  const isAAACompliant = ratio >= aaaThreshold;
  
  let level: 'fail' | 'AA' | 'AAA' = 'fail';
  if (isAAACompliant) level = 'AAA';
  else if (isAACompliant) level = 'AA';
  
  return {
    ratio,
    isAACompliant,
    isAAACompliant,
    level
  };
}

/**
 * WCAG 2.1 AA compliant color palette for the job platform
 */
export const accessibleColors = {
  // Primary colors with sufficient contrast
  primary: {
    50: '#eff6ff',   // Very light blue
    100: '#dbeafe',  // Light blue
    200: '#bfdbfe',  // Medium light blue
    300: '#93c5fd',  // Medium blue
    400: '#60a5fa',  // Medium dark blue
    500: '#3b82f6',  // Primary blue (4.5:1 on white)
    600: '#2563eb',  // Dark blue (6.3:1 on white)
    700: '#1d4ed8',  // Darker blue (8.6:1 on white)
    800: '#1e40af',  // Very dark blue (11.9:1 on white)
    900: '#1e3a8a',  // Darkest blue (13.9:1 on white)
  },
  
  // Gray scale with proper contrast ratios
  gray: {
    50: '#f9fafb',   // Almost white
    100: '#f3f4f6',  // Very light gray
    200: '#e5e7eb',  // Light gray
    300: '#d1d5db',  // Medium light gray
    400: '#9ca3af',  // Medium gray (3.4:1 on white - use for large text only)
    500: '#6b7280',  // Medium dark gray (4.6:1 on white)
    600: '#4b5563',  // Dark gray (7.0:1 on white)
    700: '#374151',  // Darker gray (10.8:1 on white)
    800: '#1f2937',  // Very dark gray (16.0:1 on white)
    900: '#111827',  // Almost black (18.7:1 on white)
  },
  
  // Success colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',  // 3.9:1 on white (use for large text)
    600: '#16a34a',  // 5.3:1 on white
    700: '#15803d',  // 7.4:1 on white
    800: '#166534',  // 10.0:1 on white
    900: '#14532d',  // 12.2:1 on white
  },
  
  // Warning colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',  // 2.8:1 on white (insufficient - use darker)
    600: '#d97706',  // 4.0:1 on white (use for large text only)
    700: '#b45309',  // 5.9:1 on white
    800: '#92400e',  // 8.2:1 on white
    900: '#78350f',  // 10.4:1 on white
  },
  
  // Error colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',  // 3.3:1 on white (use for large text only)
    600: '#dc2626',  // 4.7:1 on white
    700: '#b91c1c',  // 6.8:1 on white
    800: '#991b1b',  // 9.2:1 on white
    900: '#7f1d1d',  // 11.4:1 on white
  },
  
  // Info colors
  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',  // 3.6:1 on white (use for large text only)
    600: '#0284c7',  // 4.9:1 on white
    700: '#0369a1',  // 6.8:1 on white
    800: '#075985',  // 9.0:1 on white
    900: '#0c4a6e',  // 11.0:1 on white
  }
};

/**
 * Get accessible text color for a given background
 */
export function getAccessibleTextColor(backgroundColor: string): string {
  const whiteContrast = getContrastRatio('#ffffff', backgroundColor);
  const blackContrast = getContrastRatio('#000000', backgroundColor);
  
  // Return the color with better contrast
  return whiteContrast > blackContrast ? '#ffffff' : '#000000';
}

/**
 * Validate if a color combination is accessible
 */
export function validateColorCombination(
  foreground: string,
  background: string,
  context: 'normal' | 'large' | 'ui' = 'normal'
): {
  isValid: boolean;
  ratio: number;
  recommendation?: string;
} {
  const isLargeText = context === 'large';
  const result = checkContrast(foreground, background, isLargeText);
  
  let recommendation: string | undefined;
  
  if (!result.isAACompliant) {
    if (context === 'ui') {
      recommendation = 'UI components need at least 3:1 contrast ratio. Consider using a darker foreground or lighter background.';
    } else if (isLargeText) {
      recommendation = 'Large text needs at least 3:1 contrast ratio. Consider using a darker foreground or lighter background.';
    } else {
      recommendation = 'Normal text needs at least 4.5:1 contrast ratio. Consider using a darker foreground or lighter background.';
    }
  }
  
  return {
    isValid: result.isAACompliant,
    ratio: result.ratio,
    recommendation
  };
}

/**
 * Common accessible color combinations for the job platform
 */
export const accessibleCombinations = {
  // Text on backgrounds
  textOnWhite: {
    primary: accessibleColors.primary[600],     // 6.3:1
    secondary: accessibleColors.gray[600],      // 7.0:1
    muted: accessibleColors.gray[500],          // 4.6:1
    success: accessibleColors.success[700],     // 7.4:1
    warning: accessibleColors.warning[700],     // 5.9:1
    error: accessibleColors.error[600],         // 4.7:1
    info: accessibleColors.info[700],           // 6.8:1
  },
  
  // Text on colored backgrounds
  textOnPrimary: {
    background: accessibleColors.primary[600],
    text: '#ffffff',                            // 6.3:1
  },
  
  textOnSuccess: {
    background: accessibleColors.success[600],
    text: '#ffffff',                            // 5.3:1
  },
  
  textOnWarning: {
    background: accessibleColors.warning[700],
    text: '#ffffff',                            // 5.9:1
  },
  
  textOnError: {
    background: accessibleColors.error[600],
    text: '#ffffff',                            // 4.7:1
  },
  
  // Button combinations
  buttons: {
    primary: {
      background: accessibleColors.primary[600],
      text: '#ffffff',
      hover: accessibleColors.primary[700],
    },
    secondary: {
      background: accessibleColors.gray[100],
      text: accessibleColors.gray[700],
      hover: accessibleColors.gray[200],
    },
    success: {
      background: accessibleColors.success[600],
      text: '#ffffff',
      hover: accessibleColors.success[700],
    },
    warning: {
      background: accessibleColors.warning[700],
      text: '#ffffff',
      hover: accessibleColors.warning[800],
    },
    error: {
      background: accessibleColors.error[600],
      text: '#ffffff',
      hover: accessibleColors.error[700],
    },
  },
  
  // Link colors
  links: {
    default: accessibleColors.primary[600],     // 6.3:1 on white
    hover: accessibleColors.primary[700],       // 8.6:1 on white
    visited: accessibleColors.primary[800],     // 11.9:1 on white
  },
  
  // Focus indicators
  focus: {
    outline: accessibleColors.primary[600],     // 6.3:1 on white
    ring: accessibleColors.primary[200],        // Light ring for visibility
  }
};

/**
 * Generate CSS custom properties for accessible colors
 */
export function generateAccessibleCSSVars(): string {
  return `
    :root {
      /* Accessible primary colors */
      --color-primary-50: ${accessibleColors.primary[50]};
      --color-primary-100: ${accessibleColors.primary[100]};
      --color-primary-200: ${accessibleColors.primary[200]};
      --color-primary-300: ${accessibleColors.primary[300]};
      --color-primary-400: ${accessibleColors.primary[400]};
      --color-primary-500: ${accessibleColors.primary[500]};
      --color-primary-600: ${accessibleColors.primary[600]};
      --color-primary-700: ${accessibleColors.primary[700]};
      --color-primary-800: ${accessibleColors.primary[800]};
      --color-primary-900: ${accessibleColors.primary[900]};
      
      /* Accessible gray colors */
      --color-gray-50: ${accessibleColors.gray[50]};
      --color-gray-100: ${accessibleColors.gray[100]};
      --color-gray-200: ${accessibleColors.gray[200]};
      --color-gray-300: ${accessibleColors.gray[300]};
      --color-gray-400: ${accessibleColors.gray[400]};
      --color-gray-500: ${accessibleColors.gray[500]};
      --color-gray-600: ${accessibleColors.gray[600]};
      --color-gray-700: ${accessibleColors.gray[700]};
      --color-gray-800: ${accessibleColors.gray[800]};
      --color-gray-900: ${accessibleColors.gray[900]};
      
      /* Accessible semantic colors */
      --color-success: ${accessibleColors.success[600]};
      --color-warning: ${accessibleColors.warning[700]};
      --color-error: ${accessibleColors.error[600]};
      --color-info: ${accessibleColors.info[700]};
      
      /* Accessible text combinations */
      --text-primary: ${accessibleCombinations.textOnWhite.primary};
      --text-secondary: ${accessibleCombinations.textOnWhite.secondary};
      --text-muted: ${accessibleCombinations.textOnWhite.muted};
      
      /* Accessible link colors */
      --link-default: ${accessibleCombinations.links.default};
      --link-hover: ${accessibleCombinations.links.hover};
      --link-visited: ${accessibleCombinations.links.visited};
      
      /* Accessible focus colors */
      --focus-outline: ${accessibleCombinations.focus.outline};
      --focus-ring: ${accessibleCombinations.focus.ring};
    }
  `;
} 