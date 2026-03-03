const express = require("express");
require("dotenv").config();
const { chromium } = require("playwright");

const app = express();
app.use(express.json());

app.post("/post", async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Missing content" });
  }

  try {
    const browser = await chromium.launch({
      headless: true
    });

    const context = await browser.newContext({
      storageState: "auth.json"
    });

    const page = await context.newPage();

    await page.goto("https://typefully.com");

    await page.waitForSelector('[contenteditable="true"]', { timeout: 60000 });

    await page.click('[contenteditable="true"]');
    await page.keyboard.type(content);

    await page.waitForTimeout(5000);

    await browser.close();

    res.json({
      success: true
    });

  } catch (error) {
    console.error("PUBLISH ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("🚀 X Publisher running on port 3000");
});