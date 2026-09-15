import { test, expect, Browser, BrowserContext } from '@playwright/test';
import { runSeedE2E, getLatestOTP } from './seed-helper';
import path from 'path';

/**
 * Real E2E Test: Tenant Contract Signing Workflow
 *
 * This test executes against the REAL Next.js frontend (localhost:3000) and Django backend.
 * No API mocking. Database is seeded before each test run.
 *
 * Flow:
 * 1. Tenant navigates to pending contract via secure review link
 * 2. Tenant reviews and agrees to contract terms
 * 3. Tenant requests OTP (backend creates OTP in database)
 * 4. Test retrieves OTP directly from database (simulating SMS reception)
 * 5. Tenant submits OTP and signs contract
 * 6. Verify contract status transitions to SIGNED
 */

// Generous timeout for real database operations and Next.js rendering
test.setTimeout(120000);

// Seeded user credentials (created by seed_e2e command)
const TENANT_CREDENTIALS = {
  phone: '+251900000002',
  pin: '1234',
};

// Secure review token from seed_e2e
const SECURE_REVIEW_TOKEN = 'e2e-test-contract-token-12345678';

test.describe('Contract Signing Workflow - Real Database E2E', () => {
  let tenantContext: BrowserContext;

  test.beforeAll(async () => {
    console.log('🌱 Seeding database with test users and contract...');
    try {
      runSeedE2E();
      console.log('✅ Database seeded successfully');
    } catch (error) {
      console.error('❌ Failed to seed database:', error);
      throw error;
    }
  });

  test.afterAll(async () => {
    if (tenantContext) await tenantContext.close();
  });

  test('should complete contract signing workflow: Review → Agree → Sign with OTP', async ({ browser }) => {
    const backendPath = path.resolve(__dirname, '../../../idhrts_backend');

    // ==================== STEP 1: NAVIGATE TO SECURE REVIEW LINK ====================
    console.log('\n📋 STEP 1: Tenant navigates to secure contract review link...');

    tenantContext = await browser.newContext();
    const tenantPage = await tenantContext.newPage();

    await tenantPage.goto(`/review/${SECURE_REVIEW_TOKEN}`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });

    // The page h1 says "Rental Contract Review" — wait for it
    await expect(tenantPage.locator('h1').filter({ hasText: 'Rental Contract Review' })).toBeVisible({ timeout: 30000 });
    console.log('✅ Contract review page loaded');

    // Verify the Contract Terms section is rendered
    await expect(tenantPage.locator('h2').filter({ hasText: 'Contract Terms' })).toBeVisible({ timeout: 15000 });
    // Verify monthly rent appears in any locale format (ETB followed by digits)
    await expect(tenantPage.locator('td').filter({ hasText: /^ETB/ }).first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Contract terms visible');

    // Verify status badge shows pending
    await expect(tenantPage.locator('text=/PENDING YOUR SIGNATURE/i')).toBeVisible({ timeout: 10000 });
    console.log('✅ Contract status is PENDING YOUR SIGNATURE');

    // ==================== STEP 2: TENANT AGREES TO TERMS ====================
    console.log('\n✔ STEP 2: Tenant agrees to contract terms...');

    const agreeCheckbox = tenantPage.locator('input[type="checkbox"]');
    await agreeCheckbox.check();
    await expect(agreeCheckbox).toBeChecked();
    console.log('✅ Agreement checkbox checked');

    const signButton = tenantPage.locator('button:has-text("I Agree & Sign Digitally")');
    await expect(signButton).toBeEnabled({ timeout: 5000 });
    await signButton.click();
    console.log('✅ Sign button clicked');

    // ==================== STEP 3: OTP MODAL APPEARS ====================
    console.log('\n📱 STEP 3: OTP modal appears...');

    const otpModal = tenantPage.locator('h3').filter({ hasText: 'Enter OTP' });
    await expect(otpModal).toBeVisible({ timeout: 15000 });
    console.log('✅ OTP modal visible');

    const otpInput = tenantPage.locator('input[type="text"][maxlength="6"]');
    await expect(otpInput).toBeVisible({ timeout: 5000 });
    console.log('✅ OTP input field visible');

    // ==================== STEP 4: RETRIEVE OTP FROM DATABASE ====================
    console.log('\n🔍 STEP 4: Retrieving OTP from database...');

    // Wait a moment for the OTP to be persisted
    await tenantPage.waitForTimeout(1500);

    let otpCode: string;
    try {
      otpCode = getLatestOTP('+251900000002');

      if (otpCode === 'NO_OTP' || otpCode.length !== 6) {
        throw new Error(`Invalid OTP retrieved from DB: "${otpCode}"`);
      }
      console.log(`✅ Retrieved OTP from database: ${otpCode}`);
    } catch (error) {
      console.error('❌ Failed to retrieve OTP:', error);
      throw error;
    }

    // ==================== STEP 5: ENTER OTP AND SIGN ====================
    console.log('\n✍️ STEP 5: Tenant enters OTP and signs contract...');

    await otpInput.fill(otpCode);
    await expect(otpInput).toHaveValue(otpCode);
    console.log(`✅ OTP entered: ${otpCode}`);

    const verifyButton = tenantPage.locator('button:has-text("Verify & Sign")');
    await expect(verifyButton).toBeEnabled({ timeout: 5000 });
    await verifyButton.click();
    console.log('✅ Verify & Sign button clicked');

    // ==================== STEP 6: VERIFY CONTRACT IS SIGNED ====================
    console.log('\n🎉 STEP 6: Verifying contract signature...');

    await expect(tenantPage.locator('text=/Contract Signed Successfully/i')).toBeVisible({ timeout: 15000 });
    console.log('✅ Success message displayed');

    await expect(tenantPage.locator('text=/Your signature has been recorded/i')).toBeVisible({ timeout: 5000 });
    console.log('✅ Signature confirmation text visible');

    await tenantPage.close();
    console.log('\n🎊 CONTRACT SIGNING WORKFLOW COMPLETED SUCCESSFULLY');
  });
});

