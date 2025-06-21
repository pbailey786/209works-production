import { getChatCompletion } from '@/lib/openai';
import {

  ShouldIApplyPrompts, 
  JobAnalysisInput, 
  JobAnalysisResult,
} from '@/lib/prompts/shouldIApply';

/**
 * AI-powered job match analysis service
 * Provides detailed analysis of job fit with personalized recommendations
 */
export class ShouldIApplyAnalysisService {
  /**
   * Analyze job fit using AI
   */
  static async analyzeJobFit(input: JobAnalysisInput): Promise<JobAnalysisResult> {
    try {
      console.log('🤖 Starting AI job fit analysis for:', input.job.title);

      const systemPrompt = ShouldIApplyPrompts.getSystemPrompt();
      const userPrompt = ShouldIApplyPrompts.getUserPrompt(input);

      const response = await getChatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          model: 'gpt-4',
          temperature: 0.3, // Lower temperature for more consistent analysis
          maxTokens: 1500,
          rateLimitId: 'should-i-apply-analysis',
          timeout: 45000, // Longer timeout for complex analysis
        }
      );

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]) as JobAnalysisResult;
        
        // Validate and sanitize the response
        const validatedAnalysis = this.validateAnalysisResult(analysis);
        
        console.log('✅ AI analysis completed successfully');
        return validatedAnalysis;
      }

      console.warn('⚠️ AI response did not contain valid JSON, using fallback');
      return ShouldIApplyPrompts.getFallbackAnalysis(input);

    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      
      // Return fallback analysis on error
      return ShouldIApplyPrompts.getFallbackAnalysis(input);
    }
  }

  /**
   * Validate and sanitize AI analysis result
   */
  private static validateAnalysisResult(analysis: any): JobAnalysisResult {
    // Ensure match score is within valid range
    const matchScore = Math.min(100, Math.max(0, Number(analysis.matchScore) || 50));
    
    // Validate recommendation level
    const validRecommendations = ['strong', 'good', 'fair', 'poor'];
    const recommendation = validRecommendations.includes(analysis.recommendation) 
      ? analysis.recommendation 
      : this.getRecommendationFromScore(matchScore);

    // Ensure arrays are valid
    const strengths = Array.isArray(analysis.strengths) 
      ? analysis.strengths.slice(0, 5) // Limit to 5 items
      : ['You bring valuable experience to this role'];

    const skillGaps = Array.isArray(analysis.skillGaps) 
      ? analysis.skillGaps.slice(0, 4) // Limit to 4 items
      : ['Consider developing additional relevant skills'];

    const advice = Array.isArray(analysis.advice) 
      ? analysis.advice.slice(0, 5) // Limit to 5 items
      : ['Tailor your application to highlight relevant experience'];

    const localInsights = Array.isArray(analysis.localInsights) 
      ? analysis.localInsights.slice(0, 3) // Limit to 3 items
      : undefined;

    return {
      matchScore,
      recommendation: recommendation as 'strong' | 'good' | 'fair' | 'poor',
      shouldApply: matchScore >= 45, // Apply threshold
      summary: typeof analysis.summary === 'string' 
        ? analysis.summary.substring(0, 500) // Limit summary length
        : `This appears to be a ${recommendation} match with a ${matchScore}% compatibility score.`,
      strengths,
      skillGaps,
      advice,
      localInsights
    };
  }

  /**
   * Determine recommendation level from match score
   */
  private static getRecommendationFromScore(score: number): 'strong' | 'good' | 'fair' | 'poor' {
    if (score >= 80) return 'strong';
    if (score >= 65) return 'good';
    if (score >= 45) return 'fair';
    return 'poor';
  }

  /**
   * Convert analysis result to legacy format for backward compatibility
   */
  static convertToLegacyFormat(analysis: JobAnalysisResult): any {
    return {
      success: true,
      recommendation: analysis.recommendation,
      shouldApply: analysis.shouldApply,
      message: analysis.summary,
      score: Math.round(analysis.matchScore / 20), // Convert to 0-5 scale
      maxScore: 5,
      reasons: analysis.strengths,
      analysis: {
        matchPercentage: analysis.matchScore,
        strengthAreas: analysis.strengths,
        tips: analysis.advice,
        skillGaps: analysis.skillGaps,
        localInsights: analysis.localInsights
      }
    };
  }

  /**
   * Generate application tips based on analysis
   */
  static generateApplicationTips(analysis: JobAnalysisResult): string[] {
    const tips: string[] = [...analysis.advice];

    // Add specific tips based on match score
    if (analysis.matchScore >= 80) {
      tips.push('You\'re a strong candidate - apply with confidence!');
    } else if (analysis.matchScore >= 65) {
      tips.push('Highlight your relevant experience in your application');
    } else if (analysis.matchScore >= 45) {
      tips.push('Consider addressing skill gaps in your cover letter');
    } else {
      tips.push('Focus on transferable skills and willingness to learn');
    }

    // Add local insights as tips if available
    if (analysis.localInsights) {
      tips.push(...analysis.localInsights);
    }

    return tips.slice(0, 6); // Limit to 6 tips total
  }
}
