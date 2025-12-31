import { chromium } from 'playwright';

const url = process.argv[2] || 'https://carfinder.dev.ecoworks.ca';
const outputPath = process.argv[3] || 'screenshot-compare.png';

async function takeScreenshot() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors']
  });

  const page = await browser.newPage({
    viewport: { width: 1600, height: 950 },
    ignoreHTTPSErrors: true
  });

  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Click Compare button to enter compare mode
  console.log('Entering compare mode...');
  await page.click('button.tally-btn-secondary:has-text("Compare")');
  await page.waitForTimeout(800);

  // Click checkboxes one by one with proper delays
  console.log('Selecting cars for comparison...');

  // Select vehicles sequentially, only clicking unselected ones
  for (let i = 0; i < 6; i++) {
    // Check current count
    const btnText = await page.locator('button:has-text("Compare")').first().textContent();
    const match = btnText.match(/\((\d)\/3\)/);
    const currentCount = match ? parseInt(match[1]) : 0;

    if (currentCount >= 3) {
      console.log('Already have 3 selected!');
      break;
    }

    // Check if this card is already selected (has ring-tally-mint class)
    const isSelected = await page.evaluate((index) => {
      const card = document.querySelectorAll('.tally-card')[index];
      return card && card.classList.contains('ring-tally-mint');
    }, i);

    if (!isSelected) {
      console.log(`Selecting card ${i + 1}...`);
      await page.evaluate((index) => {
        const cards = document.querySelectorAll('.tally-card');
        const btn = cards[index]?.querySelector('button');
        if (btn) btn.click();
      }, i);
      await page.waitForTimeout(400);
    } else {
      console.log(`Card ${i + 1} already selected, skipping`);
    }
  }

  await page.waitForTimeout(500);

  // Log current state
  const btnText = await page.locator('button:has-text("Compare (")').textContent();
  console.log(`Final button state: ${btnText}`);

  // Click the Compare button to open modal
  console.log('Opening comparison modal...');
  await page.click('button.tally-btn-primary:has-text("Compare (")');
  await page.waitForTimeout(1000);

  console.log(`Saving screenshot to ${outputPath}...`);
  await page.screenshot({ path: outputPath });

  await browser.close();
  console.log('Done!');
}

takeScreenshot().catch(console.error);
