/**
 * Enhanced JobsGPT with Career Transition Intelligence
 * Integrates career transition analytics directly into the chat experience
 */

import { processWithAI } from '@/lib/ai';
import { CareerTransitionAnalytics } from '@/lib/ai/career-transition-analytics';
import { prisma } from '@/lib/database/prisma';

export interface CareerTransitionSuggestion {
  type: 'career_transition';
  fromIndustry: string;
  toIndustry: string;
  transitionCount: number;
  averageSalaryIncrease: number;
  timeToTransition: string;
  successRate: number;
  topReasons: string[];
  actionSteps: string[];
  trainingPrograms?: {
    name: string;
    provider: string;
    duration: string;
    cost: string;
    description: string;
  }[];
}

export interface JobsGPTResponse {
  message: string;
  jobs?: any[];
  careerInsights?: CareerTransitionSuggestion[];
  trainingOpportunities?: any[];
  nextSteps?: string[];
  followUpQuestions?: string[];
}

export class EnhancedJobsGPT {
  /**
   * Generate intelligent response with career transition insights
   */
  static async generateResponse(
    userMessage: string,
    userId: string,
    conversationHistory: any[] = []
  ): Promise<JobsGPTResponse> {
    // Get user profile for context
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        jobSeekerProfile: true,
        searchHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        jobApplications: {
          include: { job: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    // Analyze the user's intent and current situation
    const intent = await this.analyzeUserIntent(userMessage, user, conversationHistory);
    
    let response: JobsGPTResponse = {
      message: '',
      jobs: [],
      careerInsights: [],
      trainingOpportunities: [],
      nextSteps: [],
      followUpQuestions: [],
    };

    // Handle different types of career-related queries
    switch (intent.type) {
      case 'career_change':
        response = await this.handleCareerChangeQuery(userMessage, user, intent);
        break;
      
      case 'skill_development':
        response = await this.handleSkillDevelopmentQuery(userMessage, user, intent);
        break;
      
      case 'salary_inquiry':
        response = await this.handleSalaryInquiry(userMessage, user, intent);
        break;
      
      case 'job_search':
        response = await this.handleJobSearchQuery(userMessage, user, intent);
        break;
      
      default:
        response = await this.handleGeneralQuery(userMessage, user, conversationHistory);
    }

    // Log the interaction for learning
    await this.logInteraction(userId, userMessage, response);

    return response;
  }

  /**
   * Analyze user intent from their message
   */
  private static async analyzeUserIntent(
    userMessage: string,
    user: any,
    conversationHistory: any[]
  ) {
    const prompt = `
Analyze this user message and determine their intent:

User Message: "${userMessage}"

Current Job: ${user?.jobSeekerProfile?.currentJobTitle || 'Unknown'}
Experience: ${user?.jobSeekerProfile?.experience || 0} years
Recent Searches: ${user?.searchHistory?.map((s: any) => s.query).join(', ') || 'None'}

Classify the intent as one of:
- career_change: Wants to switch industries or roles
- skill_development: Asking about skills needed or training
- salary_inquiry: Asking about salary/compensation
- job_search: Looking for specific jobs
- general: General career advice or other

Also extract:
- targetIndustry: What industry they're interested in
- currentIndustry: Their current industry (if mentioned)
- specificRole: Any specific job title mentioned
- urgency: high, medium, low

Return as JSON only.
    `;

    try {
      const response = await processWithAI(prompt, {
        systemPrompt: 'You are an expert career counselor analyzing user intent.',
        maxTokens: 300,
        temperature: 0.1,
        context: 'Intent Analysis',
      });

      const jsonMatch = response.match(/{[\s\S]*}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Intent analysis failed:', error);
    }

    // Fallback intent
    return {
      type: 'general',
      targetIndustry: null,
      currentIndustry: null,
      specificRole: null,
      urgency: 'medium',
    };
  }

  /**
   * Handle career change queries with transition intelligence
   */
  private static async handleCareerChangeQuery(
    userMessage: string,
    user: any,
    intent: any
  ): Promise<JobsGPTResponse> {
    const currentIndustry = this.extractIndustry(user?.jobSeekerProfile?.currentJobTitle);
    const targetIndustry = intent.targetIndustry || 'Technology'; // Default suggestion

    // Get transition data
    const transitions = await CareerTransitionAnalytics.analyzeCareerTransitions();
    const relevantTransition = transitions.find(
      t => t.fromIndustry === currentIndustry && t.toIndustry === targetIndustry
    );

    // Get talent pool analysis
    const talentPool = await CareerTransitionAnalytics.analyzeTalentPool(
      currentIndustry,
      targetIndustry
    );

    // Generate personalized response
    const responsePrompt = `
User wants to transition from ${currentIndustry} to ${targetIndustry}.

Transition Data:
- ${relevantTransition?.transitionCount || 0} people have made this transition
- Average salary increase: ${relevantTransition?.averageSalaryIncrease || 0}%
- Success rate: ${relevantTransition?.successRate || 0.7}
- Time needed: ${relevantTransition?.timeToTransition || '6-12 months'}

User's Current Situation:
- Current role: ${user?.jobSeekerProfile?.currentJobTitle || 'Unknown'}
- Experience: ${user?.jobSeekerProfile?.experience || 0} years
- Skills: ${user?.jobSeekerProfile?.skills?.join(', ') || 'None listed'}

Generate a friendly, encouraging response (2-3 sentences) that:
1. Acknowledges their career change goal
2. Shares the positive transition data
3. Gives 1-2 specific next steps
4. Ends with an encouraging note

Keep it conversational and supportive!
    `;

    const message = await processWithAI(responsePrompt, {
      systemPrompt: 'You are a supportive career coach helping someone with a career transition.',
      maxTokens: 200,
      temperature: 0.7,
      context: 'Career Change Response',
    });

    // Generate career insights
    const careerInsights: CareerTransitionSuggestion[] = relevantTransition ? [{
      type: 'career_transition',
      fromIndustry: currentIndustry,
      toIndustry: targetIndustry,
      transitionCount: relevantTransition.transitionCount,
      averageSalaryIncrease: relevantTransition.averageSalaryIncrease,
      timeToTransition: relevantTransition.timeToTransition,
      successRate: relevantTransition.successRate,
      topReasons: relevantTransition.topReasons,
      actionSteps: this.generateActionSteps(currentIndustry, targetIndustry),
      trainingPrograms: this.getTrainingPrograms(targetIndustry),
    }] : [];

    return {
      message,
      careerInsights,
      nextSteps: this.generateNextSteps(currentIndustry, targetIndustry),
      followUpQuestions: [
        'What specific role in ' + targetIndustry + ' interests you most?',
        'Would you like to see training programs for this transition?',
        'Want to know about salary expectations?',
      ],
    };
  }

  /**
   * Handle skill development queries
   */
  private static async handleSkillDevelopmentQuery(
    userMessage: string,
    user: any,
    intent: any
  ): Promise<JobsGPTResponse> {
    const currentSkills = user?.jobSeekerProfile?.skills || [];
    const targetRole = intent.specificRole || intent.targetIndustry;

    // Generate skill gap analysis
    const skillGapPrompt = `
User's current skills: ${currentSkills.join(', ')}
Target role/industry: ${targetRole}

What skills are they missing for this transition? Provide:
1. Top 3 most important missing skills
2. Learning timeline for each
3. Best resources (courses, certifications)
4. Difficulty level (beginner, intermediate, advanced)

Format as JSON with skills array.
    `;

    try {
      const skillAnalysis = await processWithAI(skillGapPrompt, {
        systemPrompt: 'You are a skills assessment expert.',
        maxTokens: 400,
        temperature: 0.3,
        context: 'Skill Gap Analysis',
      });

      const message = `Based on your current skills, here's what you need to focus on for ${targetRole}! 🎯 I've identified the key gaps and can help you create a learning plan.`;

      return {
        message,
        trainingOpportunities: this.getTrainingPrograms(targetRole),
        nextSteps: [
          'Start with the highest-priority skill',
          'Set aside 1-2 hours daily for learning',
          'Build a portfolio project to demonstrate skills',
        ],
        followUpQuestions: [
          'Which skill would you like to start with?',
          'Do you prefer online courses or in-person training?',
          'What\'s your timeline for this transition?',
        ],
      };
    } catch (error) {
      return {
        message: 'I can help you identify the skills you need! What specific role or industry are you targeting?',
        followUpQuestions: [
          'What job title are you aiming for?',
          'What skills do you already have?',
          'How much time can you dedicate to learning?',
        ],
      };
    }
  }

  /**
   * Handle salary inquiries with market data
   */
  private static async handleSalaryInquiry(
    userMessage: string,
    user: any,
    intent: any
  ): Promise<JobsGPTResponse> {
    const targetRole = intent.specificRole || intent.targetIndustry;
    const currentSalary = user?.jobSeekerProfile?.currentSalary || 0;

    // Get salary data (in a real implementation, this would come from market data)
    const salaryData = this.getSalaryData(targetRole);

    const message = `For ${targetRole} in the 209 area, you're looking at ${salaryData.range} 💰 ${
      currentSalary > 0 && salaryData.average > currentSalary 
        ? `That's about a ${Math.round(((salaryData.average - currentSalary) / currentSalary) * 100)}% increase from your current salary!`
        : 'Great earning potential in this field!'
    }`;

    return {
      message,
      nextSteps: [
        'Research specific companies in the 209 area',
        'Highlight relevant experience in applications',
        'Consider negotiation strategies',
      ],
      followUpQuestions: [
        'Want to see jobs in this salary range?',
        'Interested in companies known for good pay?',
        'Need tips for salary negotiation?',
      ],
    };
  }

  /**
   * Handle regular job search queries
   */
  private static async handleJobSearchQuery(
    userMessage: string,
    user: any,
    intent: any
  ): Promise<JobsGPTResponse> {
    // This would integrate with the existing job search functionality
    const message = `Let me find some great opportunities for you! 🔍`;

    return {
      message,
      jobs: [], // Would be populated by job search
      followUpQuestions: [
        'Want to filter by salary range?',
        'Interested in remote opportunities?',
        'Need help with your application?',
      ],
    };
  }

  /**
   * Handle general queries
   */
  private static async handleGeneralQuery(
    userMessage: string,
    user: any,
    conversationHistory: any[]
  ): Promise<JobsGPTResponse> {
    const message = await processWithAI(userMessage, {
      systemPrompt: 'You are a friendly career advisor helping people in the 209 area find better opportunities.',
      maxTokens: 150,
      temperature: 0.8,
      context: 'General Career Advice',
    });

    return {
      message,
      followUpQuestions: [
        'What type of work are you most interested in?',
        'Are you looking to change careers?',
        'Want to explore opportunities in the 209 area?',
      ],
    };
  }

  // Helper methods

  private static extractIndustry(jobTitle?: string): string {
    if (!jobTitle) return 'Other';
    
    const industryKeywords = {
      'Technology': ['software', 'developer', 'engineer', 'programmer', 'tech', 'IT'],
      'Healthcare': ['nurse', 'doctor', 'medical', 'healthcare', 'clinical'],
      'Retail': ['cashier', 'sales associate', 'retail', 'store', 'customer service'],
      'Finance': ['accountant', 'financial', 'banker', 'analyst', 'finance'],
      'Education': ['teacher', 'professor', 'educator', 'academic', 'instructor'],
      'Manufacturing': ['operator', 'assembly', 'production', 'factory', 'warehouse'],
    };

    const title = jobTitle.toLowerCase();
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => title.includes(keyword))) {
        return industry;
      }
    }

    return 'Other';
  }

  private static generateActionSteps(fromIndustry: string, toIndustry: string): string[] {
    const steps = [
      'Update your resume to highlight transferable skills',
      'Start networking with people in ' + toIndustry,
      'Research companies in the 209 area hiring for ' + toIndustry,
    ];

    // Add industry-specific steps
    if (toIndustry === 'Technology') {
      steps.push('Build a portfolio of coding projects');
      steps.push('Consider a coding bootcamp or online courses');
    } else if (toIndustry === 'Healthcare') {
      steps.push('Look into certification requirements');
      steps.push('Consider volunteer opportunities in healthcare');
    }

    return steps;
  }

  private static getTrainingPrograms(industry: string) {
    const programs = {
      'Technology': [
        {
          name: 'Full Stack Web Development',
          provider: 'San Joaquin Delta College',
          duration: '6 months',
          cost: '$3,500',
          description: 'Learn JavaScript, React, and Node.js',
        },
        {
          name: 'Google IT Support Certificate',
          provider: 'Coursera',
          duration: '3-6 months',
          cost: '$49/month',
          description: 'Entry-level IT support skills',
        },
      ],
      'Healthcare': [
        {
          name: 'Medical Assistant Program',
          provider: 'Carrington College',
          duration: '8 months',
          cost: '$15,000',
          description: 'Clinical and administrative skills',
        },
      ],
    };

    return programs[industry as keyof typeof programs] || [];
  }

  private static generateNextSteps(fromIndustry: string, toIndustry: string): string[] {
    return [
      'Research job requirements in ' + toIndustry,
      'Identify skill gaps and create learning plan',
      'Start networking in your target industry',
      'Update LinkedIn profile for new direction',
    ];
  }

  private static getSalaryData(role: string) {
    // Mock salary data - in production, this would come from real market data
    const salaryRanges = {
      'Software Developer': { min: 65000, max: 95000, average: 80000, range: '$65k-$95k' },
      'Nurse': { min: 70000, max: 90000, average: 80000, range: '$70k-$90k' },
      'Sales Representative': { min: 45000, max: 75000, average: 60000, range: '$45k-$75k' },
      'Customer Service': { min: 35000, max: 50000, average: 42500, range: '$35k-$50k' },
    };

    return salaryRanges[role as keyof typeof salaryRanges] || 
           { min: 40000, max: 60000, average: 50000, range: '$40k-$60k' };
  }

  private static async logInteraction(userId: string, userMessage: string, response: JobsGPTResponse) {
    try {
      await prisma.chatInteraction.create({
        data: {
          userId,
          userMessage,
          aiResponse: response.message,
          hasCareerInsights: (response.careerInsights?.length || 0) > 0,
          hasTrainingRecommendations: (response.trainingOpportunities?.length || 0) > 0,
          createdAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to log interaction:', error);
    }
  }
}
