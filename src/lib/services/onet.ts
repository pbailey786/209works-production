/**
 * O*NET Web Services API integration for official job market data
 * Provides real employment statistics, salary data, and occupation information
 */

interface ONetOccupation {
  code: string;
  title: string;
  description?: string;
  related_occupations?: Array<{
    code: string;
    title: string;
  }>;
  typical_education?: string;
  median_wages?: {
    annual?: number;
    hourly?: number;
  };
  job_outlook?: string;
  tasks?: string[];
  knowledge?: string[];
  skills?: string[];
  abilities?: string[];
}

interface ONetAPIResponse {
  occupation?: ONetOccupation[];
  career?: any;
  error?: string;
}

class ONetService {
  private baseUrl = 'https://services.onetcenter.org/ws';
  private userAgent: string;
  private credentials?: string;
  
  constructor() {
    // Use environment variables for O*NET configuration
    this.userAgent = process.env.ONET_USER_AGENT || '209jobs/1.0 (mailto:contact@209.works)';
    
    // O*NET supports basic auth if you have username/password
    if (process.env.ONET_USERNAME && process.env.ONET_PASSWORD) {
      this.credentials = Buffer.from(
        `${process.env.ONET_USERNAME}:${process.env.ONET_PASSWORD}`
      ).toString('base64');
    }
  }

  /**
   * Get standard headers for O*NET API requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': this.userAgent,
      'Accept': 'application/json',
    };
    
    if (this.credentials) {
      headers['Authorization'] = `Basic ${this.credentials}`;
    }
    
    return headers;
  }

  /**
   * Search for occupations by keyword
   */
  async searchOccupations(keyword: string): Promise<ONetOccupation[]> {
    try {
      const encodedKeyword = encodeURIComponent(keyword);
      const response = await fetch(
        `${this.baseUrl}/online/search?keyword=${encodedKeyword}&end=10`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`O*NET API error: ${response.status}`);
      }

      const data: ONetAPIResponse = await response.json();
      return data.occupation || [];
    } catch (error) {
      console.error('Error fetching O*NET occupations:', error);
      return [];
    }
  }

  /**
   * Get detailed information about a specific occupation
   */
  async getOccupationDetails(onetCode: string): Promise<ONetOccupation | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/online/occupations/${onetCode}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`O*NET API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching O*NET occupation details:', error);
      return null;
    }
  }

  /**
   * Get salary data for an occupation in a specific location
   */
  async getWageData(onetCode: string, stateCode: string = 'CA'): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/online/occupations/${onetCode}/wages/state/${stateCode}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`O*NET wage API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching O*NET wage data:', error);
      return null;
    }
  }

  /**
   * Get related occupations for career exploration
   */
  async getRelatedOccupations(onetCode: string): Promise<ONetOccupation[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/online/occupations/${onetCode}/related_occupations`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`O*NET related occupations API error: ${response.status}`);
      }

      const data = await response.json();
      return data.related_occupation || [];
    } catch (error) {
      console.error('Error fetching O*NET related occupations:', error);
      return [];
    }
  }

  /**
   * Get job outlook and growth projections
   */
  async getJobOutlook(onetCode: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/online/occupations/${onetCode}/summary/job_outlook`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`O*NET job outlook API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching O*NET job outlook:', error);
      return null;
    }
  }

  /**
   * Convert common job titles to O*NET codes for API lookups
   */
  getONetCodeForJobTitle(jobTitle: string): string | null {
    const titleMapping: { [key: string]: string } = {
      // Warehouse & Logistics (very common in Central Valley)
      'warehouse worker': '53-7051.00',
      'warehouse associate': '53-7051.00',
      'forklift operator': '53-7051.00', 
      'material handler': '53-7051.00',
      'shipping clerk': '43-5071.00',
      'receiving clerk': '43-5071.00',
      'inventory clerk': '43-5081.00',
      'order picker': '53-7051.00',
      'packer': '53-7064.00',
      
      // Transportation & Delivery
      'truck driver': '53-3032.00',
      'delivery driver': '53-3033.00',
      'cdl driver': '53-3032.00',
      'driver': '53-3033.00',
      
      // Retail & Customer Service
      'customer service': '43-4051.00',
      'retail sales': '41-2031.00',
      'sales associate': '41-2031.00',
      'cashier': '41-2011.00',
      'stocker': '53-7065.00',
      'retail worker': '41-2031.00',
      
      // Healthcare (growing in Central Valley)
      'registered nurse': '29-1141.00',
      'rn': '29-1141.00',
      'lpn': '29-2061.00',
      'licensed practical nurse': '29-2061.00',
      'cna': '31-1014.00',
      'certified nursing assistant': '31-1014.00',
      'medical assistant': '31-9092.00',
      'home health aide': '31-1011.00',
      
      // Administrative & Office
      'administrative assistant': '43-6011.00',
      'office clerk': '43-9061.00',
      'receptionist': '43-4171.00',
      'data entry': '43-9021.00',
      'secretary': '43-6014.00',
      
      // Manufacturing & Production (major Central Valley industry)
      'machine operator': '51-9061.00',
      'production worker': '51-2092.00',
      'assembly worker': '51-2011.00',
      'factory worker': '51-2092.00',
      'manufacturing': '51-2092.00',
      'food processing': '51-3093.00',
      'packaging': '51-9111.00',
      
      // Agriculture & Food (Central Valley specialty)
      'farm worker': '45-2092.00',
      'agricultural worker': '45-2092.00',
      'farmhand': '45-2092.00',
      'picker': '45-2092.00',
      'harvester': '45-2092.00',
      'walnut harvester': '45-2092.00',
      'fruit picker': '45-2092.00',
      'farm laborer': '45-2092.00',
      'ranch hand': '45-2093.00',
      'livestock worker': '45-2093.00',
      
      // Food Service
      'food service worker': '35-3021.00',
      'restaurant server': '35-3031.00',
      'server': '35-3031.00',
      'cook': '35-2014.00',
      'kitchen helper': '35-9021.00',
      'dishwasher': '35-9021.00',
      'food prep': '35-2021.00',
      'fast food': '35-3023.00',
      
      // Maintenance & Facilities
      'janitor': '37-2011.00',
      'custodian': '37-2011.00',
      'cleaner': '37-2011.00',
      'maintenance worker': '49-9071.00',
      'handyman': '49-9071.00',
      'groundskeeper': '37-3011.00',
      
      // Security & Safety
      'security guard': '33-9032.00',
      'security officer': '33-9032.00',
      'loss prevention': '33-9032.00',
      
      // Construction & Trades
      'construction laborer': '47-2061.00',
      'construction worker': '47-2061.00',
      'carpenter': '47-2031.00',
      'electrician': '47-2111.00',
      'plumber': '47-2152.00',
      'roofer': '47-2181.00',
      
      // General Labor
      'general laborer': '53-7062.00',
      'laborer': '53-7062.00',
      'helper': '53-7062.00',
      'entry level': '53-7062.00',
    };

    const normalizedTitle = jobTitle.toLowerCase().trim();
    return titleMapping[normalizedTitle] || null;
  }

  /**
   * Provide helpful career guidance when no jobs are available
   */
  async getCareerGuidanceForJobTitle(jobTitle: string): Promise<{
    suggestions: string[];
    relatedFields: string[];
    skills: string[];
    education: string[];
  }> {
    const onetCode = this.getONetCodeForJobTitle(jobTitle);
    
    if (!onetCode) {
      return {
        suggestions: [
          "Try searching with different keywords",
          "Look for entry-level positions in related fields",
          "Consider expanding your search to nearby areas"
        ],
        relatedFields: [],
        skills: [],
        education: []
      };
    }

    try {
      const [details, related] = await Promise.all([
        this.getOccupationDetails(onetCode),
        this.getRelatedOccupations(onetCode)
      ]);

      const suggestions = [];
      const relatedFields = related.map(occ => occ.title);
      const skills = details?.skills || [];
      const education = details?.typical_education ? [details.typical_education] : [];

      if (relatedFields.length > 0) {
        suggestions.push(`Consider related roles like ${relatedFields.slice(0, 3).join(', ')}`);
      }

      if (details?.median_wages?.hourly) {
        suggestions.push(`This field typically pays $${details.median_wages.hourly}/hour in California`);
      }

      return {
        suggestions,
        relatedFields: relatedFields.slice(0, 5),
        skills: skills.slice(0, 5),
        education
      };
    } catch (error) {
      console.error('Error getting career guidance:', error);
      return {
        suggestions: ["Check back later for new opportunities"],
        relatedFields: [],
        skills: [],
        education: []
      };
    }
  }
}

// Export singleton instance
export const onetService = new ONetService();

/**
 * Helper function to enhance job search responses with O*NET data
 */
export async function enhanceJobSearchWithONetData(
  searchTerm: string,
  foundJobs: any[]
): Promise<{
  marketInsight?: string;
  careerGuidance?: string;
  relatedRoles?: string[];
}> {
  try {
    const guidance = await onetService.getCareerGuidanceForJobTitle(searchTerm);
    
    const result: any = {};

    // Add market insight if we have wage data
    if (guidance.suggestions.length > 0) {
      result.marketInsight = guidance.suggestions[0];
    }

    // Add career guidance when no jobs found
    if (foundJobs.length === 0 && guidance.relatedFields.length > 0) {
      result.careerGuidance = `Consider exploring: ${guidance.relatedFields.slice(0, 3).join(', ')}`;
      result.relatedRoles = guidance.relatedFields;
    }

    return result;
  } catch (error) {
    console.error('Error enhancing with O*NET data:', error);
    return {};
  }
}