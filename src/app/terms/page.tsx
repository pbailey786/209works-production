'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TermsPage() {
  const [domainConfig, setDomainConfig] = useState({
    displayName: '209 Works',
    areaCode: '209',
    region: 'Central Valley',
  });

  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname.includes('916')) {
      setDomainConfig({
        displayName: '916 Jobs',
        areaCode: '916',
        region: 'Sacramento Metro',
      });
    } else if (hostname.includes('510')) {
      setDomainConfig({
        displayName: '510 Jobs',
        areaCode: '510',
        region: 'East Bay',
      });
    } else if (hostname.includes('925')) {
      setDomainConfig({
        displayName: '925 Works',
        areaCode: '925',
        region: 'East Bay & Tri-Valley',
      });
    } else if (hostname.includes('559')) {
      setDomainConfig({
        displayName: '559 Jobs',
        areaCode: '559',
        region: 'Fresno',
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-primary">
                  {domainConfig.areaCode}
                </span>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {domainConfig.displayName}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Local jobs in the {domainConfig.region}
                  </p>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/jobs" className="text-gray-700 hover:text-primary">
                Jobs
              </Link>
              <Link
                href="/employers"
                className="text-gray-700 hover:text-primary"
              >
                Employers
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-primary">
                About
              </Link>
              <Link href="/terms" className="font-medium text-primary">
                Terms
              </Link>
              <Link
                href="/sign-in"
                className="text-gray-700 hover:text-primary"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="hover:bg-primary/90 rounded-md bg-primary px-4 py-2 text-white"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="from-primary/5 to-primary/10 bg-gradient-to-br py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-6xl">
              Terms of Service
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-700 md:text-2xl">
              The rules and guidelines for using {domainConfig.displayName}
            </p>
            <p className="text-sm text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg mx-auto text-gray-700">

            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using {domainConfig.displayName}, you agree to be bound by these
              Terms of Service and our Privacy Policy. If you do not agree to these terms,
              please do not use our services.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              {domainConfig.displayName} is a local job board platform that connects job seekers
              with employers in the {domainConfig.region}. Our services include:
            </p>
            <ul>
              <li>Job search and application functionality</li>
              <li>AI-powered job matching (JobsGPT)</li>
              <li>Employer job posting and candidate management tools</li>
              <li>Career resources and tools</li>
            </ul>

            <h2>3. User Accounts</h2>

            <h3>Account Creation</h3>
            <p>
              To use certain features, you must create an account. You agree to:
            </p>
            <ul>
              <li>Provide accurate and complete information</li>
              <li>Keep your account information updated</li>
              <li>Maintain the security of your password</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h3>Account Termination</h3>
            <p>
              We may suspend or terminate your account if you violate these terms
              or engage in prohibited activities.
            </p>

            <h2>4. User Conduct</h2>

            <p>You agree not to:</p>
            <ul>
              <li>Post false, misleading, or discriminatory content</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use automated tools to scrape or collect data</li>
              <li>Post spam or unsolicited communications</li>
            </ul>

            <h2>5. Job Postings and Applications</h2>

            <h3>For Employers</h3>
            <p>
              Employers agree to:
            </p>
            <ul>
              <li>Post only legitimate job opportunities</li>
              <li>Comply with equal opportunity employment laws</li>
              <li>Respect candidate privacy and data</li>
              <li>Pay applicable fees for premium services</li>
            </ul>

            <h3>For Job Seekers</h3>
            <p>
              Job seekers agree to:
            </p>
            <ul>
              <li>Provide accurate information in applications</li>
              <li>Respect employer time and processes</li>
              <li>Not misrepresent qualifications or experience</li>
            </ul>

            <h2>6. Payment and Refunds</h2>

            <p>
              Employers may purchase credits or premium services. All sales are final
              unless otherwise specified. We reserve the right to change pricing with
              reasonable notice.
            </p>

            <h2>7. Intellectual Property</h2>

            <p>
              The {domainConfig.displayName} platform, including its design, functionality,
              and content, is owned by us and protected by intellectual property laws.
              You may not copy, modify, or distribute our content without permission.
            </p>

            <h2>8. Privacy and Data</h2>

            <p>
              Your privacy is important to us. Please review our Privacy Policy to
              understand how we collect, use, and protect your information.
            </p>

            <h2>9. Disclaimers</h2>

            <p>
              Our services are provided "as is" without warranties. We do not guarantee:
            </p>
            <ul>
              <li>Job placement or hiring outcomes</li>
              <li>Accuracy of job postings or user information</li>
              <li>Uninterrupted service availability</li>
              <li>Compatibility with all devices or browsers</li>
            </ul>

            <h2>10. Limitation of Liability</h2>

            <p>
              We are not liable for indirect, incidental, or consequential damages
              arising from your use of our services. Our total liability is limited
              to the amount you paid for our services.
            </p>

            <h2>11. Indemnification</h2>

            <p>
              You agree to indemnify and hold us harmless from claims arising from
              your use of our services or violation of these terms.
            </p>

            <h2>12. Changes to Terms</h2>

            <p>
              We may update these terms from time to time. We will notify users of
              significant changes. Continued use of our services constitutes acceptance
              of updated terms.
            </p>

            <h2>13. Governing Law</h2>

            <p>
              These terms are governed by the laws of California. Any disputes will
              be resolved in the courts of California.
            </p>

            <h2>14. Contact Information</h2>

            <p>
              If you have questions about these terms, please contact us:
            </p>
            <ul>
              <li>Email: legal@{domainConfig.areaCode}.works</li>
              <li>Contact form: <Link href="/contact" className="text-primary hover:underline">Contact Us</Link></li>
            </ul>

            <div className="mt-12 rounded-lg bg-gray-50 p-6">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                Fair and Transparent
              </h3>
              <p className="text-gray-700">
                We believe in building a fair and transparent platform that serves
                both job seekers and employers in the {domainConfig.region}. These terms
                help ensure a positive experience for everyone in our community.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
