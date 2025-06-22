// Domain configuration for regional 209 Works sites
export interface DomainConfig {
  domain: string;
  areaCode: string;
  region: string;
  displayName: string;
  cities: string[];
  primaryColor: string;
  accentColor: string;
  radius: number;
  seoTitle: string;
  seoDescription: string;
}

// Default domain configuration
export const DEFAULT_DOMAIN = '209.works';

// Domain configurations for all regional sites
export const DOMAIN_CONFIGS: Record<string, DomainConfig> = {
  '209.works': {
    domain: '209.works',
    areaCode: '209',
    region: 'Central Valley',
    displayName: '209 Works',
    cities: ['Stockton', 'Modesto', 'Tracy', 'Manteca', 'Lodi'],
    primaryColor: '#ff6b35',
    accentColor: '#2d4a3e',
    radius: 50,
    seoTitle: '209 Works - Local Jobs in Central Valley',
    seoDescription: 'Find local jobs in Stockton, Modesto, Tracy and the Central Valley. Built for the 209. Made for the people who work here.'
  },
  '916.works': {
    domain: '916.works',
    areaCode: '916',
    region: 'Sacramento Metro',
    displayName: '916 Jobs',
    cities: ['Sacramento', 'Elk Grove', 'Roseville', 'Folsom', 'Davis'],
    primaryColor: '#059669',
    accentColor: '#047857',
    radius: 40,
    seoTitle: '916 Jobs - Local Jobs in Sacramento Metro',
    seoDescription: 'Find local jobs in Sacramento, Elk Grove, Roseville and the Sacramento Metro area. Built for the 916.'
  },
  '510.works': {
    domain: '510.works',
    areaCode: '510',
    region: 'East Bay',
    displayName: '510 Jobs',
    cities: ['Oakland', 'Berkeley', 'Fremont', 'Hayward', 'Richmond'],
    primaryColor: '#DC2626',
    accentColor: '#B91C1C',
    radius: 35,
    seoTitle: '510 Jobs - Local Jobs in East Bay',
    seoDescription: 'Find local jobs in Oakland, Berkeley, Fremont and the East Bay area. Built for the 510.'
  },
  '925.works': {
    domain: '925.works',
    areaCode: '925',
    region: 'East Bay & Tri-Valley',
    displayName: '925 Works',
    cities: ['Concord', 'Walnut Creek', 'Pleasanton', 'Livermore', 'Antioch'],
    primaryColor: '#7c3aed',
    accentColor: '#6d28d9',
    radius: 35,
    seoTitle: '925 Works - Local Jobs in Tri-Valley',
    seoDescription: 'Find local jobs in Concord, Walnut Creek, Pleasanton and the Tri-Valley area. Built for the 925.'
  },
  '559.works': {
    domain: '559.works',
    areaCode: '559',
    region: 'Fresno',
    displayName: '559 Jobs',
    cities: ['Fresno', 'Visalia', 'Clovis', 'Madera'],
    primaryColor: '#2563eb',
    accentColor: '#1d4ed8',
    radius: 45,
    seoTitle: '559 Jobs - Local Jobs in Fresno',
    seoDescription: 'Find local jobs in Fresno, Visalia, Clovis and the Central Valley South. Built for the 559.'
  }
};

// Get domain configuration from hostname
export function getDomainConfig(hostname: string): DomainConfig {
  // Remove www. prefix if present
  const cleanHostname = hostname.replace(/^www\./, '');

  // Return configuration for the domain, or default to 209.works
  return DOMAIN_CONFIGS[cleanHostname] || DOMAIN_CONFIGS[DEFAULT_DOMAIN];
}

// Check if a domain is valid/supported
export function isValidDomain(hostname: string): boolean {
  const cleanHostname = hostname.replace(/^www\./, '');
  return cleanHostname in DOMAIN_CONFIGS;
}

// Get all supported domains
export function getAllDomains(): string[] {
  return Object.keys(DOMAIN_CONFIGS);
}

// Get domain config by area code
export function getDomainByAreaCode(areaCode: string): DomainConfig | null {
  const config = Object.values(DOMAIN_CONFIGS).find(config => config.areaCode === areaCode);
  return config || null;
}

// Get regional domains (excluding the default)
export function getRegionalDomains(): string[] {
  return Object.keys(DOMAIN_CONFIGS).filter(domain => domain !== DEFAULT_DOMAIN);
}