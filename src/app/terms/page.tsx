import { Metadata } from 'next';
import { Scale, FileText, Users, Shield, AlertTriangle, Mail, Calendar, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service - 209 Works',
  description: 'Read the terms and conditions for using 209 Works. Understand your rights and responsibilities when using our job platform.',
};

export default function TermsPage() {
  const lastUpdated = "January 15, 2025";
  const effectiveDate = "January 15, 2025";

  const sections = [
    {
      id: "acceptance",
      title: "Acceptance of Terms",
      icon: CheckCircle,
      content: [
        {
          text: "By accessing or using 209 Works, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site."
        },
        {
          text: "These terms apply to all users of the platform, including job seekers, employers, and visitors. Your continued use of the platform constitutes acceptance of any updates to these terms."
        }
      ]
    },
    {
      id: "platform-description",
      title: "Platform Description",
      icon: FileText,
      content: [
        {
          text: "209 Works is an online job platform that connects job seekers with employers in the Central Valley region of California. We provide AI-powered job search, application management, and recruitment tools."
        },
        {
          text: "Our services include job posting, candidate matching, application tracking, resume management, and related career development tools. We reserve the right to modify, suspend, or discontinue any aspect of our services at any time."
        }
      ]
    },
    {
      id: "user-accounts",
      title: "User Accounts and Registration",
      icon: Users,
      content: [
        {
          subtitle: "Account Creation",
          text: "You must create an account to access most features of our platform. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete."
        },
        {
          subtitle: "Account Security",
          text: "You are responsible for safeguarding your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account."
        },
        {
          subtitle: "Account Termination",
          text: "We reserve the right to suspend or terminate your account at any time for violation of these terms, fraudulent activity, or any other reason we deem appropriate."
        }
      ]
    },
    {
      id: "user-responsibilities",
      title: "User Responsibilities",
      icon: Shield,
      content: [
        {
          subtitle: "Job Seekers",
          text: "Job seekers must provide truthful and accurate information in their profiles and applications. You may not misrepresent your qualifications, experience, or eligibility to work."
        },
        {
          subtitle: "Employers",
          text: "Employers must post legitimate job opportunities and comply with all applicable employment laws. Job postings must be accurate and not discriminatory."
        },
        {
          subtitle: "All Users",
          text: "All users must treat others with respect, not engage in harassment or discriminatory behavior, and comply with all applicable laws and regulations."
        }
      ]
    },
    {
      id: "prohibited-conduct",
      title: "Prohibited Conduct",
      icon: AlertTriangle,
      content: [
        {
          text: "Users are prohibited from: posting false, misleading, or fraudulent information; engaging in harassment, discrimination, or abusive behavior; attempting to circumvent our security measures; using automated tools to scrape or collect data; posting spam or unsolicited communications."
        },
        {
          text: "Employers may not post fake job listings, pyramid schemes, or opportunities that require upfront payments. Job seekers may not create multiple accounts or misrepresent their identity or qualifications."
        },
        {
          text: "Any violation of these prohibitions may result in immediate account suspension or termination, and we may report illegal activities to appropriate authorities."
        }
      ]
    },
    {
      id: "payment-terms",
      title: "Payment Terms",
      icon: FileText,
      content: [
        {
          subtitle: "Subscription Services",
          text: "Premium subscriptions are billed monthly or annually as selected. All fees are non-refundable except as specifically stated in our refund policy."
        },
        {
          subtitle: "Job Posting Fees",
          text: "Employers pay fees for job postings as outlined in our pricing page. Payment is due upon posting, and jobs remain active for the purchased duration."
        },
        {
          subtitle: "Automatic Renewal",
          text: "Subscriptions automatically renew unless cancelled before the renewal date. You can cancel your subscription at any time through your account settings."
        },
        {
          subtitle: "Refunds",
          text: "We offer refunds for job postings within 7 days if no applications are received. Subscription refunds are provided on a case-by-case basis for technical issues or billing errors."
        }
      ]
    },
    {
      id: "intellectual-property",
      title: "Intellectual Property",
      icon: Scale,
      content: [
        {
          subtitle: "Platform Content",
          text: "All content on 209.works, including text, graphics, logos, and software, is owned by us or our licensors and is protected by copyright and other intellectual property laws."
        },
        {
          subtitle: "User Content",
          text: "You retain ownership of content you submit (resumes, profiles, etc.) but grant us a license to use, display, and distribute such content as necessary to provide our services."
        },
        {
          subtitle: "Trademark",
          text: "209.works and related marks are trademarks of our company. You may not use our trademarks without our prior written consent."
        }
      ]
    },
    {
      id: "privacy-data",
      title: "Privacy and Data Protection",
      icon: Shield,
      content: [
        {
          text: "Your privacy is important to us. Our Privacy Policy, which is incorporated into these terms by reference, explains how we collect, use, and protect your personal information."
        },
        {
          text: "By using our platform, you consent to the collection and use of your information as described in our Privacy Policy. You have the right to access, correct, or delete your personal data as outlined in our Privacy Policy."
        }
      ]
    }
  ];

  const disclaimers = [
    {
      title: "Service Availability",
      text: "We strive to maintain continuous service availability but do not guarantee uninterrupted access. We may perform maintenance, updates, or experience technical issues that temporarily affect service."
    },
    {
      title: "Job Opportunities",
      text: "We do not guarantee that job seekers will find employment or that employers will find suitable candidates. Success depends on many factors beyond our control."
    },
    {
      title: "Third-Party Content",
      text: "Our platform may contain links to third-party websites or services. We are not responsible for the content, privacy practices, or terms of service of third-party sites."
    },
    {
      title: "User Interactions",
      text: "We are not responsible for interactions between users, including employment relationships, contracts, or disputes that may arise from connections made through our platform."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#2d4a3e] via-[#1d3a2e] to-[#2d4a3e] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Scale className="w-16 h-16 mx-auto mb-6 text-[#9fdf9f]" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Terms of Service
            </h1>
            <p className="text-xl md:text-2xl text-[#9fdf9f]/80 max-w-3xl mx-auto">
              Please read these terms carefully before using 209 Works. They govern your use of our platform and services.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-[#9fdf9f]/70">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                <span>Last updated: {lastUpdated}</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span>Effective: {effectiveDate}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-700 leading-relaxed mb-8">
              Welcome to 209 Works. These Terms of Service ("Terms") govern your use of our website, mobile applications,
              and related services (collectively, the "Platform"). By using our Platform, you agree to these Terms.
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-amber-900 mb-2">Important Notice</h3>
              <p className="text-amber-800">
                These Terms include important information about your rights and responsibilities. Please read them carefully. 
                If you do not agree to these Terms, please do not use our Platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Terms Sections */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-[#9fdf9f]/10 to-[#ff6b35]/10 px-8 py-6 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Icon className="w-8 h-8 text-[#2d4a3e]" />
                      </div>
                      <h2 className="ml-4 text-2xl font-bold text-gray-900">
                        {section.title}
                      </h2>
                    </div>
                  </div>
                  
                  <div className="px-8 py-6">
                    <div className="space-y-6">
                      {section.content.map((item, itemIndex) => (
                        <div key={itemIndex}>
                          {'subtitle' in item && item.subtitle && (
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {item.subtitle}
                            </h3>
                          )}
                          <p className="text-gray-700 leading-relaxed">
                            {item.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Disclaimers and Limitations */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 px-8 py-6 border-b border-gray-200">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
                <h2 className="ml-4 text-2xl font-bold text-gray-900">Disclaimers and Limitations</h2>
              </div>
            </div>
            
            <div className="px-8 py-6">
              <div className="space-y-6">
                {disclaimers.map((disclaimer, index) => (
                  <div key={index}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {disclaimer.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {disclaimer.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Liability and Indemnification */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-8 py-6 border-b border-gray-200">
              <div className="flex items-center">
                <Scale className="w-8 h-8 text-gray-600" />
                <h2 className="ml-4 text-2xl font-bold text-gray-900">Limitation of Liability</h2>
              </div>
            </div>
            
            <div className="px-8 py-6">
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  <strong>Limitation of Liability:</strong> To the maximum extent permitted by law, 209.works shall not be liable 
                  for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of 
                  profits, data, or business opportunities.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Maximum Liability:</strong> Our total liability to you for any claims arising from your use of the Platform 
                  shall not exceed the amount you paid to us in the twelve months preceding the claim.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Indemnification:</strong> You agree to indemnify and hold harmless 209.works from any claims, damages, 
                  or expenses arising from your use of the Platform, violation of these Terms, or infringement of any third-party rights.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Governing Law and Disputes */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-8 py-6 border-b border-gray-200">
              <div className="flex items-center">
                <Scale className="w-8 h-8 text-purple-600" />
                <h2 className="ml-4 text-2xl font-bold text-gray-900">Governing Law and Dispute Resolution</h2>
              </div>
            </div>
            
            <div className="px-8 py-6">
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  <strong>Governing Law:</strong> These Terms are governed by the laws of the State of California, without regard 
                  to conflict of law principles.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Jurisdiction:</strong> Any disputes arising from these Terms or your use of the Platform shall be resolved 
                  in the state or federal courts located in San Joaquin County, California.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Arbitration:</strong> For disputes involving amounts less than $10,000, you agree to resolve disputes through 
                  binding arbitration rather than in court, except where prohibited by law.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Changes to Terms */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <Calendar className="w-12 h-12 text-blue-600 mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Changes to These Terms</h3>
              <p className="text-gray-700 mb-4">
                We may update these Terms from time to time. When we do, we will:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• Post the updated Terms on this page</li>
                <li>• Update the "Last Updated" date</li>
                <li>• Notify users of material changes via email</li>
                <li>• Provide reasonable notice before changes take effect</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <Mail className="w-12 h-12 text-green-600 mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h3>
              <p className="text-gray-700 mb-4">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> legal@209.works</p>
                <p><strong>Mail:</strong> 209.works Legal Team<br />Stockton, CA 95202</p>
                <p><strong>Phone:</strong> (209) 555-WORK</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Severability and Entire Agreement */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-50 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Final Provisions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Severability</h3>
                <p className="text-gray-700 text-sm">
                  If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Entire Agreement</h3>
                <p className="text-gray-700 text-sm">
                  These Terms, together with our Privacy Policy, constitute the entire agreement between you and 209.works.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Waiver</h3>
                <p className="text-gray-700 text-sm">
                  Our failure to enforce any provision of these Terms does not constitute a waiver of that provision or any other provision.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Assignment</h3>
                <p className="text-gray-700 text-sm">
                  You may not assign these Terms without our written consent. We may assign these Terms at any time without notice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Acknowledgment */}
      <section className="py-16 bg-[#2d4a3e]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <CheckCircle className="w-16 h-16 mx-auto mb-6 text-[#9fdf9f]" />
          <h2 className="text-3xl font-bold mb-4">Thank You</h2>
          <p className="text-xl text-[#9fdf9f]/80 mb-8">
            Thank you for taking the time to read our Terms of Service. By using 209 Works,
            you acknowledge that you have read, understood, and agree to be bound by these Terms.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Get Started
            </a>
            <a
              href="/contact"
              className="border border-[#9fdf9f] text-[#9fdf9f] hover:bg-[#9fdf9f] hover:text-[#2d4a3e] px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
} 