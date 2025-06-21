// Local knowledge base for 209 area code region
export interface LocalArea {
  name: string;
  aliases: string[];
  county: string;
  majorEmployers: string[];
  industries: string[];
  landmarks: string[];
  commuteInfo?: {
    toBayArea: string;
    toSacramento: string;
  };
}

export interface LocalBusinessInfo {
  name: string;
  industry: string;
  locations: string[];
  typicalJobs: string[];
}

// 209 Area Local Knowledge Base
export const LOCAL_AREAS: LocalArea[] = [
  {
    name: 'Stockton',
    aliases: ['stockton', 'port city'],
    county: 'San Joaquin',
    majorEmployers: [
      'San Joaquin Delta College',
      "St. Joseph's Medical Center",
      'Amazon',
      'Port of Stockton',
    ],
    industries: [
      'logistics',
      'healthcare',
      'education',
      'agriculture',
      'distribution',
    ],
    landmarks: [
      'Port of Stockton',
      'Delta College',
      'Miracle Mile',
      'Lincoln Center',
    ],
    commuteInfo: {
      toBayArea: '1.5-2 hours via I-580/I-5',
      toSacramento: '45 minutes via Highway 99',
    },
  },
  {
    name: 'Modesto',
    aliases: ['modesto', 'mo-town'],
    county: 'Stanislaus',
    majorEmployers: [
      'Gallo Winery',
      'Memorial Medical Center',
      'Modesto City Schools',
      'Foster Farms',
    ],
    industries: [
      'food processing',
      'agriculture',
      'healthcare',
      'education',
      'manufacturing',
    ],
    landmarks: ['Gallo Center', 'Modesto Junior College', 'McHenry Mansion'],
    commuteInfo: {
      toBayArea: '2-2.5 hours via I-580',
      toSacramento: '1.5 hours via Highway 99',
    },
  },
  {
    name: 'Lodi',
    aliases: ['lodi', 'wine country'],
    county: 'San Joaquin',
    majorEmployers: [
      'Lodi Unified School District',
      'Adventist Health Lodi Memorial',
      'General Mills',
    ],
    industries: [
      'wine',
      'agriculture',
      'education',
      'healthcare',
      'food processing',
    ],
    landmarks: ['Lodi Lake', 'Wine Country', 'Hutchins Street Square'],
    commuteInfo: {
      toBayArea: '1.5 hours via I-5/I-580',
      toSacramento: '30 minutes via Highway 99',
    },
  },
  {
    name: 'Tracy',
    aliases: ['tracy'],
    county: 'San Joaquin',
    majorEmployers: ['Amazon', 'Tesla', 'Sutter Tracy Community Hospital'],
    industries: ['logistics', 'automotive', 'healthcare', 'retail'],
    landmarks: ['Tracy Hills', 'West Valley Mall'],
    commuteInfo: {
      toBayArea: '1-1.5 hours via I-580',
      toSacramento: '1 hour via I-5',
    },
  },
  {
    name: 'Manteca',
    aliases: ['manteca'],
    county: 'San Joaquin',
    majorEmployers: ['Amazon', 'Costco', 'Kaiser Permanente'],
    industries: ['distribution', 'retail', 'healthcare'],
    landmarks: ['Big League Dreams', 'Manteca Transit Center'],
    commuteInfo: {
      toBayArea: '1.5 hours via I-580/I-205',
      toSacramento: '1 hour via Highway 99',
    },
  },
];

export const LOCAL_INDUSTRIES = {
  agriculture: {
    description: "Central Valley is California's agricultural heartland",
    commonJobs: [
      'farm worker',
      'agricultural technician',
      'crop advisor',
      'farm manager',
    ],
    seasonality:
      'Seasonal hiring peaks: Spring (planting), Summer/Fall (harvest)',
  },
  logistics: {
    description: 'Major distribution hub for California',
    commonJobs: [
      'warehouse worker',
      'forklift operator',
      'logistics coordinator',
      'truck driver',
    ],
    majorHubs: ['Amazon', 'Costco', 'FedEx', 'UPS'],
  },
  healthcare: {
    description: 'Growing healthcare sector serving Central Valley',
    commonJobs: [
      'nurse',
      'medical assistant',
      'healthcare administrator',
      'technician',
    ],
    majorSystems: ['Sutter Health', 'Adventist Health', 'Kaiser Permanente'],
  },
  education: {
    description: 'Strong education sector with multiple institutions',
    commonJobs: ['teacher', 'administrator', 'support staff', 'counselor'],
    institutions: ['UC Merced', 'CSU Stanislaus', 'Delta College', 'MJC'],
  },
};

export const COMMUTE_PATTERNS = {
  reverse_commute: {
    description: 'Many Bay Area workers moved to 209 area for affordability',
    routes: ['Tracy → Bay Area via ACE Train', 'Stockton → Bay Area via I-580'],
    benefits: [
      'Lower housing costs',
      'Better quality of life',
      'Family-friendly communities',
    ],
  },
  local_opportunities: {
    description: 'Growing local job market reduces commute need',
    trends: [
      'Tech companies expanding to Central Valley',
      'Healthcare growth',
      'Logistics boom',
    ],
  },
};

export const LOCAL_SALARY_CONTEXT = {
  '209_area_average': {
    cost_of_living_index: 85, // Compared to Bay Area (100 = Bay Area average)
    housing_cost_savings: '60-70% lower than Bay Area',
    median_household_income: 65000,
    popular_salary_ranges: {
      entry_level: '$35,000 - $45,000',
      mid_level: '$45,000 - $70,000',
      senior_level: '$70,000 - $100,000',
    },
  },
  commuter_context: {
    bay_area_premium: 'Bay Area jobs typically pay 40-60% more',
    commute_cost: '$300-500/month (gas, tolls, parking)',
    time_investment: '3-4 hours daily commute',
    break_even_salary: '$85,000+ Bay Area salary to justify commute',
  },
  industry_salaries: {
    healthcare: {
      registered_nurse: '$75,000 - $95,000',
      medical_assistant: '$35,000 - $45,000',
      healthcare_admin: '$45,000 - $65,000',
    },
    logistics: {
      warehouse_worker: '$35,000 - $50,000',
      truck_driver: '$55,000 - $75,000',
      logistics_coordinator: '$45,000 - $65,000',
    },
    education: {
      teacher: '$50,000 - $85,000',
      administrator: '$70,000 - $120,000',
      support_staff: '$30,000 - $45,000',
    },
    agriculture: {
      farm_worker: '$30,000 - $40,000',
      agricultural_tech: '$45,000 - $65,000',
      farm_manager: '$65,000 - $90,000',
    },
  },
};

export class LocalKnowledgeService {
  /**
   * Get local area information by name or alias
   */
  static getAreaInfo(locationQuery: string): LocalArea | null {
    const query = locationQuery.toLowerCase().trim();
    return (
      LOCAL_AREAS.find(
        area =>
          area.name.toLowerCase() === query ||
          area.aliases.some(alias => alias.toLowerCase() === query)
      ) || null
    );
  }

  /**
   * Get relevant local context for job search
   */
  static getLocalJobContext(industry?: string, location?: string): string {
    let context = 'Local 209 Area Job Market Context:\n';

    if (location) {
      const areaInfo = this.getAreaInfo(location);
      if (areaInfo) {
        context += `\n${areaInfo.name} (${areaInfo.county} County):`;
        context += `\n- Major employers: ${areaInfo.majorEmployers.path.join(', ')}`;
        context += `\n- Key industries: ${areaInfo.industries.path.join(', ')}`;
        if (areaInfo.commuteInfo) {
          context += `\n- Commute to Bay Area: ${areaInfo.commuteInfo.toBayArea}`;
        }
      }
    }

    if (
      industry &&
      LOCAL_INDUSTRIES[industry as keyof typeof LOCAL_INDUSTRIES]
    ) {
      const industryInfo =
        LOCAL_INDUSTRIES[industry as keyof typeof LOCAL_INDUSTRIES];
      context += `\n\n${industry.charAt(0).toUpperCase() + industry.slice(1)} in Central Valley:`;
      context += `\n- ${industryInfo.description}`;
      context += `\n- Common jobs: ${industryInfo.commonJobs.path.join(', ')}`;
    }

    return context;
  }

  /**
   * Extract local landmarks or areas mentioned in user query
   */
  static extractLocalReferences(userMessage: string): string[] {
    const message = userMessage.toLowerCase();
    const references: string[] = [];

    LOCAL_AREAS.forEach(area => {
      if (message.includes(area.name.toLowerCase())) {
        references.push(area.name);
      }
      area.aliases.forEach(alias => {
        if (message.includes(alias)) {
          references.push(area.name);
        }
      });
      area.landmarks.forEach(landmark => {
        if (message.includes(landmark.toLowerCase())) {
          references.push(`${landmark} (${area.name})`);
        }
      });
    });

    return [...new Set(references)]; // Remove duplicates
  }

  /**
   * Get commute-related advice for job seekers
   */
  static getCommuteAdvice(fromLocation?: string): string {
    if (!fromLocation) {
      return 'Many 209 residents commute to Bay Area/Sacramento for higher wages while enjoying lower cost of living. Local job market is growing with new opportunities in logistics, healthcare, and tech.';
    }

    const areaInfo = this.getAreaInfo(fromLocation);
    if (areaInfo?.commuteInfo) {
      return `From ${areaInfo.name}: Bay Area commute is ${areaInfo.commuteInfo.toBayArea}, Sacramento is ${areaInfo.commuteInfo.toSacramento}. Consider local opportunities to reduce commute time.`;
    }

    return 'Central Valley offers both local opportunities and reasonable commute access to major employment centers.';
  }

  /**
   * Get salary context for local market
   */
  static getSalaryContext(role?: string, industry?: string): string {
    let context = '209 Area Salary Context:\n';
    context += `- Cost of living is 60-70% lower than Bay Area\n`;
    context += `- Median household income: $${LOCAL_SALARY_CONTEXT['209_area_average'].median_household_income.toLocaleString()}\n`;

    if (
      industry &&
      LOCAL_SALARY_CONTEXT.industry_salaries[
        industry as keyof typeof LOCAL_SALARY_CONTEXT.industry_salaries
      ]
    ) {
      const industryData =
        LOCAL_SALARY_CONTEXT.industry_salaries[
          industry as keyof typeof LOCAL_SALARY_CONTEXT.industry_salaries
        ];
      context += `\n${industry.charAt(0).toUpperCase() + industry.slice(1)} salaries in 209 area:\n`;
      Object.entries(industryData).forEach(([role, salary]) => {
        context += `- ${role.replace(/_/g, ' ')}: ${salary}\n`;
      });
    }

    context += `\nCommute vs Local Trade-offs:\n`;
    context += `- Bay Area jobs pay 40-60% more but cost $300-500/month to commute\n`;
    context += `- Need $85,000+ Bay Area salary to break even after commute costs\n`;
    context += `- Local jobs offer better work-life balance and community connection\n`;

    return context;
  }

  /**
   * Compare local vs Bay Area opportunities
   */
  static getCommuteVsLocalAdvice(userSalaryRange?: string): string {
    const advice = [];

    advice.push('🏠 Living in 209 Area - Working Locally:');
    advice.push('✅ 60-70% lower housing costs');
    advice.push('✅ Better work-life balance');
    advice.push('✅ Strong community connections');
    advice.push('✅ No commute stress');
    advice.push('✅ Growing local job market');

    advice.push('\n🚗 Living in 209 Area - Commuting to Bay Area:');
    advice.push('✅ Higher salaries (40-60% premium)');
    advice.push('❌ 3-4 hours daily commute');
    advice.push('❌ $300-500/month commute costs');
    advice.push('❌ Commute stress and time loss');
    advice.push('❌ Less family/community time');

    advice.push('\n💡 Recommendation:');
    advice.push(
      'Consider local opportunities first - the quality of life benefits often outweigh salary differences. Many residents find local careers more fulfilling and sustainable long-term.'
    );

    return advice.path.join('\n');
  }
}
