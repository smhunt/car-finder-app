import { chromium } from 'playwright';

const url = process.argv[2] || 'https://carfinder.dev.ecoworks.ca';
const outputPath = process.argv[3] || 'screenshot.png';

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
  await page.waitForTimeout(2000);

  console.log(`Saving screenshot to ${outputPath}...`);
  await page.screenshot({ path: outputPath, fullPage: true });

  await browser.close();
  console.log('Done!');
}

takeScreenshot().catch(console.error);
