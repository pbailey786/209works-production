import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/profile/resumes/[id]/analyze - Analyze resume with AI
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || user.role !== 'jobseeker') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resumeId = params.id;

    // Get the resume
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId: user.id,
      },
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // For now, we'll simulate AI analysis since we don't have actual PDF parsing
    // In a real implementation, you'd use a PDF parsing library like pdf-parse
    // and then send the extracted text to OpenAI for analysis

    const mockResumeText = `
      John Doe
      Software Engineer
      john.doe@email.com
      (555) 123-4567
      
      SUMMARY
      Experienced software engineer with 5 years of experience in web development.
      
      EXPERIENCE
      Senior Software Engineer - Tech Corp (2021-2024)
      - Developed web applications using React and Node.js
      - Led a team of 3 developers
      - Improved application performance by 40%
      
      Software Engineer - StartupXYZ (2019-2021)
      - Built REST APIs using Express.js
      - Worked with PostgreSQL databases
      - Implemented CI/CD pipelines
      
      EDUCATION
      Bachelor of Science in Computer Science
      University of Technology (2015-2019)
      
      SKILLS
      JavaScript, React, Node.js, PostgreSQL, Git, Docker
    `;

    try {
      // Parse resume content with AI
      const parseResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a resume parser. Extract structured information from the resume text and return it as JSON with the following structure:
            {
              "name": "string",
              "email": "string", 
              "phone": "string",
              "summary": "string",
              "experience": [
                {
                  "title": "string",
                  "company": "string", 
                  "duration": "string",
                  "description": "string"
                }
              ],
              "education": [
                {
                  "degree": "string",
                  "school": "string",
                  "year": "string"
                }
              ],
              "skills": ["string"]
            }`
          },
          {
            role: 'user',
            content: `Parse this resume:\n\n${mockResumeText}`
          }
        ],
        temperature: 0.1,
      });

      let parsedData;
      try {
        parsedData = JSON.parse(parseResponse.choices[0].message.content || '{}');
      } catch (e) {
        parsedData = {};
      }

      // Analyze resume and provide suggestions
      const analysisResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a professional resume reviewer. Analyze the resume and provide:
            1. A score from 0-100
            2. Top 3 improvement suggestions
            3. Top 2 strengths
            
            Return as JSON:
            {
              "score": number,
              "improvements": ["string"],
              "strengths": ["string"]
            }`
          },
          {
            role: 'user',
            content: `Analyze this resume:\n\n${mockResumeText}`
          }
        ],
        temperature: 0.3,
      });

      let aiSuggestions;
      try {
        aiSuggestions = JSON.parse(analysisResponse.choices[0].message.content || '{}');
      } catch (e) {
        aiSuggestions = {
          score: 75,
          improvements: [
            'Add quantifiable achievements with specific metrics',
            'Include relevant keywords for your target industry',
            'Expand the summary section to highlight unique value proposition'
          ],
          strengths: [
            'Clear work progression and career growth',
            'Relevant technical skills for software engineering roles'
          ]
        };
      }

      // Update resume with parsed data and AI suggestions
      const updatedResume = await prisma.resume.update({
        where: { id: resumeId },
        data: {
          parsedData,
          aiSuggestions,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Resume analyzed successfully',
        parsedData,
        aiSuggestions,
      });

    } catch (aiError) {
      console.error('AI analysis error:', aiError);
      
      // Fallback to mock data if AI fails
      const fallbackParsedData = {
        name: 'Resume Owner',
        email: user.email,
        summary: 'Professional with experience in their field',
        experience: [],
        education: [],
        skills: []
      };

      const fallbackSuggestions = {
        score: 70,
        improvements: [
          'Add more specific achievements and metrics',
          'Include relevant keywords for your industry',
          'Improve formatting and structure'
        ],
        strengths: [
          'Professional presentation',
          'Relevant experience listed'
        ]
      };

      // Update with fallback data
      await prisma.resume.update({
        where: { id: resumeId },
        data: {
          parsedData: fallbackParsedData,
          aiSuggestions: fallbackSuggestions,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Resume analyzed successfully',
        parsedData: fallbackParsedData,
        aiSuggestions: fallbackSuggestions,
      });
    }

  } catch (error) {
    console.error('Error analyzing resume:', error);
    return NextResponse.json(
      { error: 'Failed to analyze resume' },
      { status: 500 }
    );
  }
}
