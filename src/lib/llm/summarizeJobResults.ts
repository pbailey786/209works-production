import { openai } from '@/lib/openai';

interface JobSummary {
  title: string;
  company: string;
  location: string;
  jobType: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
}

export async function summarizeJobResults({
  userMessage,
  filters,
  jobs,
}: {
  userMessage: string;
  filters: any;
  jobs: JobSummary[];
}): Promise<string | null> {
  // Build a summary of the jobs for the LLM
  const jobsList = jobs
    .slice(0, 5)
    .map((job, i) => {
      let salary = '';
      if (job.salaryMin && job.salaryMax) {
        salary = `$${job.salaryMin} - $${job.salaryMax}`;
      } else if (job.salaryMin) {
        salary = `from $${job.salaryMin}`;
      } else if (job.salaryMax) {
        salary = `up to $${job.salaryMax}`;
      }
      return `${i + 1}. ${job.title} at ${job.company} (${job.location}) [${job.jobType}]${salary ? ' - ' + salary : ''}`;
    })
    .join('\n');

  const prompt = `You are a helpful job search assistant. The user asked: "${userMessage}"\n\nExtracted filters: ${JSON.stringify(filters, null, 2)}\n\nHere are the top job results:\n${jobsList || 'No jobs found.'}\n\nWrite a friendly, concise summary for the user. If no jobs were found, encourage them to try a different search or adjust their criteria. Otherwise, highlight the most relevant jobs and invite them to ask for more details or refine their search.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful, friendly job search assistant.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 200,
    });
    const content = response.choices?.[0]?.message?.content;
    return content || null;
  } catch (error) {
    console.error('Error generating job summary:', error);
    return null;
  }
}
