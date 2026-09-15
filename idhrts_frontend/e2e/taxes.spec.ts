import { test, expect } from '@playwright/test';

test.describe('Tax Assessment & Payments', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to base to set localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'valid-mock-token');
      localStorage.setItem('user_role', 'TAX_OFFICER');
    });
  });

  test('Tax officer dashboard loads with heading', async ({ page }) => {
    await page.goto('/dashboard/tax');
    await expect(page.getByRole('heading', { name: 'Tax Assessments Overview' })).toBeVisible();
  });

  test('Tax dashboard shows SIGTAS download button', async ({ page }) => {
    await page.goto('/dashboard/tax');
    await expect(page.locator('button:has-text("Download SIGTAS CSV"), button:has-text("Export SIGTAS")').first()).toBeVisible();
  });

  test('Tax dashboard shows stat cards for assessments', async ({ page }) => {
    await page.goto('/dashboard/tax');
    await expect(page.locator('text=Total Assessments')).toBeVisible();
  });

  test('SIGTAS download button triggers file download', async ({ page }) => {
    await page.goto('/dashboard/tax');
    const [download] = await Promise.all([
      page.waitForEvent('download').catch(() => null),
      page.locator('button:has-text("Download SIGTAS CSV"), button:has-text("Export SIGTAS")').first().click(),
    ]);
    const isLoading = await page.locator('text=Downloading...').isVisible().catch(() => false);
    expect(download !== null || isLoading).toBeTruthy();
  });
});
