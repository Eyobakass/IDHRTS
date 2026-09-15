import { test, expect } from '@playwright/test';

const BASE = 'http://127.0.0.1:3000';

async function login(page: any, phone: string, pin: string) {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="text"]', phone);
  await page.fill('input[type="password"]', pin);
  
  const [response] = await Promise.all([
    page.waitForResponse((res: any) => res.url().includes('/auth/login/') && res.request().method() === 'POST'),
    page.click('button[type="submit"]')
  ]);

  const text = await response.text();
  console.log(`Login Response: Status ${response.status()}, Body: ${text}`);

  if (!response.ok() && response.status() >= 500) {
    throw new Error(`Login API Failed! Status: ${response.status()}, Body: ${text}`);
  }
}

test.describe('Auth Flow', () => {
  test('Landlord login redirects to landlord dashboard', async ({ page }) => {
    await login(page, '+251900000001', '1234');
    await page.waitForURL(/\/dashboard\/landlord/);
    await expect(page).toHaveURL(/\/dashboard\/landlord/);
  });

  test('Tenant login redirects to tenant dashboard', async ({ page }) => {
    await login(page, '+251900000002', '1234');
    await page.waitForURL(/\/dashboard\/tenant/);
    await expect(page).toHaveURL(/\/dashboard\/tenant/);
  });

  test('Woreda Officer login redirects to woreda dashboard', async ({ page }) => {
    await login(page, '+251900000003', '1234');
    await page.waitForURL(/\/dashboard\/woreda/);
    await expect(page).toHaveURL(/\/dashboard\/woreda/);
  });

  test('Tax Officer login redirects to tax dashboard', async ({ page }) => {
    await login(page, '+251900000004', '1234');
    await page.waitForURL(/\/dashboard\/tax/);
    await expect(page).toHaveURL(/\/dashboard\/tax/);
  });

  test('Invalid PIN shows error message', async ({ page }) => {
    await login(page, '+251900000001', '9999');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
    const errorEl = page.locator('text=Invalid phone number or PIN');
    await expect(errorEl).toBeVisible({ timeout: 5000 });
  });

  test('Logout clears session and redirects to login', async ({ page }) => {
    await login(page, '+251900000001', '1234');
    await page.waitForURL(/\/dashboard\/landlord/);
    await page.click('button:has-text("Logout")');
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeNull();
  });
});
