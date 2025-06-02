import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Cover Letter Generator - 209 Works',
  description: 'Generate personalized, compelling cover letters for any job using AI. Create tailored cover letters that stand out to employers.',
};

export default function CoverLetterAIPage() {
  const features = [
    {
      icon: '🎯',
      title: 'Job-Specific Personalization',
      description: 'Our AI analyzes job descriptions and creates tailored cover letters that address specific requirements and company needs.'
    },
    {
      icon: '📝',
      title: 'Professional Writing',
      description: 'Generate compelling, well-structured cover letters with professional tone and persuasive language.'
    },
    {
      icon: '⚡',
      title: 'Instant Generation',
      description: 'Create a complete, personalized cover letter in under 2 minutes for any job application.'
    },
    {
      icon: '🔍',
      title: 'Keyword Optimization',
      description: 'Automatically incorporates relevant keywords from job postings to improve your application\'s visibility.'
    },
    {
      icon: '🎨',
      title: 'Multiple Styles',
      description: 'Choose from different writing styles and tones to match company culture and industry standards.'
    },
    {
      icon: '📊',
      title: 'Success Metrics',
      description: 'Cover letters optimized based on successful application patterns and hiring manager preferences.'
    }
  ];

  const steps = [
    {
      step: '1',
      title: 'Input Job Details',
      description: 'Paste the job description or enter key details about the position and company.'
    },
    {
      step: '2',
      title: 'Add Your Background',
      description: 'Provide your relevant experience, skills, and achievements that match the role.'
    },
    {
      step: '3',
      title: 'AI Personalizes Content',
      description: 'Our AI creates a tailored cover letter that connects your background to the job requirements.'
    },
    {
      step: '4',
      title: 'Review & Send',
      description: 'Review the generated content, make any final adjustments, and submit your application.'
    }
  ];

  const examples = [
    {
      company: 'TechStart Inc.',
      role: 'Frontend Developer',
      preview: 'Dear Hiring Manager, I am excited to apply for the Frontend Developer position at TechStart Inc. Your commitment to creating user-centric digital experiences aligns perfectly with my passion for building intuitive interfaces...',
      highlight: 'Personalized opening that shows company research'
    },
    {
      company: 'Global Finance Corp',
      role: 'Data Analyst',
      preview: 'Dear Hiring Team, The Data Analyst opportunity at Global Finance Corp represents the perfect intersection of my analytical skills and your company\'s data-driven approach to financial solutions...',
      highlight: 'Industry-specific language and value proposition'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <span className="text-6xl mr-4">✉️</span>
            <h1 className="text-4xl font-bold text-gray-900">AI Cover Letter Generator</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Generate personalized, compelling cover letters for any job using advanced AI. 
            Create tailored content that showcases your fit and gets you noticed by employers.
          </p>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#2d4a3e] to-[#1d3a2e] rounded-xl p-8 mb-12 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Create Your Personalized Cover Letter</h2>
          <p className="text-[#9fdf9f]/80 mb-6 max-w-2xl mx-auto">
            Stand out from the competition with AI-generated cover letters that are tailored to each job.
            Increase your response rate with personalized, professional content.
          </p>
          <button className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors">
            Generate Cover Letter - Premium Feature
          </button>
          <p className="text-[#9fdf9f]/60 text-sm mt-3">🔒 Premium feature • Upgrade to access</p>
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Why Our AI Cover Letters Work</h2>
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

        {/* Example Cover Letters */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">AI-Generated Cover Letter Examples</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {examples.map((example, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{example.role}</h3>
                    <span className="text-sm text-gray-500">{example.company}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-green-500">
                    <p className="text-gray-700 text-sm italic">"{example.preview}"</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✨ {example.highlight}
                  </span>
                  <span className="text-xs text-gray-500">Generated in 90 seconds</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Before/After Comparison */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Before vs. After AI Enhancement</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-red-600 mb-4">❌ Generic Cover Letter</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  "Dear Sir/Madam, I am writing to apply for the position I saw on your website. 
                  I believe I would be a good fit for your company. I have experience in the field 
                  and am a hard worker. Please consider my application."
                </p>
                <div className="mt-3 text-xs text-red-600">
                  ⚠️ Lacks personalization, specific details, and compelling reasons to hire
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-4">✅ AI-Generated Cover Letter</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  "Dear Ms. Johnson, I was excited to discover the Senior Marketing Manager position at InnovateCorp. 
                  Your recent campaign for sustainable products aligns perfectly with my 5+ years of experience 
                  in eco-friendly marketing, where I increased brand engagement by 150% at my previous role..."
                </p>
                <div className="mt-3 text-xs text-green-600">
                  ✅ Personalized, specific, shows research, quantifies achievements
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Stats */}
        <div className="bg-gray-900 rounded-xl p-8 text-white mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Proven Results</h2>
            <p className="text-gray-300">Our AI-generated cover letters deliver measurable improvements</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-green-400 mb-2">3.2x</div>
              <div className="text-gray-300">Higher Response Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-400 mb-2">89%</div>
              <div className="text-gray-300">User Satisfaction</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-2">1,247</div>
              <div className="text-gray-300">Cover Letters Generated</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400 mb-2">67%</div>
              <div className="text-gray-300">Interview Rate Increase</div>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Cover Letter Best Practices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">🎯 Personalization</h3>
              <p className="text-blue-800">Always customize for each job. Our AI analyzes job descriptions to create unique, targeted content.</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2">📊 Show Value</h3>
              <p className="text-green-800">Quantify your achievements. Our AI helps translate your experience into measurable business impact.</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">🔍 Company Research</h3>
              <p className="text-purple-800">Reference specific company details. Our AI incorporates company information for authentic personalization.</p>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚡ Call to Action</h3>
              <p className="text-yellow-800">End with a strong closing. Our AI creates compelling calls to action that encourage follow-up.</p>
            </div>
          </div>
        </div>

        {/* Related Tools */}
        <div className="bg-gray-900 rounded-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-6 text-center">Complete Your Application</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/tools/resume-ai" className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition-colors">
              <div className="text-3xl mb-3">📄</div>
              <h3 className="text-lg font-semibold mb-2">Resume AI</h3>
              <p className="text-gray-300 text-sm">Generate professional resumes that complement your cover letter.</p>
            </Link>
            
            <Link href="/tools/resume-compare" className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition-colors">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-lg font-semibold mb-2">Resume Compare</h3>
              <p className="text-gray-300 text-sm">Optimize your resume against specific job descriptions.</p>
            </Link>
            
            <Link href="/tools/interview-coach" className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition-colors">
              <div className="text-3xl mb-3">🎤</div>
              <h3 className="text-lg font-semibold mb-2">Interview Coach</h3>
              <p className="text-gray-300 text-sm">Practice for interviews once you get called back.</p>
            </Link>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center mt-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Write Better Cover Letters?</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join hundreds of job seekers who have improved their application response rates with AI-generated cover letters. 
              Start creating personalized cover letters today.
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