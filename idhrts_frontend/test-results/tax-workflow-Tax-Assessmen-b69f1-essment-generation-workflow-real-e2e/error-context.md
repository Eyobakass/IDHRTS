# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: real\tax-workflow.spec.ts >> Tax Assessment Workflow - Real Database E2E >> should complete tax assessment generation workflow
- Location: e2e\real\tax-workflow.spec.ts:30:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('td, div, span').filter({ hasText: /PRN-/ }).first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('td, div, span').filter({ hasText: /PRN-/ }).first()

```

```yaml
- alert
- navigation:
  - link "IDHRTS":
    - /url: /
    - img
    - text: IDHRTS
  - text: Tax Officer Portal
  - button:
    - img
  - img
  - button "Logout"
- main:
  - heading "Tax Assessments Overview" [level=1]
  - button "Revenue Report PDF":
    - img
    - text: Revenue Report PDF
  - paragraph: Total Assessments
  - paragraph: "1"
  - img
  - paragraph: Pending Payment
  - paragraph: "1"
  - img
  - paragraph: Paid
  - paragraph: "0"
  - img
  - button "Assessments"
  - button "Generate Assessment"
  - button "Vacant Properties"
  - heading "SIGTAS Export" [level=3]
  - paragraph: Export a CSV report of all tax assessments in SIGTAS-compatible format for submission to the tax authority
  - text: "Format: CSV | Fields: 13 columns | Scope: All assessments in your sub-city"
  - button "Download SIGTAS CSV"
  - heading "All Assessments" [level=2]
  - table:
    - rowgroup:
      - row "Property Landlord Tax Year Total Due (ETB) Due Date Status Actions":
        - columnheader "Property"
        - columnheader "Landlord"
        - columnheader "Tax Year"
        - columnheader "Total Due (ETB)"
        - columnheader "Due Date"
        - columnheader "Status"
        - columnheader "Actions"
    - rowgroup:
      - row "#E2E-300 Landlord 2026/2027 ETB 23,100 Jan 31, 2027 PENDING Pay Online Generate PRN Flag Investigate Override":
        - cell "#E2E-300"
        - cell "Landlord"
        - cell "2026/2027"
        - cell "ETB 23,100"
        - cell "Jan 31, 2027"
        - cell "PENDING"
        - cell "Pay Online Generate PRN Flag Investigate Override":
          - button "Pay Online"
          - button "Generate PRN"
          - button "Flag Investigate"
          - button "Override"
```

# Test source

```ts
  1  | import { test, expect, Browser, BrowserContext } from '@playwright/test';
  2  | import { runSeedE2E } from './seed-helper';
  3  | 
  4  | test.setTimeout(120000);
  5  | 
  6  | const TAX_OFFICER_CREDENTIALS = {
  7  |   phone: '+251900000004',
  8  |   pin: '1234',
  9  | };
  10 | 
  11 | test.describe('Tax Assessment Workflow - Real Database E2E', () => {
  12 |   let browser: Browser;
  13 |   let taxContext: BrowserContext | undefined;
  14 | 
  15 |   test.beforeAll(async () => {
  16 |     console.log('🌱 Seeding database with test users and registered contract...');
  17 |     try {
  18 |       runSeedE2E();
  19 |       console.log('✅ Database seeded successfully');
  20 |     } catch (error) {
  21 |       console.error('❌ Failed to seed database:', error);
  22 |       throw error;
  23 |     }
  24 |   });
  25 | 
  26 |   test.afterAll(async ({ browser }) => {
  27 |     if (taxContext) await taxContext.close();
  28 |   });
  29 | 
  30 |   test('should complete tax assessment generation workflow', async ({ browser }) => {
  31 |     console.log('\n🔐 STEP 1: Tax Officer logs in...');
  32 |     taxContext = await browser.newContext();
  33 |     const taxPage = await taxContext.newPage();
  34 | 
  35 |     await taxPage.goto('/login', { waitUntil: 'domcontentloaded' });
  36 |     await taxPage.fill('input[type="text"]', TAX_OFFICER_CREDENTIALS.phone);
  37 |     await taxPage.fill('input[type="password"]', TAX_OFFICER_CREDENTIALS.pin);
  38 |     await taxPage.click('button[type="submit"]');
  39 | 
  40 |     await expect(taxPage).toHaveURL(/.*dashboard\/tax/, { timeout: 60000 });
  41 |     console.log('✅ Tax Officer logged in successfully');
  42 | 
  43 |     console.log('\n📋 STEP 2: Navigate to Generate Assessment tab...');
  44 |     await taxPage.locator('button').filter({ hasText: 'Generate Assessment' }).click();
  45 | 
  46 |     // Generate Assessment tab shows house_number WITHOUT hash prefix in contract rows
  47 |     await expect(taxPage.locator('td').filter({ hasText: 'E2E-300' })).toBeVisible({ timeout: 10000 });
  48 |     console.log('✅ Registered contract visible in generation tab');
  49 | 
  50 |     console.log('\n⚙️ STEP 3: Generate the Assessment...');
  51 |     await taxPage.locator('button').filter({ hasText: 'Assess Tax' }).first().click();
  52 |     // Brief pause for API response before switching tabs
  53 |     await taxPage.waitForTimeout(2000);
  54 |     console.log('✅ Assessment generation triggered');
  55 | 
  56 |     console.log('\n🔍 STEP 4: Verify in Assessments list...');
  57 |     await taxPage.locator('button').filter({ hasText: 'Assessments' }).click();
  58 |     await taxPage.waitForLoadState('networkidle');
  59 | 
  60 |     // Assessments table renders house_number as "#E2E-300" (with # prefix)
  61 |     // Take screenshot to diagnose what's actually rendered
  62 |     await taxPage.screenshot({ path: 'test-results/debug-tax-assessments-tab.png', fullPage: true });
  63 |     const taxPageText = await taxPage.locator('body').innerText();
  64 |     console.log('TAX PAGE TEXT SNIPPET:', taxPageText.substring(0, 800));
  65 |     await expect(taxPage.locator('td').filter({ hasText: '#E2E-300' })).toBeVisible({ timeout: 20000 });
  66 |     console.log('✅ New assessment verified in table');
  67 | 
  68 |     console.log('\n🎊 TAX ASSESSMENT WORKFLOW COMPLETED SUCCESSFULLY');
  69 | 
  70 |     console.log('\nSTEP 5: Generate PRN...');
  71 |     await taxPage.locator('button').filter({ hasText: 'Generate PRN' }).first().click();
  72 |     // PRN format is now PRN-[WoredaCode]-[YYYYMMDD]-[XXXXXX] (structured)
  73 |     await expect(
  74 |       taxPage.locator('td, div, span').filter({ hasText: /PRN-/ }).first()
> 75 |     ).toBeVisible({ timeout: 15000 });
     |       ^ Error: expect(locator).toBeVisible() failed
  76 |     console.log('✅ PRN generated successfully');
  77 |   });
  78 | });
  79 | 
```