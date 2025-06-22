/**
 * End-to-End Tests for Critical User Journeys
 * Tests complete user workflows from start to finish
 */

import { test, expect, Page } from '@playwright/test';

// Test data
const testUser = {
  email: 'test.jobseeker@209works.test',
  password: 'TestPassword123!',
  name: 'Test Job Seeker',
};

const testEmployer = {
  email: 'test.employer@209works.test',
  password: 'TestPassword123!',
  name: 'Test Employer',
  company: 'Test Company Inc.',
};

const testJob = {
  title: 'Senior Software Engineer',
  company: 'Tech Innovations Inc.',
  location: 'Stockton, CA',
  description:
    'We are looking for a senior software engineer to join our growing team. You will be responsible for developing and maintaining our web applications using modern technologies.',
  salaryMin: '80000',
  salaryMax: '120000',
  jobType: 'Full-time',
  experienceLevel: 'Senior Level',
  skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
  benefits: ['Health Insurance', '401k', 'Remote Work', 'Paid Time Off'],
};

// Helper functions
async function signUp(
  page: Page,
  userData: typeof testUser,
  role: 'job_seeker' | 'employer' = 'job_seeker'
) {
  await page.goto('/sign-up');

  await page.fill('[data-testid="email-input"]', userData.email);
  await page.fill('[data-testid="password-input"]', userData.password);
  await page.fill('[data-testid="name-input"]', userData.name);

  if (role === 'employer') {
    await page.click('[data-testid="employer-role"]');
    await page.fill('[data-testid="company-input"]', (userData as any).company);
  }

  await page.click('[data-testid="sign-up-button"]');

  // Wait for redirect to dashboard or onboarding
  await page.waitForURL(/\/(dashboard|onboarding)/);
}

async function signIn(page: Page, userData: typeof testUser) {
  await page.goto('/sign-in');

  await page.fill('[data-testid="email-input"]', userData.email);
  await page.fill('[data-testid="password-input"]', userData.password);
  await page.click('[data-testid="sign-in-button"]');

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard');
}

async function completeJobSeekerOnboarding(page: Page) {
  // Step 1: Personal Information
  await page.fill('[data-testid="current-job-title"]', 'Software Developer');
  await page.fill('[data-testid="experience-years"]', '5');
  await page.click('[data-testid="next-button"]');

  // Step 2: Skills and Preferences
  await page.click('[data-testid="skill-javascript"]');
  await page.click('[data-testid="skill-react"]');
  await page.click('[data-testid="skill-nodejs"]');
  await page.fill('[data-testid="desired-salary-min"]', '70000');
  await page.fill('[data-testid="desired-salary-max"]', '100000');
  await page.click('[data-testid="next-button"]');

  // Step 3: Location and Work Preferences
  await page.fill('[data-testid="location-input"]', 'Stockton, CA');
  await page.check('[data-testid="open-to-remote"]');
  await page.click('[data-testid="complete-onboarding"]');

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard');
}

async function postJob(page: Page, jobData: typeof testJob) {
  await page.goto('/post-job');

  // Basic job information
  await page.fill('[data-testid="job-title"]', jobData.title);
  await page.fill('[data-testid="company-name"]', jobData.company);
  await page.fill('[data-testid="job-location"]', jobData.location);
  await page.fill('[data-testid="job-description"]', jobData.description);

  // Salary information
  await page.fill('[data-testid="salary-min"]', jobData.salaryMin);
  await page.fill('[data-testid="salary-max"]', jobData.salaryMax);

  // Job details
  await page.selectOption('[data-testid="job-type"]', jobData.jobType);
  await page.selectOption(
    '[data-testid="experience-level"]',
    jobData.experienceLevel
  );

  // Skills
  for (const skill of jobData.skills) {
    await page.fill('[data-testid="skills-input"]', skill);
    await page.press('[data-testid="skills-input"]', 'Enter');
  }

  // Benefits
  for (const benefit of jobData.benefits) {
    await page.click(
      `[data-testid="benefit-${benefit.toLowerCase().replace(/\s+/g, '-')}"]`
    );
  }

  // Submit job
  await page.click('[data-testid="post-job-button"]');

  // Wait for success message
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
}

test.describe('Critical User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto('/');
  });

  test.describe('Job Seeker Journey', () => {
    test('Complete job seeker registration and job search flow', async ({
      page,
    }) => {
      // 1. Sign up as job seeker
      await signUp(page, testUser, 'job_seeker');

      // 2. Complete onboarding
      await completeJobSeekerOnboarding(page);

      // 3. Verify dashboard loads with personalized content
      await expect(
        page.locator('[data-testid="welcome-message"]')
      ).toContainText(testUser.name);
      await expect(
        page.locator('[data-testid="recommended-jobs"]')
      ).toBeVisible();

      // 4. Search for jobs
      await page.goto('/search');
      await page.fill('[data-testid="search-input"]', 'software engineer');
      await page.fill('[data-testid="location-input"]', 'Stockton');
      await page.click('[data-testid="search-button"]');

      // 5. Verify search results
      await expect(page.locator('[data-testid="job-results"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="job-card"]').first()
      ).toBeVisible();

      // 6. View job details
      await page.locator('[data-testid="job-card"]').first().click();
      await expect(page.locator('[data-testid="job-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="apply-button"]')).toBeVisible();

      // 7. Save job for later
      await page.click('[data-testid="save-job-button"]');
      await expect(
        page.locator('[data-testid="job-saved-message"]')
      ).toBeVisible();

      // 8. Apply to job
      await page.click('[data-testid="apply-button"]');
      await page.fill(
        '[data-testid="cover-letter"]',
        'I am very interested in this position...'
      );
      await page.click('[data-testid="submit-application"]');

      // 9. Verify application submitted
      await expect(
        page.locator('[data-testid="application-success"]')
      ).toBeVisible();

      // 10. Check application status in dashboard
      await page.goto('/dashboard');
      await page.click('[data-testid="applications-tab"]');
      await expect(
        page.locator('[data-testid="application-item"]').first()
      ).toBeVisible();
    });

    test('JobsGPT conversation flow', async ({ page }) => {
      // 1. Sign in as existing job seeker
      await signIn(page, testUser);

      // 2. Navigate to JobsGPT
      await page.goto('/jobsgpt');

      // 3. Start conversation
      await page.fill(
        '[data-testid="chat-input"]',
        "I'm looking for software engineering jobs in the 209 area"
      );
      await page.click('[data-testid="send-button"]');

      // 4. Verify AI response
      await expect(
        page.locator('[data-testid="ai-message"]').last()
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="job-recommendations"]')
      ).toBeVisible();

      // 5. Ask follow-up question
      await page.fill(
        '[data-testid="chat-input"]',
        'What about remote opportunities?'
      );
      await page.click('[data-testid="send-button"]');

      // 6. Verify conversation continues
      await expect(page.locator('[data-testid="ai-message"]')).toHaveCount(2);

      // 7. Apply to recommended job
      await page
        .locator('[data-testid="recommended-job-apply"]')
        .first()
        .click();
      await expect(
        page.locator('[data-testid="quick-apply-modal"]')
      ).toBeVisible();
    });

    test('Profile management and resume upload', async ({ page }) => {
      // 1. Sign in and navigate to profile
      await signIn(page, testUser);
      await page.goto('/profile');

      // 2. Update profile information
      await page.fill(
        '[data-testid="bio-input"]',
        'Experienced software developer with 5+ years...'
      );
      await page.fill(
        '[data-testid="linkedin-url"]',
        'https://linkedin.com/in/testuser'
      );
      await page.click('[data-testid="save-profile"]');

      // 3. Upload resume
      await page.setInputFiles(
        '[data-testid="resume-upload"]',
        'test-files/sample-resume.pdf'
      );
      await expect(
        page.locator('[data-testid="upload-success"]')
      ).toBeVisible();

      // 4. Verify resume analysis
      await expect(page.locator('[data-testid="resume-score"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="resume-suggestions"]')
      ).toBeVisible();
    });
  });

  test.describe('Employer Journey', () => {
    test('Complete employer registration and job posting flow', async ({
      page,
    }) => {
      // 1. Sign up as employer
      await signUp(page, testEmployer, 'employer');

      // 2. Complete employer onboarding
      await page.fill(
        '[data-testid="company-description"]',
        'We are a leading technology company...'
      );
      await page.fill(
        '[data-testid="company-website"]',
        'https://testcompany.com'
      );
      await page.selectOption('[data-testid="company-size"]', '50-200');
      await page.click('[data-testid="complete-onboarding"]');

      // 3. Verify employer dashboard
      await expect(
        page.locator('[data-testid="employer-dashboard"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="post-job-cta"]')).toBeVisible();

      // 4. Post a new job
      await postJob(page, testJob);

      // 5. Verify job appears in dashboard
      await page.goto('/dashboard');
      await expect(page.locator('[data-testid="posted-jobs"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="job-item"]').first()
      ).toContainText(testJob.title);

      // 6. View job applications
      await page.locator('[data-testid="view-applications"]').first().click();
      await expect(
        page.locator('[data-testid="applications-list"]')
      ).toBeVisible();

      // 7. Purchase credits for job promotion
      await page.goto('/dashboard');
      await page.click('[data-testid="buy-credits"]');
      await page.click('[data-testid="standard-plan"]');

      // Note: In real tests, we'd use Stripe test mode
      await expect(
        page.locator('[data-testid="checkout-redirect"]')
      ).toBeVisible();
    });

    test('Applicant tracking and management', async ({ page }) => {
      // 1. Sign in as employer
      await signIn(page, testEmployer);

      // 2. Navigate to applicant tracking
      await page.goto('/dashboard/applicants');

      // 3. Filter applications
      await page.selectOption('[data-testid="status-filter"]', 'pending');
      await page.fill('[data-testid="search-applicants"]', 'software');

      // 4. Review application
      await page.locator('[data-testid="application-item"]').first().click();
      await expect(
        page.locator('[data-testid="applicant-profile"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="resume-viewer"]')).toBeVisible();

      // 5. Update application status
      await page.click('[data-testid="status-dropdown"]');
      await page.click('[data-testid="status-interviewed"]');
      await page.fill(
        '[data-testid="status-notes"]',
        'Great candidate, moving to next round'
      );
      await page.click('[data-testid="save-status"]');

      // 6. Send message to applicant
      await page.click('[data-testid="message-applicant"]');
      await page.fill(
        '[data-testid="message-content"]',
        'Thank you for your application...'
      );
      await page.click('[data-testid="send-message"]');

      // 7. Verify status updated
      await expect(page.locator('[data-testid="status-badge"]')).toContainText(
        'Interviewed'
      );
    });
  });

  test.describe('Cross-Platform Features', () => {
    test('Social features and networking', async ({ page }) => {
      // 1. Sign in as job seeker
      await signIn(page, testUser);

      // 2. Navigate to networking
      await page.goto('/network');

      // 3. Send connection request
      await page
        .locator('[data-testid="suggested-connection"]')
        .first()
        .click();
      await page.fill(
        '[data-testid="connection-message"]',
        "I'd like to connect with you..."
      );
      await page.click('[data-testid="send-request"]');

      // 4. Navigate to company reviews
      await page.goto('/companies');
      await page.locator('[data-testid="company-card"]').first().click();

      // 5. Write company review
      await page.click('[data-testid="write-review"]');
      await page.fill('[data-testid="review-title"]', 'Great place to work');
      await page.fill(
        '[data-testid="review-content"]',
        'I really enjoyed working here...'
      );
      await page.click('[data-testid="rating-4"]');
      await page.click('[data-testid="submit-review"]');

      // 6. Participate in forums
      await page.goto('/forums');
      await page.click('[data-testid="career-advice-category"]');
      await page.click('[data-testid="new-post"]');
      await page.fill(
        '[data-testid="post-title"]',
        'Tips for software engineering interviews?'
      );
      await page.fill(
        '[data-testid="post-content"]',
        'I have an interview coming up...'
      );
      await page.click('[data-testid="submit-post"]');
    });

    test('Mobile responsive experience', async ({ page }) => {
      // 1. Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // 2. Navigate to mobile homepage
      await page.goto('/');
      await expect(page.locator('[data-testid="mobile-hero"]')).toBeVisible();

      // 3. Test mobile navigation
      await page.click('[data-testid="mobile-menu-toggle"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

      // 4. Test mobile job search
      await page.click('[data-testid="mobile-search"]');
      await page.fill('[data-testid="mobile-search-input"]', 'engineer');
      await page.click('[data-testid="mobile-search-button"]');

      // 5. Verify mobile job cards
      await expect(
        page.locator('[data-testid="mobile-job-card"]').first()
      ).toBeVisible();

      // 6. Test mobile job application
      await page.locator('[data-testid="mobile-job-card"]').first().click();
      await page.click('[data-testid="mobile-apply-button"]');
      await expect(
        page.locator('[data-testid="mobile-apply-modal"]')
      ).toBeVisible();
    });

    test('PWA functionality', async ({ page, context }) => {
      // 1. Navigate to homepage
      await page.goto('/');

      // 2. Test service worker registration
      const serviceWorkerPromise = context.waitForEvent('serviceworker');
      await page.reload();
      const serviceWorker = await serviceWorkerPromise;
      expect(serviceWorker.url()).toContain('sw.js');

      // 3. Test offline functionality
      await context.setOffline(true);
      await page.goto('/offline');
      await expect(
        page.locator('[data-testid="offline-message"]')
      ).toBeVisible();

      // 4. Test PWA install prompt
      await context.setOffline(false);
      await page.goto('/');

      // Simulate PWA install prompt
      await page.evaluate(() => {
        window.dispatchEvent(new Event('beforeinstallprompt'));
      });

      await expect(
        page.locator('[data-testid="pwa-install-prompt"]')
      ).toBeVisible();
    });
  });

  test.describe('Performance and Accessibility', () => {
    test('Core Web Vitals compliance', async ({ page }) => {
      await page.goto('/');

      // Measure performance metrics
      const metrics = await page.evaluate(() => {
        return new Promise(resolve => {
          new PerformanceObserver(list => {
            const entries = list.getEntries();
            const vitals: any = {};

            entries.forEach((entry: any) => {
              if (entry.name === 'largest-contentful-paint') {
                vitals.lcp = entry.value;
              }
              if (entry.name === 'first-input-delay') {
                vitals.fid = entry.value;
              }
              if (entry.name === 'cumulative-layout-shift') {
                vitals.cls = entry.value;
              }
            });

            resolve(vitals);
          }).observe({
            entryTypes: [
              'largest-contentful-paint',
              'first-input',
              'layout-shift',
            ],
          });
        });
      });

      // Assert Core Web Vitals thresholds
      expect((metrics as any).lcp).toBeLessThan(2500); // LCP < 2.5s
      expect((metrics as any).fid).toBeLessThan(100); // FID < 100ms
      expect((metrics as any).cls).toBeLessThan(0.1); // CLS < 0.1
    });

    test('Accessibility compliance', async ({ page }) => {
      await page.goto('/');

      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();

      // Test screen reader compatibility
      const ariaLabels = await page.locator('[aria-label]').count();
      expect(ariaLabels).toBeGreaterThan(0);

      // Test color contrast (simplified check)
      const contrastIssues = await page.locator('[style*="color"]').count();
      // In a real test, we'd use axe-core for comprehensive accessibility testing
    });
  });
});
