import { NextRequest, NextResponse } from 'next/server';
import { getEmbedding } from '@/lib/ai/embeddings';
import { prisma } from '@/lib/database/prisma';
import path from "path";


class SemanticSearchValidator {
  static isValidQuery(query: any): query is string {
    return (
      typeof query === 'string' &&
      query.trim().length > 0 &&
      query.length <= 1000 // Reasonable limit
    );
  }

  static isValidLimit(limit: any): limit is number {
    return (
      typeof limit === 'number' &&
      Number.isInteger(limit) &&
      limit > 0 &&
      limit <= 100 // Reasonable upper limit
    );
  }

  static sanitizeQuery(query: string): string {
    return query
      .trim()
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .substring(0, 1000); // Enforce length limit
  }

  static isValidExtractedParams(params: any): boolean {
    return (
      params &&
      typeof params === 'object' &&
      (!params.keywords || Array.isArray(params.keywords)) &&
      (!params.location || typeof params.location === 'string') &&
      (!params.minSalary || typeof params.minSalary === 'string') &&
      (!params.jobType || typeof params.jobType === 'string')
    );
  }
}

// Safe parameter extraction using OpenAI
async function extractSearchParams(userQuery: string): Promise<{
  keywords: string[];
  location: string;
  minSalary: string;
  jobType: string;
} | null> {
  try {
    // Validate input
    if (!SemanticSearchValidator.isValidQuery(userQuery)) {
      console.warn('Invalid query provided to extractSearchParams');
      return null;
    }

    const sanitizedQuery = SemanticSearchValidator.sanitizeQuery(userQuery);

    const prompt = `Extract the following from this job search query:
- keywords (array of relevant job-related terms)
- location (city, state, or region)
- minimum salary (number only, no currency symbols)
- job type (full-time, part-time, contract, etc.)

Query: "${sanitizedQuery}"

Respond in valid JSON format only:
{
  "keywords": [],
  "location": "",
  "minSalary": "",
  "jobType": ""
}`;

    // Use the secure OpenAI wrapper
    const response = await getChatCompletion(
      [{ role: 'user', content: prompt }],
      {
        model: 'gpt-3.5-turbo',
        temperature: 0,
        maxTokens: 200,
        rateLimitId: 'semantic-search-extraction',
        timeout: 15000,
      }
    );

    // Safely parse JSON response
    const jsonMatch = response.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      console.warn('No JSON found in OpenAI response');
      return null;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.warn('Failed to parse JSON from OpenAI response:', parseError);
      return null;
    }

    // Validate parsed response
    if (!SemanticSearchValidator.isValidExtractedParams(parsed)) {
      console.warn('Invalid extracted parameters from OpenAI');
      return null;
    }

    // Sanitize and return
    return {
      keywords: Array.isArray(parsed.keywords)
        ? parsed.keywords
            .filter((k: any) => typeof k === 'string' && k.length > 0)
            .slice(0, 10)
        : [],
      location:
        typeof parsed.location === 'string'
          ? parsed.location.trim().substring(0, 100)
          : '',
      minSalary:
        typeof parsed.minSalary === 'string'
          ? parsed.minSalary.trim().substring(0, 20)
          : '',
      jobType:
        typeof parsed.jobType === 'string'
          ? parsed.jobType.trim().substring(0, 50)
          : '',
    };
  } catch (error) {
    console.error('Error extracting search parameters:', error);
    return null;
  }
}

// Safe database query builder
function buildSemanticSearchQuery(
  embedding: string,
  limit: number,
  embeddingInput: string,
  extracted: any
): { query: string; params: any[] } {
  let extraFilters = '';
  const params: any[] = [embedding, limit, embeddingInput];
  let paramIdx = 4;

  if (extracted) {
    // Location filter with safe parameter binding
    if (extracted.location && extracted.location.length > 0) {
      extraFilters += ` AND LOWER(location) LIKE LOWER($${paramIdx})`;
      params.push(`%${extracted.location}%`);
      paramIdx++;
    }

    // Salary filter with validation
    if (extracted.minSalary && !isNaN(Number(extracted.minSalary))) {
      const minSalary = Number(extracted.minSalary);
      if (minSalary > 0 && minSalary < 10000000) {
        // Reasonable salary range
        extraFilters += ` AND ("salary_min" >= $${paramIdx} OR "salary_max" >= $${paramIdx})`;
        params.push(minSalary);
        paramIdx++;
      }
    }

    // Job type filter with validation
    if (extracted.jobType && extracted.jobType.length > 0) {
      const validJobTypes = [
        'full_time',
        'part_time',
        'contract',
        'temporary',
        'internship',
      ];
      const normalizedJobType = extracted.jobType.toLowerCase();
      if (validJobTypes.includes(normalizedJobType)) {
        extraFilters += ` AND LOWER(type::text) = LOWER($${paramIdx})`;
        params.push(extracted.jobType);
        paramIdx++;
      }
    }
  }

  // Use safe, parameterized query
  const query = `
    SELECT 
      id, title, location, company, 
      "posted_at" AS "postedAt", 
      description, url, 
      "salary_min" AS "salaryMin", 
      "salary_max" AS "salaryMax", 
      type, categories,
      embedding <#> $1 AS distance,
      (CASE WHEN LOWER(title) ILIKE LOWER('%' || $3 || '%') OR LOWER(description) ILIKE LOWER('%' || $3 || '%') THEN 0.5 ELSE 1 END) AS keyword_boost,
      (embedding <#> $1) * (CASE WHEN LOWER(title) ILIKE LOWER('%' || $3 || '%') OR LOWER(description) ILIKE LOWER('%' || $3 || '%') THEN 0.5 ELSE 1 END) AS hybrid_score
    FROM "Job"
    WHERE embedding IS NOT NULL${extraFilters}
    ORDER BY hybrid_score ASC, distance ASC
    LIMIT $2
  `;

  return { query, params };
}

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    let requestBody: any;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { query, limit = 20 } = requestBody;

    // Validate query parameter
    if (!SemanticSearchValidator.isValidQuery(query)) {
      return NextResponse.json(
        { error: 'Missing or invalid query parameter' },
        { status: 400 }
      );
    }

    // Validate limit parameter
    if (!SemanticSearchValidator.isValidLimit(limit)) {
      return NextResponse.json(
        { error: 'Invalid limit parameter (must be 1-100)' },
        { status: 400 }
      );
    }

    const sanitizedQuery = SemanticSearchValidator.sanitizeQuery(query);

    // Extract search parameters using secure OpenAI wrapper
    let extracted: any = null;
    try {
      extracted = await extractSearchParams(sanitizedQuery);
    } catch (extractError) {
      console.warn('Failed to extract search parameters:', extractError);
      // Continue without extracted parameters
    }

    // Determine embedding input
    const embeddingInput =
      extracted && extracted.keywords && extracted.keywords.length > 0
        ? extracted.keywords.path.join(' ')
        : sanitizedQuery;

    // Generate embedding using secure wrapper
    let embeddingArr: number[];
    try {
      embeddingArr = await getEmbedding(embeddingInput, {
        rateLimitId: 'semantic-search',
        timeout: 30000,
      });
    } catch (embeddingError) {
      console.error('Failed to generate embedding:', embeddingError);
      return NextResponse.json(
        { error: 'Failed to process search query' },
        { status: 500 }
      );
    }

    // Convert embedding to string format for database
    const embedding = `[${embeddingArr.path.join(',')}]`;

    // Build safe database query
    const { query: dbQuery, params } = buildSemanticSearchQuery(
      embedding,
      limit,
      embeddingInput,
      extracted
    );

    // Execute database query safely
    let results: any[];
    try {
      results = await prisma.$queryRawUnsafe(dbQuery, ...params);
    } catch (dbError) {
      console.error('Database query failed:', dbError);
      return NextResponse.json(
        { error: 'Search query failed' },
        { status: 500 }
      );
    }

    // Validate and sanitize results
    const sanitizedResults = results.map(result => ({
      id: result.id,
      title: result.title || '',
      location: result.location || '',
      company: result.company || '',
      postedAt: result.postedAt,
      description: result.description || '',
      url: result.url || '',
      salaryMin: typeof result.salaryMin === 'number' ? result.salaryMin : null,
      salaryMax: typeof result.salaryMax === 'number' ? result.salaryMax : null,
      type: result.type || '',
      categories: Array.isArray(result.categories) ? result.categories : [],
      distance: typeof result.distance === 'number' ? result.distance : 0,
      keywordBoost:
        typeof result.keyword_boost === 'number' ? result.keyword_boost : 1,
      hybridScore:
        typeof result.hybrid_score === 'number' ? result.hybrid_score : 0,
    }));

    return NextResponse.json({
      results: sanitizedResults,
      extracted: extracted || {},
      metadata: {
        queryProcessed: sanitizedQuery,
        embeddingInput,
        resultCount: sanitizedResults.length,
      },
    });
  } catch (error: any) {
    console.error('Semantic search error:', error);

    // Don't expose internal error details
    return NextResponse.json(
      { error: 'Internal server error occurred during search' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    // Validate query parameter
    if (!SemanticSearchValidator.isValidQuery(query)) {
      return NextResponse.json(
        { error: 'Missing or invalid query parameter' },
        { status: 400 }
      );
    }

    const sanitizedQuery = SemanticSearchValidator.sanitizeQuery(query);

    // Generate embedding using secure wrapper
    let embedding: number[];
    try {
      embedding = await getEmbedding(sanitizedQuery, {
        rateLimitId: 'semantic-search-get',
        timeout: 30000,
      });
    } catch (embeddingError) {
      console.error('Failed to generate embedding:', embeddingError);
      return NextResponse.json(
        { error: 'Failed to process search query' },
        { status: 500 }
      );
    }

    // Execute safe database query
    let jobs: any[];
    try {
      jobs = await prisma.job.findMany({
        where: {
          embedding: { not: null },
        },
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          description: true,
          url: true,
          postedAt: true,
          salaryMin: true,
          salaryMax: true,
          jobType: true,
          categories: true,
        },
        take: 10,
        // Note: Vector similarity ordering would need to be implemented
        // based on your specific database setup
        orderBy: { postedAt: 'desc' },
      });
    } catch (dbError) {
      console.error('Database query failed:', dbError);
      return NextResponse.json(
        { error: 'Search query failed' },
        { status: 500 }
      );
    }

    // Sanitize results
    const sanitizedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      description: job.description || '',
      url: job.url || '',
      postedAt: job.postedAt,
      salaryMin: typeof job.salaryMin === 'number' ? job.salaryMin : null,
      salaryMax: typeof job.salaryMax === 'number' ? job.salaryMax : null,
      type: job.type || '',
      categories: Array.isArray(job.categories) ? job.categories : [],
    }));

    return NextResponse.json({
      jobs: sanitizedJobs,
      metadata: {
        queryProcessed: sanitizedQuery,
        resultCount: sanitizedJobs.length,
      },
    });
  } catch (error: any) {
    console.error('Semantic search GET error:', error);

    // Don't expose internal error details
    return NextResponse.json(
      { error: 'Internal server error occurred during search' },
      { status: 500 }
    );
  }
}
