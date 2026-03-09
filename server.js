const express = require("express");
const { chromium } = require("playwright");

const app = express();
app.use(express.json());

let browser;
let page;

async function initBrowser() {

  if (!browser) {

    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ]
    });

    const context = await browser.newContext({
      storageState: "auth.json"
    });

    page = await context.newPage();

    await page.goto("https://typefully.com", {
      waitUntil: "domcontentloaded"
    });

    console.log("Typefully session ready");
  }
}

app.post("/post", async (req, res) => {

  try {

    await initBrowser();

    let content = req.body.content;

    if (!content) {
      return res.status(400).json({ error: "No content" });
    }

    content = content.slice(0, 260);

    console.log("Publishing to Typefully:", content);

    await page.waitForSelector('[contenteditable="true"]', { timeout: 60000 });

    await page.fill('[contenteditable="true"]', content);

    await page.waitForTimeout(1500);

    const publishButton = page.locator("button:has-text('Publish')");

    await publishButton.click({ force: true });

    await page.waitForTimeout(3000);

    res.json({ success: true });

  } catch (error) {

    console.error("PUBLISH ERROR:", error);

    res.status(500).json({ error: error.toString() });

  }

});

app.listen(3000, () => {
  console.log("🚀 X Publisher running on port 3000");
});
