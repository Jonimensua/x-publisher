const express = require("express");
const { chromium } = require("playwright");

const app = express();
app.use(express.json());

let browser;
let context;
let page;

async function initBrowser() {

  console.log("Starting browser...");

  browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage"
    ]
  });

  context = await browser.newContext({
    storageState: "auth.json"
  });

  page = await context.newPage();

  await page.goto("https://typefully.com/write", {
    waitUntil: "networkidle"
  });

  console.log("Typefully ready");

}

app.post("/post", async (req, res) => {

  try {

    const content = req.body.content;

    if (!content) {
      return res.status(400).json({ error: "Missing content" });
    }

    console.log("Publishing:", content);

    await page.click('[contenteditable="true"]');

    await page.keyboard.type(content);

    console.log("Post inserted");

    await page.waitForTimeout(3000);

    res.json({ success: true });

  } catch (err) {

    console.error("PUBLISH ERROR:", err);

    res.status(500).json({ error: err.message });

  }

});

app.get("/", (req, res) => {
  res.send("X Publisher running");
});

app.listen(3000, async () => {

  console.log("🚀 X Publisher running on port 3000");

  await initBrowser();

});
