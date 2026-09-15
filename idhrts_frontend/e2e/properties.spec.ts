import { test, expect } from '@playwright/test';

const BASE = 'http://127.0.0.1:3000';

test.describe('Property Registration E2E Flows', () => {

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      // Delay for 5000ms
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.continue();
    });
  });

  test('Landlord draft creation, document upload, and submission', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto(`${BASE}/`);
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'valid-mock-token');
      localStorage.setItem('user_role', 'LANDLORD');
    });
    await page.goto(`${BASE}/dashboard/landlord`);
    
    await page.waitForURL(/\/dashboard\/landlord/);

    // 2. Navigate to Property Registration
    await page.click('text=Register Property');

    // Step 1: Location (Form step 1)
    await page.selectOption('select[name="subCity"]', { label: 'Bole' });
    await page.selectOption('select[name="woreda"]', { label: 'Woreda 03' });
    await page.fill('input[name="kebele"]', '05');
    await page.fill('input[name="houseNumber"]', 'B-12345');

    const saveDraftBtn = page.locator('button:has-text("Save Draft")');
    if (await saveDraftBtn.isVisible()) {
      await saveDraftBtn.click();
      await expect(page.locator('text=Saving draft...').or(page.locator('.spinner'))).toBeVisible();
      await expect(page.locator('text=Draft saved')).toBeVisible();
    }

    await page.click('button:has-text("Next")');

    // Step 2: Building Details & Document Upload
    await page.selectOption('select[name="buildingType"]', { label: 'VILLA' });
    await page.fill('input[name="rooms"]', '4');
    await page.fill('input[name="floorArea"]', '150');
    await page.fill('input[name="constructionYear"]', '2015');

    // Upload Title Deed (Document Upload)
    const buffer = Buffer.from('dummy pdf content');
    await page.setInputFiles('input[type="file"]', {
      name: 'title_deed.pdf',
      mimeType: 'application/pdf',
      buffer
    });

    await page.click('button:has-text("Next")');

    // Step 3: Financial Details
    await page.fill('input[name="units"]', '1');
    await page.fill('input[name="monthlyRent"]', '15000');

    // Submit Registration
    await page.click('button:has-text("Submit Registration")');

    const submitButton = page.locator('button:has-text("Submit Registration")');
    await expect(submitButton).toBeDisabled();
    await expect(page.locator('text=Submitting').or(page.locator('.spinner'))).toBeVisible();
    
    await expect(page.locator('text=successfully').or(page.locator('text=Property Registered'))).toBeVisible();
  });

  test('Woreda Officer approval flow', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto(`${BASE}/`);
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'valid-mock-token');
      localStorage.setItem('user_role', 'WOREDA_OFFICER');
    });
    await page.goto(`${BASE}/dashboard/woreda`);
    await page.waitForURL(/\/dashboard\/woreda/);

    // Go to Property Registrations
    await page.click('text=Property Registrations');
    
    // Assert table loading state
    await expect(page.locator('text=Loading').or(page.locator('.spinner'))).toBeVisible();
    
    // Wait for the list to load
    await page.waitForSelector('text=Loading', { state: 'hidden' });

    // Select the pending property
    await page.click('text=B-12345');
    
    // Click Approve
    await page.click('button:has-text("Approve")');

    // Assert approval loading state
    const approveBtn = page.locator('button:has-text("Approve")');
    await expect(approveBtn).toBeDisabled();
    await expect(page.locator('text=Approving').or(page.locator('.spinner'))).toBeVisible();

    // Assert success
    await expect(page.locator('text=Approved successfully')).toBeVisible();
  });

  test('Woreda Officer rejection flow with notes', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto(`${BASE}/`);
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'valid-mock-token');
      localStorage.setItem('user_role', 'WOREDA_OFFICER');
    });
    await page.goto(`${BASE}/dashboard/woreda`);
    await page.waitForURL(/\/dashboard\/woreda/);

    // Go to Property Registrations
    await page.click('text=Property Registrations');
    await page.waitForSelector('text=Loading', { state: 'hidden' });

    // Select another pending property (fallback to any pending row)
    const pendingRow = page.locator('tr:has-text("Pending")').first();
    await pendingRow.click();
    
    // Click Reject to open rejection modal/form
    await page.click('button:has-text("Reject")');
    
    // Provide rejection notes
    await page.fill('textarea[name="rejectionReason"], textarea[placeholder*="reason"]', 'Documents provided are invalid or expired.');
    
    // Confirm Rejection
    await page.click('button:has-text("Confirm Rejection"), button:has-text("Submit Rejection")');

    // Assert rejection loading state
    const confirmBtn = page.locator('button:has-text("Confirm Rejection"), button:has-text("Submit Rejection")');
    await expect(confirmBtn).toBeDisabled();
    await expect(page.locator('text=Rejecting').or(page.locator('.spinner'))).toBeVisible();

    // Assert success
    await expect(page.locator('text=Rejected successfully')).toBeVisible();
  });

});
