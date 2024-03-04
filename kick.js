const puppeteer = require('puppeteer');

(async () => {
  // Launch a new browser session.
  const browser = await puppeteer.launch({ headless: false });
  
  // Open a new page.
  const page = await browser.newPage();
  page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36");
  
  // Navigate to the specified URL.
  await page.goto('https://kick.com/amouranth/chatroom');
  
})();
