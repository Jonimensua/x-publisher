const express = require("express");
const { chromium } = require("playwright");

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
        "--no-zygote",
        "--single-process",
        "--disable-software-rasterizer"
      ]
    });

    const context = await browser.newContext({
      storageState: "auth.json"
    });

    const page = await context.newPage();

    await page.goto("https://typefully.com/?compose=true", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    // esperar editor
    await page.waitForSelector('[contenteditable="true"]', { timeout: 30000 });

    const editor = page.locator('[contenteditable="true"]').first();

    await editor.fill(content);

    await page.waitForTimeout(2000);

    // botón publish
    const publishButton = page.locator("button:has-text('Publish')");

    await publishButton.first().click();

    await page.waitForTimeout(4000);

    await browser.close();

    res.json({ success: true });

  } catch (error) {

    console.error("PUBLISH ERROR:", error);

    res.status(500).json({
      error: error.toString()
    });

  }

});

app.listen(3000, () => {
  console.log("🚀 X Publisher running on port 3000");
});
