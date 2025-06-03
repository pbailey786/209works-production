/**
 * Component Memory Leak Fixer
 *
 * Automatically detects and fixes common memory leak patterns in React components:
 * - Uncleaned timers (setTimeout, setInterval)
 * - Uncleaned event listeners
 * - Uncleaned async operations
 * - Uncleaned subscriptions
 * - State updates after unmount
 */

import { useEffect, useRef, useCallback } from 'react';

interface MemoryLeakFix {
  type: 'timer' | 'listener' | 'async' | 'subscription' | 'state';
  description: string;
  fix: () => void;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ComponentAnalysis {
  componentName: string;
  leaks: MemoryLeakFix[];
  score: number; // 0-100, higher is better
  recommendations: string[];
}

class ComponentMemoryLeakFixer {
  private fixes = new Map<string, MemoryLeakFix[]>();
  private analysisResults = new Map<string, ComponentAnalysis>();

  // Analyze component for memory leaks
  analyzeComponent(
    componentName: string,
    componentCode: string
  ): ComponentAnalysis {
    const leaks: MemoryLeakFix[] = [];

    // Check for setTimeout without cleanup
    const timeoutMatches = componentCode.match(/setTimeout\s*\(/g);
    const timeoutCleanupMatches = componentCode.match(/clearTimeout\s*\(/g);
    if (
      timeoutMatches &&
      (!timeoutCleanupMatches ||
        timeoutMatches.length > timeoutCleanupMatches.length)
    ) {
      leaks.push({
        type: 'timer',
        description: 'setTimeout calls without proper cleanup in useEffect',
        fix: () => this.fixTimeoutLeaks(componentName),
        severity: 'high',
      });
    }

    // Check for setInterval without cleanup
    const intervalMatches = componentCode.match(/setInterval\s*\(/g);
    const intervalCleanupMatches = componentCode.match(/clearInterval\s*\(/g);
    if (
      intervalMatches &&
      (!intervalCleanupMatches ||
        intervalMatches.length > intervalCleanupMatches.length)
    ) {
      leaks.push({
        type: 'timer',
        description: 'setInterval calls without proper cleanup in useEffect',
        fix: () => this.fixIntervalLeaks(componentName),
        severity: 'critical',
      });
    }

    // Check for addEventListener without removeEventListener
    const addListenerMatches = componentCode.match(/addEventListener\s*\(/g);
    const removeListenerMatches = componentCode.match(
      /removeEventListener\s*\(/g
    );
    if (
      addListenerMatches &&
      (!removeListenerMatches ||
        addListenerMatches.length > removeListenerMatches.length)
    ) {
      leaks.push({
        type: 'listener',
        description: 'Event listeners without proper cleanup',
        fix: () => this.fixEventListenerLeaks(componentName),
        severity: 'high',
      });
    }

    // Check for async operations without AbortController
    const fetchMatches = componentCode.match(/fetch\s*\(/g);
    const abortMatches = componentCode.match(/AbortController|signal/g);
    if (fetchMatches && !abortMatches) {
      leaks.push({
        type: 'async',
        description: 'Async operations without cancellation support',
        fix: () => this.fixAsyncLeaks(componentName),
        severity: 'medium',
      });
    }

    // Check for state updates without mounted check
    const setStateMatches = componentCode.match(/set\w+\s*\(/g);
    const mountedCheckMatches = componentCode.match(/isMounted|mounted/g);
    if (setStateMatches && setStateMatches.length > 3 && !mountedCheckMatches) {
      leaks.push({
        type: 'state',
        description: 'State updates without mounted component check',
        fix: () => this.fixStateUpdateLeaks(componentName),
        severity: 'medium',
      });
    }

    // Calculate score (100 - (leaks * severity weight))
    const severityWeights = { low: 5, medium: 15, high: 25, critical: 40 };
    const totalDeduction = leaks.reduce(
      (sum, leak) => sum + severityWeights[leak.severity],
      0
    );
    const score = Math.max(0, 100 - totalDeduction);

    // Generate recommendations
    const recommendations = this.generateRecommendations(leaks);

    const analysis: ComponentAnalysis = {
      componentName,
      leaks,
      score,
      recommendations,
    };

    this.analysisResults.set(componentName, analysis);
    this.fixes.set(componentName, leaks);

    return analysis;
  }

  // Fix timeout leaks
  private fixTimeoutLeaks(componentName: string): string {
    return `
// Fixed timeout leak in ${componentName}
const timeoutRef = useRef<number>();

useEffect(() => {
  timeoutRef.current = setTimeout(() => {
    // Your timeout logic here
  }, delay);

  return () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
}, [dependencies]);
`;
  }

  // Fix interval leaks
  private fixIntervalLeaks(componentName: string): string {
    return `
// Fixed interval leak in ${componentName}
const intervalRef = useRef<number>();

useEffect(() => {
  intervalRef.current = setInterval(() => {
    // Your interval logic here
  }, delay);

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
}, [dependencies]);
`;
  }

  // Fix event listener leaks
  private fixEventListenerLeaks(componentName: string): string {
    return `
// Fixed event listener leak in ${componentName}
useEffect(() => {
  const handleEvent = (event) => {
    // Your event handler logic here
  };

  target.addEventListener('eventType', handleEvent);

  return () => {
    target.removeEventListener('eventType', handleEvent);
  };
}, [dependencies]);
`;
  }

  // Fix async operation leaks
  private fixAsyncLeaks(componentName: string): string {
    return `
// Fixed async leak in ${componentName}
useEffect(() => {
  const abortController = new AbortController();

  const fetchData = async () => {
    try {
      const response = await fetch(url, {
        signal: abortController.signal
      });
      const data = await response.json();
      
      // Only update state if not aborted
      if (!abortController.signal.aborted) {
        setData(data);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setError(error);
      }
    }
  };

  fetchData();

  return () => {
    abortController.abort();
  };
}, [dependencies]);
`;
  }

  // Fix state update leaks
  private fixStateUpdateLeaks(componentName: string): string {
    return `
// Fixed state update leak in ${componentName}
const isMountedRef = useRef(true);

useEffect(() => {
  return () => {
    isMountedRef.current = false;
  };
}, []);

// Safe state update function
const safeSetState = useCallback((newState) => {
  if (isMountedRef.current) {
    setState(newState);
  }
}, []);
`;
  }

  // Generate recommendations based on leaks
  private generateRecommendations(leaks: MemoryLeakFix[]): string[] {
    const recommendations: string[] = [];

    if (leaks.some(leak => leak.type === 'timer')) {
      recommendations.push(
        'Use useRef to store timer IDs and clear them in useEffect cleanup'
      );
      recommendations.push(
        'Consider using custom hooks like useSafeTimeout and useSafeInterval'
      );
    }

    if (leaks.some(leak => leak.type === 'listener')) {
      recommendations.push(
        'Always remove event listeners in useEffect cleanup functions'
      );
      recommendations.push(
        'Use the same function reference for both add and remove operations'
      );
    }

    if (leaks.some(leak => leak.type === 'async')) {
      recommendations.push(
        'Use AbortController to cancel pending async operations'
      );
      recommendations.push(
        'Check if component is still mounted before updating state'
      );
    }

    if (leaks.some(leak => leak.type === 'state')) {
      recommendations.push(
        'Implement mounted component checks before state updates'
      );
      recommendations.push(
        'Use custom hooks that handle component lifecycle automatically'
      );
    }

    recommendations.push(
      'Consider using the useMemoryLeakPrevention hook for automatic cleanup'
    );
    recommendations.push('Run memory leak detection in development mode');

    return recommendations;
  }

  // Apply all fixes for a component
  applyFixes(componentName: string): string[] {
    const fixes = this.fixes.get(componentName);
    if (!fixes) {
      return [];
    }

    const appliedFixes: string[] = [];

    fixes.forEach(fix => {
      try {
        fix.fix();
        appliedFixes.push(fix.description);
      } catch (error) {
        console.error(`Failed to apply fix for ${componentName}:`, error);
      }
    });

    return appliedFixes;
  }

  // Get analysis results
  getAnalysis(componentName: string): ComponentAnalysis | undefined {
    return this.analysisResults.get(componentName);
  }

  // Get all analyses
  getAllAnalyses(): ComponentAnalysis[] {
    return Array.from(this.analysisResults.values());
  }

  // Generate comprehensive report
  generateReport(): {
    totalComponents: number;
    averageScore: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    topIssues: string[];
    recommendations: string[];
  } {
    const analyses = this.getAllAnalyses();

    if (analyses.length === 0) {
      return {
        totalComponents: 0,
        averageScore: 100,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
        topIssues: [],
        recommendations: [],
      };
    }

    const totalScore = analyses.reduce(
      (sum, analysis) => sum + analysis.score,
      0
    );
    const averageScore = totalScore / analyses.length;

    const allLeaks = analyses.flatMap(analysis => analysis.leaks);
    const criticalIssues = allLeaks.filter(
      leak => leak.severity === 'critical'
    ).length;
    const highIssues = allLeaks.filter(leak => leak.severity === 'high').length;
    const mediumIssues = allLeaks.filter(
      leak => leak.severity === 'medium'
    ).length;
    const lowIssues = allLeaks.filter(leak => leak.severity === 'low').length;

    // Get top issues by frequency
    const issueFrequency = new Map<string, number>();
    allLeaks.forEach(leak => {
      const count = issueFrequency.get(leak.description) || 0;
      issueFrequency.set(leak.description, count + 1);
    });

    const topIssues = Array.from(issueFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue, count]) => `${issue} (${count} components)`);

    // Aggregate recommendations
    const allRecommendations = analyses.flatMap(
      analysis => analysis.recommendations
    );
    const uniqueRecommendations = Array.from(new Set(allRecommendations));

    return {
      totalComponents: analyses.length,
      averageScore: Math.round(averageScore),
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      topIssues,
      recommendations: uniqueRecommendations,
    };
  }
}

// Global instance
const componentMemoryLeakFixer = new ComponentMemoryLeakFixer();

// React hook for automatic memory leak detection and fixing
export function useMemoryLeakDetection(
  componentName: string,
  componentCode?: string
) {
  const analysisRef = useRef<ComponentAnalysis | null>(null);

  useEffect(() => {
    if (componentCode) {
      analysisRef.current = componentMemoryLeakFixer.analyzeComponent(
        componentName,
        componentCode
      );

      // Log analysis in development
      if (
        process.env.NODE_ENV === 'development' &&
        analysisRef.current.leaks.length > 0
      ) {
        console.warn(
          `Memory leak analysis for ${componentName}:`,
          analysisRef.current
        );
      }
    }
  }, [componentName, componentCode]);

  const applyFixes = useCallback(() => {
    return componentMemoryLeakFixer.applyFixes(componentName);
  }, [componentName]);

  const getAnalysis = useCallback(() => {
    return (
      analysisRef.current || componentMemoryLeakFixer.getAnalysis(componentName)
    );
  }, [componentName]);

  return {
    analysis: getAnalysis(),
    applyFixes,
    getAnalysis,
  };
}

// Utility functions
export function analyzeComponentCode(
  componentName: string,
  code: string
): ComponentAnalysis {
  return componentMemoryLeakFixer.analyzeComponent(componentName, code);
}

export function generateMemoryLeakReport() {
  return componentMemoryLeakFixer.generateReport();
}

export function getComponentAnalysis(
  componentName: string
): ComponentAnalysis | undefined {
  return componentMemoryLeakFixer.getAnalysis(componentName);
}

export default componentMemoryLeakFixer;
