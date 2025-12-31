import { chromium } from 'playwright';

const url = process.argv[2] || 'https://carfinder.dev.ecoworks.ca';
const outputPath = process.argv[3] || 'screenshot-photos.png';

async function takeScreenshot() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors']
  });

  const page = await browser.newPage({
    viewport: { width: 1400, height: 950 },
    ignoreHTTPSErrors: true
  });

  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Click Edit on the first car to get to edit mode (which starts on step 2)
  console.log('Expanding first card...');
  await page.evaluate(() => {
    const clickableDiv = document.querySelector('.tally-card .flex.items-center.gap-4.cursor-pointer');
    if (clickableDiv) clickableDiv.click();
  });
  await page.waitForTimeout(800);

  // Click Edit button
  console.log('Clicking Edit button...');
  await page.click('button:has-text("Edit")');
  await page.waitForTimeout(500);

  // Click Next to go to step 3
  console.log('Clicking Next to go to step 3...');
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(500);

  console.log(`Saving screenshot to ${outputPath}...`);
  await page.screenshot({ path: outputPath });

  await browser.close();
  console.log('Done!');
}

takeScreenshot().catch(console.error);
