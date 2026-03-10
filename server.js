const express = require("express");
const { chromium } = require("playwright");

const app = express();
app.use(express.json());

let browser;
let page;

async function startBrowser() {

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

    await page.goto("https://typefully.com/?compose=true", {
      waitUntil: "domcontentloaded"
    });

    console.log("Typefully ready");
  }
}

app.post("/post", async (req, res) => {

  const content = req.body.content;

  try {

    await startBrowser();

    console.log("Publishing:", content);

    await page.fill('[contenteditable="true"]', "");

    await page.fill('[contenteditable="true"]', content);

    await page.click("button:has-text('Publish')");

    res.json({ success: true });

  } catch (err) {

    console.log("Publish error:", err);

    res.status(500).json({
      error: err.toString()
    });

  }

});

app.listen(3000, () => {

  console.log("X Publisher running");

});
