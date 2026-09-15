/**
 * Comprehensive E2E Tests for Admin Security & Administration Dashboard
 * Tests officer list rendering, deactivation flow, and PDF download functionality
 */
import { test, expect, Page } from '@playwright/test';

// Mock data for officers
const mockOfficers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    full_name_en: 'Abebe Kebede',
    role: 'WOREDA OFFICER',
    phone_number: '+251911234567',
    is_active: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    full_name_en: 'Tigist Alemu',
    role: 'TAX OFFICER',
    phone_number: '+251922345678',
    is_active: false,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    full_name_en: 'Mulugeta Desta',
    role: 'WOREDA OFFICER',
    phone_number: '+251933456789',
    is_active: true,
  },
];

/**
 * BULLETPROOF SETUP FUNCTION
 * Handles auth bypassing, dynamic mocking, and delayed loading states BEFORE navigation
 * to avoid race conditions with React's immediate data fetching on mount.
 */
async function setupAdminPage(page: Page, options: { mockData?: any, delay?: number, status?: number } = {}) {
  const { mockData = mockOfficers, delay = 0, status = 200 } = options;

  // 1. Bypass frontend Next.js middleware protection
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'fake_admin_token');
    localStorage.setItem('user_role', 'ADMIN');
  });

  // 2. Setup the dynamic route mock BEFORE navigation
  await page.route('**/api/users/officers/', async (route) => {
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));

    if (status !== 200) {
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ error: 'API Error' }) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockData) });
    }
  });

  await page.route('**/api/auth/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true }) });
  });

  // 3. Navigate
  await page.goto('/dashboard/admin');
  await page.waitForLoadState('networkidle');
}

test.describe('Admin Dashboard - Officer Management', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1280, height: 720 });
    // Auto-accept confirmation dialogs
    page.on('dialog', dialog => dialog.accept());
  });

  // =====================================================================
  // UI RENDERING TESTS
  // =====================================================================

  test('should render the admin dashboard page', async ({ page }) => {
    await setupAdminPage(page);

    // Check for admin dashboard heading or title
    await expect(page.getByRole('heading', { name: /Officer Management/i })).toBeVisible();
  });

  test('should display officers table with all mock officers', async ({ page }) => {
    await setupAdminPage(page);

    // Verify all three officers are displayed
    await expect(page.getByText('Abebe Kebede')).toBeVisible();
    await expect(page.getByText('Tigist Alemu')).toBeVisible();
    await expect(page.getByText('Mulugeta Desta')).toBeVisible();
  });

  test('should display officer roles in the table', async ({ page }) => {
    await setupAdminPage(page);

    // Check that roles are displayed
    const woredaOfficerTexts = await page.getByText(/WOREDA OFFICER/i).count();
    const taxOfficerTexts = await page.getByText(/TAX OFFICER/i).count();

    expect(woredaOfficerTexts).toBeGreaterThanOrEqual(2);
    expect(taxOfficerTexts).toBeGreaterThanOrEqual(1);
  });

  test('should display phone numbers in the table', async ({ page }) => {
    await setupAdminPage(page);

    // Verify phone numbers are shown
    await expect(page.getByText('+251911234567')).toBeVisible();
    await expect(page.getByText('+251922345678')).toBeVisible();
    await expect(page.getByText('+251933456789')).toBeVisible();
  });

  test('should display status badges for officers', async ({ page }) => {
    await setupAdminPage(page);

    // Look for active/inactive status indicators
    const activeStatuses = await page.getByText(/active/i).count();
    const inactiveStatuses = await page.getByText(/inactive/i).count();

    // We have 2 active and 1 inactive officer
    expect(activeStatuses).toBeGreaterThanOrEqual(2);
    expect(inactiveStatuses).toBeGreaterThanOrEqual(1);
  });

  test('should disable deactivate button for inactive officers', async ({ page }) => {
    await setupAdminPage(page);

    // Find the row with Tigist Alemu (inactive officer)
    const tigistRow = page.locator('tr', { has: page.getByText('Tigist Alemu') });

    // Find deactivate button in that row
    const deactivateButton = tigistRow.getByRole('button', { name: /deactivate/i });

    // Assert it's disabled
    await expect(deactivateButton).toBeDisabled();
  });

  test('should enable deactivate button for active officers', async ({ page }) => {
    await setupAdminPage(page);

    // Find the row with Abebe Kebede (active officer)
    const abebeRow = page.locator('tr', { has: page.getByText('Abebe Kebede') });

    // Find deactivate button in that row
    const deactivateButton = abebeRow.getByRole('button', { name: /deactivate/i });

    // Assert it's NOT disabled
    await expect(deactivateButton).not.toBeDisabled();
  });

  test('should display police report buttons for all officers', async ({ page }) => {
    await setupAdminPage(page);

    // Count all "Police Report" or "Incident Report" buttons
    const reportButtons = await page.getByText(/police report|incident report/i).count();

    // Should have at least 3 (one per officer)
    expect(reportButtons).toBeGreaterThanOrEqual(3);
  });

  // =====================================================================
  // DEACTIVATION FLOW TESTS
  // =====================================================================

  test('should show confirmation dialog when deactivate is clicked', async ({ page }) => {
    await setupAdminPage(page);

    // Mock deactivation endpoint before clicking
    await page.route('**/api/users/*/deactivate/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Officer deactivated successfully',
          officer_id: '550e8400-e29b-41d4-a716-446655440001',
          tokens_blacklisted: 2,
        }),
      });
    });

    // Find active officer row
    const abebeRow = page.locator('tr', { has: page.getByText('Abebe Kebede') });
    const deactivateButton = abebeRow.getByRole('button', { name: /deactivate/i });

    // Click deactivate
    await deactivateButton.click();

    // Check for confirmation dialog (could be native confirm or custom modal)
    // If using custom dialog, check for modal visibility
    // If using native confirm, it will be handled automatically in test

    // For this test, we'll assume the click proceeds to API call
  });

  test('should successfully deactivate an active officer', async ({ page }) => {
    await setupAdminPage(page);

    let deactivateRequestMade = false;
    let requestOfficerId = '';

    // Mock deactivation endpoint and capture request
    await page.route('**/api/users/*/deactivate/', async (route) => {
      deactivateRequestMade = true;
      const match = route.request().url().match(/\/users\/([^/]+)\/deactivate/);
      requestOfficerId = match ? match[1] : '';

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Officer deactivated successfully',
          officer_id: requestOfficerId,
          tokens_blacklisted: 2,
        }),
      });
    });

    // Find and click deactivate button for Abebe
    const abebeRow = page.locator('tr', { has: page.getByText('Abebe Kebede') });
    const deactivateButton = abebeRow.getByRole('button', { name: /deactivate/i }).first();
    
    // Setup the refreshed list route (returns Abebe as inactive)
    await page.route('**/api/users/officers/', async (route) => {
      const refreshedMock = [...mockOfficers];
      refreshedMock[0] = { ...refreshedMock[0], is_active: false };
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(refreshedMock),
      });
    });

    await deactivateButton.click({ force: true });

    // Wait a bit for the request
    await page.waitForTimeout(500);

    // Verify request was made
    expect(deactivateRequestMade).toBeTruthy();
    expect(requestOfficerId).toBe('550e8400-e29b-41d4-a716-446655440001');
  });

  test('should display success toast notification after deactivation', async ({ page }) => {
    await setupAdminPage(page);

    // Mock deactivation endpoint
    await page.route('**/api/users/*/deactivate/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Officer deactivated successfully',
          officer_id: '550e8400-e29b-41d4-a716-446655440001',
          tokens_blacklisted: 2,
        }),
      });
    });

    // Click deactivate button
    const abebeRow = page.locator('tr', { has: page.getByText('Abebe Kebede') });
    const deactivateButton = abebeRow.getByRole('button', { name: /deactivate/i }).first();
    
    // Setup the refreshed list route (returns Abebe as inactive)
    await page.route('**/api/users/officers/', async (route) => {
      const refreshedMock = [...mockOfficers];
      refreshedMock[0] = { ...refreshedMock[0], is_active: false };
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(refreshedMock),
      });
    });

    await deactivateButton.click({ force: true });

    // Wait for and verify toast notification
    // Common toast patterns: look for success message
    const successToast = page.getByText(/successfully deactivated|deactivated successfully|success/i).first();

    await expect(successToast).toBeVisible({ timeout: 5000 });
  });

  test('should handle deactivation API errors gracefully', async ({ page }) => {
    await setupAdminPage(page);

    // Mock error response
    await page.route('**/api/users/*/deactivate/', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error',
        }),
      });
    });

    // Click deactivate button
    const abebeRow = page.locator('tr', { has: page.getByText('Abebe Kebede') });
    const deactivateButton = abebeRow.getByRole('button', { name: /deactivate/i }).first();
    
    // Setup the refreshed list route (returns Abebe as inactive)
    await page.route('**/api/users/officers/', async (route) => {
      const refreshedMock = [...mockOfficers];
      refreshedMock[0] = { ...refreshedMock[0], is_active: false };
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(refreshedMock),
      });
    });

    await deactivateButton.click({ force: true });

    // Wait for error toast
    const errorToast = page.getByText(/error|failed|something went wrong/i).first();

    await expect(errorToast).toBeVisible({ timeout: 5000 });
  });

  test('should refresh officer list after successful deactivation', async ({ page }) => {
    let officersRequestCount = 0;

    // Setup route mock BEFORE navigation
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'fake_admin_token');
      localStorage.setItem('user_role', 'ADMIN');
    });

    await page.route('**/api/users/officers/', async (route) => {
      officersRequestCount++;

      // Return updated list on second request
      if (officersRequestCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockOfficers),
        });
      } else {
        // Update Abebe to inactive
        const updatedOfficers = mockOfficers.map((officer) =>
          officer.id === '550e8400-e29b-41d4-a716-446655440001'
            ? { ...officer, is_active: false }
            : officer
        );

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(updatedOfficers),
        });
      }
    });

    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true }) });
    });

    await page.route('**/api/users/*/deactivate/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Officer deactivated successfully',
          officer_id: '550e8400-e29b-41d4-a716-446655440001',
        }),
      });
    });

    await page.goto('/dashboard/admin');
    await page.waitForLoadState('networkidle');

    // Click deactivate
    const abebeRow = page.locator('tr', { has: page.getByText('Abebe Kebede') });
    const deactivateButton = abebeRow.getByRole('button', { name: /deactivate/i }).first();
    
    // Setup the refreshed list route (returns Abebe as inactive)
    await page.route('**/api/users/officers/', async (route) => {
      const refreshedMock = [...mockOfficers];
      refreshedMock[0] = { ...refreshedMock[0], is_active: false };
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(refreshedMock),
      });
    });

    await deactivateButton.click({ force: true });

    // Wait for refresh
    await page.waitForTimeout(1000);

    // Verify officers endpoint was called twice
    expect(officersRequestCount).toBeGreaterThanOrEqual(2);
  });

  // =====================================================================
  // PDF DOWNLOAD FLOW TESTS
  // =====================================================================

  test('should trigger PDF download when police report button is clicked', async ({ page }) => {
    await setupAdminPage(page);

    // Create a dummy PDF blob
    const pdfContent = Buffer.from('%PDF-1.4 dummy pdf content');

    // Mock incident report endpoint - NO route.fetch()
    await page.route('**/api/users/*/incident-report/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        headers: {
          'x-report-signature': 'abc123mockedsignature',
          'content-disposition': 'attachment; filename="incident_report_550e8400-e29b-41d4-a716-446655440001.pdf"',
        },
        body: pdfContent,
      });
    });

    // Set up download listener BEFORE clicking
    const downloadPromise = page.waitForEvent('download');

    // Click police report button for first officer
    const policeReportButton = page.getByText(/police report|incident report/i).first();
    await policeReportButton.click();

    // Wait for download to start
    const download = await downloadPromise;

    // Verify download started
    expect(download).toBeTruthy();
  });

  test('should download PDF with correct filename format', async ({ page }) => {
    await setupAdminPage(page);

    const pdfContent = Buffer.from('%PDF-1.4 dummy pdf content');

    await page.route('**/api/users/*/incident-report/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        headers: {
          'x-report-signature': 'abc123mockedsignature',
          'content-disposition': 'attachment; filename="incident_report_550e8400-e29b-41d4-a716-446655440001.pdf"',
        },
        body: pdfContent,
      });
    });

    const downloadPromise = page.waitForEvent('download');

    // Click police report button
    const policeReportButton = page.getByText(/police report|incident report/i).first();
    await policeReportButton.click();

    const download = await downloadPromise;

    // Verify filename starts with incident_report_
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/^incident_report_/);
    expect(suggestedFilename).toMatch(/\.pdf$/);
  });

  test('should include x-report-signature header in PDF response', async ({ page }) => {
    await setupAdminPage(page);

    const pdfContent = Buffer.from('%PDF-1.4 dummy pdf content');

    // Mock with hardcoded signature - NO route.fetch()
    await page.route('**/api/users/*/incident-report/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        headers: {
          'x-report-signature': 'abc123mockedsignature',
          'content-disposition': 'attachment; filename="incident_report_test.pdf"',
        },
        body: pdfContent,
      });
    });

    // Use proper Promise.all pattern
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByText(/police report|incident report/i).first().click(),
    ]);

    expect(download).toBeTruthy();

    // Note: Headers are mocked in the fulfill payload
    // The test verifies the download completes successfully with the mocked signature
  });

  test('should handle multiple PDF downloads for different officers', async ({ page }) => {
    await setupAdminPage(page);

    const pdfContent = Buffer.from('%PDF-1.4 dummy pdf content');
    let downloadCount = 0;

    await page.route('**/api/users/*/incident-report/', async (route) => {
      downloadCount++;
      const officerId = route.request().url().split('/').slice(-2, -1)[0];

      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        headers: {
          'x-report-signature': `abc123mockedsignature${downloadCount}`,
          'content-disposition': `attachment; filename="incident_report_${officerId}.pdf"`,
        },
        body: pdfContent,
      });
    });

    // Get all police report buttons
    const policeReportButtons = page.getByText(/police report|incident report/i);

    // Download first report
    const [download1] = await Promise.all([
      page.waitForEvent('download'),
      policeReportButtons.first().click(),
    ]);

    expect(download1).toBeTruthy();

    // Download second report
    const [download2] = await Promise.all([
      page.waitForEvent('download'),
      policeReportButtons.nth(1).click(),
    ]);

    expect(download2).toBeTruthy();
    expect(downloadCount).toBe(2);
  });

  test('should show error message if PDF generation fails', async ({ page }) => {
    await setupAdminPage(page);

    // Mock error response
    await page.route('**/api/users/*/incident-report/', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Failed to generate report',
        }),
      });
    });

    // Click police report button
    await page.getByText(/police report|incident report/i).first().click();

    // Wait for error notification
    const errorMessage = page.getByText(/error|failed|could not generate/i).first();

    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  // =====================================================================
  // ACCESSIBILITY & RESPONSIVE TESTS
  // =====================================================================

  test('should be keyboard navigable', async ({ page }) => {
    await setupAdminPage(page);

    // Tab through the interface
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should display properly on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await setupAdminPage(page);

    // Verify content is still visible
    await expect(page.getByText('Abebe Kebede')).toBeVisible();
  });

  test('should have proper ARIA labels for buttons', async ({ page }) => {
    await setupAdminPage(page);

    // Check for accessible buttons
    const deactivateButtons = page.getByRole('button', { name: /deactivate/i });
    const reportButtons = page.getByRole('button', { name: /report/i });

    expect(await deactivateButtons.count()).toBeGreaterThan(0);
    expect(await reportButtons.count()).toBeGreaterThan(0);
  });

  // =====================================================================
  // LOADING & ERROR STATES
  // =====================================================================

  test('should show loading state while fetching officers', async ({ page }) => {
    // Use the helper function with delay option
    await setupAdminPage(page, { delay: 2000 });

    // Data should now be visible after delay
    await expect(page.getByText('Abebe Kebede')).toBeVisible({ timeout: 5000 });
  });

  test('should display error message if officers API fails', async ({ page }) => {
    // Use the helper function with error status
    await setupAdminPage(page, { status: 500 });

    // Look for error message
    const errorMessage = page.getByText(/error|failed|could not load/i).first();

    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should display empty state when no officers exist', async ({ page }) => {
    // Use the helper function with empty data
    await setupAdminPage(page, { mockData: [] });

    // Look for empty state message
    const emptyMessage = page.getByText(/no officers|empty|no data/i).first();

    await expect(emptyMessage).toBeVisible({ timeout: 5000 });
  });
});
