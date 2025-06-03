import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Resume Builder - 209 Works',
  description:
    'Generate professional resumes from your work history using AI. Create ATS-friendly resumes that stand out to employers.',
};

export default function ResumeAIPage() {
  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Generation',
      description:
        'Our advanced AI analyzes your work history and creates compelling resume content that highlights your achievements.',
    },
    {
      icon: '📊',
      title: 'ATS-Friendly Formatting',
      description:
        'All resumes are optimized for Applicant Tracking Systems to ensure your resume gets past initial screenings.',
    },
    {
      icon: '🎨',
      title: 'Professional Templates',
      description:
        'Choose from multiple industry-specific templates designed by career experts and hiring managers.',
    },
    {
      icon: '⚡',
      title: 'Quick Generation',
      description:
        'Create a complete professional resume in under 5 minutes with our streamlined AI process.',
    },
    {
      icon: '🔄',
      title: 'Easy Updates',
      description:
        'Modify and update your resume instantly as you gain new experiences or target different roles.',
    },
    {
      icon: '📱',
      title: 'Multiple Formats',
      description:
        'Download your resume in PDF, Word, or plain text formats for different application requirements.',
    },
  ];

  const steps = [
    {
      step: '1',
      title: 'Enter Your Information',
      description:
        'Provide your work history, education, and key skills. Our AI will analyze this information.',
    },
    {
      step: '2',
      title: 'AI Generates Content',
      description:
        'Our AI creates compelling bullet points and descriptions that highlight your achievements.',
    },
    {
      step: '3',
      title: 'Review & Customize',
      description:
        'Review the generated content and make any adjustments to match your preferences.',
    },
    {
      step: '4',
      title: 'Download & Apply',
      description:
        'Download your professional resume and start applying to your dream jobs immediately.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center">
            <span className="mr-4 text-6xl">📄</span>
            <h1 className="text-4xl font-bold text-gray-900">
              AI Resume Builder
            </h1>
          </div>
          <p className="mx-auto max-w-3xl text-xl text-gray-600">
            Generate professional, ATS-friendly resumes from your work history
            using advanced AI. Create compelling content that showcases your
            achievements and gets you interviews.
          </p>
        </div>

        {/* CTA Section */}
        <div className="mb-12 rounded-xl bg-gradient-to-r from-[#2d4a3e] to-[#1d3a2e] p-8 text-center text-white">
          <h2 className="mb-4 text-2xl font-bold">
            Create Your AI-Generated Resume
          </h2>
          <p className="mx-auto mb-6 max-w-2xl text-[#9fdf9f]/80">
            Join thousands of job seekers who have successfully landed
            interviews with AI-generated resumes. Start building your
            professional resume in minutes.
          </p>
          <button className="rounded-lg bg-[#ff6b35] px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-[#e55a2b]">
            Start Building Resume - Premium Feature
          </button>
          <p className="mt-3 text-sm text-[#9fdf9f]/60">
            🔒 Premium feature • Upgrade to access
          </p>
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Why Choose Our AI Resume Builder
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 text-4xl">{feature.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-12 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            How It Works
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#2d4a3e]/10">
                  <span className="text-xl font-bold text-[#2d4a3e]">
                    {step.step}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sample Resume Preview */}
        <div className="mb-12">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            AI-Generated Resume Example
          </h2>
          <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
            <div className="rounded-lg bg-gray-50 p-6">
              <div className="mb-6 text-center">
                <h3 className="text-2xl font-bold text-gray-900">John Smith</h3>
                <p className="text-gray-600">Senior Software Engineer</p>
                <p className="text-sm text-gray-500">
                  john.smith@email.com • (555) 123-4567 • LinkedIn
                </p>
              </div>

              <div className="mb-6">
                <h4 className="mb-2 text-lg font-semibold text-gray-900">
                  Professional Summary
                </h4>
                <p className="rounded border-l-4 border-[#2d4a3e] bg-white p-3 text-sm text-gray-700">
                  Results-driven Software Engineer with 5+ years of experience
                  developing scalable web applications. Led cross-functional
                  teams to deliver high-impact features, increasing user
                  engagement by 40% and reducing system downtime by 25%. Expert
                  in React, Node.js, and cloud architecture.
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-900">
                  Experience
                </h4>
                <div className="rounded border-l-4 border-[#9fdf9f] bg-white p-3">
                  <p className="font-medium text-gray-900">
                    Senior Software Engineer • TechCorp
                  </p>
                  <p className="mb-2 text-sm text-gray-600">
                    Jan 2020 - Present
                  </p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>
                      • Architected and implemented microservices reducing API
                      response time by 60%
                    </li>
                    <li>
                      • Mentored 3 junior developers, improving team velocity by
                      30%
                    </li>
                    <li>
                      • Led migration to cloud infrastructure, reducing
                      operational costs by $50K annually
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 text-center">
                <span className="inline-flex items-center rounded-full bg-[#2d4a3e]/10 px-3 py-1 text-xs font-medium text-[#2d4a3e]">
                  ✨ Generated by AI in 3 minutes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            Resume Building Tips
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg bg-[#2d4a3e]/5 p-6">
              <h3 className="mb-2 text-lg font-semibold text-[#2d4a3e]">
                💡 Pro Tip
              </h3>
              <p className="text-[#1d3a2e]">
                Use action verbs and quantify your achievements. Our AI
                automatically identifies impact metrics from your descriptions.
              </p>
            </div>

            <div className="rounded-lg bg-[#9fdf9f]/20 p-6">
              <h3 className="mb-2 text-lg font-semibold text-[#2d4a3e]">
                🎯 ATS Optimization
              </h3>
              <p className="text-[#1d3a2e]">
                Include relevant keywords from job descriptions. Our AI suggests
                industry-specific terms for better ATS compatibility.
              </p>
            </div>

            <div className="rounded-lg bg-[#ff6b35]/10 p-6">
              <h3 className="mb-2 text-lg font-semibold text-[#ff6b35]">
                📊 Content Strategy
              </h3>
              <p className="text-[#1d3a2e]">
                Focus on achievements, not responsibilities. Our AI transforms
                job duties into compelling accomplishment statements.
              </p>
            </div>

            <div className="rounded-lg bg-[#9fdf9f]/10 p-6">
              <h3 className="mb-2 text-lg font-semibold text-[#2d4a3e]">
                ✨ Customization
              </h3>
              <p className="text-[#1d3a2e]">
                Tailor your resume for each application. Use our tool to quickly
                generate variations for different roles.
              </p>
            </div>
          </div>
        </div>

        {/* Related Tools */}
        <div className="rounded-xl bg-[#2d4a3e] p-8 text-white">
          <h2 className="mb-6 text-center text-2xl font-bold">
            Complete Your Application
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Link
              href="/tools/coverletter-ai"
              className="rounded-lg bg-[#1d3a2e] p-6 transition-colors hover:bg-[#0d2a1e]"
            >
              <div className="mb-3 text-3xl">✉️</div>
              <h3 className="mb-2 text-lg font-semibold">Cover Letter AI</h3>
              <p className="text-sm text-[#9fdf9f]/80">
                Generate personalized cover letters that complement your resume.
                (Premium)
              </p>
            </Link>

            <Link
              href="/jobs"
              className="rounded-lg bg-[#1d3a2e] p-6 transition-colors hover:bg-[#0d2a1e]"
            >
              <div className="mb-3 text-3xl">🔍</div>
              <h3 className="mb-2 text-lg font-semibold">Find Jobs</h3>
              <p className="text-sm text-[#9fdf9f]/80">
                Search for jobs in the 209 area with our AI-powered search.
              </p>
            </Link>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-12 text-center">
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              Ready to Build Your Professional Resume?
            </h2>
            <p className="mx-auto mb-6 max-w-2xl text-gray-600">
              Join over 1,200 job seekers who have created professional resumes
              with our AI tool. Start your resume today and land more
              interviews.
            </p>
            <button className="rounded-lg bg-[#ff6b35] px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-[#e55a2b]">
              Upgrade to Premium →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
