const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    console.log('Navigating to example.com...');
    await page.goto('https://example.com');
    const title = await page.title();
    console.log('Title:', title);
    await browser.close();
    console.log('Success');
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
