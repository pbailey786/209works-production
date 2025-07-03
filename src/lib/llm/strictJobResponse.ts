/**
 * Strict job response system that NEVER fabricates job listings.
 * Only provides information about jobs that actually exist in our database.
 * Uses O*NET API for legitimate job market insights when no results found.
 */

import { enhanceJobSearchWithONetData } from '@/lib/services/onet';

interface StrictJobResponseParams {
  userMessage: string;
  jobs: any[];
  conversationHistory?: any[];
  userContext?: any;
  totalJobsInDatabase?: number;
}

export async function generateStrictJobResponse({
  userMessage,
  jobs,
  conversationHistory = [],
  userContext = null,
  totalJobsInDatabase = 0,
}: StrictJobResponseParams): Promise<string> {
  const messageWords = userMessage.toLowerCase();
  
  // If no jobs found, provide honest feedback with O*NET insights
  if (jobs.length === 0) {
    return await generateNoJobsResponseWithONet(messageWords, userContext, totalJobsInDatabase);
  }

  // If jobs found, provide factual summary
  return generateJobsFoundResponse(jobs, messageWords, userContext);
}

async function generateNoJobsResponseWithONet(
  messageWords: string,
  userContext: any,
  totalJobsInDatabase: number
): Promise<string> {
  // Detect what they were looking for
  const searchTerms = extractSearchTerms(messageWords);
  
  let response = `No ${searchTerms} jobs in our current listings.`;

  try {
    // Get O*NET insights for this job type
    const onetData = await enhanceJobSearchWithONetData(searchTerms, []);
    
    if (onetData.careerGuidance) {
      response += ` ${onetData.careerGuidance}`;
    } else if (onetData.marketInsight) {
      response += ` ${onetData.marketInsight}`;
    } else if (totalJobsInDatabase > 0) {
      // Fallback to generic suggestions
      const suggestions = [
        "Try searching for warehouse, retail, or customer service roles.",
        "Check out healthcare, logistics, or administrative positions.", 
        "Consider entry-level opportunities in different fields.",
      ];
      response += ` ${suggestions[Math.floor(Math.random() * suggestions.length)]}`;
    }
  } catch (error) {
    console.error('Error getting O*NET data:', error);
    // Fallback to basic suggestions
    if (totalJobsInDatabase > 0) {
      response += " Try different keywords or check similar job types.";
    } else {
      response += " Check back soon as we add new jobs regularly.";
    }
  }

  return response;
}

function generateJobsFoundResponse(
  jobs: any[],
  messageWords: string,
  userContext: any
): string {
  const count = jobs.length;
  const searchTerms = extractSearchTerms(messageWords);
  
  // Get salary range from actual jobs
  const salaries = jobs
    .filter(job => job.salaryMin || job.salaryMax)
    .map(job => job.salaryMin || job.salaryMax);
  
  const minSalary = salaries.length > 0 ? Math.min(...salaries) : null;
  const maxSalary = salaries.length > 0 ? Math.max(...salaries) : null;
  
  // Get actual locations from jobs
  const locations = [...new Set(jobs.map(job => job.location).filter(Boolean))];
  
  // Get actual companies from jobs
  const companies = [...new Set(jobs.map(job => job.company).filter(Boolean))];

  let response = '';

  // Opening based on job count
  if (count === 1) {
    response = "Found 1 job that matches";
  } else if (count <= 3) {
    response = `Found ${count} jobs that match`;
  } else if (count <= 10) {
    response = `Found ${count} solid options`;
  } else {
    response = `Found ${count} jobs`;
  }

  // Add search context if we detected what they were looking for
  if (searchTerms && searchTerms !== 'jobs') {
    response += ` your ${searchTerms} search`;
  }

  response += '.';

  // Add location context if we have real locations
  if (locations.length > 0) {
    if (locations.length === 1) {
      response += ` All in ${locations[0]}.`;
    } else if (locations.length <= 3) {
      response += ` Located in ${locations.slice(0, -1).join(', ')} and ${locations[locations.length - 1]}.`;
    } else {
      response += ` Across ${locations.length} different locations in the Central Valley.`;
    }
  }

  // Add salary context if we have real salary data
  if (minSalary && maxSalary && minSalary !== maxSalary) {
    response += ` Pay ranges from $${minSalary}/hr to $${maxSalary}/hr.`;
  } else if (minSalary) {
    response += ` Starting at $${minSalary}/hr.`;
  }

  // Add urgency context if jobs have immediate start dates
  const urgentJobs = jobs.filter(job => 
    job.title?.toLowerCase().includes('immediate') ||
    job.description?.toLowerCase().includes('start immediately') ||
    job.metadata?.urgentHiring
  );
  
  if (urgentJobs.length > 0) {
    response += ` ${urgentJobs.length} can start immediately.`;
  }

  return response;
}

function extractSearchTerms(messageWords: string): string {
  // Extract what they're actually looking for
  const rolePatterns = [
    { pattern: /warehouse|logistics|shipping|fulfillment/, term: 'warehouse' },
    { pattern: /nurse|nursing|healthcare|medical/, term: 'healthcare' },
    { pattern: /retail|sales|cashier|customer service/, term: 'retail' },
    { pattern: /tech|technology|software|developer/, term: 'technology' },
    { pattern: /admin|administrative|office|clerk/, term: 'administrative' },
    { pattern: /food|restaurant|kitchen|server/, term: 'food service' },
    { pattern: /security|guard|safety/, term: 'security' },
    { pattern: /driver|delivery|transport/, term: 'driving' },
    { pattern: /clean|custodial|janitorial/, term: 'cleaning' },
    { pattern: /construction|trade|maintenance/, term: 'trades' },
    { pattern: /manager|management|supervisor/, term: 'management' },
    { pattern: /walnut|harvest|farm|agriculture/, term: 'agricultural' },
  ];

  for (const { pattern, term } of rolePatterns) {
    if (pattern.test(messageWords)) {
      return term;
    }
  }

  return 'jobs';
}

/**
 * Generate follow-up questions that are helpful and don't assume jobs exist
 */
export function generateStrictFollowUpQuestions(
  jobs: any[],
  userContext: any,
  messageWords: string
): string[] {
  if (jobs.length === 0) {
    return [
      "Try a broader search?",
      "Look in nearby cities?", 
      "Check similar job types?",
      "Set up a job alert for when something posts?",
    ];
  }

  if (jobs.length === 1) {
    return [
      "Want to see the job details?",
      "Looking for similar positions?",
      "Questions about the company?",
    ];
  }

  return [
    "Filter by pay rate?",
    "Show only immediate start?",
    "Focus on specific companies?",
    "Filter by schedule?",
  ];
}

/**
 * Validate that response doesn't contain fabricated job information
 */
export function validateResponseAccuracy(response: string, actualJobs: any[]): boolean {
  const response_lower = response.toLowerCase();
  
  // Check for specific company names that aren't in our jobs
  const mentionedCompanies = extractCompanyMentions(response_lower);
  const actualCompanies = actualJobs.map(job => job.company?.toLowerCase()).filter(Boolean);
  
  for (const company of mentionedCompanies) {
    if (!actualCompanies.includes(company)) {
      console.warn(`Response mentions company "${company}" not in actual jobs`);
      return false;
    }
  }

  // Check for specific salary claims
  const mentionedSalaries = extractSalaryMentions(response_lower);
  const actualSalaries = actualJobs
    .flatMap(job => [job.salaryMin, job.salaryMax])
    .filter(Boolean);
    
  for (const salary of mentionedSalaries) {
    if (!actualSalaries.includes(salary)) {
      console.warn(`Response mentions salary "${salary}" not in actual jobs`);
      return false;
    }
  }

  return true;
}

function extractCompanyMentions(text: string): string[] {
  // Common company name patterns
  const companyPatterns = [
    /amazon/g, /walmart/g, /target/g, /costco/g, /fedex/g, /ups/g,
    /mcdonalds/g, /starbucks/g, /home depot/g, /lowes/g,
  ];
  
  const mentions: string[] = [];
  for (const pattern of companyPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      mentions.push(...matches);
    }
  }
  
  return mentions;
}

function extractSalaryMentions(text: string): number[] {
  const salaryPattern = /\$(\d+)(?:\/hr|per hour|hourly)/g;
  const mentions: number[] = [];
  let match;
  
  while ((match = salaryPattern.exec(text)) !== null) {
    mentions.push(parseInt(match[1]));
  }
  
  return mentions;
}