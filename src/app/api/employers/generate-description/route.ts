import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { openai } from '@/lib/ai';
import { findJobTemplate } from '@/lib/ai/job-knowledge-base';

export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, location, salary } = await req.json();
    
    if (!title) {
      return NextResponse.json({ error: 'Job title is required' }, { status: 400 });
    }

    // Try AI first with short timeout
    try {
      const prompt = `Write a concise job description for a ${title} position in ${location || 'Stockton, CA'}${salary ? ` paying ${salary}` : ''}. 

Format as:
DESCRIPTION: 2-3 sentences about main duties and what makes this job appealing
REQUIREMENTS: 3-4 bullet points of basic requirements

Keep it professional but friendly. Focus on Central Valley work culture.`;

      const completion = await Promise.race([
        openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful job description writer for Central Valley employers. Be concise and practical.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 250
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI timeout')), 5000)
        )
      ]) as any;

      const aiContent = completion.choices?.[0]?.message?.content || '';
      
      // Parse AI response
      const descMatch = aiContent.match(/DESCRIPTION:\s*(.*?)(?=REQUIREMENTS:|$)/s);
      const reqMatch = aiContent.match(/REQUIREMENTS:\s*(.*?)$/s);
      
      const description = descMatch?.[1]?.trim() || '';
      const requirements = reqMatch?.[1]?.trim() || '';

      if (description) {
        return NextResponse.json({
          description,
          requirements
        });
      }
    } catch (error) {
      console.log('AI failed, using template fallback');
    }

    // Fallback to template system
    const template = findJobTemplate(title);
    
    if (template) {
      const description = template.typicalDuties.slice(0, 3).join('. ') + '.';
      const requirements = '• ' + template.typicalRequirements.slice(0, 4).join('\n• ');
      
      return NextResponse.json({
        description,
        requirements
      });
    }

    // Final fallback - generic description
    const fallbackDescription = `We're looking for a reliable ${title} to join our team in ${location || 'Stockton'}. You'll handle daily responsibilities with attention to detail and work with a supportive team.`;
    const fallbackRequirements = '• Must be 18+ years old\n• Reliable transportation\n• Good work ethic\n• Ability to work in a team';

    return NextResponse.json({
      description: fallbackDescription,
      requirements: fallbackRequirements
    });

  } catch (error) {
    console.error('Generate description error:', error);
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    );
  }
}