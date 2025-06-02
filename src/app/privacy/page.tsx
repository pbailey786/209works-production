import { Metadata } from 'next';
import { Shield, Eye, Lock, Users, FileText, Globe, Mail, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - 209 Works',
  description: 'Learn how 209 Works protects your personal information and privacy. Our comprehensive privacy policy explains data collection, usage, and your rights.',
};

export default function PrivacyPage() {
  const lastUpdated = "January 15, 2025";

  const sections = [
    {
      id: "information-we-collect",
      title: "Information We Collect",
      icon: FileText,
      content: [
        {
          subtitle: "Personal Information",
          text: "When you create an account, we collect your name, email address, phone number, location, and professional information including work experience, education, and skills."
        },
        {
          subtitle: "Resume and Profile Data",
          text: "We store resumes, cover letters, portfolio items, and other documents you upload. This includes any personal information contained within these documents."
        },
        {
          subtitle: "Usage Information",
          text: "We collect information about how you use our platform, including job searches, applications submitted, pages visited, and features used."
        },
        {
          subtitle: "Technical Information",
          text: "We automatically collect IP addresses, browser type, device information, operating system, and other technical data to improve our services."
        }
      ]
    },
    {
      id: "how-we-use-information",
      title: "How We Use Your Information",
      icon: Users,
      content: [
        {
          subtitle: "Job Matching and Applications",
          text: "We use your profile information to match you with relevant job opportunities and to facilitate applications to employers."
        },
        {
          subtitle: "Platform Improvement",
          text: "We analyze usage patterns to improve our AI search algorithms, user experience, and platform features."
        },
        {
          subtitle: "Communication",
          text: "We send job alerts, platform updates, and important account information. You can control communication preferences in your settings."
        },
        {
          subtitle: "Security and Fraud Prevention",
          text: "We use your information to verify identity, prevent fraud, and maintain platform security for all users."
        }
      ]
    },
    {
      id: "information-sharing",
      title: "Information Sharing",
      icon: Globe,
      content: [
        {
          subtitle: "With Employers",
          text: "When you apply to jobs or make your profile public, employers can view your profile information, resume, and application materials."
        },
        {
          subtitle: "Service Providers",
          text: "We share data with trusted third-party services that help us operate our platform, including cloud storage, email services, and analytics providers."
        },
        {
          subtitle: "Legal Requirements",
          text: "We may disclose information when required by law, to protect our rights, or to ensure user safety and platform security."
        },
        {
          subtitle: "Business Transfers",
          text: "In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of the business transaction."
        }
      ]
    },
    {
      id: "data-security",
      title: "Data Security",
      icon: Lock,
      content: [
        {
          subtitle: "Encryption",
          text: "All data is encrypted in transit using SSL/TLS protocols and at rest using industry-standard encryption methods."
        },
        {
          subtitle: "Access Controls",
          text: "We implement strict access controls, ensuring only authorized personnel can access user data for legitimate business purposes."
        },
        {
          subtitle: "Regular Security Audits",
          text: "We conduct regular security assessments and penetration testing to identify and address potential vulnerabilities."
        },
        {
          subtitle: "Incident Response",
          text: "We have procedures in place to quickly respond to and mitigate any security incidents or data breaches."
        }
      ]
    },
    {
      id: "your-rights",
      title: "Your Privacy Rights",
      icon: Shield,
      content: [
        {
          subtitle: "Access and Portability",
          text: "You can access, download, and export your personal data at any time through your account settings."
        },
        {
          subtitle: "Correction and Updates",
          text: "You can update or correct your personal information directly in your profile or by contacting our support team."
        },
        {
          subtitle: "Deletion",
          text: "You can delete your account and personal data at any time. Some information may be retained for legal or business purposes as outlined in this policy."
        },
        {
          subtitle: "Profile Visibility Control",
          text: "You have complete control over whether your profile is visible to employers and can change this setting at any time."
        }
      ]
    },
    {
      id: "cookies-tracking",
      title: "Cookies and Tracking",
      icon: Eye,
      content: [
        {
          subtitle: "Essential Cookies",
          text: "We use necessary cookies to provide core platform functionality, maintain your session, and ensure security."
        },
        {
          subtitle: "Analytics Cookies",
          text: "We use analytics tools to understand how users interact with our platform and to improve our services."
        },
        {
          subtitle: "Marketing Cookies",
          text: "With your consent, we may use cookies for targeted advertising and to measure the effectiveness of our marketing campaigns."
        },
        {
          subtitle: "Cookie Management",
          text: "You can control cookie preferences through your browser settings or our cookie preference center."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#2d4a3e] via-[#1d3a2e] to-[#2d4a3e] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Shield className="w-16 h-16 mx-auto mb-6 text-[#9fdf9f]" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl md:text-2xl text-[#9fdf9f]/80 max-w-3xl mx-auto">
              Your privacy is important to us. Learn how we collect, use, and protect your personal information.
            </p>
            <div className="mt-8 flex items-center justify-center text-[#9fdf9f]/70">
              <Calendar className="w-5 h-5 mr-2" />
              <span>Last updated: {lastUpdated}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-700 leading-relaxed mb-8">
              At 209 Works, we are committed to protecting your privacy and ensuring the security of your personal information.
              This Privacy Policy explains how we collect, use, share, and protect your information when you use our job platform
              and related services.
            </p>

            <div className="bg-[#2d4a3e]/5 border border-[#2d4a3e]/20 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-[#2d4a3e] mb-2">Key Points</h3>
              <ul className="text-[#1d3a2e] space-y-2">
                <li>• We only collect information necessary to provide our services</li>
                <li>• You control the visibility of your profile to employers</li>
                <li>• We never sell your personal information to third parties</li>
                <li>• You can delete your account and data at any time</li>
                <li>• We use industry-standard security measures to protect your data</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Sections */}
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
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {item.subtitle}
                          </h3>
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

      {/* Data Retention */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 px-8 py-6 border-b border-gray-200">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-green-600" />
                <h2 className="ml-4 text-2xl font-bold text-gray-900">Data Retention</h2>
              </div>
            </div>
            
            <div className="px-8 py-6">
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy:
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-2 h-2 bg-[#2d4a3e] rounded-full mt-2 mr-3"></span>
                    <span><strong>Active Accounts:</strong> We retain data while your account is active and for a reasonable period after account closure.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-2 h-2 bg-[#2d4a3e] rounded-full mt-2 mr-3"></span>
                    <span><strong>Legal Requirements:</strong> Some data may be retained longer to comply with legal obligations or resolve disputes.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-2 h-2 bg-[#2d4a3e] rounded-full mt-2 mr-3"></span>
                    <span><strong>Anonymized Data:</strong> We may retain anonymized usage data for analytics and platform improvement.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* International Transfers */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-8 py-6 border-b border-gray-200">
              <div className="flex items-center">
                <Globe className="w-8 h-8 text-purple-600" />
                <h2 className="ml-4 text-2xl font-bold text-gray-900">International Data Transfers</h2>
              </div>
            </div>
            
            <div className="px-8 py-6">
              <p className="text-gray-700 leading-relaxed mb-4">
                209 Works is based in California, United States. If you are accessing our services from outside the United States,
                please be aware that your information may be transferred to, stored, and processed in the United States.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We ensure that any international transfers of personal data are protected by appropriate safeguards, 
                including standard contractual clauses and other legally recognized transfer mechanisms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Children's Privacy */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-8 py-6 border-b border-gray-200">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-yellow-600" />
                <h2 className="ml-4 text-2xl font-bold text-gray-900">Children's Privacy</h2>
              </div>
            </div>
            
            <div className="px-8 py-6">
              <p className="text-gray-700 leading-relaxed">
                Our services are not intended for individuals under the age of 16. We do not knowingly collect personal information 
                from children under 16. If we become aware that we have collected personal information from a child under 16, 
                we will take steps to delete such information promptly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact and Updates */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <Mail className="w-12 h-12 text-[#2d4a3e] mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Us About Privacy</h3>
              <p className="text-gray-700 mb-6">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> privacy@209.works</p>
                <p><strong>Mail:</strong> 209 Works Privacy Team<br />Stockton, CA 95202</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <Calendar className="w-12 h-12 text-[#9fdf9f] mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Policy Updates</h3>
              <p className="text-gray-700 mb-6">
                We may update this Privacy Policy from time to time. When we do, we will:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• Post the updated policy on this page</li>
                <li>• Update the "Last Updated" date</li>
                <li>• Notify users of significant changes via email</li>
                <li>• Provide notice on our platform</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 bg-[#2d4a3e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold mb-8">Manage Your Privacy</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <a
                href="/profile/settings"
                className="bg-[#9fdf9f]/20 hover:bg-[#9fdf9f]/30 rounded-lg p-6 transition-all duration-200"
              >
                <Shield className="w-8 h-8 mx-auto mb-4 text-[#9fdf9f]" />
                <h3 className="font-semibold mb-2">Privacy Settings</h3>
                <p className="text-sm text-[#9fdf9f]/80">Control your profile visibility and data sharing preferences</p>
              </a>

              <a
                href="/profile"
                className="bg-[#9fdf9f]/20 hover:bg-[#9fdf9f]/30 rounded-lg p-6 transition-all duration-200"
              >
                <FileText className="w-8 h-8 mx-auto mb-4 text-[#9fdf9f]" />
                <h3 className="font-semibold mb-2">Download Data</h3>
                <p className="text-sm text-[#9fdf9f]/80">Export your personal data and account information</p>
              </a>

              <a
                href="/contact"
                className="bg-[#9fdf9f]/20 hover:bg-[#9fdf9f]/30 rounded-lg p-6 transition-all duration-200"
              >
                <Mail className="w-8 h-8 mx-auto mb-4 text-[#9fdf9f]" />
                <h3 className="font-semibold mb-2">Contact Support</h3>
                <p className="text-sm text-[#9fdf9f]/80">Get help with privacy questions or data requests</p>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 