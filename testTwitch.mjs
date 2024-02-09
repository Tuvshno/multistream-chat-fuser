import puppeteer from 'puppeteer';

let activeBrowser; // Track the active Puppeteer browser

async function getTwitchPageData(page) {
  const chatData = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.chat-line__message')); // Use the correct selector for chat messages
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

      // Iterate over child nodes of the chat message body and process each node
      const messageParts = Array.from(item.querySelector('[data-a-target="chat-line-message-body"]').childNodes).map(processNode).filter(part => part.length > 0).join(' '); // Filter out empty strings and join parts with a space

      const authorElement = item.querySelector('.chat-author__display-name');
      const authorName = authorElement?.textContent.trim() || 'Anonymous';
      const authorColor = authorElement?.style.color || ''; // Get the color style
      const imgSrcs = Array.from(item.querySelectorAll('img.chat-badge')).map(img => img.src);

      item.remove(); // Remove the item from the DOM

      return { platform, authorName, message: messageParts, imgSrcs, authorColor };
    });
  });
  return chatData;
}



async function fetchChatData(page) {
  try {
    let chatData = await getTwitchPageData(page);
    chatData = chatData.reverse();

    // Process fetched chat data, e.g., log to console or send to a client
    if (chatData.length > 0) {
      console.log(chatData);
    }
  } catch (e) {
    console.error('Error fetching page data:', e);
    clearInterval(fetchInterval); // Clear interval if there's an error
  }
}

// Initialize and start fetching chat data
async function startFetchingChatData() {
  activeBrowser = await puppeteer.launch({ headless: false });
  const page = await activeBrowser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36");
  await page.goto('https://www.twitch.tv/popout/tuvshno/chat?popout=');
  // await page.waitForSelector('.chat-scrollable-area__message-container'); // Uncomment if there's a specific element you need to wait for

  // Set interval to fetch chat data every 100ms
  const fetchInterval = setInterval(() => fetchChatData(page), 100);

  // Clear interval on browser close to clean up
  page.on('close', () => clearInterval(fetchInterval));
}

startFetchingChatData();
