import { test, expect } from '@playwright/test';

const BASE = 'http://127.0.0.1:3000';

async function loginAsWoreda(page: any) {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="text"]', '+251900000003');
  await page.fill('input[type="password"]', '1234');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard\/woreda/);
}

test.describe('Woreda Flow', () => {
  test('Woreda dashboard loads with tabs', async ({ page }) => {
    await loginAsWoreda(page);
    await expect(page.getByRole('button', { name: /Property Registrations/ })).toBeVisible();
  });

  test('Woreda properties tab shows table or empty state', async ({ page }) => {
    await loginAsWoreda(page);
    await page.getByRole('button', { name: /Property Registrations/ }).click();
    await expect(
      page.locator('table').or(page.locator('text=No Properties'))
    ).toBeVisible();
  });

  test('Woreda contracts tab is accessible', async ({ page }) => {
    await loginAsWoreda(page);
    await page.getByRole('button', { name: /Contract Authentication/ }).click();
    await expect(
      page.locator('table').or(page.locator('text=No Contracts').first())
    ).toBeVisible();
  });

  test('Woreda disputes tab is accessible', async ({ page }) => {
    await loginAsWoreda(page);
    await page.getByRole('button', { name: /Disputes/ }).click();
    await expect(
      page.locator('table').or(page.locator('text=No Disputes').first())
    ).toBeVisible();
  });
});
