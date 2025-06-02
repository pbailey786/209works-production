import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Resume Builder - 209 Works',
  description: 'Generate professional resumes from your work history using AI. Create ATS-friendly resumes that stand out to employers.',
};

export default function ResumeAIPage() {
  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Generation',
      description: 'Our advanced AI analyzes your work history and creates compelling resume content that highlights your achievements.'
    },
    {
      icon: '📊',
      title: 'ATS-Friendly Formatting',
      description: 'All resumes are optimized for Applicant Tracking Systems to ensure your resume gets past initial screenings.'
    },
    {
      icon: '🎨',
      title: 'Professional Templates',
      description: 'Choose from multiple industry-specific templates designed by career experts and hiring managers.'
    },
    {
      icon: '⚡',
      title: 'Quick Generation',
      description: 'Create a complete professional resume in under 5 minutes with our streamlined AI process.'
    },
    {
      icon: '🔄',
      title: 'Easy Updates',
      description: 'Modify and update your resume instantly as you gain new experiences or target different roles.'
    },
    {
      icon: '📱',
      title: 'Multiple Formats',
      description: 'Download your resume in PDF, Word, or plain text formats for different application requirements.'
    }
  ];

  const steps = [
    {
      step: '1',
      title: 'Enter Your Information',
      description: 'Provide your work history, education, and key skills. Our AI will analyze this information.'
    },
    {
      step: '2',
      title: 'AI Generates Content',
      description: 'Our AI creates compelling bullet points and descriptions that highlight your achievements.'
    },
    {
      step: '3',
      title: 'Review & Customize',
      description: 'Review the generated content and make any adjustments to match your preferences.'
    },
    {
      step: '4',
      title: 'Download & Apply',
      description: 'Download your professional resume and start applying to your dream jobs immediately.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <span className="text-6xl mr-4">📄</span>
            <h1 className="text-4xl font-bold text-gray-900">AI Resume Builder</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Generate professional, ATS-friendly resumes from your work history using advanced AI. 
            Create compelling content that showcases your achievements and gets you interviews.
          </p>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#2d4a3e] to-[#1d3a2e] rounded-xl p-8 mb-12 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Create Your AI-Generated Resume</h2>
          <p className="text-[#9fdf9f]/80 mb-6 max-w-2xl mx-auto">
            Join thousands of job seekers who have successfully landed interviews with AI-generated resumes.
            Start building your professional resume in minutes.
          </p>
          <button className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors">
            Start Building Resume - Premium Feature
          </button>
          <p className="text-[#9fdf9f]/60 text-sm mt-3">🔒 Premium feature • Upgrade to access</p>
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Why Choose Our AI Resume Builder</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-[#2d4a3e]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-[#2d4a3e]">{step.step}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sample Resume Preview */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">AI-Generated Resume Example</h2>
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-4xl mx-auto">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">John Smith</h3>
                <p className="text-gray-600">Senior Software Engineer</p>
                <p className="text-sm text-gray-500">john.smith@email.com • (555) 123-4567 • LinkedIn</p>
              </div>
              
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Professional Summary</h4>
                <p className="text-gray-700 text-sm bg-white p-3 rounded border-l-4 border-[#2d4a3e]">
                  Results-driven Software Engineer with 5+ years of experience developing scalable web applications.
                  Led cross-functional teams to deliver high-impact features, increasing user engagement by 40% and
                  reducing system downtime by 25%. Expert in React, Node.js, and cloud architecture.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Experience</h4>
                <div className="bg-white p-3 rounded border-l-4 border-[#9fdf9f]">
                  <p className="font-medium text-gray-900">Senior Software Engineer • TechCorp</p>
                  <p className="text-sm text-gray-600 mb-2">Jan 2020 - Present</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Architected and implemented microservices reducing API response time by 60%</li>
                    <li>• Mentored 3 junior developers, improving team velocity by 30%</li>
                    <li>• Led migration to cloud infrastructure, reducing operational costs by $50K annually</li>
                  </ul>
                </div>
              </div>
              
              <div className="text-center mt-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#2d4a3e]/10 text-[#2d4a3e]">
                  ✨ Generated by AI in 3 minutes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Resume Building Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#2d4a3e]/5 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[#2d4a3e] mb-2">💡 Pro Tip</h3>
              <p className="text-[#1d3a2e]">Use action verbs and quantify your achievements. Our AI automatically identifies impact metrics from your descriptions.</p>
            </div>

            <div className="bg-[#9fdf9f]/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[#2d4a3e] mb-2">🎯 ATS Optimization</h3>
              <p className="text-[#1d3a2e]">Include relevant keywords from job descriptions. Our AI suggests industry-specific terms for better ATS compatibility.</p>
            </div>

            <div className="bg-[#ff6b35]/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[#ff6b35] mb-2">📊 Content Strategy</h3>
              <p className="text-[#1d3a2e]">Focus on achievements, not responsibilities. Our AI transforms job duties into compelling accomplishment statements.</p>
            </div>

            <div className="bg-[#9fdf9f]/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[#2d4a3e] mb-2">✨ Customization</h3>
              <p className="text-[#1d3a2e]">Tailor your resume for each application. Use our tool to quickly generate variations for different roles.</p>
            </div>
          </div>
        </div>

        {/* Related Tools */}
        <div className="bg-[#2d4a3e] rounded-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-6 text-center">Complete Your Application</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/tools/coverletter-ai" className="bg-[#1d3a2e] hover:bg-[#0d2a1e] rounded-lg p-6 transition-colors">
              <div className="text-3xl mb-3">✉️</div>
              <h3 className="text-lg font-semibold mb-2">Cover Letter AI</h3>
              <p className="text-[#9fdf9f]/80 text-sm">Generate personalized cover letters that complement your resume. (Premium)</p>
            </Link>

            <Link href="/jobs" className="bg-[#1d3a2e] hover:bg-[#0d2a1e] rounded-lg p-6 transition-colors">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="text-lg font-semibold mb-2">Find Jobs</h3>
              <p className="text-[#9fdf9f]/80 text-sm">Search for jobs in the 209 area with our AI-powered search.</p>
            </Link>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center mt-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Build Your Professional Resume?</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join over 1,200 job seekers who have created professional resumes with our AI tool. 
              Start your resume today and land more interviews.
            </p>
            <button className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors">
              Upgrade to Premium →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 