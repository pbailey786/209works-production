export interface ParsedJobSearchQuery {
  keywords: string[];
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  jobType?: string; // e.g., 'full-time', 'part-time', 'contract', 'internship'
  remote?: boolean;
}

/**
 * Parses a natural language job search query and extracts structured filters.
 * @param query The user's search string
 */
export function parseJobSearchQuery(query: string): ParsedJobSearchQuery {
  let q = query;
  const result: ParsedJobSearchQuery = { keywords: [] };

  // Remote
  if (/\b(remote|work from home|telecommute)\b/i.test(q)) {
    result.remote = true;
    q = q.replace(/\b(remote|work from home|telecommute)\b/gi, '');
  }

  // Job type
  const jobTypeMatch = q.match(
    /\b(full[- ]?time|part[- ]?time|contract|internship|temporary|freelance)\b/i
  );
  if (jobTypeMatch) {
    result.jobType = jobTypeMatch[1].toLowerCase().replace(/[- ]/, '-');
    q = q.replace(jobTypeMatch[0], '');
  }

  // Salary (e.g., $20/hour, 100k+, over $50,000)
  const salaryMatch = q.match(
    /(?:\$|£|€)?\s?(\d{2,3}(?:,\d{3})?)(k|K)?\s*(\+|or more|per hour|per year)?/i
  );
  if (salaryMatch) {
    let salary = parseInt(salaryMatch[1].replace(/,/g, ''));
    if (salaryMatch[2]) salary *= 1000;
    if (salaryMatch[3] && /hour/i.test(salaryMatch[3])) {
      // Convert hourly to yearly (approximate, 40h/week, 52 weeks)
      salary = salary * 40 * 52;
    }
    result.salaryMin = salary;
    q = q.replace(salaryMatch[0], '');
  }

  // Location (e.g., in Austin, near London)
  const locationMatch = q.match(/\b(in|near|around) ([A-Za-z\s]+)\b/i);
  if (locationMatch) {
    result.location = locationMatch[2].trim();
    q = q.replace(locationMatch[0], '');
  }

  // Clean up and extract keywords
  const keywords = q
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(
      word =>
        word.length > 2 &&
        !['jobs', 'job', 'positions', 'openings'].includes(word.toLowerCase())
    );
  if (keywords.length) result.keywords = keywords;

  return result;
}
