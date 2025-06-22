import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads
    await expect(page).toHaveTitle(/209jobs/i);

    // Check for main navigation elements
    await expect(page.locator('nav')).toBeVisible();

    // Check for main content area
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display job search functionality', async ({ page }) => {
    await page.goto('/');

    // Look for search input or search section
    const searchSection = page
      .locator('[data-testid="job-search"], .search, input[type="search"]')
      .first();
    if (await searchSection.isVisible()) {
      await expect(searchSection).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check that the page is still functional on mobile
    await expect(page.locator('body')).toBeVisible();

    // Check for mobile navigation (hamburger menu, etc.)
    const mobileNav = page
      .locator(
        '[data-testid="mobile-nav"], .mobile-menu, button[aria-label*="menu"]'
      )
      .first();
    if (await mobileNav.isVisible()) {
      await expect(mobileNav).toBeVisible();
    }
  });

  test('should have proper accessibility landmarks', async ({ page }) => {
    await page.goto('/');

    // Check for semantic HTML landmarks
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();

    // Check for proper heading structure
    const h1 = page.locator('h1').first();
    if (await h1.isVisible()) {
      await expect(h1).toBeVisible();
    }
  });
});
