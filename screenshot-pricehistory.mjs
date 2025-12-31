import { chromium } from 'playwright';

const url = process.argv[2] || 'https://carfinder.dev.ecoworks.ca';
const outputPath = process.argv[3] || 'screenshot-pricehistory.png';

async function takeScreenshot() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors']
  });

  const page = await browser.newPage({
    viewport: { width: 1600, height: 1000 },
    ignoreHTTPSErrors: true
  });

  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Click on the clickable div inside the first card
  console.log('Expanding first card...');
  await page.evaluate(() => {
    const clickableDiv = document.querySelector('.tally-card .flex.items-center.gap-4.cursor-pointer');
    if (clickableDiv) clickableDiv.click();
  });
  await page.waitForTimeout(800);

  console.log(`Saving screenshot to ${outputPath}...`);
  await page.screenshot({ path: outputPath });

  await browser.close();
  console.log('Done!');
}

takeScreenshot().catch(console.error);
