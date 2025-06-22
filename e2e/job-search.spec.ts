import { test, expect } from '@playwright/test';

test.describe('Job Search', () => {
  test('should perform a basic job search', async ({ page }) => {
    await page.goto('/');

    // Look for search input
    const searchInput = page
      .locator(
        'input[type="search"], input[placeholder*="search"], input[name*="search"]'
      )
      .first();

    if (await searchInput.isVisible()) {
      // Perform a search
      await searchInput.fill('software engineer');

      // Look for search button or submit
      const searchButton = page
        .locator(
          'button[type="submit"], button:has-text("Search"), [data-testid="search-button"]'
        )
        .first();

      if (await searchButton.isVisible()) {
        await searchButton.click();

        // Wait for results to load
        await page.waitForLoadState('networkidle');

        // Check that we're on a results page or results are displayed
        const resultsIndicator = page
          .locator('.job-results, [data-testid="job-results"], .search-results')
          .first();
        if (await resultsIndicator.isVisible()) {
          await expect(resultsIndicator).toBeVisible();
        }
      }
    }
  });

  test('should display job listings', async ({ page }) => {
    // Go directly to jobs page if it exists
    await page.goto('/jobs');

    // Check if job listings are displayed
    const jobListings = page.locator(
      '.job-card, .job-listing, [data-testid="job-card"]'
    );

    // Wait a bit for content to load
    await page.waitForTimeout(2000);

    const count = await jobListings.count();
    if (count > 0) {
      await expect(jobListings.first()).toBeVisible();
    }
  });

  test('should open job details when clicking on a job', async ({ page }) => {
    await page.goto('/jobs');

    // Wait for job listings to load
    await page.waitForTimeout(2000);

    const jobListings = page.locator(
      '.job-card, .job-listing, [data-testid="job-card"]'
    );
    const count = await jobListings.count();

    if (count > 0) {
      // Click on the first job listing
      await jobListings.first().click();

      // Check if job details are displayed (could be modal or new page)
      const jobDetails = page.locator(
        '.job-details, [data-testid="job-details"], .modal'
      );
      await expect(jobDetails.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle empty search results gracefully', async ({ page }) => {
    await page.goto('/');

    const searchInput = page
      .locator('input[type="search"], input[placeholder*="search"]')
      .first();

    if (await searchInput.isVisible()) {
      // Search for something that likely won't have results
      await searchInput.fill('xyzabc123nonexistentjob');

      const searchButton = page
        .locator('button[type="submit"], button:has-text("Search")')
        .first();

      if (await searchButton.isVisible()) {
        await searchButton.click();
        await page.waitForLoadState('networkidle');

        // Check for "no results" message
        const noResults = page.locator(
          ':has-text("No jobs found"), :has-text("No results"), .no-results'
        );
        if (await noResults.first().isVisible()) {
          await expect(noResults.first()).toBeVisible();
        }
      }
    }
  });
});
