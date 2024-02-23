// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const puppeteer = require('puppeteer');
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const websocket = require('ws');
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const path = require('path');

let activeBrowser; // Track the active Puppeteer browser
let fetchInterval; // Track the interval ID for fetching chat data
let isFirstFetch = true; // Flag to track the first fetch after a new connection
// Inside worker.mjs


console.log('Looking for Client Connection...')

async function getYouTubePageData(page) {
  const chatData = await page.evaluate(() => {
    let messageType = 'Message'
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

      return { platform, messageType, authorName, message: messageParts, imgSrcs, authorColor };
    });
  });
  return chatData;
}

async function getTwitchPageData(page) {
  const chatData = await page.evaluate(() => {
    let allMessages = []; // Array to hold all messages including user notices and chat messages

    // Function to process each child node within the message
    const processNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE || node.classList.contains('text-fragment')) {
        return node.textContent.trim();
      } else if (node.nodeType === Node.ELEMENT_NODE && node.querySelector('img')) {
        return node.querySelector('img').src;
      }
      return '';
    };

    // Get and process all user notices
    const userNotices = Array.from(document.querySelectorAll('[data-test-selector="user-notice-line"]:not(.processed)'));
    userNotices.forEach(item => {
      console.log('user notice')
      let messageType, authorName, messageParts, authorColor = 'rgb(138, 43, 226)', subscriptionInfo;

      authorName = item.querySelector('.chatter-name')?.textContent.trim() || 'Anonymous';

      const subscriptionText = item.querySelector('.CoreText-sc-1txzju1-0')?.textContent.trim();
      if (subscriptionText && subscriptionText.includes('Subscribed')) {
        messageType = 'Subscription';
        subscriptionInfo = subscriptionText;

        const subscriptionMessageElement = item.querySelector('.chat-resubscription-message__custom-message');
        messageParts = subscriptionMessageElement ? Array.from(subscriptionMessageElement.childNodes).map(processNode).filter(part => part.length > 0).join(' ') : '';

        allMessages.push({ platform: 'Twitch', messageType, authorName, subscriptionInfo, message: messageParts, authorColor });
      }

      item.style.display = 'none'; // Hide the item instead of removing it from the DOM
      item.classList.add('processed'); // Mark as processed

    });

    // Process the normal chat messages
    const chatMessages = Array.from(document.querySelectorAll('.chat-line__message:not(.processed)'));
    chatMessages.forEach(item => {
      let platform = 'Twitch';
      let messageType = 'Message';

      // Check for "replying" message
      const replyingElement = item.querySelector('.CoreText-sc-1txzju1-0.cCvSAC');
      const replyingMessage = replyingElement ? replyingElement.getAttribute('title') : ''; // Use 'title' attribute to get the full replying message text

      const messageElement = item.querySelector('[data-a-target="chat-line-message-body"]');
      const messageParts = messageElement ? Array.from(messageElement.childNodes).map(processNode).filter(part => part.length > 0).join(' ') : 'Message Deleted';

      const authorElement = item.querySelector('.chat-author__display-name');
      const authorName = authorElement?.textContent.trim() || 'Anonymous';
      const authorColor = authorElement?.style.color || ''; // Get the color style
      const imgSrcs = Array.from(item.querySelectorAll('img.chat-badge')).map(img => img.src);

      //Check highlighted
      const highlighted = item.querySelector('.chat-line__message-body--highlighted')
      if (highlighted)
        messageType = 'Highlighted';

      item.style.display = 'none'; // Hide the item instead of removing it from the DOM
      item.classList.add('processed'); // Mark as processed

      const chatMessage = { platform, messageType, authorName, message: messageParts, imgSrcs, authorColor };

      if (replyingMessage) {
        chatMessage.replyingTo = replyingMessage; // Add replying message text to the object
      }

      allMessages.push(chatMessage);

    });

    return allMessages; // Return all messages including user notices and chat messages
  });

  return chatData;
}


const wss = new websocket.WebSocketServer({ port: 8080 });
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

    activeBrowser = await puppeteer.launch({ headless: "new" });
    // const pages = [await activeBrowser.newPage(), await activeBrowser.newPage(), await activeBrowser.newPage()];

    // eslint-disable-next-line no-undef
    // const USER_URLS = JSON.parse(process.env.USER_URLS);
    // console.log(USER_URLS);

    // eslint-disable-next-line no-undef
    const urlsArg = process.argv[2];
    const USER_URLS = JSON.parse(urlsArg); // Convert the JSON string back into an array/object

    const platform = [];

    USER_URLS.forEach(url => {
      if (url.includes("youtube")) {
        platform.push(0); // 0 for YouTube
      } else if (url.includes("twitch")) {
        platform.push(1); // 1 for Twitch
      }
    });
    console.log('Received URLs:', USER_URLS);
    console.log('Platforms:', platform);

    const selectors = [
      '#items.style-scope.yt-live-chat-item-list-renderer', //YT Selector
      '.chat-scrollable-area__message-container' //Twitch Selector
    ];


    let pageData = [];


    for (let i = 0; i < USER_URLS.length; i++) {
      // if (!activeBrowser) {
      //   activeBrowser = await puppeteer.launch({ headless: "new" }); // Ensure headless is set to true or false based on your requirement
      // }
      const page = await activeBrowser.newPage();

      // Load Twitch cookies if they exist and are not empty
      // eslint-disable-next-line no-undef
      const cookiesTWArg = process.argv[3];
      const cookiesTW = JSON.parse(cookiesTWArg); // Ensure this is the correct argument index
      if (Array.isArray(cookiesTW) && cookiesTW.length > 0) {
        for (const cookie of cookiesTW) {
          await page.setCookie(cookie);
        }
      }

      // Load YouTube cookies if they exist and are not empty
      // eslint-disable-next-line no-undef
      const cookiesYTArg = process.argv[4];
      const cookiesYT = JSON.parse(cookiesYTArg); // Ensure this is the correct argument index
      if (Array.isArray(cookiesYT) && cookiesYT.length > 0) {
        for (const cookie of cookiesYT) {
          await page.setCookie(cookie);
        }
      }

      await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36");

      await page.goto(USER_URLS[i]).catch(e => console.error(`Error navigating to ${USER_URLS[i]}:`, e));


      // Push an object containing the page, its platform type, and the selector to the pageData array
      pageData.push({
        page: page,
        platform: platform[i],
        selector: selectors[platform[i]]
      });
    }

    for (let i = 0; i < pageData.length; i++) {
      ws.send(JSON.stringify({ type: 'link', linkNum: i + 1 }));

      try {
        // Check first for YouTube pages if the "Chat is disabled" message is present
        if (pageData[i].platform === 0) { // 0 represents YouTube
          const disabledChatMessageSelector = 'yt-formatted-string#text.style-scope.yt-live-chat-message-renderer';
          const isChatDisabled = await pageData[i].page.evaluate((selector) => {
            const element = document.querySelector(selector);
            return !!element && element.textContent.includes('Chat is disabled for this live stream.');
          }, disabledChatMessageSelector);

          if (isChatDisabled) {
            throw new Error('Chat is disabled for this live stream, indicating an expired or invalid link.');
          }
        }

        // If the "Chat is disabled" message is not found, or if it's not a YouTube page, wait for the usual selector
        await pageData[i].page.waitForSelector(pageData[i].selector, { timeout: 5000 });


      } catch (e) {
        console.error(`Failed on page ${i + 1}: ${e.message}`);
        ws.send(JSON.stringify({ type: 'error', errorUrl: USER_URLS[i] }));

        // Remove the failed pageData object and the corresponding URL from the array
        pageData.splice(i, 1);
        USER_URLS.splice(i, 1); // Also remove the URL that resulted in an error
        i--; // Adjust index since we removed an item
      }
    }

    // Send only the URLs that didn't result in errors
    ws.send(JSON.stringify({
      type: 'success',
      urls: USER_URLS // This now contains only the URLs of the pages that passed all checks
    }));

    ws.send(JSON.stringify({ type: 'link', linkNum: 0 }));

    // Now, when fetching chat data, map over the pageData array
    fetchInterval = setInterval(async () => {
      try {
        const chatDataPromises = pageData.map(data => {
          if (data.selector.includes('yt-live-chat-item-list-renderer')) {
            return getYouTubePageData(data.page);
          } else {
            return getTwitchPageData(data.page);
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

// eslint-disable-next-line no-undef
// process.stdin.on('data', async (data) => {
//   try {
//     const message = JSON.parse(data.toString());
//     if (message.action === 'shutdown') {
//       console.log("Shutting down...");

//       if (wss) {
//         await new Promise(resolve => wss.close(resolve));
//         console.log("WebSocket server closed.");
//       }

//       if (fetchInterval) {
//         clearInterval(fetchInterval);
//         console.log("Fetch interval cleared.");
//       }

//       if (activeBrowser) {
//         await activeBrowser.close();
//         console.log("Puppeteer browser closed.");
//       }

//       console.log("Shutdown sequence completed.");
//       // eslint-disable-next-line no-undef
//       process.exit(0);
//     }
//   } catch (error) {
//     console.error("Error parsing message from parent:", error);
//   }
// });