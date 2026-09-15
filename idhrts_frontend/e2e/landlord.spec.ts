import { test, expect } from '@playwright/test';

const BASE = 'http://127.0.0.1:3000';

async function loginAsLandlord(page: any) {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="text"]', '+251900000001');
  await page.fill('input[type="password"]', '1234');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard\/landlord/);
}

test.describe('Landlord Flow', () => {
  test('Landlord dashboard loads with My Properties heading', async ({ page }) => {
    await loginAsLandlord(page);
    await expect(page.getByRole('heading', { name: 'My Properties' })).toBeVisible();
  });

  test('Landlord can navigate to register property form', async ({ page }) => {
    await loginAsLandlord(page);
    await page.click('text=Register Property');
    await page.waitForURL(/register-property/);
    await expect(page).toHaveURL(/register-property/);
  });

  test('Register property form has required fields', async ({ page }) => {
    await loginAsLandlord(page);
    await page.goto(`${BASE}/dashboard/landlord/register-property`);
    await page.waitForLoadState('networkidle');
    // House number field placeholder matches new form design
    await expect(page.locator('input[placeholder="e.g. A-205"]')).toBeVisible();
    await expect(page.locator('select')).toBeVisible();
    // ETB prefix input has no plain placeholder — verify the ETB label is present instead
    await expect(page.locator('text=Monthly Rent (ETB)')).toBeVisible();
  });

  test('Landlord dashboard shows stat cards', async ({ page }) => {
    await loginAsLandlord(page);
    // Two "Total Properties" cards exist — use .first() to avoid strict mode violation
    await expect(page.locator('text=Total').first()).toBeVisible();
  });
});
