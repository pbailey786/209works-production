'use client';

import { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  X, 
  FileText, 
  Clock, 
  CheckCircle, 
  User,
  MessageSquare,
  Calendar,
  Award,
  AlertCircle,
  Copy,
  Edit3
} from 'lucide-react';
import { EMAIL_TEMPLATES, getTemplatesByCategory, getTemplateById, populateTemplate, getDefaultVariables } from '@/lib/email-templates';
import type { EmailTemplate } from '@/lib/email-templates';

interface CommunicationCenterProps {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  onClose: () => void;
  onEmailSent?: () => void;
}

interface EmailHistory {
  id: string;
  subject: string;
  sentAt: string;
  templateUsed?: string;
  status: 'sent' | 'failed' | 'pending';
}

const CATEGORY_CONFIG = {
  initial: {
    icon: User,
    label: 'Initial Contact',
    color: 'blue',
    description: 'First outreach and application acknowledgments'
  },
  interview: {
    icon: Calendar,
    label: 'Interview',
    color: 'purple',
    description: 'Interview invitations and scheduling'
  },
  decision: {
    icon: Award,
    label: 'Decision',
    color: 'green',
    description: 'Job offers and rejection letters'
  },
  followup: {
    icon: MessageSquare,
    label: 'Follow-up',
    color: 'orange',
    description: 'Check-ins and additional communication'
  }
};

export default function CommunicationCenter({ 
  candidateId, 
  candidateName, 
  candidateEmail, 
  jobTitle, 
  companyName, 
  onClose,
  onEmailSent 
}: CommunicationCenterProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('initial');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [employerProfile, setEmployerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load employer profile and email history
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [profileResponse, historyResponse] = await Promise.all([
          fetch('/api/employers/profile'),
          fetch(`/api/employers/candidates/${candidateId}/emails`)
        ]);

        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          setEmployerProfile(profile);
        } else {
          throw new Error('Failed to load profile');
        }

        if (historyResponse.ok) {
          const history = await historyResponse.json();
          setEmailHistory(history.emails || []);
        }
      } catch (error) {
        console.error('Error loading communication data:', error);
        setError('Failed to load communication data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [candidateId]);

  // Initialize default variables when employer profile loads
  useEffect(() => {
    if (employerProfile) {
      const defaults = getDefaultVariables(employerProfile, { title: jobTitle });
      setCustomVariables({
        ...defaults,
        candidateName,
        candidateEmail,
      });
    }
  }, [employerProfile, candidateName, candidateEmail, jobTitle]);

  // Update email content when template is selected
  useEffect(() => {
    if (selectedTemplate && customVariables) {
      const populated = populateTemplate(selectedTemplate, customVariables);
      setEmailSubject(populated.subject);
      setEmailBody(populated.body);
    }
  }, [selectedTemplate, customVariables]);

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsCustomMode(false);
  };

  const handleCustomMode = () => {
    setIsCustomMode(true);
    setSelectedTemplate(null);
    setEmailSubject(`Re: ${jobTitle} Application`);
    setEmailBody(`Hi ${candidateName},\n\n\n\nBest regards,\n${customVariables.employerName}\n${companyName}`);
  };

  const handleVariableChange = (key: string, value: string) => {
    setCustomVariables(prev => ({ ...prev, [key]: value }));
  };

  const sendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      alert('Please enter both subject and message before sending.');
      return;
    }

    // Validate email content length
    if (emailSubject.length > 200) {
      alert('Subject line is too long. Please keep it under 200 characters.');
      return;
    }

    if (emailBody.length > 10000) {
      alert('Message is too long. Please keep it under 10,000 characters.');
      return;
    }

    try {
      setIsSending(true);
      const response = await fetch('/api/employers/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: candidateEmail,
          subject: emailSubject,
          message: emailBody,
          candidateId,
          templateUsed: selectedTemplate?.id || 'custom',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      // Add to history
      const newEmail: EmailHistory = {
        id: Date.now().toString(),
        subject: emailSubject,
        sentAt: new Date().toISOString(),
        templateUsed: selectedTemplate?.name || 'Custom',
        status: 'sent'
      };
      
      setEmailHistory(prev => [newEmail, ...prev]);
      
      onEmailSent?.();
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const currentTemplates = getTemplatesByCategory(selectedCategory);

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="mx-4 w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading communication center...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="mx-4 w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Error Loading Communication Center</h3>
            <p className="mb-4 text-gray-600">{error}</p>
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog" 
      aria-modal="true"
      aria-labelledby="communication-center-title"
    >
      <div className="mx-4 w-full max-w-6xl rounded-lg bg-white shadow-xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="communication-center-title" className="text-xl font-semibold text-gray-900">Communication Center</h2>
              <p className="text-sm text-gray-600">
                Compose professional email to {candidateName} for {jobTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Left Sidebar - Templates */}
          <div className="w-1/3 border-r border-gray-200 bg-gray-50">
            <div className="p-4">
              <div className="mb-4">
                <button
                  onClick={handleCustomMode}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    isCustomMode 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <Edit3 className="mr-2 h-4 w-4" />
                    <span className="font-medium">Custom Email</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">Write your own message</p>
                </button>
              </div>

              <div className="space-y-4">
                {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
                  const Icon = config.icon;
                  const templates = getTemplatesByCategory(category);
                  
                  return (
                    <div key={category}>
                      <button
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full rounded-lg border p-3 text-left transition-colors ${
                          selectedCategory === category && !isCustomMode
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Icon className={`mr-2 h-4 w-4 text-${config.color}-500`} />
                            <span className="font-medium">{config.label}</span>
                          </div>
                          <span className="text-xs text-gray-500">{templates.length}</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-600">{config.description}</p>
                      </button>

                      {selectedCategory === category && !isCustomMode && (
                        <div className="mt-2 space-y-2 pl-4">
                          {templates.map((template) => (
                            <button
                              key={template.id}
                              onClick={() => handleTemplateSelect(template)}
                              className={`w-full rounded-md border p-2 text-left text-sm transition-colors ${
                                selectedTemplate?.id === template.id
                                  ? 'border-blue-400 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 bg-white hover:bg-gray-50'
                              }`}
                            >
                              <div className="font-medium">{template.name}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Email History */}
            <div className="border-t border-gray-200 p-4">
              <h3 className="mb-3 font-medium text-gray-900">Recent Emails</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {emailHistory.length === 0 ? (
                  <p className="text-sm text-gray-500">No previous emails</p>
                ) : (
                  emailHistory.slice(0, 5).map((email) => (
                    <div key={email.id} className="rounded-md border border-gray-200 bg-white p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-900 truncate">
                          {email.subject}
                        </span>
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                        <span>{email.templateUsed}</span>
                        <span>{new Date(email.sentAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Email Composer */}
          <div className="flex-1 flex flex-col">
            {/* Template Variables (if using template) */}
            {selectedTemplate && !isCustomMode && (
              <div className="border-b border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-3 font-medium text-gray-900">Customize Variables</h3>
                <div className="grid grid-cols-2 gap-3 max-h-32 overflow-y-auto">
                  {selectedTemplate.variables.map((variable) => (
                    <div key={variable}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {variable.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                      <input
                        type="text"
                        value={customVariables[variable] || ''}
                        onChange={(e) => handleVariableChange(variable, e.target.value)}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                        placeholder={`Enter ${variable}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Email Composer */}
            <div className="flex-1 p-6">
              <div className="space-y-4">
                {/* To Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
                  <div className="rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                    {candidateEmail}
                  </div>
                </div>

                {/* Subject Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Email subject"
                  />
                </div>

                {/* Message Field */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Message:</label>
                    <button
                      onClick={() => copyToClipboard(emailBody)}
                      className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      Copy
                    </button>
                  </div>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={16}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                    placeholder="Type your message here..."
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedTemplate ? (
                    <span>Using template: <strong>{selectedTemplate.name}</strong></span>
                  ) : isCustomMode ? (
                    <span>Custom email</span>
                  ) : (
                    <span>Select a template or write custom email</span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={onClose}
                    className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendEmail}
                    disabled={!emailSubject.trim() || !emailBody.trim() || isSending}
                    className="flex items-center rounded bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}