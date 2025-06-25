import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { openai } from '@/lib/ai';

interface CSVJobData {
  title: string;
  description: string;
  requirements: string;
  salary: string;
  location: string;
  jobType: string;
  contactEmail?: string;
}

const JOB_ENHANCEMENT_PROMPT = `You are an expert job posting optimizer for 209.works, serving California's Central Valley job market. 

Your task is to enhance job postings to be more effective at attracting qualified local candidates while maintaining the employer's original intent.

ENHANCEMENT GUIDELINES:
1. Keep the original job title unless it's unclear
2. Improve the description to be more compelling and specific
3. Add relevant local context when appropriate
4. Ensure salary/wage is competitive for the Central Valley market
5. Make requirements clear but not overly restrictive
6. Add soft skills that matter for the role
7. Mention benefits or growth opportunities if space allows

CENTRAL VALLEY CONTEXT:
- Major cities: Stockton, Modesto, Fresno, Merced, Turlock
- Strong bilingual workforce (English/Spanish)
- Industries: Agriculture, manufacturing, healthcare, retail, logistics
- Commuter population to Bay Area
- Family-oriented workforce
- Typical wage ranges: $15-25/hr entry level, $25-40/hr skilled

RESPONSE FORMAT:
Return a JSON object with the enhanced job data:
{
  "title": "Enhanced title (or original if good)",
  "description": "Enhanced description with local appeal",
  "requirements": "Clarified requirements (essential vs preferred)",
  "salary": "Market-appropriate salary range",
  "location": "Specific location (city, CA)",
  "jobType": "full-time/part-time/contract",
  "benefits": "Any benefits mentioned or suggested",
  "aiEnhancements": "Brief note on what was improved"
}`;

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobs } = await req.json();
    
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ error: 'No jobs provided' }, { status: 400 });
    }

    if (jobs.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 jobs per batch' }, { status: 400 });
    }

    const processedJobs = [];

    // Process jobs in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (job: CSVJobData, index: number) => {
        try {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
              { 
                role: 'system', 
                content: JOB_ENHANCEMENT_PROMPT 
              },
              {
                role: 'user',
                content: `Please enhance this job posting for the Central Valley market:

Title: ${job.title}
Description: ${job.description}
Requirements: ${job.requirements || 'Not specified'}
Salary: ${job.salary}
Location: ${job.location}
Job Type: ${job.jobType || 'full-time'}
Contact: ${job.contactEmail || 'Not specified'}`
              }
            ],
            temperature: 0.3,
            max_tokens: 800,
          });

          const aiResponse = completion.choices[0]?.message?.content;
          
          if (!aiResponse) {
            throw new Error('No AI response');
          }

          try {
            const enhancedJob = JSON.parse(aiResponse);
            return {
              ...job,
              ...enhancedJob,
              originalData: job,
              processedAt: new Date().toISOString(),
              batchIndex: i + index
            };
          } catch (parseError) {
            // Fallback if AI doesn't return valid JSON
            return {
              ...job,
              aiEnhancements: 'AI processing failed, using original data',
              processedAt: new Date().toISOString(),
              batchIndex: i + index
            };
          }

        } catch (error) {
          console.error(`Error processing job ${i + index}:`, error);
          return {
            ...job,
            aiEnhancements: 'Error during AI processing',
            processedAt: new Date().toISOString(),
            batchIndex: i + index
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      processedJobs.push(...batchResults);

      // Small delay between batches to be respectful of API limits
      if (i + batchSize < jobs.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      processedJobs,
      totalProcessed: processedJobs.length,
      message: `Successfully processed ${processedJobs.length} job postings`
    });

  } catch (error) {
    console.error('Bulk job processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process jobs' },
      { status: 500 }
    );
  }
}