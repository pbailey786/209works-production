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

export class JobEnhancer {
  private onetClient = getONetClient();

  async enhanceJobPosting(input: JobEnhancementInput): Promise<EnhancedJobData | null> {
    try {
      // Get O*NET data
      const onetData = await this.onetClient.getJobEnhancementData(input.title, input.location);
      
      if (!onetData) {
        return null;
      }

      // Extract region from location for salary adjustment
      const regionCode = this.extractRegionCode(input.location);
      const wageMultiplier = REGION_WAGE_MULTIPLIERS[regionCode] || REGION_WAGE_MULTIPLIERS.default;

      // Process salary data
      const salary = this.processSalaryData(onetData.salary, wageMultiplier, input.salary);

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
    userProvidedSalary?: string
  ): EnhancedJobData['salary'] {
    // If user provided specific salary, use it
    if (userProvidedSalary) {
      const parsed = this.parseUserSalary(userProvidedSalary);
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