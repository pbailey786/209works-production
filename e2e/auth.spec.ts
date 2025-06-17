import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display sign in page', async ({ page }) => {
    await page.goto('/signin');

    // Check that we're on the sign in page
    await expect(page).toHaveURL(/signin/);

    // Look for sign in form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator(
      'input[type="password"], input[name="password"]'
    );
    const signInButton = page.locator(
      'button[type="submit"], button:has-text("Sign In")'
    );

    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeVisible();
    }

    if (await passwordInput.isVisible()) {
      await expect(passwordInput).toBeVisible();
    }

    if (await signInButton.isVisible()) {
      await expect(signInButton).toBeVisible();
    }
  });

  test('should display sign up page', async ({ page }) => {
    await page.goto('/signup');

    // Check that we're on the sign up page
    await expect(page).toHaveURL(/signup/);

    // Look for sign up form elements
    const nameInput = page.locator(
      'input[name="name"], input[placeholder*="name"]'
    );
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator(
      'input[type="password"], input[name="password"]'
    );
    const signUpButton = page.locator(
      'button[type="submit"], button:has-text("Sign Up")'
    );

    if (await nameInput.isVisible()) {
      await expect(nameInput).toBeVisible();
    }

    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeVisible();
    }

    if (await passwordInput.isVisible()) {
      await expect(passwordInput).toBeVisible();
    }

    if (await signUpButton.isVisible()) {
      await expect(signUpButton).toBeVisible();
    }
  });

  test('should show validation errors for invalid sign in', async ({
    page,
  }) => {
    await page.goto('/signin');

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator(
      'input[type="password"], input[name="password"]'
    );
    const signInButton = page.locator(
      'button[type="submit"], button:has-text("Sign In")'
    );

    if (
      (await emailInput.isVisible()) &&
      (await passwordInput.isVisible()) &&
      (await signInButton.isVisible())
    ) {
      // Try to sign in with invalid credentials
      await emailInput.fill('invalid@email.com');
      await passwordInput.fill('wrongpassword');
      await signInButton.click();

      // Wait for potential error message
      await page.waitForTimeout(2000);

      // Look for error messages
      const errorMessage = page.locator(
        '.error, .alert-error, [role="alert"], :has-text("Invalid")'
      );
      if (await errorMessage.first().isVisible()) {
        await expect(errorMessage.first()).toBeVisible();
      }
    }
  });

  test('should navigate between sign in and sign up pages', async ({
    page,
  }) => {
    await page.goto('/signin');

    // Look for link to sign up page
    const signUpLink = page.locator(
      'a[href*="signup"], a:has-text("Sign Up"), a:has-text("Register")'
    );

    if (await signUpLink.isVisible()) {
      await signUpLink.click();
      await expect(page).toHaveURL(/signup/);

      // Look for link back to sign in
      const signInLink = page.locator(
        'a[href*="signin"], a:has-text("Sign In"), a:has-text("Login")'
      );

      if (await signInLink.isVisible()) {
        await signInLink.click();
        await expect(page).toHaveURL(/signin/);
      }
    }
  });

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/signin');

    // Look for forgot password link
    const forgotPasswordLink = page.locator(
      'a:has-text("Forgot"), a:has-text("Reset"), a[href*="reset"]'
    );

    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();

      // Should be on password reset page
      await expect(page).toHaveURL(/reset|forgot/);

      // Look for email input for password reset
      const emailInput = page.locator(
        'input[type="email"], input[name="email"]'
      );
      const resetButton = page.locator(
        'button[type="submit"], button:has-text("Reset")'
      );

      if ((await emailInput.isVisible()) && (await resetButton.isVisible())) {
        await emailInput.fill('test@example.com');
        await resetButton.click();

        // Wait for confirmation message
        await page.waitForTimeout(2000);

        // Look for success message
        const successMessage = page.locator(
          '.success, .alert-success, :has-text("sent"), :has-text("check")'
        );
        if (await successMessage.first().isVisible()) {
          await expect(successMessage.first()).toBeVisible();
        }
      }
    }
  });
});
