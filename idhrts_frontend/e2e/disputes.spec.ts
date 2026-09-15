import { test, expect } from '@playwright/test';

const BASE = 'http://127.0.0.1:3000';

test.describe('Dispute Flow', () => {
  test('Tenant dashboard loads without errors', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'valid-mock-token');
      localStorage.setItem('user_role', 'TENANT');
    });
    await page.goto(`${BASE}/dashboard/tenant`);
    await page.waitForURL(/\/dashboard\/tenant/);
    await expect(page.getByRole('heading', { name: 'My Contracts' })).toBeVisible();
    
    // No JavaScript errors on page load
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors.length).toBe(0);
  });

  test('Woreda can see disputes tab', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'valid-mock-token');
      localStorage.setItem('user_role', 'WOREDA_OFFICER');
    });
    await page.goto(`${BASE}/dashboard/woreda`);
    await page.waitForURL(/\/dashboard\/woreda/);
    await page.getByRole('button', { name: /Disputes/ }).click();
    
    await expect(
      page.locator('table').or(page.locator('text=No Disputes').first())
    ).toBeVisible();
  });
});
