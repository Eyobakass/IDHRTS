/**
 * Playwright Global Setup — Next.js Route Warmer
 *
 * Next.js dev server compiles routes on-demand (JIT). The first request to
 * each route can take 20-90 seconds. If a Playwright test hits a cold route
 * its goto() times out before the page is ready.
 *
 * This global setup pre-warms every route used by the real-e2e suite so that
 * by the time the first test runs, all routes are already compiled and cached.
 */

import { chromium } from '@playwright/test';

const ROUTES_TO_WARM = [
  'http://localhost/login',
  'http://localhost/review/e2e-test-contract-token-12345678',
  // Dashboard routes require auth — visiting them redirects to /login,
  // but that still triggers Next.js to compile the route bundle.
  'http://localhost/dashboard/landlord',
  'http://localhost/dashboard/woreda',
  'http://localhost/dashboard/tax',
];

async function globalSetup() {
  console.log('\n🔥 [Global Setup] Pre-warming Next.js routes...');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const url of ROUTES_TO_WARM) {
    try {
      console.log(`   → Warming ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
      console.log(`   ✅ ${url} ready`);
    } catch (err) {
      // A timeout here just means it's still compiling — that's okay.
      // The route will still be warmer than a completely cold start.
      console.warn(`   ⚠️  ${url} warmup timed out (may still be compiling)`);
    }
  }

  await browser.close();
  console.log('🔥 [Global Setup] All routes warmed. Starting tests.\n');
}

export default globalSetup;
