'use client';

import React from 'react';
import Link from 'next/link';
import { useDomain } from '@/lib/domain/context';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from 'lucide-react';

interface DomainAwareFooterProps {
  className?: string;
}

export default function DomainAwareFooter({ className = '' }: DomainAwareFooterProps) {
  const { config, isLoading } = useDomain();

  if (isLoading) {
    return (
      <footer className={`bg-gray-900 text-white py-12 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-4">
                <div className="w-24 h-6 bg-gray-700 rounded animate-pulse" />
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="w-32 h-4 bg-gray-700 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    );
  }

  const currentYear = new Date().getFullYear();

  const footerLinks = {
    jobSeekers: [
      { name: 'Browse Jobs', href: '/jobs' },
      { name: 'JobsGPT Chat', href: '/jobs?chat=true' },
      { name: 'Career Resources', href: '/resources' },
      { name: 'Resume Builder', href: '/resume' },
    ],
    employers: [
      { name: 'Post a Job', href: '/employers/post-job' },
      { name: 'Employer Dashboard', href: '/employers/dashboard' },
      { name: 'Pricing', href: '/employers/pricing' },
      { name: 'Success Stories', href: '/employers/success' },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact', href: '/contact' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
    ],
    regions: [
      { name: '209 Works', href: 'https://209.works', current: config.areaCode === '209' },
      { name: '916 Works', href: 'https://916.works', current: config.areaCode === '916' },
      { name: '510 Works', href: 'https://510.works', current: config.areaCode === '510' },
      { name: '925 Works', href: 'https://925.works', current: config.areaCode === '925' },
      { name: '559 Works', href: 'https://559.works', current: config.areaCode === '559' },
    ]
  };

  return (
    <footer className={`bg-gray-900 text-white py-12 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand and Regional Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: config.branding.primaryColor }}
              >
                {config.areaCode}
              </div>
              <div>
                <h3 className="text-lg font-bold">{config.displayName}</h3>
                <p className="text-sm text-gray-400">{config.description}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>Serving {config.region}</span>
              </div>
              <div className="text-xs text-gray-500">
                {config.cities.join(' • ')}
              </div>
            </div>

            {/* Regional Badge */}
            <Badge 
              variant="outline" 
              className="w-fit"
              style={{ 
                borderColor: config.branding.accentColor,
                color: config.branding.accentColor 
              }}
            >
              <Globe className="w-3 h-3 mr-1" />
              {config.region} Focus
            </Badge>
          </div>

          {/* Job Seekers */}
          <div>
            <h4 className="text-lg font-semibold mb-4">For Job Seekers</h4>
            <ul className="space-y-2">
              {footerLinks.jobSeekers.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Employers */}
          <div>
            <h4 className="text-lg font-semibold mb-4">For Employers</h4>
            <ul className="space-y-2">
              {footerLinks.employers.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company & Other Regions */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Company</h4>
            <ul className="space-y-2 mb-6">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            <h5 className="text-sm font-semibold mb-2 text-gray-300">Other Regions</h5>
            <ul className="space-y-1">
              {footerLinks.regions.map((region) => (
                <li key={region.name}>
                  {region.current ? (
                    <span className="text-sm font-medium" style={{ color: config.branding.accentColor }}>
                      {region.name} (Current)
                    </span>
                  ) : (
                    <a 
                      href={region.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {region.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-400 mb-4 md:mb-0">
              © {currentYear} {config.displayName}. All rights reserved.
              <span className="ml-2">Built for the {config.areaCode}. Made for the people who work here.</span>
            </div>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
