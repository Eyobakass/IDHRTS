import { test, expect, BrowserContext } from '@playwright/test';
import { runSeedE2E } from './seed-helper';

/**
 * Real E2E Test: Woreda Officer Dispute List View
 *
 * Tests that a seeded FILED dispute appears in the Woreda dashboard.
 * No API mocking — connects to real Django backend.
 */

test.setTimeout(120000);

const WOREDA_OFFICER_CREDENTIALS = {
  phone: '+251900000003',
  pin: '1234',
};

test.describe('Dispute Workflow - Real Database E2E', () => {
  let woredaContext: BrowserContext;

  test.beforeAll(async () => {
    console.log('🌱 Seeding database with test users and dispute...');
    runSeedE2E();
    console.log('✅ Database seeded successfully');
  });

  test.afterAll(async () => {
    if (woredaContext) await woredaContext.close();
  });

  test('should view filed dispute in Woreda dashboard', async ({ browser }) => {
    woredaContext = await browser.newContext();
    const woredaPage = await woredaContext.newPage();

    // ==================== STEP 1: LOGIN ====================
    console.log('\n🔐 STEP 1: Woreda Officer logs in...');

    await woredaPage.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Login page uses type="text" for phone, type="password" for PIN
    await woredaPage.fill('input[type="text"]', WOREDA_OFFICER_CREDENTIALS.phone);
    await woredaPage.fill('input[type="password"]', WOREDA_OFFICER_CREDENTIALS.pin);
    await woredaPage.click('button[type="submit"]');

    await expect(woredaPage).toHaveURL(/.*dashboard\/woreda/, { timeout: 60000 });
    console.log('✅ Woreda Officer logged in successfully');

    // ==================== STEP 2: NAVIGATE TO DISPUTES TAB ====================
    console.log('\n📋 STEP 2: Clicking Disputes tab...');

    const disputesTab = woredaPage.locator('button').filter({ hasText: 'Disputes' }).first();
    await expect(disputesTab).toBeVisible({ timeout: 10000 });
    await disputesTab.click();
    console.log('✅ Disputes tab clicked');

    // ==================== STEP 3: VERIFY FILED DISPUTE IS LISTED ====================
    console.log('\n🔍 STEP 3: Verifying FILED dispute in list...');

    // Wait for the "Woreda Disputes" section heading to render
    await expect(woredaPage.locator('text=/Woreda Disputes/i')).toBeVisible({ timeout: 15000 });

    // The seeded dispute has status FILED — verify the badge is present
    await expect(woredaPage.locator('text=/FILED/i').first()).toBeVisible({ timeout: 10000 });
    console.log('✅ FILED dispute badge is visible in the Woreda dashboard');

    // ==================== STEP 4: NAVIGATE TO DISPUTE DETAILS ====================
    console.log('\n🔍 STEP 4: Clicking Manage on dispute...');
    
    // Click the new "Manage ->" button
    await woredaPage.locator('button').filter({ hasText: 'Manage' }).first().click();
    
    // Wait for the dispute detail page to load
    await expect(woredaPage).toHaveURL(/.*dashboard\/woreda\/disputes\/.+/, { timeout: 30000 });
    await expect(woredaPage.locator('h1').filter({ hasText: 'Dispute Details' })).toBeVisible({ timeout: 15000 });
    console.log('✅ Navigated to Dispute Details page');

    // ==================== STEP 5: ACKNOWLEDGE DISPUTE ====================
    console.log('\n✅ STEP 5: Acknowledging dispute (FILED -> UNDER_REVIEW)...');
    
    await woredaPage.locator('button').filter({ hasText: 'Acknowledge & Begin Review' }).click();
    
    // Wait for status to change to UNDER_REVIEW
    await expect(woredaPage.locator('text=/UNDER_REVIEW/i').first()).toBeVisible({ timeout: 15000 });
    console.log('✅ Dispute acknowledged and moved to UNDER_REVIEW');

    // ==================== STEP 6: RESOLVE DISPUTE ====================
    console.log('\n⚖️ STEP 6: Entering ruling to resolve dispute...');
    
    // Minimum 50 chars required
    const rulingText = "After careful review of the submitted evidence, the woreda finds in favor of the tenant. The rent increase violates the current housing directives.";
    await woredaPage.fill('textarea', rulingText);
    await woredaPage.locator('button').filter({ hasText: 'Submit Resolution' }).click();

    // Wait for status to change to DECISION_ISSUED (UI formats it as "Decision Issued")
    await expect(woredaPage.locator('text=/Decision Issued/i').first()).toBeVisible({ timeout: 15000 });
    // Verify appeal deadline is displayed
    await expect(woredaPage.locator('text=/Appeal deadline/i').first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Dispute resolved and DECISION_ISSUED');

    await woredaPage.close();
    console.log('\n🎊 DISPUTE RESOLUTION WORKFLOW COMPLETED SUCCESSFULLY');
  });
});

