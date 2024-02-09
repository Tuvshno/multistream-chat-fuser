import puppeteer from 'puppeteer';
import { WebSocketServer } from 'ws';

let activeBrowser; // Track the active Puppeteer browser
let fetchInterval; // Track the interval ID for fetching chat data
let isFirstFetch = true; // Flag to track the first fetch after a new connection

console.log('Looking for Client Connection...')

async function getYouTubePageData(page) {
  const chatData = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#items.style-scope.yt-live-chat-item-list-renderer > *'));
    return items.map(item => {
      const platform = 'YouTube';

      // Function to process each child node within the message
      const processNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          // For text nodes, get the text content
          return node.textContent.trim();
        } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'IMG') {
          // For image elements, get the src attribute
          return node.src;
        }
        return '';
      };

      // Select the message element and process its child nodes
      const messageElement = item.querySelector('#message');
      const messageParts = messageElement ? Array.from(messageElement.childNodes).map(processNode).filter(part => part.length > 0).join(' ') : 'No message';

      const authorName = item.querySelector('#author-name')?.textContent.trim() || 'Anonymous';
      const authorColor = "rgb(255, 94, 94)"; // Default color for YouTube authors
      const imgSrcs = []; // Placeholder if you need to extract specific images related to the author or badges

      item.remove(); // Remove the item from the DOM

      return { platform, authorName, message: messageParts, imgSrcs, authorColor };
    });
  });
  return chatData;
}

async function getTwitchPageData(page) {
  const chatData = await page.evaluate(() => {
    // Hide elements with data-test-selector="user-notice-line" instead of removing them
    const userNotices = Array.from(document.querySelectorAll('[data-test-selector="user-notice-line"]:not(.processed)'));
    userNotices.forEach(notice => {
      notice.style.display = 'none';
      notice.classList.add('processed'); // Mark as processed
    });

    const items = Array.from(document.querySelectorAll('.chat-line__message:not(.processed)')); // Use the correct selector for chat messages and skip already processed messages
    return items.map(item => {
      const platform = 'Twitch';

      // Function to process each child node within the message
      const processNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE || node.classList.contains('text-fragment')) {
          // For text nodes and elements with class 'text-fragment', get the text content
          return node.textContent.trim();
        } else if (node.nodeType === Node.ELEMENT_NODE && node.querySelector('img')) {
          // For element nodes containing images, get the src of the image
          return node.querySelector('img').src;
        }
        return '';
      };

      // Use optional chaining to avoid TypeError when the element is not found
      const messageElement = item.querySelector('[data-a-target="chat-line-message-body"]');
      const messageParts = messageElement ? Array.from(messageElement.childNodes).map(processNode).filter(part => part.length > 0).join(' ') : 'No message';

      const authorElement = item.querySelector('.chat-author__display-name');
      const authorName = authorElement?.textContent.trim() || 'Anonymous';
      const authorColor = authorElement?.style.color || ''; // Get the color style
      const imgSrcs = Array.from(item.querySelectorAll('img.chat-badge')).map(img => img.src);

      item.style.display = 'none'; // Hide the item instead of removing it from the DOM
      item.classList.add('processed'); // Mark as processed to avoid reprocessing

      return { platform, authorName, message: messageParts, imgSrcs, authorColor };
    });
  });
  return chatData;
}

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {
  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });
  console.log('CONNECTED!');

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
    const page3 = await activeBrowser.newPage();


    await page1.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36");
    await page2.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36");
    await page3.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36");
    await page1.goto('https://www.youtube.com/live_chat?is_popout=1&v=ebiSGJYno3g');
    await page2.goto('https://www.youtube.com/live_chat?is_popout=1&v=qp3zEtondTo');
    await page3.goto('https://www.twitch.tv/popout/hasanabi/chat?popout=')
    await page1.waitForSelector('#items.style-scope.yt-live-chat-item-list-renderer');
    await page2.waitForSelector('#items.style-scope.yt-live-chat-item-list-renderer');
    await page3.waitForSelector('.chat-scrollable-area__message-container');

    console.log('Listening to chats...');
    fetchInterval = setInterval(async () => {
      try {
        if (!page1.isClosed() && !page2.isClosed()) {
          let chatData1 = await getYouTubePageData(page1);
          let chatData2 = await getYouTubePageData(page2);
          let chatData3 = await getTwitchPageData(page3);
          chatData1 = chatData1.reverse();
          chatData2 = chatData2.reverse();
          chatData3 = chatData3.reverse();

          if (isFirstFetch) {
            isFirstFetch = false; // Set the flag to false after the first fetch
          } else {
            // Send data only after the first fetch
            if (chatData1.length > 0) {
              ws.send(JSON.stringify(chatData1))
              console.log('Sent Message to Client')
            }
            if (chatData2.length > 0) {
              ws.send(JSON.stringify(chatData2));
              console.log('Sent Message to Client')
            }
            if(chatData3.length > 0) {
              ws.send(JSON.stringify(chatData3));
              console.log('Sent Message to Client')
            }

          }
        }
      } catch (e) {
        console.error('Error fetching page data:', e);
      }
    }, 100);
  })();
});
