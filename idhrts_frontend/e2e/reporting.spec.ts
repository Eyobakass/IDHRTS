import { test, expect } from '@playwright/test';

test.describe('Reporting flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to base to set localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'valid-mock-token');
      localStorage.setItem('user_role', 'WOREDA_OFFICER');
    });
  });

  test('Woreda Officer views compliance trend chart', async ({ page }) => {
    await page.goto('/dashboard/woreda');
    
    // Assert SVG chart element renders with data points
    const chart = page.locator('svg.recharts-surface');
    await expect(chart).toBeVisible();
    
    const dataPoints = page.locator('.recharts-line-dots circle');
    await expect(dataPoints.first()).toBeVisible();
  });

  test('Woreda chart renders with empty data gracefully without crashing', async ({ page }) => {
    await page.route('**/api/tax/', route => {
      route.fulfill({ json: [] });
    });

    const errors: any[] = [];
    page.on('pageerror', err => errors.push(err));

    await page.goto('/dashboard/woreda');

    // Assert the actual Recharts DOM wrapper is rendered
    const rechartsWrapper = page.locator('.recharts-wrapper').first();
    await expect(rechartsWrapper).toBeVisible();
    
    await page.waitForTimeout(1000);
    expect(errors.length).toBe(0);
  });
});
