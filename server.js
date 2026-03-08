const express = require("express");
const { chromium } = require("playwright");

const app = express();
app.use(express.json());

app.post("/post", async (req, res) => {
  try {
    let content = req.body.content;

    if (!content) {
      return res.status(400).json({ error: "No content provided" });
    }

    // limitar longitud para Typefully
    content = content.slice(0, 270);

    console.log("Publishing to Typefully:", content);

    const browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process"
      ]
    });

    const context = await browser.newContext({
      storageState: "auth.json"
    });

    const page = await context.newPage();

    await page.goto("https://typefully.com", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForSelector('[contenteditable="true"]', { timeout: 60000 });

    await page.fill('[contenteditable="true"]', content);

    const publishButton = page.locator("button:has-text('Publish')");
    await publishButton.click();

    await page.waitForTimeout(2000);

    await browser.close();

    res.json({ success: true });

  } catch (error) {
    console.error("PUBLISH ERROR:", error);
    res.status(500).json({ error: error.toString() });
  }
});

app.listen(3000, () => {
  console.log("🚀 X Publisher running on port 3000");
});
