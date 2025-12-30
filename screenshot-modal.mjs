import { chromium } from 'playwright';

const url = process.argv[2] || 'https://carfinder.dev.ecoworks.ca';
const outputPath = process.argv[3] || 'screenshot-modal.png';

async function takeScreenshot() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true
  });

  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Click the version badge to open the changelog modal
  console.log('Clicking version badge...');
  await page.click('button:has-text("v0.1.0")');
  await page.waitForTimeout(500);

  // Click on a specific tab if provided
  const tab = process.argv[4];
  if (tab) {
    console.log(`Clicking ${tab} tab...`);
    await page.click(`button:has-text("${tab}")`);
    await page.waitForTimeout(300);
  }

  console.log(`Saving screenshot to ${outputPath}...`);
  await page.screenshot({ path: outputPath });

  await browser.close();
  console.log('Done!');
}

takeScreenshot().catch(console.error);
