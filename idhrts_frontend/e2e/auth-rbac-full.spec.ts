import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:8000';

const ROLES = [
  { role: 'Landlord', phone: '+251900000001', pin: '1234', dashboard: '/dashboard/landlord' },
  { role: 'Tenant', phone: '+251900000002', pin: '1234', dashboard: '/dashboard/tenant' },
  { role: 'Woreda Officer', phone: '+251900000003', pin: '1234', dashboard: '/dashboard/woreda' },
  { role: 'Tax Officer', phone: '+251900000004', pin: '1234', dashboard: '/dashboard/tax' },
];

test.describe('Authentication & RBAC Module', () => {

  test.describe('Happy Paths', () => {
    for (const { role, phone, pin, dashboard } of ROLES) {
      test(`Login as ${role} and redirect to correct dashboard`, async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);
        
        await page.fill('input[name="phone"]', phone);
        await page.fill('input[name="pin"]', pin);
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL(`${BASE_URL}${dashboard}`);
      });
    }

    test('Logout successfully', async ({ page }) => {
      // Login first
      const { phone, pin, dashboard } = ROLES[0];
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="phone"]', phone);
      await page.fill('input[name="pin"]', pin);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(`${BASE_URL}${dashboard}`);

      // Perform Logout
      await page.click('button:has-text("Logout"), a:has-text("Logout")'); // Assuming a generic logout button
      
      // Wait for redirect to login
      await expect(page).toHaveURL(`${BASE_URL}/login`);
      
      // Assert localStorage is cleared
      const token = await page.evaluate(() => localStorage.getItem('access_token'));
      expect(token).toBeNull();
    });
  });

  test.describe('Sad Paths - Login Validations', () => {
    test('Submit login with empty phone number', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="pin"]', '1234');
      await page.click('button[type="submit"]');
      
      // Wait for validation error to appear
      await expect(page.locator('text=required').first()).toBeVisible();
    });

    test('Submit login with empty PIN', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="phone"]', '+251900000001');
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=required').first()).toBeVisible();
    });

    test('Submit login with valid phone but wrong PIN', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="phone"]', '+251900000001');
      await page.fill('input[name="pin"]', '9999');
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Invalid credentials')).toBeVisible();
    });

    test('Submit login with non-existent phone number', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="phone"]', '+251999999999');
      await page.fill('input[name="pin"]', '1234');
      await page.click('button[type="submit"]');
      
      // Assuming it shows either Invalid credentials or User not found
      const errorLocator = page.locator('.error-message, .toast, [role="alert"]').first();
      await expect(errorLocator).toBeVisible();
    });
  });

  test.describe('Sad Paths - Navigation & RBAC', () => {
    const protectedRoutes = [
      '/dashboard/landlord',
      '/dashboard/woreda',
      '/dashboard/tenant',
      '/dashboard/tax'
    ];

    for (const route of protectedRoutes) {
      test(`Unauthenticated user navigates to ${route} -> redirect to /login`, async ({ page }) => {
        await page.goto(`${BASE_URL}${route}`);
        await expect(page).toHaveURL(`${BASE_URL}/login`);
      });
    }

    test('Tenant logs in and attempts to navigate to /dashboard/woreda', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="phone"]', '+251900000002'); // Tenant
      await page.fill('input[name="pin"]', '1234');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(`${BASE_URL}/dashboard/tenant`);

      await page.goto(`${BASE_URL}/dashboard/woreda`);
      
      // Should redirect somewhere or show 403
      // Here we assume it either redirects back to tenant dashboard, login, or shows a 403 text
      const url = page.url();
      if (url.includes('/dashboard/woreda')) {
        await expect(page.locator('text=403').or(page.locator('text=Unauthorized'))).toBeVisible();
      } else {
        expect(url).not.toContain('/dashboard/woreda');
      }
    });

    test('Landlord logs in and attempts to navigate to /dashboard/tax', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="phone"]', '+251900000001'); // Landlord
      await page.fill('input[name="pin"]', '1234');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(`${BASE_URL}/dashboard/landlord`);

      await page.goto(`${BASE_URL}/dashboard/tax`);
      
      const url = page.url();
      if (url.includes('/dashboard/tax')) {
        await expect(page.locator('text=403').or(page.locator('text=Unauthorized'))).toBeVisible();
      } else {
        expect(url).not.toContain('/dashboard/tax');
      }
    });


  });

  test.describe('Sad Paths - API Endpoints', () => {
    test('Access a protected API endpoint without a token -> 401', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/contracts/`);
      expect(response.status()).toBe(401);
    });

    test('Access a protected API endpoint with an expired/tampered JWT -> 401', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/contracts/`, {
        headers: {
          Authorization: 'Bearer tampered_token_here'
        }
      });
      expect(response.status()).toBe(401);
    });
  });

});
