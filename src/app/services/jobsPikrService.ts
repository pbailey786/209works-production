import axios from 'axios';

const JOBSPIKR_CLIENT_ID = process.env.JOBSPIKR_CLIENT_ID;
const JOBSPIKR_CLIENT_AUTH_KEY = process.env.JOBSPIKR_CLIENT_AUTH_KEY;
const BASE_URL = 'https://api-bcp.jobspikr.com/v2/data';

if (!JOBSPIKR_CLIENT_ID || !JOBSPIKR_CLIENT_AUTH_KEY) {
  throw new Error(
    'JobsPikr API credentials are not set in environment variables.'
  );
}

export interface JobsPikrQuery {
  location?: string;
  dateRange?: { gte?: string; lte?: string };
  [key: string]: any;
}

export interface JobsPikrResponse {
  status: string;
  message: string;
  data?: any[];
  next_cursor?: string;
}

export async function fetchJobsWithPagination(
  query: JobsPikrQuery,
  onPage?: (data: any[], page: number) => Promise<void> | void,
  maxPages: number = 10
): Promise<any[]> {
  let cursor: string | undefined = undefined;
  let allResults: any[] = [];
  let page = 1;

  while (page <= maxPages) {
    try {
      // Use custom date range if provided, else default to last 30 days
      let lte: string, gte: string;
      if (query.dateRange && (query.dateRange.gte || query.dateRange.lte)) {
        const today = new Date();
        lte = query.dateRange.lte || today.toISOString().slice(0, 10);
        gte =
          query.dateRange.gte ||
          (() => {
            const d = new Date(today);
            d.setDate(today.getDate() - 30);
            return d.toISOString().slice(0, 10);
          })();
      } else {
        const today = new Date();
        lte = today.toISOString().slice(0, 10);
        const gteDate = new Date(today);
        gteDate.setDate(today.getDate() - 30);
        gte = gteDate.toISOString().slice(0, 10);
      }

      const mustFilters: any[] = [
        {
          query_string: {
            fields: ['job_title', 'inferred_job_title'],
            query: '*',
          },
        },
        {
          query_string: {
            default_field: 'job_type',
            query: '*',
          },
        },
        {
          query_string: {
            default_field: 'company_name',
            query: '*',
          },
        },
        {
          range: {
            post_date: { gte, lte },
          },
        },
      ];

      if (query.location) {
        const city = query.location.trim();
        console.log('Filtering for city:', city);

        mustFilters.push({
          bool: {
            must: [
              {
                query_string: {
                  fields: ['inferred_country'],
                  query: '"United states"',
                },
              },
              {
                query_string: {
                  fields: ['inferred_state'],
                  query: '"California"',
                },
              },
              {
                query_string: {
                  fields: ['city', 'inferred_city'],
                  query: `*${city}*`,
                },
              },
            ],
          },
        });
      }

      const body: any = {
        format: 'json',
        size: 50,
        dataset: ['job_board'],
        search_query_json: {
          bool: {
            must: mustFilters,
            must_not: [
              {
                query_string: {
                  default_field: 'job_board',
                  query: 'company_website',
                },
              },
              {
                query_string: {
                  default_field: 'company_name',
                  query: 'Unspecified',
                },
              },
            ],
          },
        },
        ...(cursor ? { cursor } : {}),
      };

      console.log(`🔁 Page ${page} request body:`, body);

      const response: any = await axios.post<JobsPikrResponse>(BASE_URL, body, {
        headers: {
          client_id: JOBSPIKR_CLIENT_ID!,
          client_auth_key: JOBSPIKR_CLIENT_AUTH_KEY!,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.status !== 'success') {
        throw new Error(
          response.data.message || 'Unknown error from JobsPikr API'
        );
      }

      const jobs = Array.isArray(response.data.data) ? response.data.data : [];
      console.log(`✅ Page ${page} returned ${jobs.length} jobs`);
      if (jobs.length) {
        console.log('Sample job city fields:');
        jobs.slice(0, 3).forEach((job: any, idx: number) => {
          console.log(
            `#${idx + 1}: city =`,
            job.city,
            ', inferred_city =',
            job.inferred_city
          );
        });
      } else {
        console.warn(`⚠️ No jobs found for location: ${query.location}`);
      }

      if (onPage) await onPage(jobs, page);
      allResults.push(...jobs);

      if (!response.data.next_cursor) break;
      cursor = response.data.next_cursor;
      page++;
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.warn('⏳ Rate limit hit — retrying in 60 seconds...');
        await new Promise(resolve => setTimeout(resolve, 60000));
        continue;
      }

      console.error(
        '❌ JobsPikr error:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  console.log(
    `🎯 Fetched total of ${allResults.length} jobs across ${page - 1} pages.`
  );
  return allResults;
}
