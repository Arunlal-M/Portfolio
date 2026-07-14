import puppeteer from 'puppeteer';
// const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`[Browser PageError]: ${error.message}`);
  });

  page.on('requestfailed', request => {
    console.log(`[Browser Request Failed]: ${request.url()} - ${request.failure().errorText}`);
  });

  page.on('response', response => {
    if (response.status() === 404) {
      console.log(`[Browser 404 Not Found]: ${response.url()}`);
    }
  });

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  } catch (err) {
    console.log(`[Puppeteer Error]: ${err.message}`);
  }

  await browser.close();
})();
