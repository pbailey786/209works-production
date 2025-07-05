import { getONetClient } from './client';

interface JobEnhancementInput {
  title: string;
  location?: string;
  description?: string;
  salary?: string;
}

interface EnhancedJobData {
  title: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  salary: {
    min: number;
    max: number;
    display: string;
  } | null;
  benefits: string[];
  skills: string[];
}

// California region salary adjustments
const REGION_WAGE_MULTIPLIERS: Record<string, number> = {
  '209': 0.85,  // Central Valley - lower than state average
  '916': 0.95,  // Sacramento - slightly below state average
  '510': 1.15,  // East Bay - above state average
  'bay': 1.25,  // Bay Area - highest wages
  'default': 0.90, // Default for rural/unknown
};

// Market-based salary data for common jobs when O*NET fails
const MARKET_SALARY_DATA: Record<string, Record<string, { min: number; max: number; median: number }>> = {
  'hvac technician': {
    '209': { min: 25, max: 35, median: 28 },
    '916': { min: 28, max: 38, median: 32 },
    '510': { min: 32, max: 42, median: 36 },
    'bay': { min: 38, max: 48, median: 42 },
    'default': { min: 22, max: 32, median: 26 }
  },
  'warehouse worker': {
    '209': { min: 16, max: 22, median: 18 },
    '916': { min: 18, max: 24, median: 20 },
    '510': { min: 20, max: 26, median: 22 },
    'bay': { min: 24, max: 30, median: 26 },
    'default': { min: 15, max: 20, median: 17 }
  },
  'retail associate': {
    '209': { min: 16, max: 20, median: 17 },
    '916': { min: 17, max: 21, median: 18 },
    '510': { min: 18, max: 22, median: 19 },
    'bay': { min: 20, max: 24, median: 21 },
    'default': { min: 15, max: 18, median: 16 }
  },
  'customer service': {
    '209': { min: 17, max: 23, median: 19 },
    '916': { min: 19, max: 25, median: 21 },
    '510': { min: 21, max: 27, median: 23 },
    'bay': { min: 25, max: 31, median: 27 },
    'default': { min: 16, max: 21, median: 18 }
  }
};

export class JobEnhancer {
  private onetClient = getONetClient();

  async enhanceJobPosting(input: JobEnhancementInput): Promise<EnhancedJobData | null> {
    try {
      console.log('🔧 JobEnhancer: Starting enhancement for:', input.title);
      
      // Get O*NET data
      const onetData = await this.onetClient.getJobEnhancementData(input.title, input.location);
      
      if (!onetData) {
        console.log('🔧 JobEnhancer: No O*NET data returned');
        return null;
      }
      
      console.log('🔧 JobEnhancer: O*NET data found:', {
        occupationTitle: onetData.occupation?.title,
        tasksCount: onetData.tasks?.length || 0,
        skillsCount: onetData.skills?.length || 0
      });

      // Extract region from location for salary adjustment
      const regionCode = this.extractRegionCode(input.location);
      const wageMultiplier = REGION_WAGE_MULTIPLIERS[regionCode] || REGION_WAGE_MULTIPLIERS.default;

      // Process salary data
      const salary = this.processSalaryData(onetData.salary, wageMultiplier, input.salary, input.title, regionCode);

      // Generate enhanced responsibilities from O*NET tasks
      const responsibilities = this.enhanceResponsibilities(onetData.tasks);

      // Generate requirements based on skills and occupation
      const requirements = this.generateRequirements(onetData.skills, onetData.occupation.title);

      // Suggest appropriate benefits based on job level
      const benefits = this.suggestBenefits(salary?.min || 0, onetData.occupation.title);

      return {
        title: this.refineJobTitle(input.title, onetData.occupation.title),
        description: this.enhanceDescription(
          input.description || '', 
          onetData.occupation.description || ''
        ),
        responsibilities,
        requirements,
        salary,
        benefits,
        skills: onetData.skills.slice(0, 5), // Top 5 skills
      };
    } catch (error) {
      console.error('Job enhancement error:', error);
      return null;
    }
  }

  private extractRegionCode(location?: string): string {
    if (!location) return 'default';
    
    const locationLower = location.toLowerCase();
    if (locationLower.includes('209') || locationLower.includes('stockton') || locationLower.includes('modesto')) {
      return '209';
    } else if (locationLower.includes('916') || locationLower.includes('sacramento')) {
      return '916';
    } else if (locationLower.includes('510') || locationLower.includes('oakland') || locationLower.includes('fremont')) {
      return '510';
    } else if (locationLower.includes('bay area') || locationLower.includes('san francisco')) {
      return 'bay';
    }
    
    return 'default';
  }

  private processSalaryData(
    onetSalary: any, 
    regionMultiplier: number,
    userProvidedSalary?: string,
    jobTitle?: string,
    region?: string
  ): EnhancedJobData['salary'] {
    // If user provided specific salary, validate it
    if (userProvidedSalary) {
      const parsed = this.parseUserSalary(userProvidedSalary);
      if (parsed && jobTitle && region) {
        // Validate the salary range
        const validation = this.validateSalaryRange(parsed.max, jobTitle, region);
        
        if (validation.warningMessage) {
          console.warn('🚨 Salary validation warning:', validation.warningMessage);
          console.warn('📊 Market data:', validation.marketData);
        }
        
        // If unrealistic, suggest market-based range but still return user input
        if (!validation.isRealistic && validation.marketData) {
          console.warn('💡 Suggested salary range:', 
            `$${validation.marketData.min}-$${validation.marketData.max}/hour`);
        }
      }
      
      if (parsed) return parsed;
    }

    // Use O*NET data with regional adjustment
    if (onetSalary?.hourly?.median) {
      const adjustedMedian = Math.round(onetSalary.hourly.median * regionMultiplier);
      const adjustedLow = Math.round((onetSalary.hourly.low || adjustedMedian * 0.8) * regionMultiplier);
      const adjustedHigh = Math.round((onetSalary.hourly.high || adjustedMedian * 1.2) * regionMultiplier);
      
      return {
        min: adjustedLow,
        max: adjustedHigh,
        display: `$${adjustedLow}-$${adjustedHigh}/hour`,
      };
    } else if (onetSalary?.annual?.median) {
      const adjustedMedian = Math.round(onetSalary.annual.median * regionMultiplier);
      const adjustedLow = Math.round((onetSalary.annual.low || adjustedMedian * 0.8) * regionMultiplier);
      const adjustedHigh = Math.round((onetSalary.annual.high || adjustedMedian * 1.2) * regionMultiplier);
      
      return {
        min: Math.round(adjustedLow / 2080), // Convert to hourly
        max: Math.round(adjustedHigh / 2080),
        display: `$${(adjustedLow / 1000).toFixed(0)}k-$${(adjustedHigh / 1000).toFixed(0)}k/year`,
      };
    }

    // Fallback to market data if O*NET fails
    if (jobTitle && region) {
      const jobTitleLower = jobTitle.toLowerCase();
      let marketKey = '';
      
      // Find matching market data
      for (const key of Object.keys(MARKET_SALARY_DATA)) {
        if (jobTitleLower.includes(key.replace(' ', '')) || 
            jobTitleLower.includes(key.split(' ')[0])) {
          marketKey = key;
          break;
        }
      }
      
      if (marketKey) {
        const marketData = MARKET_SALARY_DATA[marketKey];
        const regionData = marketData[region] || marketData['default'];
        
        console.log('📊 Using market-based salary data for:', jobTitle);
        console.log('💰 Market range:', `$${regionData.min}-$${regionData.max}/hour`);
        
        return {
          min: regionData.min,
          max: regionData.max,
          display: `$${regionData.min}-$${regionData.max}/hour`,
        };
      }
    }

    return null;
  }

  private parseUserSalary(salary: string): EnhancedJobData['salary'] | null {
    // Parse various salary formats
    const hourlyMatch = salary.match(/\$?(\d+(?:\.\d+)?)\s*-?\s*\$?(\d+(?:\.\d+)?)?.*?(?:\/hour|\/hr|hourly)/i);
    if (hourlyMatch) {
      const min = parseFloat(hourlyMatch[1]);
      const max = parseFloat(hourlyMatch[2] || hourlyMatch[1]);
      return {
        min,
        max,
        display: `$${min}-$${max}/hour`,
      };
    }

    const annualMatch = salary.match(/\$?(\d+)k?\s*-?\s*\$?(\d+)?k?.*?(?:\/year|annual|salary)/i);
    if (annualMatch) {
      const min = parseInt(annualMatch[1]) * (annualMatch[1].includes('k') ? 1 : 1000);
      const max = parseInt(annualMatch[2] || annualMatch[1]) * (annualMatch[2]?.includes('k') ? 1 : 1000);
      return {
        min: Math.round(min / 2080),
        max: Math.round(max / 2080),
        display: `$${min / 1000}k-$${max / 1000}k/year`,
      };
    }

    return null;
  }

  private validateSalaryRange(salary: number, jobTitle: string, region: string): {
    isRealistic: boolean;
    suggestedRange: { min: number; max: number };
    warningMessage?: string;
    marketData?: { min: number; max: number; median: number };
  } {
    // Find matching job type in market data
    const jobTitleLower = jobTitle.toLowerCase();
    let marketKey = '';
    
    // Match job title to market data
    for (const key of Object.keys(MARKET_SALARY_DATA)) {
      if (jobTitleLower.includes(key.replace(' ', '')) || 
          jobTitleLower.includes(key.split(' ')[0])) {
        marketKey = key;
        break;
      }
    }
    
    // Special cases for common job patterns
    if (!marketKey) {
      if (jobTitleLower.includes('hvac') || jobTitleLower.includes('heating') || 
          jobTitleLower.includes('air conditioning') || jobTitleLower.includes('refrigeration')) {
        marketKey = 'hvac technician';
      } else if (jobTitleLower.includes('warehouse') || jobTitleLower.includes('picker') || 
                jobTitleLower.includes('packer')) {
        marketKey = 'warehouse worker';
      } else if (jobTitleLower.includes('retail') || jobTitleLower.includes('sales associate') || 
                jobTitleLower.includes('cashier')) {
        marketKey = 'retail associate';
      } else if (jobTitleLower.includes('customer') || jobTitleLower.includes('service') || 
                jobTitleLower.includes('support')) {
        marketKey = 'customer service';
      }
    }
    
    if (!marketKey) {
      // No market data available, return basic validation
      return {
        isRealistic: salary <= 75, // General high-end threshold
        suggestedRange: { min: 15, max: 45 }
      };
    }
    
    const marketData = MARKET_SALARY_DATA[marketKey];
    const regionData = marketData[region] || marketData['default'];
    
    // Calculate thresholds
    const highThreshold = regionData.max * 1.25; // 25% above typical max
    const veryHighThreshold = regionData.max * 1.4; // 40% above typical max (tighter threshold)
    
    if (salary > veryHighThreshold) {
      return {
        isRealistic: false,
        suggestedRange: { min: regionData.min, max: regionData.max },
        warningMessage: `$${salary}/hour is ${Math.round((salary/regionData.median)*100)}% above typical ${jobTitle} median wage in this region. This rate is exceptional and may indicate a specialized or senior-level position.`,
        marketData: regionData
      };
    } else if (salary > highThreshold) {
      return {
        isRealistic: true,
        suggestedRange: { min: regionData.min, max: regionData.max },
        warningMessage: `$${salary}/hour is above typical ${jobTitle} range but may be appropriate for experienced candidates or specialized roles.`,
        marketData: regionData
      };
    }
    
    return {
      isRealistic: true,
      suggestedRange: { min: regionData.min, max: regionData.max },
      marketData: regionData
    };
  }

  private enhanceResponsibilities(onetTasks: string[]): string[] {
    // Take top 5-6 most relevant tasks and make them action-oriented
    return onetTasks.slice(0, 6).map(task => {
      // Ensure task starts with action verb
      if (!task.match(/^[A-Z][a-z]+ /)) {
        task = 'Perform ' + task.charAt(0).toLowerCase() + task.slice(1);
      }
      return task;
    });
  }

  private generateRequirements(skills: string[], jobTitle: string): string[] {
    const requirements: string[] = [];
    
    // Experience requirement based on job level
    if (jobTitle.toLowerCase().includes('senior') || jobTitle.toLowerCase().includes('lead')) {
      requirements.push('3+ years of relevant experience');
    } else if (jobTitle.toLowerCase().includes('manager') || jobTitle.toLowerCase().includes('supervisor')) {
      requirements.push('2+ years of supervisory experience');
    } else {
      requirements.push('Previous experience preferred but not required');
    }

    // Add top skills as requirements
    const topSkills = skills.slice(0, 3);
    if (topSkills.length > 0) {
      requirements.push(`Strong ${topSkills.join(', ')} skills`);
    }

    // Standard requirements
    requirements.push('Reliable transportation and valid driver\'s license');
    requirements.push('Ability to work scheduled hours consistently');
    
    // Physical requirements for relevant jobs
    if (jobTitle.toLowerCase().match(/warehouse|driver|labor|construction/)) {
      requirements.push('Ability to lift 50+ lbs and stand for extended periods');
    }

    return requirements;
  }

  private suggestBenefits(hourlySalary: number, jobTitle: string): string[] {
    const benefits: string[] = [];
    
    // Salary-based benefits
    if (hourlySalary >= 25) {
      benefits.push('Health insurance', 'Dental and vision coverage', '401(k) with company match');
    } else if (hourlySalary >= 18) {
      benefits.push('Health insurance options', 'Paid time off', 'Employee discounts');
    } else {
      benefits.push('Flexible scheduling', 'Employee discounts', 'Opportunities for advancement');
    }

    // Job-specific benefits
    if (jobTitle.toLowerCase().includes('driver')) {
      benefits.push('Fuel card or reimbursement');
    }
    if (jobTitle.toLowerCase().includes('manager') || jobTitle.toLowerCase().includes('supervisor')) {
      benefits.push('Performance bonuses', 'Professional development opportunities');
    }

    // Always include
    benefits.push('Positive work environment', 'On-the-job training');

    return benefits.slice(0, 5); // Return top 5 benefits
  }

  private refineJobTitle(userTitle: string, onetTitle: string): string {
    // If user title is very generic, use O*NET suggestion
    const genericTitles = ['worker', 'employee', 'staff', 'team member'];
    const userTitleLower = userTitle.toLowerCase();
    
    if (genericTitles.some(generic => userTitleLower.includes(generic))) {
      return onetTitle;
    }
    
    // Otherwise, keep user's title as they know their business
    return userTitle;
  }

  private enhanceDescription(userDescription: string, onetDescription: string): string {
    // If user provided a good description, keep it
    if (userDescription && userDescription.length > 100) {
      return userDescription;
    }
    
    // Otherwise, create a hybrid
    const intro = userDescription || `We're looking for a dedicated professional to join our team.`;
    const details = onetDescription ? `\n\nThis role involves ${onetDescription.toLowerCase()}` : '';
    
    return intro + details;
  }
}

// Export singleton instance
export const jobEnhancer = new JobEnhancer();