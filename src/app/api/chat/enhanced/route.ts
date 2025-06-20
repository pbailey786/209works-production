import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { EnhancedJobsGPT } from '@/lib/ai/enhanced-jobsgpt';
import { z } from 'zod';

// Validation schema
const chatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  sessionId: z.string().uuid().optional(),
  includeCareerInsights: z.boolean().default(true),
  includeTrainingRecommendations: z.boolean().default(true),
});

// POST /api/chat/enhanced - Enhanced chat with career transition intelligence
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { message, sessionId, includeCareerInsights, includeTrainingRecommendations } = 
      chatRequestSchema.parse(body);

    // Get or create chat session
    let session;
    if (sessionId) {
      session = await prisma.chatSession.findUnique({
        where: { id: sessionId, userId: user.id },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });
    }

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          userId: user.id,
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
          isActive: true,
        },
        include: {
          messages: true,
        },
      });
    }

    // Get conversation history
    const conversationHistory = session.messages.map(msg => ({
      type: msg.role,
      content: msg.content,
      timestamp: msg.createdAt,
    }));

    // Generate enhanced response
    const response = await EnhancedJobsGPT.generateResponse(
      message,
      user.id,
      conversationHistory
    );

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: message,
      },
    });

    // Save AI response
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: response.message,
        metadata: {
          hasCareerInsights: (response.careerInsights?.length || 0) > 0,
          hasTrainingRecommendations: (response.trainingOpportunities?.length || 0) > 0,
          hasJobs: (response.jobs?.length || 0) > 0,
        },
      },
    });

    // Update session activity
    await prisma.chatSession.update({
      where: { id: session.id },
      data: { 
        updatedAt: new Date(),
        messageCount: { increment: 2 }, // User + AI message
      },
    });

    // Filter response based on user preferences
    const filteredResponse = {
      ...response,
      careerInsights: includeCareerInsights ? response.careerInsights : undefined,
      trainingOpportunities: includeTrainingRecommendations ? response.trainingOpportunities : undefined,
    };

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      response: filteredResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in enhanced chat:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

// GET /api/chat/enhanced - Get enhanced chat capabilities info
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile to show personalized capabilities
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        jobSeekerProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const currentIndustry = user.jobSeekerProfile?.currentJobTitle 
      ? extractIndustry(user.jobSeekerProfile.currentJobTitle)
      : null;

    const capabilities = {
      careerTransitionInsights: {
        available: true,
        description: 'Get insights about career transitions, success rates, and salary expectations',
        currentIndustry,
        popularTransitions: currentIndustry ? [
          `${currentIndustry} → Technology`,
          `${currentIndustry} → Healthcare`,
          `${currentIndustry} → Sales`,
        ] : [
          'Retail → Technology',
          'Customer Service → Sales',
          'Manufacturing → Logistics',
        ],
      },
      trainingRecommendations: {
        available: true,
        description: 'Personalized training program recommendations based on your career goals',
        localProviders: [
          'San Joaquin Delta College',
          'University of the Pacific',
          'Carrington College',
          'Online platforms (Coursera, Udemy)',
        ],
      },
      salaryInsights: {
        available: true,
        description: 'Market salary data for the 209 area with transition expectations',
        regions: ['Stockton', 'Modesto', 'Tracy', 'Manteca', 'Lodi'],
      },
      jobMatching: {
        available: true,
        description: 'AI-powered job matching with career transition considerations',
        features: ['Skill gap analysis', 'Transferable skills identification', 'Growth potential'],
      },
    };

    const exampleQueries = [
      "I want to transition from retail to tech - is that realistic?",
      "What skills do I need to become a software developer?",
      "How much do nurses make in Stockton?",
      "I'm in customer service but want better pay - what are my options?",
      "What training programs are available for healthcare careers?",
      "Show me jobs that value my retail experience",
    ];

    return NextResponse.json({
      success: true,
      capabilities,
      exampleQueries,
      userProfile: {
        hasProfile: !!user.jobSeekerProfile,
        currentIndustry,
        experience: user.jobSeekerProfile?.experience || 0,
        skills: user.jobSeekerProfile?.skills || [],
      },
      tips: [
        "Be specific about your career goals for better recommendations",
        "Mention your current job or industry for personalized insights",
        "Ask about training programs to get local recommendations",
        "Include salary expectations to get realistic market data",
      ],
    });
  } catch (error) {
    console.error('Error fetching enhanced chat capabilities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch capabilities' },
      { status: 500 }
    );
  }
}

// Helper function to extract industry from job title
function extractIndustry(jobTitle: string): string {
  const industryKeywords = {
    'Technology': ['software', 'developer', 'engineer', 'programmer', 'tech', 'IT'],
    'Healthcare': ['nurse', 'doctor', 'medical', 'healthcare', 'clinical'],
    'Retail': ['cashier', 'sales associate', 'retail', 'store', 'customer service'],
    'Finance': ['accountant', 'financial', 'banker', 'analyst', 'finance'],
    'Education': ['teacher', 'professor', 'educator', 'academic', 'instructor'],
    'Manufacturing': ['operator', 'assembly', 'production', 'factory', 'warehouse'],
    'Sales': ['sales', 'account manager', 'business development', 'representative'],
    'Marketing': ['marketing', 'brand', 'digital marketing', 'content', 'social media'],
  };

  const title = jobTitle.toLowerCase();
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some(keyword => title.includes(keyword))) {
      return industry;
    }
  }

  return 'Other';
}
