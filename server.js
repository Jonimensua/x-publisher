const express = require("express");
const { chromium } = require("playwright");

const app = express();
app.use(express.json());

let browser;
let context;
let page;
let queue = Promise.resolve(); // cola simple para evitar concurrencia

async function initBrowser() {
  console.log("Starting persistent browser...");

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

  await page.waitForSelector('[contenteditable="true"]', { timeout: 60000 });

  console.log("Typefully editor ready");
}

async function publish(content) {
  console.log("Publishing:", content);

  const editor = await page.locator('[contenteditable="true"]').first();

  await editor.click();

  await page.keyboard.type(content);

  await page.waitForTimeout(3000); // esperar autoguardado

  console.log("Post inserted");
}

app.post("/post", async (req, res) => {
  const content = req.body.content;

  if (!content) {
    return res.status(400).json({ error: "Missing content" });
  }

  // añadir a cola para que no se ejecuten varios a la vez
  queue = queue.then(() => publish(content)).catch(err => {
    console.error("Publish error:", err);
  });

  res.json({ queued: true });
});

app.get("/", (req, res) => {
  res.send("X Publisher running");
});

app.listen(3000, async () => {
  console.log("🚀 X Publisher running on port 3000");
  await initBrowser();
});
