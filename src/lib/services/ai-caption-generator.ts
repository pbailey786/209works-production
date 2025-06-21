import { openai } from '@/lib/openai';
import { Job } from '@/components/ui/card';
import { getDomainConfig } from '@/lib/domain/config';

/**
 * AI-Powered Instagram Caption Generator
 * Creates engaging, optimized captions for job post social media promotion
 */


export interface CaptionOptions {
  tone?: 'professional' | 'casual' | 'energetic' | 'urgent' | 'friendly';
  length?: 'short' | 'medium' | 'long';
  includeEmojis?: boolean;
  includeCTA?: boolean;
  customHashtags?: string[];
  targetAudience?: 'recent_graduates' | 'experienced_professionals' | 'career_changers' | 'general';
  domain?: string;
}

export interface CaptionResult {
  caption: string;
  hashtags: string[];
  estimatedReach: number;
  engagementTips: string[];
}

export class AICaptionGenerator {
  private defaultHashtags = [
    '209Jobs',
    '209Works', 
    'Hiring',
    'LocalJobs',
    'JobAlert',
    'NowHiring',
    'CareerOpportunity',
    'CentralValley'
  ];

  /**
   * Generate an AI-powered Instagram caption for a job
   */
  async generateJobCaption(
    job: Job,
    options: CaptionOptions = {}
  ): Promise<CaptionResult> {
    const {
      tone = 'professional',
      length = 'medium',
      includeEmojis = true,
      includeCTA = true,
      customHashtags = [],
      targetAudience = 'general',
      domain = '209.works'
    } = options;

    try {
      const domainConfig = getDomainConfig(domain);
      
      const prompt = this.buildCaptionPrompt(job, {
        tone,
        length,
        includeEmojis,
        includeCTA,
        targetAudience,
        domain,
        domainConfig
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert social media manager specializing in job promotion and career content. Create engaging, professional Instagram captions that drive applications and engagement.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const aiCaption = response.choices[0]?.message?.content || '';
      
      // Parse the AI response and extract caption
      const caption = this.processCaptionResponse(aiCaption, job, options);
      
      // Generate hashtags
      const hashtags = this.generateHashtags(job, customHashtags, domain);
      
      // Estimate reach and provide tips
      const estimatedReach = this.estimateReach(job, hashtags.length);
      const engagementTips = this.generateEngagementTips(job, tone);

      return {
        caption,
        hashtags,
        estimatedReach,
        engagementTips
      };

    } catch (error) {
      console.error('Error generating AI caption:', error);
      
      // Fallback to template-based caption
      return this.generateTemplateCaption(job, options);
    }
  }

  /**
   * Build the AI prompt for caption generation
   */
  private buildCaptionPrompt(
    job: Job,
    options: CaptionOptions & { domainConfig?: any }
  ): string {
    const { tone, length, includeEmojis, includeCTA, targetAudience, domain, domainConfig } = options;
    
    const lengthGuide = {
      short: '50-100 words',
      medium: '100-150 words', 
      long: '150-200 words'
    };

    const audienceContext = {
      recent_graduates: 'Target recent college graduates and entry-level candidates',
      experienced_professionals: 'Target experienced professionals and senior-level candidates',
      career_changers: 'Target people looking to change careers or industries',
      general: 'Target a broad audience of job seekers'
    };

    return `Create an engaging Instagram caption for this job posting:

JOB DETAILS:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Job Type: ${job.jobType.replace('_', ' ')}
- Salary: ${job.salaryMin && job.salaryMax ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}` : 'Competitive'}
- Description: ${job.description.substring(0, 300)}...

REQUIREMENTS:
- Tone: ${tone}
- Length: ${lengthGuide[length || 'medium']}
- Include emojis: ${includeEmojis ? 'Yes' : 'No'}
- Include call-to-action: ${includeCTA ? 'Yes' : 'No'}
- Target audience: ${audienceContext[targetAudience || 'general']}
- Domain: ${domain}
- Regional focus: ${domainConfig?.region || 'Central Valley, California'}

GUIDELINES:
1. Start with an attention-grabbing hook
2. Highlight the most compelling aspects of the job
3. Include relevant benefits and company culture if mentioned
4. Use line breaks for readability
5. End with a strong call-to-action if requested
6. Keep it authentic and conversational
7. Include the domain name naturally
8. Focus on local/regional appeal for ${domainConfig?.region || 'Central Valley'}

Please provide ONLY the caption text, without hashtags (hashtags will be added separately).`;
  }

  /**
   * Process and clean the AI-generated caption
   */
  private processCaptionResponse(
    aiCaption: string,
    job: Job,
    options: CaptionOptions
  ): string {
    let caption = aiCaption.trim();
    
    // Remove any hashtags that might have been included
    caption = caption.replace(/#\w+/g, '').trim();
    
    // Ensure proper line breaks
    caption = caption.replace(/\n{3,}/g, '\n\n');
    
    // Add final CTA if not present and requested
    if (options.includeCTA && !caption.toLowerCase().includes('apply')) {
      const domain = options.domain || '209.works';
      caption += `\n\nApply now on ${domain}! 🔗`;
    }

    return caption;
  }

  /**
   * Generate template-based caption as fallback
   */
  private generateTemplateCaption(
    job: Job,
    options: CaptionOptions
  ): CaptionResult {
    const { tone = 'professional', includeEmojis = true, domain = '209.works' } = options;
    
    const emoji = includeEmojis;
    const urgencyEmoji = emoji ? '🚨 ' : '';
    const locationEmoji = emoji ? '📍 ' : '';
    const moneyEmoji = emoji ? '💰 ' : '';
    const workEmoji = emoji ? '💼 ' : '';

    let caption = '';

    if (tone === 'energetic' || tone === 'urgent') {
      caption = `${urgencyEmoji}NEW JOB ALERT! ${urgencyEmoji}

${job.title} at ${job.company}
${locationEmoji}${job.location}
${workEmoji}${job.jobType.replace('_', ' ').toUpperCase()}`;
    } else if (tone === 'casual' || tone === 'friendly') {
      caption = `Hey job seekers! ${emoji ? '👋 ' : ''}

Great opportunity at ${job.company}:
${job.title}
${locationEmoji}${job.location}`;
    } else {
      caption = `${job.title}

${job.company} is seeking qualified candidates for this ${job.jobType.replace('_', ' ')} position in ${job.location}.`;
    }

    // Add salary if available
    if (job.salaryMin && job.salaryMax) {
      caption += `\n${moneyEmoji}$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`;
    }

    // Add description snippet
    const descSnippet = job.description.substring(0, 100).trim();
    caption += `\n\n${descSnippet}...`;

    // Add CTA
    if (options.includeCTA !== false) {
      caption += `\n\nApply today on ${domain}!`;
    }

    const hashtags = this.generateHashtags(job, options.customHashtags || [], domain);
    
    return {
      caption,
      hashtags,
      estimatedReach: this.estimateReach(job, hashtags.length),
      engagementTips: this.generateEngagementTips(job, tone)
    };
  }

  /**
   * Generate relevant hashtags for the job
   */
  private generateHashtags(
    job: Job,
    customHashtags: string[] = [],
    domain: string = '209.works'
  ): string[] {
    const hashtags = [...this.defaultHashtags];
    
    // Add domain-specific hashtags
    if (domain.includes('209')) {
      hashtags.push('CentralValley', 'Modesto', 'Stockton', 'Fresno');
    } else if (domain.includes('916')) {
      hashtags.push('Sacramento', 'SacJobs', 'NorCal');
    } else if (domain.includes('510')) {
      hashtags.push('EastBay', 'Oakland', 'Berkeley', 'BayAreaJobs');
    }

    // Add location-based hashtags
    const locationWords = job.location.split(/[\s,]+/);
    locationWords.forEach(word => {
      if (word.length > 2) {
        hashtags.push(word.replace(/[^a-zA-Z0-9]/g, '') + 'Jobs');
      }
    });

    // Add industry/role hashtags
    const title = job.title.toLowerCase();
    
    if (title.includes('engineer') || title.includes('developer') || title.includes('tech')) {
      hashtags.push('TechJobs', 'Engineering', 'Developer', 'Software');
    }
    
    if (title.includes('manager') || title.includes('director')) {
      hashtags.push('Management', 'Leadership', 'Executive');
    }
    
    if (title.includes('sales') || title.includes('marketing')) {
      hashtags.push('SalesJobs', 'Marketing', 'Business');
    }
    
    if (title.includes('nurse') || title.includes('medical') || title.includes('healthcare')) {
      hashtags.push('Healthcare', 'Medical', 'Nursing');
    }

    // Add job type hashtags
    if (job.isRemote) {
      hashtags.push('RemoteWork', 'WorkFromHome');
    }
    
    if (job.jobType === 'part_time') {
      hashtags.push('PartTime', 'FlexibleWork');
    } else if (job.jobType === 'full_time') {
      hashtags.push('FullTime');
    } else if (job.jobType === 'contract') {
      hashtags.push('Contract', 'Freelance');
    } else if (job.jobType === 'internship') {
      hashtags.push('Internship', 'EntryLevel');
    }

    // Add custom hashtags
    hashtags.push(...customHashtags);

    // Remove duplicates and format
    const uniqueHashtags = [...new Set(hashtags)]
      .map(tag => tag.replace(/[^a-zA-Z0-9]/g, ''))
      .filter(tag => tag.length > 1)
      .slice(0, 25); // Instagram limit is 30, leave room for additional tags

    return uniqueHashtags;
  }

  /**
   * Estimate potential reach based on job and hashtag metrics
   */
  private estimateReach(job: Job, hashtagCount: number): number {
    let baseReach = 100; // Base followers

    // Adjust for job type
    if (job.jobType === 'full_time') baseReach += 50;
    if (job.isRemote) baseReach += 75;

    // Adjust for salary range
    if (job.salaryMin && job.salaryMin > 75000) baseReach += 100;

    // Adjust for hashtag count
    baseReach += hashtagCount * 10;

    // Add randomness for realistic estimates
    const variance = Math.random() * 0.4 + 0.8; // 80-120% of base
    
    return Math.round(baseReach * variance);
  }

  /**
   * Generate engagement tips
   */
  private generateEngagementTips(job: Job, tone: string): string[] {
    const tips = [
      'Post during peak hours (11 AM - 1 PM or 7-9 PM)',
      'Respond to comments quickly to boost engagement',
      'Share to Instagram Stories for additional reach'
    ];

    if (tone === 'energetic') {
      tips.push('Use engaging visuals with bright colors');
    }

    if (job.salaryMin && job.salaryMin > 80000) {
      tips.push('Highlight competitive salary in graphics');
    }

    if (job.isRemote) {
      tips.push('Target remote work hashtags and communities');
    }

    return tips;
  }

  /**
   * Generate multiple caption variations
   */
  async generateCaptionVariations(
    job: Job,
    options: CaptionOptions = {}
  ): Promise<CaptionResult[]> {
    const tones: Array<CaptionOptions['tone']> = ['professional', 'casual', 'energetic'];
    const variations: CaptionResult[] = [];

    for (const tone of tones) {
      try {
        const variation = await this.generateJobCaption(job, {
          ...options,
          tone
        });
        variations.push(variation);
      } catch (error) {
        console.error(`Error generating ${tone} caption:`, error);
      }
    }

    return variations;
  }
}

export default AICaptionGenerator;