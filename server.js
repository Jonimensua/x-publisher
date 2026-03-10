const express = require("express");
const { chromium } = require("playwright");

const app = express();
app.use(express.json({ limit: "1mb" }));

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
        "--disable-gpu",
        "--single-process",
        "--no-zygote"
      ]
    });

    const context = await browser.newContext({
      storageState: "auth.json"
    });

    page = await context.newPage();

    await page.goto("https://typefully.com/?compose=true", {
      waitUntil: "domcontentloaded"
    });

    await page.waitForTimeout(3000);

    console.log("Typefully ready");
  }
}

app.post("/post", async (req, res) => {

  const content = req.body.content;

  console.log("Publishing to Typefully:\n", content);

  try {

    await startBrowser();

    await page.waitForSelector('[contenteditable="true"]');

    const editor = page.locator('[contenteditable="true"]').first();

    await editor.click();

    await editor.fill("");

    await editor.type(content, { delay: 10 });

    await page.waitForTimeout(2000);

    await page.waitForSelector("button:has-text('Publish')");

    await page.locator("button:has-text('Publish')").first().click({
      force: true,
      timeout: 60000
    });

    await page.waitForTimeout(3000);

    res.json({ success: true });

  } catch (err) {

    console.error("PUBLISH ERROR:", err);

    res.status(500).json({
      error: err.toString()
    });

  }

});

app.get("/", (req, res) => {
  res.send("X Publisher running");
});

app.listen(3000, () => {
  console.log("🚀 X Publisher running on port 3000");
});
