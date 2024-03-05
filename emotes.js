// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const puppeteer = require('puppeteer');
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const https = require('https');
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const path = require('path');

let errorLog = [];

const downloadImage = (url, path) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path);
    https.get(url, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', err => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      fs.unlink(path, () => { }); // Delete the file async. (Ignore error)
      reject(err);
    });
  });
};

const sanitizeFileName = (name) => {
  return name.replace(/:/g, 'colon'); // Replace ":" with "colon"
};

async function extractEmotes(page) {
  // Directly attempt to extract emotes without retrying
  const emotes = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.emote-card')).map(wrapper => {
      try {
        const imgElement = wrapper.querySelector('.img-wrapper img');
        if (!imgElement) throw new Error('Image element not found');
        const imgSrc = imgElement.src.startsWith('http') ? imgElement.src : `https:${imgElement.src}`;
        const titleElement = wrapper.querySelector('.title-banner span');
        const title = titleElement ? titleElement.textContent.trim() : 'Untitled';
        return { imgSrc, title, error: null };
      } catch (error) {
        return { imgSrc: null, title: null, error: error.toString() };
      }
    });
  });

  // Filter out emotes with errors and log errors
  const validEmotes = emotes.filter(emote => !emote.error);
  const errorEmotes = emotes.filter(emote => emote.error);
  errorEmotes.forEach(emote => {
    console.error(`Error processing emote: ${emote.error}`);
    errorLog.push(emote);
  });

  return validEmotes;
}


// eslint-disable-next-line no-undef
const downloadsDir = path.resolve(process.argv[2], 'downloaded_emotes');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

(async () => {
  // eslint-disable-next-line no-undef
  const url = process.argv[3]
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36");
  await page.setCacheEnabled(false);
  await page.goto(url, { waitUntil: 'networkidle2' });

  let currentPage = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    console.log(`Processing page ${currentPage}...`);

    // Extract emotes before attempting to navigate to the next page
    const emotes = await extractEmotes(page);

    for (let index = 0; index < emotes.length; index++) {
      const emote = emotes[index];
      try {
        const sanitizedTitle = sanitizeFileName(emote.title || 'Untitled');
        if (!sanitizedTitle) {
          throw new Error('Invalid or missing title');
        }
        const filePath = path.resolve(downloadsDir, `${sanitizedTitle}.webp`);
        await downloadImage(emote.imgSrc, filePath);
        console.log(`Downloaded ${emote.title} ${index + 1} / ${emotes.length}`);
      } catch (err) {
        console.error(`Error processing ${emote.title || 'an emote'}: ${err}`);
        errorLog.push(emote); // Add the problematic emote to the error log
      }
    }


    // Determine if there's a next page
    hasNextPage = await page.evaluate(() => {
      const nextPageButton = Array.from(document.querySelectorAll('.page-button[selected="false"] span[selector="label"]')).find(
        span => parseInt(span.textContent.trim(), 10) > parseInt(document.querySelector('.page-button[selected="true"] span[selector="label"]').textContent.trim(), 10)
      );
      return !!nextPageButton;
    });

    if (hasNextPage) {
      // Before clicking the next page, get an identifier of the last emote on the current page.
      const lastEmoteSrc = await page.evaluate(() => {
        const emotes = document.querySelectorAll('.emote-card .img-wrapper img');
        return emotes[emotes.length - 1].src; // Get the src of the last emote's image
      });

      currentPage++;
      // Click the next page button
      await page.evaluate((currentPage) => {
        const nextPageButton = Array.from(document.querySelectorAll('.page-button span[selector="label"]')).find(
          span => parseInt(span.textContent.trim()) === currentPage
        );
        if (nextPageButton) nextPageButton.click();
      }, currentPage);

      // Wait for the last emote from the previous page to be replaced with new content
      await page.waitForFunction((lastEmoteSrc) => {
        const emotes = document.querySelectorAll('.emote-card .img-wrapper img');
        const lastEmoteNewSrc = emotes[emotes.length - 1].src;
        return lastEmoteSrc !== lastEmoteNewSrc; // Wait until the src of the last emote changes
      }, {}, lastEmoteSrc);
    }
  }

  console.log('Finished processing all pages.');

  if (errorLog.length > 0) {
    console.log('Errors encountered with the following emotes:');
    errorLog.forEach((emote, index) => {
      console.log(`Error ${index + 1}: Title - ${emote.title || 'N/A'}, Image - ${emote.imgSrc || 'N/A'}`);
    });
  }

  await browser.close();

  // Process the emotes

  // Ensure the directory exists
  if (!fs.existsSync(downloadsDir)) {
    console.log("Directory not found.");
    // eslint-disable-next-line no-undef
    process.exit(1);
  }

  fs.readdir(downloadsDir, (err, files) => {
    if (err) {
      console.error("Error reading the directory", err);
      return;
    }

    // Initialize an empty array to hold the emote objects
    const emoteObjects = [];

    // Filter for .webp files and create objects
    files.filter(file => file.endsWith('.webp')).forEach(file => {
      const title = file.replace('.webp', '');
      const src = path.join(downloadsDir, file);

      emoteObjects.push({ title, src });
    });

    // Convert the array of objects to a JSON string
    const jsonString = JSON.stringify(emoteObjects, null, 2);

    // Write the JSON string to a single file called emotes.json
    fs.writeFile(path.join(downloadsDir, 'emotes.json'), jsonString, err => {
      if (err) {
        console.error("Error writing emotes.json", err);
      } else {
        console.log("emotes.json has been created successfully.");
      }
    });
  });
})();
