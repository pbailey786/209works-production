import { z } from 'zod';

// O*NET API Configuration
const ONET_BASE_URL = 'https://services.onetcenter.org/ws';
const ONET_VERSION = '29.1'; // Latest version as of 2024

// Schemas for O*NET responses
const OccupationSchema = z.object({
  code: z.string(),
  title: z.string(),
  tags: z.object({
    bright_outlook: z.boolean().optional(),
    green: z.boolean().optional(),
  }).optional(),
});

const OccupationDetailSchema = z.object({
  code: z.string(),
  title: z.string(),
  description: z.string(),
  sample_of_reported_job_titles: z.array(z.string()).optional(),
  updated: z.string().optional(),
});

const TaskSchema = z.object({
  task: z.string(),
  importance: z.number().optional(),
  level: z.number().optional(),
  frequency: z.number().optional(),
});

const SkillSchema = z.object({
  element_id: z.string(),
  element_name: z.string(),
  scale_id: z.string(),
  scale_name: z.string(),
  value: z.number(),
});

const WageDataSchema = z.object({
  area_code: z.string(),
  area_name: z.string(),
  rate_type: z.string(),
  pct10: z.number().optional(),
  pct25: z.number().optional(),
  median: z.number().optional(),
  pct75: z.number().optional(),
  pct90: z.number().optional(),
});

export class ONetClient {
  private username: string;
  private password: string;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }

  private async makeRequest(endpoint: string) {
    const url = `${ONET_BASE_URL}${endpoint}`;
    const headers = {
      'Authorization': 'Basic ' + Buffer.from(`${this.username}:${this.password}`).toString('base64'),
      'Accept': 'application/json',
      'User-Agent': '209jobs/1.0',
    };

    console.log('🌐 O*NET Request:', url);
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(url, { 
        headers,
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('🌐 O*NET Error Response:', response.status, response.statusText, errorText);
        throw new Error(`O*NET API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🌐 O*NET Response data:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('🌐 O*NET Request timed out after 5 seconds');
        throw new Error('O*NET API request timed out');
      }
      throw error;
    }
  }

  // Search for occupations by keyword
  async searchOccupations(keyword: string) {
    try {
      const endpoint = `/online/search?keyword=${encodeURIComponent(keyword)}&end=10`;
      const data = await this.makeRequest(endpoint);
      
      return data.occupation?.map((occ: any) => ({
        code: occ.code,
        title: occ.title,
        relevance: occ.relevance_score,
      })) || [];
    } catch (error) {
      console.error('O*NET search error:', error);
      return [];
    }
  }

  // Get detailed information about a specific occupation
  async getOccupationDetails(onetCode: string) {
    try {
      const endpoint = `/online/occupations/${onetCode}`;
      const data = await this.makeRequest(endpoint);
      
      return OccupationDetailSchema.parse(data);
    } catch (error) {
      console.error('O*NET occupation details error:', error);
      return null;
    }
  }

  // Get tasks for an occupation
  async getOccupationTasks(onetCode: string, limit: number = 10) {
    try {
      const endpoint = `/online/occupations/${onetCode}/tasks?display=full&end=${limit}`;
      const data = await this.makeRequest(endpoint);
      
      return data.task?.map((t: any) => ({
        task: t.statement,
        importance: t.importance?.value,
        level: t.level?.value,
        frequency: t.frequency?.value,
      })) || [];
    } catch (error) {
      console.error('O*NET tasks error:', error);
      return [];
    }
  }

  // Get skills required for an occupation
  async getOccupationSkills(onetCode: string, limit: number = 10) {
    try {
      const endpoint = `/online/occupations/${onetCode}/skills?display=full&end=${limit}`;
      const data = await this.makeRequest(endpoint);
      
      return data.element?.map((skill: any) => ({
        name: skill.name,
        importance: skill.importance?.value || 0,
        level: skill.level?.value || 0,
      })) || [];
    } catch (error) {
      console.error('O*NET skills error:', error);
      return [];
    }
  }

  // Get wage data for an occupation in a specific area
  async getWageData(onetCode: string, areaCode: string = '000000') {
    try {
      // Area codes: 000000 = National, 06 = California
      const endpoint = `/online/occupations/${onetCode}/wages/${areaCode}`;
      const data = await this.makeRequest(endpoint);
      
      return {
        hourly: {
          median: data.wage?.rate_type === 'Hourly' ? data.wage.median : null,
          low: data.wage?.rate_type === 'Hourly' ? data.wage.pct25 : null,
          high: data.wage?.rate_type === 'Hourly' ? data.wage.pct75 : null,
        },
        annual: {
          median: data.wage?.rate_type === 'Annual' ? data.wage.median : null,
          low: data.wage?.rate_type === 'Annual' ? data.wage.pct25 : null,
          high: data.wage?.rate_type === 'Annual' ? data.wage.pct75 : null,
        },
      };
    } catch (error) {
      console.error('O*NET wage data error:', error);
      return null;
    }
  }

  // Helper to match job title to O*NET occupation
  async findBestOccupationMatch(jobTitle: string) {
    const results = await this.searchOccupations(jobTitle);
    return results[0] || null; // Return best match
  }

  // Get comprehensive job data for AI enhancement
  async getJobEnhancementData(jobTitle: string, location?: string) {
    try {
      console.log('🌐 O*NET Client: Searching for occupation:', jobTitle);
      
      // Find best matching occupation
      const occupation = await this.findBestOccupationMatch(jobTitle);
      if (!occupation) {
        console.log('🌐 O*NET Client: No occupation match found for:', jobTitle);
        return null;
      }
      
      console.log('🌐 O*NET Client: Best match found:', occupation);

      // Get all relevant data in parallel
      const [details, tasks, skills, wageData] = await Promise.all([
        this.getOccupationDetails(occupation.code),
        this.getOccupationTasks(occupation.code, 8),
        this.getOccupationSkills(occupation.code, 8),
        this.getWageData(occupation.code, '06'), // California wages
      ]);

      return {
        occupation: {
          code: occupation.code,
          title: occupation.title,
          description: details?.description,
          alternativeTitles: details?.sample_of_reported_job_titles || [],
        },
        tasks: tasks.map((t: any) => t.task),
        skills: skills.filter((s: any) => s.importance > 3).map((s: any) => s.name),
        salary: wageData,
      };
    } catch (error) {
      console.error('O*NET job enhancement error:', error);
      return null;
    }
  }
}

// Export singleton instance
let onetClient: ONetClient | null = null;

export function getONetClient() {
  if (!onetClient) {
    const username = process.env.ONET_USERNAME;
    const password = process.env.ONET_PASSWORD;
    
    console.log('🔧 O*NET Client Init:', {
      hasUsername: !!username,
      hasPassword: !!password,
      usernameLength: username?.length || 0
    });
    
    if (!username || !password) {
      console.error('❌ O*NET credentials not configured!');
      // Return a mock client instead of throwing
      return {
        searchOccupations: async () => [],
        getOccupationDetails: async () => null,
        getOccupationTasks: async () => [],
        getOccupationSkills: async () => [],
        getWageData: async () => null,
        findBestOccupationMatch: async () => null,
        getJobEnhancementData: async () => null
      } as any;
    }
    
    onetClient = new ONetClient(username, password);
    console.log('✅ O*NET Client initialized successfully');
  }
  
  return onetClient;
}