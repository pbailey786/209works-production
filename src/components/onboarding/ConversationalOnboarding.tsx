'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PaperAirplaneIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  SparklesIcon,
  UserIcon
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
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  type?: 'name_input' | 'resume_upload' | 'chat' | 'completion';
}

export default function ConversationalOnboarding({ user, onComplete }: ConversationalOnboardingProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<'name' | 'resume' | 'chat' | 'complete'>('name');
  const [nameInput, setNameInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: user.role === 'employer' 
        ? `Welcome to 209 Works! I'm here to help you find great talent for your business. Let's start by getting your name.`
        : `Welcome to 209 Works! I'm here to help you find amazing jobs in the 209 area. Let's start by getting your name.`,
      timestamp: new Date(),
      type: 'name_input'
    };
    setMessages([welcomeMessage]);
  }, [user.role]);

  const addMessage = (content: string, role: 'assistant' | 'user', type?: string) => {
    const message: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      type: type as any
    };
    setMessages(prev => [...prev, message]);
  };

  const handleNameSubmit = async () => {
    if (!nameInput.trim()) return;

    addMessage(nameInput, 'user');
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
              `Great to meet you, ${nameInput}! Now, what's your company name and what roles are you looking to fill?`,
              'assistant',
              'chat'
            );
            setCurrentStep('chat');
          } else {
            addMessage(
              `Nice to meet you, ${nameInput}! Now, do you have a resume you'd like to upload? This helps me find you the best job matches.`,
              'assistant',
              'resume_upload'
            );
            setCurrentStep('resume');
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
        addMessage(`✅ Resume uploaded: ${file.name}`, 'user');
        
        // Parse the resume to extract information
        setTimeout(async () => {
          addMessage(
            `Let me take a look at your resume...`,
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
              
              // Create a personalized message based on resume content
              let message = `Great! I've reviewed your resume. `;
              
              if (resumeInfo.experience?.totalYears) {
                message += `I see you have ${resumeInfo.experience.totalYears} years of experience`;
                if (resumeInfo.jobTitles?.length > 0) {
                  message += ` as a ${resumeInfo.jobTitles[0]}`;
                }
                message += `. `;
              }
              
              if (resumeInfo.skills?.length > 0) {
                const topSkills = resumeInfo.skills.slice(0, 3).join(', ');
                message += `Your skills in ${topSkills} are impressive! `;
              }
              
              if (resumeInfo.industries?.length > 0) {
                message += `With your background in ${resumeInfo.industries[0]}, `;
              }
              
              message += `I can help you find similar roles or explore new opportunities. What type of work environment are you looking for? Do you prefer working in a team or independently?`;
              
              addMessage(message, 'assistant', 'chat');
            } else {
              // Fallback if parsing fails
              addMessage(
                `I've saved your resume! Now let's talk about what kind of work you're looking for. What type of job interests you most?`,
                'assistant',
                'chat'
              );
            }
          } catch (parseError) {
            console.error('Resume parsing error:', parseError);
            // Fallback message
            addMessage(
              `Perfect! I've got your resume. Now let's talk about what kind of work you're looking for. What type of job interests you?`,
              'assistant',
              'chat'
            );
          }
          
          setCurrentStep('chat');
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
    addMessage("I don't have a resume right now", 'user');
    
    setTimeout(() => {
      addMessage(
        `No problem! I can help you find jobs without a resume, and later we can even help you create one. Let's talk about what kind of work you're looking for. What type of job interests you?`,
        'assistant',
        'chat'
      );
      setCurrentStep('chat');
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

        // After a few exchanges, complete onboarding
        const chatMessages = messages.filter(m => m.type === 'chat').length;
        if (chatMessages >= 3) {
          setTimeout(() => {
            addMessage(
              `Great! I've learned a lot about what you're looking for. Your profile is all set up. Let's take you to your dashboard where you can start exploring jobs!`,
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
        if (messages.filter(m => m.type === 'chat').length >= 1) {
          addMessage(
            `Thanks for sharing! I've got enough information to get you started. Let me set up your profile now.`,
            'assistant',
            'completion'
          );
          setCurrentStep('complete');
          setTimeout(() => completeOnboarding(), 2000);
        } else {
          // First message failed, ask a simpler question
          addMessage(
            `Let me ask you something simpler - are you looking for full-time or part-time work?`,
            'assistant',
            'chat'
          );
        }
      }
    } catch (error) {
      console.error('Error in chat:', error);
      addMessage(
        `I'm having trouble right now, but let's get you started! Your profile is set up and ready to go.`,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
              <SparklesIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Welcome to 209 Works!</h1>
              <p className="text-blue-100">Let's get you set up in just a few steps</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm break-words">{message.content}</p>
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
                  />
                </div>
                <button
                  onClick={handleNameSubmit}
                  disabled={!nameInput.trim() || isLoading}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 w-full sm:w-auto"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Continue</span>
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
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  <DocumentArrowUpIcon className="h-5 w-5 text-blue-500" />
                  <span className="text-blue-600 font-medium">Upload Resume</span>
                </button>
                
                <button
                  onClick={handleSkipResume}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 sm:w-auto w-full"
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

          {currentStep === 'chat' && (
            <div className="flex space-x-2 sm:space-x-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatMessage()}
                placeholder="Tell me about the work you're looking for..."
                className="flex-1 rounded-lg border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                disabled={isLoading}
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
        </div>
      </div>
    </div>
  );
}