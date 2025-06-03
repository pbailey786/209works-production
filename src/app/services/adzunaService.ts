import 'dotenv/config';
import axios from 'axios';
import pLimit from 'p-limit';

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
const ADZUNA_COUNTRY = 'us';

function assertCreds() {
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    throw new Error('Missing Adzuna API credentials');
  }
}

// Full list of 209 area cities
const area209Cities = [
  'Stockton, CA',
  'Modesto, CA',
  'Tracy, CA',
  'Manteca, CA',
  'Merced, CA',
  'Turlock, CA',
  'Lodi, CA',
  'Ceres, CA',
  'Atwater, CA',
  'Los Banos, CA',
  'Riverbank, CA',
  'Oakdale, CA',
  'Patterson, CA',
  'Lathrop, CA',
  'Ripon, CA',
  'Escalon, CA',
  'Galt, CA',
  'Gustine, CA',
  'Livingston, CA',
  'Newman, CA',
  'Valley Springs, CA',
  'Angels Camp, CA',
  'Copperopolis, CA',
  'San Andreas, CA',
  'Murphys, CA',
  'Arnold, CA',
  'Hughson, CA',
  'Waterford, CA',
  'Delhi, CA',
  'Denair, CA',
  'Hilmar, CA',
  'Empire, CA',
  'Planada, CA',
  'Winton, CA',
  'Snelling, CA',
  'Ballico, CA',
  'Keyes, CA',
  'Farmington, CA',
  'Linden, CA',
  'Lockeford, CA',
  'Clements, CA',
  'Wallace, CA',
  'West Point, CA',
  'Rail Road Flat, CA',
  'Mountain Ranch, CA',
  'Burson, CA',
  'Rancho Calaveras, CA',
  'La Grange, CA',
  'Catheys Valley, CA',
  'Coulterville, CA',
  'Hornitos, CA',
  'Hickman, CA',
];

export interface AdzunaJob extends Record<string, any> {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  created: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  contract_time?: string;
  category?: { label: string };
  // Add more fields as needed
}

async function fetchAdzunaPageWithBackoff(
  city: string,
  page: number,
  resultsPerCity: number,
  maxRetries = 5
): Promise<any> {
  const url = `https://api.adzuna.com/v1/api/jobs/${ADZUNA_COUNTRY}/search/${page}`;
  const params = {
    app_id: ADZUNA_APP_ID,
    app_key: ADZUNA_APP_KEY,
    where: city,
    results_per_page: resultsPerCity,
  };
  let attempt = 0;
  let delay = 1000;
  while (attempt <= maxRetries) {
    try {
      const response = await axios.get(url, {
        params,
        headers: { Accept: 'application/json' },
      });
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 429) {
        // Exponential backoff
        if (attempt === maxRetries) throw error;
        await new Promise(res => setTimeout(res, delay));
        delay *= 2;
        attempt++;
      } else {
        throw error;
      }
    }
  }
}

export async function fetchAdzunaJobs(
  cities: string[] = area209Cities,
  resultsPerCity = 50
): Promise<AdzunaJob[]> {
  assertCreds();
  const allJobs: AdzunaJob[] = [];
  const limit = pLimit(5);
  const cityPageTasks: (() => Promise<void>)[] = [];

  const MAX_RESULTS_PER_PAGE = 50;
  if (resultsPerCity > MAX_RESULTS_PER_PAGE) {
    console.warn(`[Adzuna] resultsPerCity capped at ${MAX_RESULTS_PER_PAGE}`);
    resultsPerCity = MAX_RESULTS_PER_PAGE;
  }

  for (const city of cities) {
    // First, fetch the first page to get totalPages
    let firstPageData;
    try {
      firstPageData = await fetchAdzunaPageWithBackoff(city, 1, resultsPerCity);
    } catch (error: any) {
      const status = error.response?.status;
      const url = `https://api.adzuna.com/v1/api/jobs/${ADZUNA_COUNTRY}/search/1`;
      const params = {
        app_id: ADZUNA_APP_ID,
        app_key: ADZUNA_APP_KEY,
        where: city,
        results_per_page: resultsPerCity,
      };
      console.error(`[Adzuna] Error fetching jobs for city ${city} (page 1):`, {
        status,
        url,
        params,
        data: error.response?.data,
        message: error.message,
      });
      continue;
    }
    // (A) Log the full response for debugging
    console.dir(firstPageData, { depth: null });
    // (B) Warn if pagination is missing
    if (!('pagination' in firstPageData)) {
      console.warn(
        `[Adzuna] No pagination object for ${city}. Response keys:`,
        Object.keys(firstPageData)
      );
    }
    const jobs: AdzunaJob[] = firstPageData.results || [];
    if (jobs.length > 0) {
      allJobs.push(...jobs);
    }
    // (C) Greedy scroll fallback for missing pagination
    let totalPages = 1;
    if (firstPageData?.pagination?.pages) {
      totalPages = firstPageData.pagination.pages;
    } else {
      if (jobs.length === resultsPerCity) {
        console.warn(
          `[Adzuna] Pagination missing but max jobs returned for ${city}, assuming at least 2 pages.`
        );
        totalPages = 2;
      }
    }
    console.log(
      `[Adzuna] ${city} | Page 1/${totalPages} | Jobs: ${jobs.length}`
    );

    // Greedy scroll: keep fetching until a page returns < resultsPerCity jobs
    let greedyScroll = !firstPageData?.pagination?.pages;
    let lastPageReached = false;
    for (let page = 2; !lastPageReached && page <= totalPages; page++) {
      cityPageTasks.push(() =>
        limit(async () => {
          try {
            const pageData = await fetchAdzunaPageWithBackoff(
              city,
              page,
              resultsPerCity
            );
            const pageJobs: AdzunaJob[] = pageData.results || [];
            if (pageJobs.length > 0) {
              allJobs.push(...pageJobs);
            }
            console.log(
              `[Adzuna] ${city} | Page ${page}/${totalPages} | Jobs: ${pageJobs.length}`
            );
            // If greedy scroll, keep going until a page returns < resultsPerCity jobs
            if (greedyScroll && pageJobs.length < resultsPerCity) {
              lastPageReached = true;
            } else if (!greedyScroll && page === totalPages) {
              lastPageReached = true;
            }
          } catch (error: any) {
            const status = error.response?.status;
            const url = `https://api.adzuna.com/v1/api/jobs/${ADZUNA_COUNTRY}/search/${page}`;
            const params = {
              app_id: ADZUNA_APP_ID,
              app_key: ADZUNA_APP_KEY,
              where: city,
              results_per_page: resultsPerCity,
            };
            console.error(
              `[Adzuna] Error fetching jobs for city ${city} (page ${page}):`,
              {
                status,
                url,
                params,
                data: error.response?.data,
                message: error.message,
              }
            );
          }
        })
      );
    }
  }

  // Run all queued tasks with concurrency limit
  await Promise.all(cityPageTasks.map(task => task()));

  // Deduplicate jobs by id using a Set
  const seenJobIds = new Set<string>();
  const dedupedJobs: AdzunaJob[] = [];
  for (const job of allJobs) {
    if (!seenJobIds.has(job.id)) {
      seenJobIds.add(job.id);
      dedupedJobs.push(job);
    }
  }

  console.log(
    `[Adzuna] Total unique jobs fetched from Adzuna: ${dedupedJobs.length}`
  );
  return dedupedJobs;
}
