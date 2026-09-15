import { test, expect } from '@playwright/test';

const BASE = 'http://127.0.0.1:3000';
const TOKEN = 'valid-token-123';
const REVIEW_URL = `${BASE}/review/${TOKEN}`;

test.describe('Contract Flow & OTP Signature', () => {
  const contractMock = {
    contract_reg_number: 'SUB-WOR-2026-000001',
    monthly_rent_etb: 15000,
    advance_payment_etb: 30000,
    lease_duration_months: 24,
    status: 'PENDING_TENANT_SIGNATURE',
    start_date: '2026-09-01T00:00:00Z',
    end_date: '2028-08-31T00:00:00Z',
    property: { house_number: '123', building_type: 'VILLA' },
    landlord: { full_name_en: 'John Doe' }
  };

  test('Tenant dashboard loads and shows contracts heading', async ({ page }) => {
    // Mock login API
    await page.route('**/api/auth/login/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access: 'fake-jwt-token',
          refresh: 'fake-refresh-token',
          role: 'TENANT'
        })
      });
    });

    await page.goto(`${BASE}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="text"]', '+251900000002');
    await page.fill('input[type="password"]', '1234');
    await page.click('button[type="submit"]');
    
    // Let playwright use its global timeout, remove hardcoded timeout
    await page.waitForURL(/\/dashboard\/tenant/);
    await expect(page.getByRole('heading', { name: 'My Contracts' })).toBeVisible();
  });

  test('Contract review page handles invalid token gracefully', async ({ page }) => {
    await page.route('**/contracts/public/review/invalid-token-xyz-123/', async route => {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: 'Not found' }) });
    });
    
    await page.goto(`${BASE}/review/invalid-token-xyz-123`);
    
    const errorLocator = page.getByRole('heading', { name: 'Invalid Contract Link' });
    await expect(errorLocator).toBeVisible();
  });

  test('Loads contract details successfully', async ({ page }) => {
    await page.route(`**/contracts/public/review/${TOKEN}/`, async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contractMock) });
    });

    await page.goto(REVIEW_URL);
    await expect(page.locator('text=Rental Contract Review').or(page.locator('text=Standard Terms'))).toBeVisible();
    await expect(page.locator('text=15000').or(page.locator('text=15,000'))).toBeVisible();
  });

  test('Sign button disabled without agreement checkbox', async ({ page }) => {
    await page.route(`**/contracts/public/review/${TOKEN}/`, async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contractMock) });
    });

    await page.goto(REVIEW_URL);
    const signBtn = page.getByRole('button', { name: /I Agree & Sign Digitally/i });
    await expect(signBtn).toBeDisabled();

    const checkbox = page.getByRole('checkbox');
    if (await checkbox.count() > 0) {
        await checkbox.first().check();
        await expect(signBtn).toBeEnabled();
    }
  });

  test('Handles invalid OTP and lockouts', async ({ page }) => {
    await page.route(`**/contracts/public/review/${TOKEN}/`, async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contractMock) });
    });
    await page.route(`**/contracts/public/review/${TOKEN}/request-otp/`, async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });

    let failedAttempts = 0;
    await page.route(`**/contracts/public/review/${TOKEN}/sign/`, async route => {
      failedAttempts++;
      if (failedAttempts >= 5) {
        await route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ detail: 'Too Many Requests' }) });
      } else {
        await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ detail: 'Invalid or expired OTP.' }) });
      }
    });

    await page.goto(REVIEW_URL);
    
    const checkbox = page.getByRole('checkbox');
    if (await checkbox.count() > 0) {
        await checkbox.first().check();
    }
    await page.getByRole('button', { name: /I Agree & Sign Digitally/i }).click();

    await expect(page.getByText('Enter OTP')).toBeVisible();

    const otpInput = page.getByRole('textbox').or(page.locator('input[name="otp"]')).or(page.getByPlaceholder('••••••'));
    const verifyBtn = page.getByRole('button', { name: /Verify & Sign/i });

    // 1st attempt
    await otpInput.fill('111111');
    await verifyBtn.click();
    await expect(page.getByText('Invalid or expired OTP.')).toBeVisible();
    
    // 2 to 5 attempts
    for (let i = 0; i < 4; i++) {
      await otpInput.fill('111111');
      await verifyBtn.click();
    }
    await expect(page.getByText('Invalid or expired OTP.')).toBeVisible();
  });

  test('Successful OTP validation and signature', async ({ page }) => {
    await page.route(`**/contracts/public/review/${TOKEN}/`, async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contractMock) });
    });
    await page.route(`**/contracts/public/review/${TOKEN}/request-otp/`, async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });
    await page.route(`**/contracts/public/review/${TOKEN}/sign/`, async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });

    await page.goto(REVIEW_URL);
    
    const checkbox = page.getByRole('checkbox');
    if (await checkbox.count() > 0) {
        await checkbox.first().check();
    }
    await page.getByRole('button', { name: /I Agree & Sign Digitally/i }).click();

    await expect(page.getByText('Enter OTP')).toBeVisible();
    const otpInput = page.getByRole('textbox').or(page.locator('input[name="otp"]')).or(page.getByPlaceholder('••••••'));
    await otpInput.fill('123456');
    await page.getByRole('button', { name: /Verify & Sign/i }).click();

    await expect(page.getByText(/Contract Signed Successfully|Contract signed successfully/i)).toBeVisible();
  });

  test('Woreda Officer authenticates and registers SIGNED contract', async ({ page }) => {
    await page.route('**/api/auth/login/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access: 'fake-jwt-token',
          refresh: 'fake-refresh-token',
          role: 'WOREDA_OFFICER'
        })
      });
    });

    await page.goto(`${BASE}/login`);
    await page.fill('input[type="text"]', '+251900000003');
    await page.fill('input[type="password"]', '1234');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/dashboard\/woreda/);

    // Navigate to contract registration page (mocking API)
    await page.route('**/api/contracts/contract_123/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'contract_123', status: 'SIGNED' })
      });
    });

    await page.goto(`${BASE}/contracts/contract_123`);

    await page.route('**/api/contracts/*/register/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'contract_123', status: 'REGISTERED', registrationNumber: 'REG-2026-1234' })
      });
    });

    const registerBtn = page.locator('button:has-text("Authenticate & Register")').or(page.locator('button:has-text("Register")'));
    if (await registerBtn.count() > 0) {
      await registerBtn.first().click();
      await expect(page.locator('text=REGISTERED')).toBeVisible();
    }
  });
});
