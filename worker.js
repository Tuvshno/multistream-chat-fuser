const puppeteer = require('puppeteer');
const { WebSocketServer } = require('ws');

let activeBrowser; // Track the active Puppeteer browser
let fetchInterval; // Track the interval ID for fetching chat data
let isFirstFetch = true; // Flag to track the first fetch after a new connection
// Inside worker.mjs


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
      const messageParts = messageElement ? Array.from(messageElement.childNodes).map(processNode).filter(part => part.length > 0).join(' ') : 'Message Deleted';

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
      console.log(notice.textContent.trim());

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

      // Check for "replying" message
      const replyingElement = item.querySelector('.CoreText-sc-1txzju1-0.cCvSAC'); // Adjust the selector to target the "replying" message element
      const replyingMessage = replyingElement ? replyingElement.textContent.trim() : '';

      const messageElement = item.querySelector('[data-a-target="chat-line-message-body"]');
      const messageParts = messageElement ? Array.from(messageElement.childNodes).map(processNode).filter(part => part.length > 0).join(' ') : 'Message Deleted';

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
//MEssage Socket has been created here

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
      await activeBrowser.close().catch(e => console.error('Error closing browser:', e));
      activeBrowser = null; // Reset the activeBrowser variable
    }

    activeBrowser = await puppeteer.launch({ headless: true });
    const pages = [await activeBrowser.newPage(), await activeBrowser.newPage(), await activeBrowser.newPage()];

    // eslint-disable-next-line no-undef
    const USER_URLS = JSON.parse(process.env.USER_URLS);
    console.log(USER_URLS);

    const selectors = [
      '#items.style-scope.yt-live-chat-item-list-renderer',
      '#items.style-scope.yt-live-chat-item-list-renderer',
      '.chat-scrollable-area__message-container'
    ];

    // Set user agents and navigate to URLs
    for (let i = 0; i < pages.length; i++) {
      await pages[i].setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36");
      await pages[i].goto(USER_URLS[i]).catch(e => console.error(`Error navigating to ${USER_URLS[i]}:`, e));
    }

    // Attempt to wait for selectors and handle failures
    for (let i = 0; i < pages.length; i++) {
      try {
        await pages[i].waitForSelector(selectors[i]);
      } catch (e) {
        console.error(`Failed to find selector ${selectors[i]} on page ${i + 1}:`, e);
        ws.send(JSON.stringify({ type: 'error', errorUrl: USER_URLS[i] }));

        // Remove the failed page from the array
        pages.splice(i, 1);
        selectors.splice(i, 1);
        USER_URLS.splice(i, 1);
        i--; // Adjust index since we removed an item
      }
    }

    console.log('Listening to chats...');
    ws.send(JSON.stringify({
      type: 'success',
      urls: USER_URLS // This will contain only the URLs of the pages that passed the waitForSelector check
    }));

    fetchInterval = setInterval(async () => {
      try {
        const chatDataPromises = pages.map((page, index) => {
          if (selectors[index].includes('yt-live-chat-item-list-renderer')) {
            return getYouTubePageData(page);
          } else {
            return getTwitchPageData(page);
          }
        });

        const chatDataArrays = await Promise.all(chatDataPromises);

        chatDataArrays.forEach((chatData, index) => {
          chatData = chatData.reverse();
          if (!isFirstFetch && chatData.length > 0) {
            ws.send(JSON.stringify({ type: 'chatMessage', url: USER_URLS[index], data: chatData }));
          }
        });

        if (isFirstFetch) isFirstFetch = false;

      } catch (e) {
        console.error('Error fetching page data:', e);
      }
    }, 100);
  })();
});

