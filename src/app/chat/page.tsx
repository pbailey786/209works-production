'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Send, Bot, User, Sparkles, MessageCircle, History } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize chat session
    initializeChat();
    loadChatHistory();
  }, []);

  const initializeChat = async () => {
    try {
      const response = await fetch('/api/jobs/chatbot');
      const data = await response.json();

      if (data.success) {
        setSessionId(data.sessionId);
        if (data.welcomeMessage) {
          setMessages([{
            id: '1',
            content: data.welcomeMessage,
            role: 'assistant',
            timestamp: new Date()
          }]);
        }
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      setMessages([{
        id: '1',
        content: "Hi! I'm JobsGPT, your AI job search assistant for the 209 area. I can help you find jobs, learn about local companies, and get career advice. What can I help you with today?",
        role: 'assistant',
        timestamp: new Date()
      }]);
    }
  };

  const loadChatHistory = async () => {
    try {
      const response = await fetch('/api/chat-history');
      const data = await response.json();

      if (data.success) {
        setChatHistory(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/jobs/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          sessionId: sessionId
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          role: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const loadChatSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat-history/${sessionId}`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.messages || []);
        setSessionId(sessionId);
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Failed to load chat session:', error);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setSessionId(null);
    initializeChat();
    setShowHistory(false);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`${showHistory ? 'w-80' : 'w-16'} bg-card border-r border-border transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-sm font-bold">209</span>
              </div>
              {showHistory && <span className="font-bold">Works</span>}
            </Link>

            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <History className="h-5 w-5" />
            </button>
          </div>
        </div>

        {showHistory && (
          <div className="flex-1 overflow-y-auto p-4">
            <button
              onClick={startNewChat}
              className="w-full mb-4 p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span>New Chat</span>
            </button>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent Chats</h3>
              {chatHistory.map((session) => (
                <button
                  key={session.id}
                  onClick={() => loadChatSession(session.id)}
                  className="w-full p-3 text-left hover:bg-muted rounded-lg transition-colors"
                >
                  <div className="font-medium text-sm truncate">{session.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{session.lastMessage}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {session.timestamp.toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">JobsGPT</h1>
                <p className="text-sm text-muted-foreground">AI Job Search Assistant for Central Valley</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-4">
              <Link href="/jobs" className="text-muted-foreground hover:text-foreground">
                Browse Jobs
              </Link>
              <Link href="/search" className="text-muted-foreground hover:text-foreground">
                Advanced Search
              </Link>
              <Link href="/profile" className="text-muted-foreground hover:text-foreground">
                Profile
              </Link>
            </nav>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-3xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} space-x-3`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gradient-to-br from-primary to-secondary text-white'
                }`}>
                  {message.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>

                <div className={`rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-3'
                    : 'bg-muted mr-3'
                }`}>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex max-w-3xl flex-row space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-lg p-4 bg-muted">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about jobs in the 209 area, career advice, or local companies..."
                className="w-full resize-none rounded-lg border border-border p-3 pr-12 focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-2 text-xs text-muted-foreground text-center">
            JobsGPT can help you find jobs, research companies, and get career advice for the Central Valley region.
          </div>
        </div>
      </div>
    </div>
  );
}
