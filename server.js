const express = require("express");
const { chromium } = require("playwright");

const app = express();
app.use(express.json({ limit: "1mb" }));

let browser;
let context;
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

    context = await browser.newContext({
      storageState: "auth.json"
    });

    page = await context.newPage();

    console.log("Opening Typefully");

    await page.goto("https://typefully.com/?compose=true", {
      waitUntil: "domcontentloaded"
    });

    await page.waitForTimeout(5000);

    console.log("Typefully ready");
  }
}

app.post("/post", async (req, res) => {

  const content = req.body.content;

  console.log("Publishing to Typefully:");
  console.log(content);

  try {

    await startBrowser();

    await page.goto("https://typefully.com/?compose=true");

    await page.waitForTimeout(5000);

    const editor = page.locator('[contenteditable="true"]').first();

    await editor.click();

    await editor.fill("");

    await editor.type(content, { delay: 10 });

    await page.waitForTimeout(2000);

    const publishButton = page.locator("button:has-text('Publish')").first();

    await publishButton.click({
      force: true
    });

    await page.waitForTimeout(4000);

    res.json({ success: true });

  } catch (err) {

    console.error("PUBLISH ERROR:", err);

    res.status(500).json({
      error: err.toString()
    });

  }

});

app.get("/", (req, res) => {
  res.send("Publisher running");
});

app.listen(3000, () => {
  console.log("🚀 X Publisher running on port 3000");
});
