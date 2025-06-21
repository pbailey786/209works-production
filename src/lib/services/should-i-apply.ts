/**
 * Should I Apply Analysis Service
 * AI-powered job application recommendation system
 */

import { getChatCompletion } from '@/lib/openai';

export interface ShouldIApplyRequest {
  jobTitle: string;
  jobDescription: string;
  jobRequirements: string[];
  company: string;
  location: string;
  salary?: string;
  userProfile: {
    skills: string[];
    experience: string;
    education: string;
    preferences: {
      jobTypes: string[];
      locations: string[];
      salaryRange?: { min: number; max: number };
    };
  };
  resumeText?: string;
}

export interface ShouldIApplyResponse {
  shouldApply: boolean;
  matchScore: number; // 0-100
  analysis: {
    strengths: string[];
    weaknesses: string[];
    missingSkills: string[];
    recommendations: string[];
  };
  reasoning: string;
  confidence: number; // 0-100
  timeToApply: 'immediate' | 'soon' | 'later' | 'never';
  applicationStrategy: {
    coverLetterTips: string[];
    interviewPrep: string[];
    skillsToHighlight: string[];
  };
}

export class ShouldIApplyAnalysisService {
  /**
   * Analyze if a user should apply to a specific job
   */
  static async analyzeJobMatch(request: ShouldIApplyRequest): Promise<ShouldIApplyResponse> {
    try {
      // Prepare the analysis prompt
      const prompt = this.buildAnalysisPrompt(request);
      
      // Get AI analysis
      const aiResponse = await getChatCompletion([
        {
          role: 'system',
          content: `You are an expert career counselor and job matching specialist. Analyze job opportunities and provide detailed, actionable advice about whether someone should apply. Always provide specific, practical recommendations.`
        },
        {
          role: 'user',
          content: prompt
        }
      ]);

      // Parse the AI response
      const analysis = this.parseAIResponse(aiResponse);
      
      // Calculate additional metrics
      const matchScore = this.calculateMatchScore(request);
      const confidence = this.calculateConfidence(request, analysis);
      
      return {
        ...analysis,
        matchScore,
        confidence
      };
    } catch (error) {
      console.error('Error in job match analysis:', error);
      
      // Fallback to rule-based analysis
      return this.fallbackAnalysis(request);
    }
  }

  /**
   * Build the analysis prompt for AI
   */
  private static buildAnalysisPrompt(request: ShouldIApplyRequest): string {
    const {
      jobTitle,
      jobDescription,
      jobRequirements,
      company,
      location,
      salary,
      userProfile,
      resumeText
    } = request;

    return `
Please analyze whether this person should apply to this job opportunity:

JOB DETAILS:
- Title: ${jobTitle}
- Company: ${company}
- Location: ${location}
- Salary: ${salary || 'Not specified'}
- Description: ${jobDescription}
- Requirements: ${jobRequirements.join(', ')}

CANDIDATE PROFILE:
- Skills: ${userProfile.skills.join(', ')}
- Experience: ${userProfile.experience}
- Education: ${userProfile.education}
- Preferred Job Types: ${userProfile.preferences.jobTypes.join(', ')}
- Preferred Locations: ${userProfile.preferences.locations.join(', ')}
- Salary Range: ${userProfile.preferences.salaryRange ? `$${userProfile.preferences.salaryRange.min} - $${userProfile.preferences.salaryRange.max}` : 'Not specified'}

${resumeText ? `RESUME CONTENT:\n${resumeText}` : ''}

Please provide your analysis in the following JSON format:
{
  "shouldApply": boolean,
  "reasoning": "detailed explanation of your recommendation",
  "timeToApply": "immediate|soon|later|never",
  "analysis": {
    "strengths": ["strength1", "strength2", ...],
    "weaknesses": ["weakness1", "weakness2", ...],
    "missingSkills": ["skill1", "skill2", ...],
    "recommendations": ["recommendation1", "recommendation2", ...]
  },
  "applicationStrategy": {
    "coverLetterTips": ["tip1", "tip2", ...],
    "interviewPrep": ["prep1", "prep2", ...],
    "skillsToHighlight": ["skill1", "skill2", ...]
  }
}

Focus on:
1. Skills alignment with job requirements
2. Experience level match
3. Location and salary preferences
4. Career growth potential
5. Company culture fit
6. Specific actionable advice
`;
  }

  /**
   * Parse AI response into structured format
   */
  private static parseAIResponse(aiResponse: string): Partial<ShouldIApplyResponse> {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }
      
      // Fallback parsing if JSON is not found
      return this.parseTextResponse(aiResponse);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.getDefaultResponse();
    }
  }

  /**
   * Parse text response when JSON parsing fails
   */
  private static parseTextResponse(response: string): Partial<ShouldIApplyResponse> {
    const shouldApply = response.toLowerCase().includes('should apply') || 
                       response.toLowerCase().includes('recommend applying');
    
    const timeToApply = response.toLowerCase().includes('immediately') ? 'immediate' :
                       response.toLowerCase().includes('soon') ? 'soon' :
                       response.toLowerCase().includes('later') ? 'later' : 'never';

    return {
      shouldApply,
      reasoning: response,
      timeToApply,
      analysis: {
        strengths: [],
        weaknesses: [],
        missingSkills: [],
        recommendations: []
      },
      applicationStrategy: {
        coverLetterTips: [],
        interviewPrep: [],
        skillsToHighlight: []
      }
    };
  }

  /**
   * Calculate match score based on various factors
   */
  private static calculateMatchScore(request: ShouldIApplyRequest): number {
    let score = 0;
    let maxScore = 0;

    // Skills match (40% weight)
    const skillsWeight = 40;
    const userSkills = request.userProfile.skills.map(s => s.toLowerCase());
    const jobRequirements = request.jobRequirements.map(r => r.toLowerCase());
    
    const matchingSkills = userSkills.filter(skill => 
      jobRequirements.some(req => req.includes(skill) || skill.includes(req))
    );
    
    const skillsScore = jobRequirements.length > 0 ? 
      (matchingSkills.length / jobRequirements.length) * skillsWeight : 0;
    score += skillsScore;
    maxScore += skillsWeight;

    // Location preference (20% weight)
    const locationWeight = 20;
    const preferredLocations = request.userProfile.preferences.locations.map(l => l.toLowerCase());
    const jobLocation = request.location.toLowerCase();
    
    const locationMatch = preferredLocations.some(loc => 
      jobLocation.includes(loc) || loc.includes(jobLocation)
    );
    
    if (locationMatch) {
      score += locationWeight;
    }
    maxScore += locationWeight;

    // Job type preference (20% weight)
    const jobTypeWeight = 20;
    const preferredTypes = request.userProfile.preferences.jobTypes.map(t => t.toLowerCase());
    const jobTitle = request.jobTitle.toLowerCase();
    
    const typeMatch = preferredTypes.some(type => 
      jobTitle.includes(type) || type.includes(jobTitle)
    );
    
    if (typeMatch) {
      score += jobTypeWeight;
    }
    maxScore += jobTypeWeight;

    // Salary match (20% weight)
    const salaryWeight = 20;
    if (request.salary && request.userProfile.preferences.salaryRange) {
      // Simple salary parsing (this could be more sophisticated)
      const salaryMatch = /\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/g;
      const salaryNumbers = request.salary.match(salaryMatch);
      
      if (salaryNumbers && salaryNumbers.length > 0) {
        const jobSalary = parseInt(salaryNumbers[0].replace(/[$,]/g, ''));
        const { min, max } = request.userProfile.preferences.salaryRange;
        
        if (jobSalary >= min && jobSalary <= max) {
          score += salaryWeight;
        } else if (jobSalary >= min * 0.8) {
          score += salaryWeight * 0.5;
        }
      }
    }
    maxScore += salaryWeight;

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Calculate confidence level in the recommendation
   */
  private static calculateConfidence(
    request: ShouldIApplyRequest, 
    analysis: Partial<ShouldIApplyResponse>
  ): number {
    let confidence = 50; // Base confidence

    // Increase confidence based on data completeness
    if (request.resumeText) confidence += 20;
    if (request.userProfile.skills.length > 3) confidence += 10;
    if (request.userProfile.experience) confidence += 10;
    if (request.jobRequirements.length > 0) confidence += 10;

    // Adjust based on analysis quality
    if (analysis.analysis?.strengths && analysis.analysis.strengths.length > 2) confidence += 10;
    if (analysis.analysis?.recommendations && analysis.analysis.recommendations.length > 2) confidence += 10;

    return Math.min(100, confidence);
  }

  /**
   * Fallback analysis when AI is unavailable
   */
  private static fallbackAnalysis(request: ShouldIApplyRequest): ShouldIApplyResponse {
    const matchScore = this.calculateMatchScore(request);
    const shouldApply = matchScore >= 60;
    
    return {
      shouldApply,
      matchScore,
      reasoning: `Based on automated analysis, your profile has a ${matchScore}% match with this position. ${shouldApply ? 'This appears to be a good opportunity for you.' : 'This position may not be the best fit for your current profile.'}`,
      confidence: 70,
      timeToApply: shouldApply ? (matchScore >= 80 ? 'immediate' : 'soon') : 'later',
      analysis: {
        strengths: ['Profile analysis completed'],
        weaknesses: ['Detailed AI analysis unavailable'],
        missingSkills: [],
        recommendations: ['Consider reviewing job requirements in detail']
      },
      applicationStrategy: {
        coverLetterTips: ['Highlight relevant experience', 'Address key requirements'],
        interviewPrep: ['Research the company', 'Prepare examples of relevant work'],
        skillsToHighlight: request.userProfile.skills.slice(0, 5)
      }
    };
  }

  /**
   * Get default response structure
   */
  private static getDefaultResponse(): Partial<ShouldIApplyResponse> {
    return {
      shouldApply: false,
      reasoning: 'Unable to complete analysis',
      timeToApply: 'later',
      analysis: {
        strengths: [],
        weaknesses: [],
        missingSkills: [],
        recommendations: []
      },
      applicationStrategy: {
        coverLetterTips: [],
        interviewPrep: [],
        skillsToHighlight: []
      }
    };
  }
}
