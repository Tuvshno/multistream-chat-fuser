import puppeteer from 'puppeteer';
import { WebSocketServer } from 'ws';

let activeBrowser; // Track the active Puppeteer browser
let fetchInterval; // Track the interval ID for fetching chat data
let isFirstFetch = true; // Flag to track the first fetch after a new connection

console.log('Looking for Extension connection...')

async function getPageData(page) {
  const chatData = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#items.style-scope.yt-live-chat-item-list-renderer > *'));
    return items.map(item => {
      const message = item.querySelector('#message')?.textContent.trim() || 'No message';
      const authorName = item.querySelector('#author-name')?.textContent.trim() || 'Anonymous';
      item.remove(); // Remove the item from the DOM
      return { authorName, message };
    });
  });
  return chatData;
}

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {
  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });
  console.log('CONNECTED! Listening to chats...');

  (async () => {
    if (fetchInterval) clearInterval(fetchInterval); // Clear existing fetch interval
    isFirstFetch = true; // Reset the flag for the new connection

    if (activeBrowser) {
      console.log('Closing the old Puppeteer browser...');  
      await activeBrowser.close().catch(e => console.error('Error closing browser:', e)); // Error handling for browser close
      activeBrowser = null; // Reset the activeBrowser variable
    }

    activeBrowser = await puppeteer.launch({ headless: "new" });
    const page1 = await activeBrowser.newPage();
    const page2 = await activeBrowser.newPage();

    await page1.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36");
    await page2.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36");

    await page1.goto('https://studio.youtube.com/live_chat?is_popout=1&v=byVhWz2WaSM');
    await page2.goto('https://studio.youtube.com/live_chat?is_popout=1&v=NTjX2dagmec');
    await page1.waitForSelector('#items.style-scope.yt-live-chat-item-list-renderer');
    await page2.waitForSelector('#items.style-scope.yt-live-chat-item-list-renderer');

    console.log('Made a new connection');
    fetchInterval = setInterval(async () => {
      try {
        if (!page1.isClosed() && !page2.isClosed()) {
          let chatData1 = await getPageData(page1);
          let chatData2 = await getPageData(page2);
          chatData1 = chatData1.reverse();
          chatData2 = chatData2.reverse();

          if (isFirstFetch) {
            isFirstFetch = false; // Set the flag to false after the first fetch
          } else {
            // Send data only after the first fetch
            if (chatData1.length > 0) ws.send(JSON.stringify(chatData1));
            if (chatData2.length > 0) ws.send(JSON.stringify(chatData2));
          }
        }
      } catch (e) {
        console.error('Error fetching page data:', e);
      }
    }, 1000);
  })();
});