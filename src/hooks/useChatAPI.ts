import { useState, useCallback, useRef } from 'react';


interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface JobGenieResponse {
  reply: string;
  jobTitle: string;
  company: string;
  contextLoaded: {
    hasCompanyInfo: boolean;
    hasKnowledgeBase: boolean;
    knowledgeCategories: string[];
  };
}

interface UseChatAPIOptions {
  jobId: string;
  jobTitle: string;
  company: string;
  apiEndpoint?: string;
  timeout?: number;
}

interface UseChatAPIReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  contextInfo: JobGenieResponse['contextLoaded'] | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  initializeChat: () => void;
}

export function useChatAPI(options: UseChatAPIOptions): UseChatAPIReturn {
  const {
    jobId,
    jobTitle,
    company,
    apiEndpoint = '/api/jobbot',
    timeout = 30000,
  } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextInfo, setContextInfo] = useState<
    JobGenieResponse['contextLoaded'] | null
  >(null);

  // Abort controller for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  const initializeChat = useCallback(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        role: 'assistant',
        content: `👋 Hi! I'm JobGenie, your AI assistant for this ${jobTitle} position at ${company}. I can help answer questions about the job requirements, company culture, benefits, and more. What would you like to know?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length, jobTitle, company]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: Message = {
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const messagesForAPI = messages.concat(userMessage).map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        );

        const fetchPromise = fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobId,
            messages: messagesForAPI,
          }),
          signal: controller.signal,
        });

        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || 'Failed to get response from JobGenie'
          );
        }

        const data: JobGenieResponse = await response.json();

        // Store context info on first successful response
        if (!contextInfo) {
          setContextInfo(data.contextLoaded);
        }

        const assistantMessage: Message = {
          role: 'assistant',
          content: data.reply,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error('JobGenie error:', error);

        if (error instanceof Error && error.name === 'AbortError') {
          // Request was cancelled, don't show error
          return;
        }

        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Something went wrong. Please try again.';
        setError(errorMessage);

        // Add error message to chat
        const errorChatMessage: Message = {
          role: 'assistant',
          content:
            '😅 Sorry, I encountered an issue. Please try asking your question again.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorChatMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, jobId, apiEndpoint, timeout, contextInfo]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setContextInfo(null);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    contextInfo,
    sendMessage,
    clearMessages,
    initializeChat,
  };
}
