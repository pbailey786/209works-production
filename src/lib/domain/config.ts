export interface DomainConfig {
  domain: string;
  areaCode: string;
  region: string;
  displayName: string;
  description: string;
  cities: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  radius: number; // miles for job filtering
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  branding: {
    logoPath: string;
    primaryColor: string;
    accentColor: string;
  };
  social: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export const DOMAIN_CONFIGS: Record<string, DomainConfig> = {
  '209.works': {
    domain: '209.works',
    areaCode: '209',
    region: 'Central Valley',
    displayName: '209 Works',
    description: 'Local jobs in the Central Valley',
    cities: [
      'Stockton',
      'Modesto',
      'Tracy',
      'Manteca',
      'Lodi',
      'Turlock',
      'Merced',
    ],
    coordinates: { lat: 37.7749, lng: -121.4194 },
    radius: 50,
    seo: {
      title:
        '209 Works - Local Jobs in the Central Valley | Stockton, Modesto, Tracy',
      description:
        'Find local jobs in Stockton, Modesto, Tracy, Manteca, and throughout the 209 area. Connect with Central Valley employers hiring now.',
      keywords: [
        '209 works',
        '209 jobs',
        'Central Valley jobs',
        'Stockton jobs',
        'Modesto jobs',
        'Tracy jobs',
        'Manteca jobs',
        'local employment',
        'California jobs',
      ],
    },
    branding: {
      logoPath: '/logos/209-works-logo.png',
      primaryColor: '#2d4a3e',
      accentColor: '#ff6b35',
    },
    social: {
      facebook: 'https://www.facebook.com/209works',
      instagram: 'https://www.instagram.com/209works',
      twitter: '@209works',
    },
  },
  '916.works': {
    domain: '916.works',
    areaCode: '916',
    region: 'Sacramento Metro',
    displayName: '916 Jobs',
    description: 'Local jobs in Sacramento and surrounding areas',
    cities: [
      'Sacramento',
      'Elk Grove',
      'Roseville',
      'Folsom',
      'Davis',
      'Woodland',
      'West Sacramento',
    ],
    coordinates: { lat: 38.5816, lng: -121.4944 },
    radius: 40,
    seo: {
      title:
        '916 Jobs - Local Jobs in Sacramento Metro | Sacramento, Elk Grove, Roseville',
      description:
        'Find local jobs in Sacramento, Elk Grove, Roseville, Folsom, and throughout the 916 area. Connect with Sacramento Metro employers hiring now.',
      keywords: [
        '916 jobs',
        'Sacramento jobs',
        'Elk Grove jobs',
        'Roseville jobs',
        'Folsom jobs',
        'Davis jobs',
        'local employment',
        'California jobs',
      ],
    },
    branding: {
      logoPath: '/logos/916-works-logo.png',
      primaryColor: '#059669',
      accentColor: '#047857',
    },
    social: {
      facebook: 'https://www.facebook.com/916jobs',
      instagram: 'https://www.instagram.com/916jobs',
      twitter: '@916jobs',
    },
  },
  '510.works': {
    domain: '510.works',
    areaCode: '510',
    region: 'East Bay',
    displayName: '510 Jobs',
    description: 'Local jobs in the East Bay',
    cities: [
      'Oakland',
      'Berkeley',
      'Fremont',
      'Hayward',
      'Richmond',
      'San Leandro',
      'Alameda',
    ],
    coordinates: { lat: 37.8044, lng: -122.2712 },
    radius: 35,
    seo: {
      title:
        '510 Jobs - Local Jobs in the East Bay | Oakland, Berkeley, Fremont',
      description:
        'Find local jobs in Oakland, Berkeley, Fremont, Hayward, and throughout the 510 area. Connect with East Bay employers hiring now.',
      keywords: [
        '510 jobs',
        'East Bay jobs',
        'Oakland jobs',
        'Berkeley jobs',
        'Fremont jobs',
        'Hayward jobs',
        'local employment',
        'California jobs',
      ],
    },
    branding: {
      logoPath: '/logos/510-works-logo.png',
      primaryColor: '#DC2626',
      accentColor: '#B91C1C',
    },
    social: {
      facebook: 'https://www.facebook.com/510jobs',
      instagram: 'https://www.instagram.com/510jobs',
      twitter: '@510jobs',
    },
  },
  'norcal.works': {
    domain: 'norcal.works',
    areaCode: 'norcal',
    region: 'Northern California',
    displayName: 'NorCal Jobs',
    description: 'Jobs across Northern California',
    cities: [
      'San Francisco',
      'San Jose',
      'Oakland',
      'Sacramento',
      'Stockton',
      'Fresno',
    ],
    coordinates: { lat: 37.7749, lng: -122.4194 },
    radius: 200,
    seo: {
      title:
        'NorCal Jobs - Jobs Across Northern California | SF Bay Area, Sacramento, Central Valley',
      description:
        'Find jobs across Northern California including SF Bay Area, Sacramento, Central Valley, and more. Your hub for NorCal employment opportunities.',
      keywords: [
        'Northern California jobs',
        'NorCal jobs',
        'Bay Area jobs',
        'Sacramento jobs',
        'Central Valley jobs',
        'California employment',
      ],
    },
    branding: {
      logoPath: '/logos/norcal-works-logo.png',
      primaryColor: '#7C3AED',
      accentColor: '#6D28D9',
    },
    social: {
      facebook: 'https://www.facebook.com/norcaljobs',
      instagram: 'https://www.instagram.com/norcaljobs',
      twitter: '@norcaljobs',
    },
  },
};

export const DEFAULT_DOMAIN = '209.works';

export function getDomainConfig(hostname: string): DomainConfig {
  // Handle localhost and development
  if (
    hostname.includes('localhost') ||
    hostname.includes('127.0.0.1') ||
    hostname.includes('vercel.app')
  ) {
    return DOMAIN_CONFIGS[DEFAULT_DOMAIN];
  }

  // Remove www. prefix if present
  const cleanHostname = hostname.replace(/^www\./, '');

  return DOMAIN_CONFIGS[cleanHostname] || DOMAIN_CONFIGS[DEFAULT_DOMAIN];
}

export function getAllDomains(): string[] {
  return Object.keys(DOMAIN_CONFIGS);
}

export function isValidDomain(hostname: string): boolean {
  const cleanHostname = hostname.replace(/^www\./, '');
  return cleanHostname in DOMAIN_CONFIGS;
}
