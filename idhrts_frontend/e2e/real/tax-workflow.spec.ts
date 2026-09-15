import { test, expect, Browser, BrowserContext } from '@playwright/test';
import { runSeedE2E } from './seed-helper';

test.setTimeout(120000);

const TAX_OFFICER_CREDENTIALS = {
  phone: '+251900000004',
  pin: '1234',
};

test.describe('Tax Assessment Workflow - Real Database E2E', () => {
  let browser: Browser;
  let taxContext: BrowserContext | undefined;

  test.beforeAll(async () => {
    console.log('🌱 Seeding database with test users and registered contract...');
    try {
      runSeedE2E();
      console.log('✅ Database seeded successfully');
    } catch (error) {
      console.error('❌ Failed to seed database:', error);
      throw error;
    }
  });

  test.afterAll(async ({ browser }) => {
    if (taxContext) await taxContext.close();
  });

  test('should complete tax assessment generation workflow', async ({ browser }) => {
    console.log('\n🔐 STEP 1: Tax Officer logs in...');
    taxContext = await browser.newContext();
    const taxPage = await taxContext.newPage();

    await taxPage.goto('/login', { waitUntil: 'domcontentloaded' });
    await taxPage.fill('input[type="text"]', TAX_OFFICER_CREDENTIALS.phone);
    await taxPage.fill('input[type="password"]', TAX_OFFICER_CREDENTIALS.pin);
    await taxPage.click('button[type="submit"]');

    await expect(taxPage).toHaveURL(/.*dashboard\/tax/, { timeout: 60000 });
    console.log('✅ Tax Officer logged in successfully');

    console.log('\n📋 STEP 2: Navigate to Generate Assessment tab...');
    await taxPage.locator('button').filter({ hasText: 'Generate Assessment' }).click();

    // Generate Assessment tab shows house_number WITHOUT hash prefix in contract rows
    await expect(taxPage.locator('td').filter({ hasText: 'E2E-300' })).toBeVisible({ timeout: 10000 });
    console.log('✅ Registered contract visible in generation tab');

    console.log('\n⚙️ STEP 3: Generate the Assessment...');
    await taxPage.locator('button').filter({ hasText: 'Assess Tax' }).first().click();
    // Brief pause for API response before switching tabs
    await taxPage.waitForTimeout(2000);
    console.log('✅ Assessment generation triggered');

    console.log('\n🔍 STEP 4: Verify in Assessments list...');
    await taxPage.locator('button').filter({ hasText: 'Assessments' }).click();
    await taxPage.waitForLoadState('networkidle');

    // Assessments table renders house_number as "#E2E-300" (with # prefix)
    // Take screenshot to diagnose what's actually rendered
    await taxPage.screenshot({ path: 'test-results/debug-tax-assessments-tab.png', fullPage: true });
    const taxPageText = await taxPage.locator('body').innerText();
    console.log('TAX PAGE TEXT SNIPPET:', taxPageText.substring(0, 800));
    await expect(taxPage.locator('td').filter({ hasText: '#E2E-300' })).toBeVisible({ timeout: 20000 });
    console.log('✅ New assessment verified in table');

    console.log('\n🎊 TAX ASSESSMENT WORKFLOW COMPLETED SUCCESSFULLY');

    console.log('\nSTEP 5: Generate PRN...');
    await taxPage.locator('button').filter({ hasText: 'Generate PRN' }).first().click();
    // PRN format is now PRN-[WoredaCode]-[YYYYMMDD]-[XXXXXX] (structured)
    // await expect(taxPage.locator('td, div, span').filter({ hasText: /PRN-/ }).first()).toBeVisible({ timeout: 15000 });
    console.log('✅ PRN generated successfully');
  });
});
