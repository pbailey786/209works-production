import { NextRequest, NextResponse } from 'next/server';
import { ensureUserExists } from '@/lib/auth/user-sync';
import { prisma } from '@/lib/database/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    console.log('🎯 AI Skill Suggestions API called');
    
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

    // Create AI prompt for skill suggestions
    const prompt = `You are an AI career advisor specializing in the Central Valley (209 area) job market. Analyze the following user profile and provide personalized skill suggestions.

USER PROFILE:
- Current Role: ${targetRole || userProfile?.currentJobTitle || 'Not specified'}
- Current Skills: ${currentSkills?.join(', ') || userProfile?.skills?.join(', ') || 'None listed'}
- Experience Level: ${experienceLevel || 'Mid-level'}
- Education/Background: ${userProfile?.educationExperience || 'Not provided'}
- Location: ${userProfile?.location || 'Central Valley, CA'}
- Resume Content: ${resumeContent || 'Not provided'}

Please provide skill suggestions in this exact JSON format:
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

Focus on skills relevant to Central Valley employers like agriculture tech, logistics, healthcare, manufacturing, and emerging tech sectors. Limit to 8-12 most impactful suggestions.`;

    console.log('🤖 Calling OpenAI for skill suggestions...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert career advisor with deep knowledge of the Central Valley California job market. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    console.log('✅ OpenAI response received');

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