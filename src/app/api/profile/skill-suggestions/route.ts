import { NextRequest, NextResponse } from 'next/server';
import { ensureUserExists } from '@/lib/auth/user-sync';
import { prisma } from '@/lib/database/prisma';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client for Claude
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

export async function POST(req: NextRequest) {
  try {
    console.log('🎯 AI Skill Suggestions API called');
    
    // Check if Claude is available
    if (!anthropic) {
      return NextResponse.json({ 
        error: 'AI service temporarily unavailable. Please try again later.' 
      }, { status: 503 });
    }

    // Ensure user exists in database
    const currentUser = await ensureUserExists();
    console.log('✅ User sync completed:', currentUser.id);

    const { resumeContent, currentSkills, targetRole, experienceLevel } = await req.json();

    if (!resumeContent && !currentSkills?.length) {
      return NextResponse.json({ 
        error: 'Need resume content or current skills to provide suggestions' 
      }, { status: 400 });
    }

    // Get user's profile data
    const userProfile = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        currentJobTitle: true,
        skills: true,
        educationExperience: true,
        preferredJobTypes: true,
        location: true,
      }
    });

    // Create AI prompt for skill suggestions with casual tone
    const prompt = `Hey! I'm a career advisor who knows the Central Valley job scene like the back of my hand. Let me check out this profile and hook them up with some solid skill recommendations.

USER PROFILE:
- Current Role: ${targetRole || userProfile?.currentJobTitle || 'Not specified'}
- Current Skills: ${currentSkills?.join(', ') || userProfile?.skills?.join(', ') || 'None listed'}
- Experience Level: ${experienceLevel || 'Mid-level'}
- Education/Background: ${userProfile?.educationExperience || 'Not provided'}
- Location: ${userProfile?.location || 'Central Valley, CA'}
- Resume Content: ${resumeContent || 'Not provided'}

Give me skill suggestions in this exact JSON format (but write the actual advice in a friendly, conversational tone - like you're talking to a friend about their career):
{
  "suggestedSkills": [
    {
      "skill": "Skill name",
      "category": "Technical|Soft|Industry|Certification",
      "priority": "High|Medium|Low",
      "reason": "Why this skill is important for their career",
      "localDemand": "High|Medium|Low",
      "learningResources": ["Resource 1", "Resource 2"],
      "timeToLearn": "1-3 months|3-6 months|6+ months"
    }
  ],
  "skillGapAnalysis": {
    "strengths": ["Current strong skills"],
    "gaps": ["Skills missing for target role"],
    "recommendations": "Overall career development advice"
  },
  "centralValleyInsights": {
    "topInDemandSkills": ["Skills highly sought in 209 area"],
    "emergingTrends": ["New skills becoming important locally"],
    "industryFocus": "Key industries in Central Valley hiring for these skills"
  }
}

Keep it real - focus on skills that Central Valley employers actually want. Think ag tech, logistics, healthcare, manufacturing, and the tech scene that's growing here. Give me 8-12 skills that'll actually make a difference for their career. Be encouraging but honest about what it takes to level up in the 209.`;

    console.log('🤖 Calling Claude for skill suggestions...');
    
    const completion = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307', // Fast and cost-effective
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      system: `You're a chill but knowledgeable career advisor who really gets the Central Valley job market. You know what employers here are looking for and you keep it 100 with job seekers. Always respond with valid JSON only, but make the content inside conversational and encouraging - like you're helping out a friend.`,
      temperature: 0.8, // Slightly higher for more personality
      max_tokens: 2000,
    });

    const aiResponse = completion.content[0]?.type === 'text' ? completion.content[0].text : null;
    console.log('✅ Claude response received');

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    let skillSuggestions;
    try {
      skillSuggestions = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Invalid AI response format');
    }

    // Store the suggestion session for analytics
    await prisma.chatAnalytics.create({
      data: {
        userId: currentUser.id,
        question: `Skill suggestions for ${targetRole || 'career development'}`,
        response: JSON.stringify(skillSuggestions),
        responseTime: Date.now(),
        jobsFound: skillSuggestions.suggestedSkills?.length || 0,
        sessionId: `skill_session_${Date.now()}`,
        createdAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      data: skillSuggestions,
      metadata: {
        generatedAt: new Date().toISOString(),
        userLocation: userProfile?.location,
        analysisType: 'ai_skill_suggestions'
      }
    });

  } catch (error) {
    console.error('❌ Skill suggestions error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate skill suggestions',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve cached suggestions
export async function GET(req: NextRequest) {
  try {
    const currentUser = await ensureUserExists();
    
    // For now, return placeholder data
    // In production, you might cache suggestions in database
    return NextResponse.json({
      success: true,
      cached: true,
      data: {
        suggestedSkills: [],
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching cached suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}