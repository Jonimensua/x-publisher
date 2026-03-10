const express = require("express");
const { chromium } = require("playwright");
const fs = require("fs");

const app = express();
app.use(express.json({ limit: "1mb" }));

app.post("/post", async (req, res) => {
  const content = req.body.content;

  console.log("Publishing to Typefully:\n", content);

  try {

    const browser = await chromium.launch({
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

    const page = await context.newPage();

    await page.goto("https://typefully.com/?compose=true", {
      waitUntil: "domcontentloaded"
    });

    await page.waitForTimeout(3000);

    await page.locator('[contenteditable="true"]').first().fill(content);

    await page.waitForTimeout(2000);

    await page.locator("button:has-text('Publish')").first().click();

    await page.waitForTimeout(3000);

    await browser.close();

    res.json({ success: true });

  } catch (err) {

    console.error("PUBLISH ERROR:", err);

    res.status(500).json({
      error: err.toString()
    });

  }
});

app.listen(3000, () => {
  console.log("🚀 X Publisher running on port 3000");
});
