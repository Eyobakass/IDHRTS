import { test, expect, Browser, BrowserContext } from '@playwright/test';
import { runSeedE2E } from './seed-helper';
/** *
 * Flow:
 * 1. Landlord registers a new property
 * 2. Woreda Officer approves the property
 * 3. Tax Officer verifies the property appears in their dashboard
 */

// Generous timeout for real database operations and Next.js rendering
test.setTimeout(120000);

// Seeded user credentials (created by seed_e2e command)
const LANDLORD_CREDENTIALS = {
  phone: '+251900000001',
  pin: '1234',
};

const WOREDA_OFFICER_CREDENTIALS = {
  phone: '+251900000003',
  pin: '1234',
};

const TAX_OFFICER_CREDENTIALS = {
  phone: '+251900000004',
  pin: '1234',
};

// Test property data
const TEST_PROPERTY = {
  houseNumber: `TEST-${Date.now()}`, // Unique house number for each test run
  buildingType: 'Villa',
  kebele: '05',
  monthlyRent: '15000',
};

test.describe('Property Workflow - Real Database E2E', () => {
  let browser: Browser;
  let landlordContext: BrowserContext | undefined;
  let woredaContext: BrowserContext | undefined;
  let taxContext: BrowserContext | undefined;

  test.beforeAll(async () => {
    console.log('?? Seeding database with test users...');
    runSeedE2E();
    console.log('? Database seeded successfully');
  });

  test.afterAll(async ({ browser }) => {
    // Clean up browser contexts
    if (landlordContext) await landlordContext.close();
    if (woredaContext) await woredaContext.close();
    if (taxContext) await taxContext.close();
  });

  test('should complete full property workflow: Register â†’ Approve â†’ Verify', async ({ browser }) => {
    // ==================== STEP 1: LANDLORD REGISTRATION ====================
    console.log('\nðŸ“ STEP 1: Landlord registers property...');

    landlordContext = await browser.newContext();
    const landlordPage = await landlordContext.newPage();

    // Navigate to login page
    landlordPage.on('console', msg => console.log('BROWSER CONSOLE: ', msg.text()));
    await landlordPage.goto('/login', { waitUntil: 'domcontentloaded' });

    // Login as Landlord (inputs lack htmlFor, so use type selectors)
    await landlordPage.locator('input[type="text"]').fill(LANDLORD_CREDENTIALS.phone);
    await landlordPage.locator('input[type="password"]').fill(LANDLORD_CREDENTIALS.pin);
    await landlordPage.click('button[type="submit"]');

    // Wait for navigation to landlord dashboard
    await expect(landlordPage).toHaveURL(/.*dashboard\/landlord/);
    console.log('âœ… Landlord logged in successfully');

    // Navigate to property registration page
    landlordPage.on('console', msg => console.log('BROWSER CONSOLE: ', msg.text()));
    await landlordPage.goto('/dashboard/landlord/register-property', {
      waitUntil: 'domcontentloaded',
    });

    // Fill out property registration form
    console.log(`📋 Filling property form with house number: ${TEST_PROPERTY.houseNumber}`);

    await landlordPage.fill('input[placeholder="e.g. A-205"]', TEST_PROPERTY.houseNumber);
    await landlordPage.selectOption('select', TEST_PROPERTY.buildingType.toUpperCase());
    await landlordPage.fill('input[placeholder="Enter kebele name or number"]', TEST_PROPERTY.kebele);
    await landlordPage.fill('input[type="number"]', TEST_PROPERTY.monthlyRent);

    // Upload a dummy file (required by form validation before submit is allowed)
    await landlordPage.setInputFiles('input[type="file"]', {
      name: 'title_deed.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 dummy title deed for E2E testing'),
    });

    // Handle any alert dialogs that may appear
    landlordPage.on('dialog', async (dialog) => {
      console.log(`Dialog: ${dialog.message()}`);
      await dialog.accept();
    });

    // Submit the form
    await landlordPage.click('button[type="submit"]');

    // Wait for redirect to exact landlord dashboard (NOT register-property sub-route)
    await landlordPage.waitForURL('**/dashboard/landlord', { timeout: 30000 });
    console.log('✅ Redirected to landlord dashboard');

    // Wait for page to settle and re-fetch property list
    await landlordPage.waitForLoadState('networkidle');
    // Reload to ensure fresh data is fetched from backend
    await landlordPage.reload();
    await landlordPage.waitForLoadState('networkidle');

    // PropertyCard renders as "House #<house_number>" — match that exact text
    // Take screenshot to diagnose what's actually on page
    await landlordPage.screenshot({ path: 'test-results/debug-landlord-after-register.png', fullPage: true });
    const pageText = await landlordPage.locator('body').innerText();
    console.log('PAGE TEXT SNIPPET:', pageText.substring(0, 500));
    const propertyRow = landlordPage.locator(`text=House #${TEST_PROPERTY.houseNumber}`);
    await expect(propertyRow).toBeVisible({ timeout: 30000 });
    console.log('✅ Property appears in landlord dashboard');

    await landlordPage.close();

    // ==================== STEP 2: WOREDA OFFICER APPROVAL ====================
    console.log('\nâœ… STEP 2: Woreda Officer approves property...');

    woredaContext = await browser.newContext();
    const woredaPage = await woredaContext.newPage();

    // Login as Woreda Officer
    await woredaPage.goto('/login', { waitUntil: 'domcontentloaded' });
    await woredaPage.locator('input[type="text"]').fill(WOREDA_OFFICER_CREDENTIALS.phone);
    await woredaPage.locator('input[type="password"]').fill(WOREDA_OFFICER_CREDENTIALS.pin);
    await woredaPage.click('button[type="submit"]');

    // Wait for navigation to woreda dashboard
    await expect(woredaPage).toHaveURL(/.*dashboard\/woreda/);
    console.log('âœ… Woreda Officer logged in successfully');

    // Verify the newly registered property appears with PENDING_REVIEW status
    const pendingProperty = woredaPage.locator(`tr:has-text("${TEST_PROPERTY.houseNumber}")`);
    await expect(pendingProperty).toBeVisible({ timeout: 10000 });
    console.log('âœ… Property visible in Woreda dashboard');

    const pendingBadge = pendingProperty.locator('text=/pending.*review/i');
    await expect(pendingBadge).toBeVisible({ timeout: 5000 });
    console.log('âœ… Property status is PENDING_REVIEW');

    // Navigate to property details page
    const viewDetailsButton = pendingProperty.locator('a:has-text("View Details"), button:has-text("View Details")');
    await viewDetailsButton.click();
    await woredaPage.waitForURL('**/dashboard/woreda/**', { timeout: 10000 });
    console.log('âœ… Navigated to property details page');

    // Setup dialog handler to auto-accept confirmation dialogs
    woredaPage.on('dialog', async (dialog) => {
      console.log(`ðŸ“¢ Dialog detected: ${dialog.message()}`);
      await dialog.accept();
    });

    // Click the Approve button
    const approveButton = woredaPage.locator('button:has-text("Approve")').first();
    await approveButton.click();

    // Wait for status to update to ACTIVE
    const activeBadge = woredaPage.locator('text=/active/i').first();
    await expect(activeBadge).toBeVisible({ timeout: 15000 });
    console.log('âœ… Property status updated to ACTIVE');

    await woredaPage.close();

    
});

});


