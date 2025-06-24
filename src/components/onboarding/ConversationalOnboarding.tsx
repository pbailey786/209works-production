'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PaperAirplaneIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  SparklesIcon,
  UserIcon,
  ForwardIcon,
  ArrowRightIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

interface ConversationalOnboardingProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: 'jobseeker' | 'employer' | 'admin';
  };
  onComplete: () => void;
}

interface Message {
  id: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: Date;
  type?: 'welcome' | 'name_input' | 'resume_upload' | 'skills_confirm' | 'chat' | 'completion' | 'suggestions';
  actions?: Array<{ label: string; action: string; primary?: boolean }>;
  skills?: string[];
}

export default function ConversationalOnboarding({ user, onComplete }: ConversationalOnboardingProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<'welcome' | 'name' | 'resume' | 'skills' | 'chat' | 'complete'>('welcome');
  const [stepNumber, setStepNumber] = useState(1);
  const [nameInput, setNameInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [userName, setUserName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with narrative welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: user.role === 'employer' 
        ? `Hey there 👋 I'm your personal hiring AI — here to connect you with the best local talent.\n\nLet's get you set up real quick so I can do the heavy lifting. Sound good?`
        : `Hey there 👋 I'm your personal job-finder AI — here to match you with the best local jobs.\n\nLet's get you set up real quick so I can do the heavy lifting. Sound good?`,
      timestamp: new Date(),
      type: 'welcome',
      actions: [
        { label: "Let's go", action: 'start', primary: true },
        { label: 'Skip setup', action: 'skip' }
      ]
    };
    setMessages([welcomeMessage]);
  }, [user.role]);

  const addMessage = (content: string, role: 'assistant' | 'user' | 'system', type?: string, actions?: any[], skills?: string[]) => {
    const message: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      type: type as any,
      actions,
      skills
    };
    setMessages(prev => [...prev, message]);
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'start':
        addMessage("Let's go", 'user');
        setTimeout(() => {
          addMessage(
            "Cool! First things first — what should I call you?",
            'assistant',
            'name_input'
          );
          setCurrentStep('name');
          setStepNumber(2);
        }, 500);
        break;
      
      case 'skip':
        addMessage("Skip setup", 'user');
        completeOnboarding();
        break;
      
      case 'remind_later':
        addMessage("Remind me later", 'user');
        completeOnboarding();
        break;
      
      case 'confirm_skills':
        addMessage("Yep!", 'user');
        setTimeout(() => {
          addMessage(
            "Perfect! Now I can start matching jobs for you. Want to try asking me something like...\n\n• \"Find me full-time warehouse jobs nearby\"\n• \"What matches my experience?\"\n• \"Any jobs that pay over $20/hour?\"",
            'assistant',
            'suggestions'
          );
          setCurrentStep('chat');
          setStepNumber(4);
        }, 500);
        break;
      
      case 'edit_skills':
        addMessage("Make some edits", 'user');
        setTimeout(() => {
          addMessage(
            "Let's refine your skills. Tell me what skills you'd like to add or remove, or describe your ideal role and location.",
            'assistant',
            'chat'
          );
          setCurrentStep('chat');
        }, 500);
        break;
    }
  };

  const handleNameSubmit = async () => {
    if (!nameInput.trim()) return;

    addMessage(nameInput, 'user');
    setUserName(nameInput);
    setIsLoading(true);

    try {
      // Update user name in database
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim() })
      });

      if (response.ok) {
        setTimeout(() => {
          if (user.role === 'employer') {
            addMessage(
              `Nice to meet you, ${nameInput}. I'll keep things quick.\n\nNow, what's your company name and what roles are you looking to fill?`,
              'assistant',
              'chat'
            );
            setCurrentStep('chat');
            setStepNumber(3);
          } else {
            addMessage(
              `Nice to meet you, ${nameInput}. I'll keep things quick.\n\nTo give you the most relevant job matches, I can scan your resume and extract your skills, experience, and preferences. Want to upload it?\n\n✅ You can always skip for now\n✅ I'll never share your info with employers unless you apply`,
              'assistant',
              'resume_upload',
              [
                { label: 'Upload resume', action: 'upload', primary: true },
                { label: 'Skip for now', action: 'skip_resume' }
              ]
            );
            setCurrentStep('resume');
            setStepNumber(3);
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error updating name:', error);
    } finally {
      setIsLoading(false);
      setNameInput('');
    }
  };

  const handleResumeUpload = async (file: File) => {
    setIsLoading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'resume');

      const response = await fetch('/api/profile/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setResumeUploaded(true);
        addMessage(`Uploaded: ${file.name}`, 'user');
        
        // Parse the resume to extract information
        setTimeout(async () => {
          addMessage(
            `Scanning... 🔍`,
            'assistant'
          );
          
          try {
            const parseFormData = new FormData();
            parseFormData.append('file', file);
            
            const parseResponse = await fetch('/api/profile/parse-resume', {
              method: 'POST',
              body: parseFormData
            });
            
            if (parseResponse.ok) {
              const parseData = await parseResponse.json();
              const resumeInfo = parseData.data;
              
              // Extract skills for display
              const skills = resumeInfo.skills || [];
              const experience = resumeInfo.experience?.positions?.[0]?.title || resumeInfo.jobTitles?.[0] || '';
              const industry = resumeInfo.industries?.[0] || '';
              
              // Combine relevant info into skills array
              const displaySkills = [];
              if (experience) displaySkills.push(experience);
              if (industry && industry !== experience) displaySkills.push(industry);
              displaySkills.push(...skills.slice(0, 3));
              
              setExtractedSkills(displaySkills.slice(0, 5));
              
              setTimeout(() => {
                addMessage(
                  `Got it! Looks like you have experience in:`,
                  'assistant',
                  'skills_confirm',
                  [
                    { label: 'Yep!', action: 'confirm_skills', primary: true },
                    { label: 'Make some edits', action: 'edit_skills' }
                  ],
                  displaySkills.slice(0, 5)
                );
                setCurrentStep('skills');
              }, 1500);
            } else {
              // Fallback if parsing fails
              addMessage(
                `Perfect! I've saved your resume. Now I can start matching jobs for you. Want to try asking me something like...\n\n• \"Find me full-time jobs nearby\"\n• \"What matches my experience?\"\n• \"Any jobs that pay over $20/hour?\"`,
                'assistant',
                'suggestions'
              );
              setCurrentStep('chat');
              setStepNumber(4);
            }
          } catch (parseError) {
            console.error('Resume parsing error:', parseError);
            // Fallback message
            addMessage(
              `Great! I've got your resume. Now I can start matching jobs for you. Want to try asking me something like...\n\n• \"Find me jobs that match my skills\"\n• \"What's available in my area?\"\n• \"Show me full-time opportunities\"`,
              'assistant',
              'suggestions'
            );
            setCurrentStep('chat');
            setStepNumber(4);
          }
        }, 1500);
      } else {
        setUploadError(data.error || 'Upload failed');
      }
    } catch (error) {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipResume = () => {
    addMessage("Skip for now", 'user');
    
    setTimeout(() => {
      addMessage(
        `No problem! I can help you find jobs without a resume, and later we can even help you create one.\n\nNow I can start matching jobs for you. Want to try asking me something like...\n\n• \"Find me entry-level jobs nearby\"\n• \"What warehouse jobs are available?\"\n• \"Show me jobs that don't require experience\"`,
        'assistant',
        'suggestions'
      );
      setCurrentStep('chat');
      setStepNumber(4);
    }, 500);
  };

  const handleChatMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    addMessage(chatInput, 'user');
    const userMessage = chatInput;
    setChatInput('');
    setIsLoading(true);

    try {
      // Use the same chat API as homepage with timeout for mobile
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch('/api/chat-job-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage,
          conversationHistory: messages.slice(-5).map(m => ({ // Only last 5 messages to reduce payload
            role: m.role,
            content: m.content
          })),
          isOnboarding: true
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        addMessage(data.response, 'assistant', 'chat');

        // After first real job search query, complete onboarding
        const chatMessages = messages.filter(m => m.type === 'chat' || m.type === 'suggestions').length;
        if (chatMessages >= 1) {
          setTimeout(() => {
            addMessage(
              `Great! I've found some matches for you. Your profile is all set up — let's take you to your dashboard where you can explore all available jobs and save your favorites! 🎉`,
              'assistant',
              'completion'
            );
            setCurrentStep('complete');
            
            // Complete onboarding after showing completion message
            setTimeout(() => {
              completeOnboarding();
            }, 2000);
          }, 1500);
        }
      } else {
        // Handle non-ok responses more gracefully
        console.error('Chat API error:', response.status, response.statusText);
        
        // For mobile/onboarding, skip to completion if API fails
        addMessage(
          `Thanks for that info! I've got what I need to help you find great jobs. Let me take you to your dashboard now! 🎉`,
          'assistant',
          'completion'
        );
        setCurrentStep('complete');
        setTimeout(() => completeOnboarding(), 2000);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      addMessage(
        `I'm having a connection issue, but no worries! Your profile is set up and ready. Let's get you to your dashboard! 🎉`,
        'assistant',
        'completion'
      );
      setTimeout(() => completeOnboarding(), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      // Mark onboarding as completed
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingCompleted: true })
      });

      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still redirect even if API call fails
      onComplete();
    }
  };

  const totalSteps = 4;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                <SparklesIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Your Personal Job-Finder AI</h1>
                <p className="text-blue-100">Let's get you matched with great local jobs</p>
              </div>
            </div>
            {currentStep !== 'welcome' && currentStep !== 'complete' && (
              <div className="text-sm text-blue-100">
                Step {stepNumber} of {totalSteps}
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {currentStep !== 'welcome' && currentStep !== 'complete' && (
          <div className="px-6 pt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((message) => (
            <div key={message.id}>
              <div
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm break-words whitespace-pre-line">{message.content}</p>
                  
                  {/* Display extracted skills */}
                  {message.skills && message.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.skills.map((skill, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  {message.actions && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleAction(action.action)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            action.primary
                              ? 'bg-blue-500 text-white hover:bg-blue-600'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4 sm:p-6">
          {currentStep === 'name' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
                    placeholder="Enter your name..."
                    className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleNameSubmit}
                  disabled={!nameInput.trim() || isLoading}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 w-full sm:w-auto"
                >
                  <span>Continue</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 'resume' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleResumeUpload(file);
                }}
                className="hidden"
              />
              
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => {
                    handleAction('upload');
                    fileInputRef.current?.click();
                  }}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  <DocumentArrowUpIcon className="h-5 w-5" />
                  <span className="font-medium">Upload Resume</span>
                </button>
                
                <button
                  onClick={handleSkipResume}
                  disabled={isLoading}
                  className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 sm:w-auto w-full"
                >
                  Skip for now
                </button>
              </div>
              
              {uploadError && (
                <p className="text-red-600 text-sm">{uploadError}</p>
              )}
              
              <p className="text-xs text-gray-500 text-center">
                Supported formats: PDF, DOC, DOCX, TXT, RTF, ODT, PNG, JPG (max 5MB)
              </p>
            </div>
          )}

          {(currentStep === 'chat' || currentStep === 'skills') && (
            <div className="flex space-x-2 sm:space-x-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatMessage()}
                placeholder="Ask me about jobs..."
                className="flex-1 rounded-lg border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                disabled={isLoading}
                autoFocus
              />
              <button
                onClick={handleChatMessage}
                disabled={!chatInput.trim() || isLoading}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-green-600">
                <CheckCircleIcon className="h-6 w-6" />
                <span className="font-medium">Setup Complete!</span>
              </div>
            </div>
          )}

          {/* Skip/Remind Later Option */}
          {currentStep !== 'welcome' && currentStep !== 'complete' && (
            <div className="mt-4 text-center">
              <button
                onClick={() => handleAction('remind_later')}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Remind me later
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}