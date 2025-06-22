'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
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
              <Link href="/privacy" className="font-medium text-primary">
                Privacy
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
              Privacy Policy
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-700 md:text-2xl">
              How we protect and use your information
            </p>
            <p className="text-sm text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Policy Content */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg mx-auto text-gray-700">

            <h2>1. Information We Collect</h2>

            <h3>Personal Information</h3>
            <p>
              When you create an account or use our services, we may collect:
            </p>
            <ul>
              <li>Name and contact information (email, phone number)</li>
              <li>Resume and professional information</li>
              <li>Job preferences and search history</li>
              <li>Application and communication history</li>
            </ul>

            <h3>Usage Information</h3>
            <p>
              We automatically collect information about how you use our platform:
            </p>
            <ul>
              <li>Pages visited and time spent on our site</li>
              <li>Search queries and job interactions</li>
              <li>Device information and IP address</li>
              <li>Browser type and operating system</li>
            </ul>

            <h2>2. How We Use Your Information</h2>

            <p>We use your information to:</p>
            <ul>
              <li>Provide and improve our job matching services</li>
              <li>Personalize your experience with JobsGPT</li>
              <li>Send you relevant job alerts and notifications</li>
              <li>Communicate with you about our services</li>
              <li>Analyze usage patterns to improve our platform</li>
              <li>Ensure security and prevent fraud</li>
            </ul>

            <h2>3. Information Sharing</h2>

            <h3>With Employers</h3>
            <p>
              When you apply for a job, we share your application information with the employer.
              This may include your resume, contact information, and responses to application questions.
            </p>

            <h3>Service Providers</h3>
            <p>
              We work with trusted third-party service providers who help us operate our platform,
              including hosting, analytics, and communication services. These providers are bound
              by confidentiality agreements.
            </p>

            <h3>Legal Requirements</h3>
            <p>
              We may disclose information when required by law or to protect our rights,
              your safety, or the safety of others.
            </p>

            <h2>4. Data Security</h2>

            <p>
              We implement industry-standard security measures to protect your information:
            </p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security audits and monitoring</li>
              <li>Access controls and authentication</li>
              <li>Secure data centers and infrastructure</li>
            </ul>

            <h2>5. Your Rights and Choices</h2>

            <p>You have the right to:</p>
            <ul>
              <li>Access and update your personal information</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of marketing communications</li>
              <li>Request a copy of your data</li>
              <li>Restrict certain uses of your information</li>
            </ul>

            <h2>6. Cookies and Tracking</h2>

            <p>
              We use cookies and similar technologies to improve your experience,
              analyze usage, and provide personalized content. You can control
              cookie settings through your browser preferences.
            </p>

            <h2>7. Data Retention</h2>

            <p>
              We retain your information for as long as your account is active or
              as needed to provide services. We may retain certain information
              for legitimate business purposes or legal requirements.
            </p>

            <h2>8. Children's Privacy</h2>

            <p>
              Our services are not intended for children under 16. We do not
              knowingly collect personal information from children under 16.
            </p>

            <h2>9. Changes to This Policy</h2>

            <p>
              We may update this privacy policy from time to time. We will notify
              you of significant changes by email or through our platform.
            </p>

            <h2>10. Contact Us</h2>

            <p>
              If you have questions about this privacy policy or our data practices,
              please contact us:
            </p>
            <ul>
              <li>Email: privacy@{domainConfig.areaCode}.works</li>
              <li>Contact form: <Link href="/contact" className="text-primary hover:underline">Contact Us</Link></li>
            </ul>

            <div className="mt-12 rounded-lg bg-gray-50 p-6">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                Local Focus, Privacy First
              </h3>
              <p className="text-gray-700">
                As a local job platform serving the {domainConfig.region}, we understand
                the importance of community trust. We're committed to protecting your
                privacy while helping you find great local opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
