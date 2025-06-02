import { openai } from '@/lib/openai';

export interface JobSearchFilters {
  age: number | null;
  location: string | null;
  region: string | null;
  job_type: string | null;
  schedule: string | null;
  industry: string | null;
  role: string | null;
  salary: string | null;
  experience_level: string | null;
  company: string | null;
  requirements: string | null;
  benefits: string | null;
  application_type: string | null;
  skills: string[] | null;
  isRemote: boolean | null;
  categories: string[] | null;
  postedAt: string | null;
  other: string | null;
}

const SYSTEM_PROMPT = `Extract the following structured filters from the user's message about job searching. If a field is not mentioned, set it to null. Return the result as a JSON object with these fields:
- age
- location
- region
- job_type (use: full_time, part_time, contract, internship, temporary, volunteer, other)
- schedule
- industry
- role
- salary
- experience_level
- company
- requirements
- benefits
- application_type
- skills (array)
- isRemote (boolean)
- categories (array)
- postedAt (date string, e.g., 'last 7 days')
- other`;

export async function extractJobSearchFilters(
  userMessage: string,
  conversationHistory: any[] = []
): Promise<JobSearchFilters | null> {

  // Build conversation context
  const contextMessages = conversationHistory
    .slice(-3) // Last 3 messages for context
    .map((msg: any) => `${msg.type}: ${msg.content}`)
    .join('\n');

  const contextPrompt = contextMessages ? `
Previous conversation context:
${contextMessages}

Consider this context when extracting filters from the current message.
` : '';

  const prompt = `${SYSTEM_PROMPT}

${contextPrompt}

Current user message: "${userMessage}"

Extract filters considering both the current message and conversation context.

Example output:
{
  "age": 17,
  "location": "Modesto",
  "region": "209",
  "job_type": "part_time",
  "schedule": "weekend",
  "industry": null,
  "role": null,
  "salary": null,
  "experience_level": "entry-level",
  "company": null,
  "requirements": null,
  "benefits": null,
  "application_type": null,
  "skills": ["React", "JavaScript"],
  "isRemote": true,
  "categories": ["Tech", "Software"],
  "postedAt": "last 7 days",
  "other": null
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 400,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) return null;

    // Attempt to extract JSON from the response
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const filters = JSON.parse(match[0]);

    // Validate and clean the filters
    return validateAndCleanFilters(filters);
  } catch (error) {
    console.error('Error extracting job search filters:', error);
    return null;
  }
}

// Map job type variations to database enum values
function normalizeJobType(jobType: string | null): string | null {
  if (!jobType) return null;

  const normalized = jobType.toLowerCase().trim();

  // Map common variations to database enum values
  const jobTypeMap: { [key: string]: string } = {
    'full-time': 'full_time',
    'full time': 'full_time',
    'fulltime': 'full_time',
    'part-time': 'part_time',
    'part time': 'part_time',
    'parttime': 'part_time',
    'contract': 'contract',
    'contractor': 'contract',
    'freelance': 'contract',
    'internship': 'internship',
    'intern': 'internship',
    'temporary': 'temporary',
    'temp': 'temporary',
    'volunteer': 'volunteer',
    'other': 'other'
  };

  return jobTypeMap[normalized] || normalized;
}

// Validate and clean extracted filters
function validateAndCleanFilters(filters: any): JobSearchFilters {
  return {
    age: typeof filters.age === 'number' ? filters.age : null,
    location: typeof filters.location === 'string' ? filters.location : null,
    region: typeof filters.region === 'string' ? filters.region : null,
    job_type: normalizeJobType(filters.job_type),
    schedule: typeof filters.schedule === 'string' ? filters.schedule : null,
    industry: typeof filters.industry === 'string' ? filters.industry : null,
    role: typeof filters.role === 'string' ? filters.role : null,
    salary: typeof filters.salary === 'string' ? filters.salary : null,
    experience_level: typeof filters.experience_level === 'string' ? filters.experience_level : null,
    company: typeof filters.company === 'string' ? filters.company : null,
    requirements: typeof filters.requirements === 'string' ? filters.requirements : null,
    benefits: typeof filters.benefits === 'string' ? filters.benefits : null,
    application_type: typeof filters.application_type === 'string' ? filters.application_type : null,
    skills: Array.isArray(filters.skills) ? filters.skills : null,
    isRemote: typeof filters.isRemote === 'boolean' ? filters.isRemote : null,
    categories: Array.isArray(filters.categories) ? filters.categories : null,
    postedAt: typeof filters.postedAt === 'string' ? filters.postedAt : null,
    other: typeof filters.other === 'string' ? filters.other : null,
  };
}