const express = require("express");
const { chromium } = require("playwright");

const app = express();

app.use(express.json());

app.post("/post", async (req, res) => {

  const content = req.body.content;

  if (!content) {
    return res.status(400).json({ error: "Missing content" });
  }

  try {

    console.log("Publishing to Typefully:", content);

    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const context = await browser.newContext({
      storageState: "auth.json"
    });

    const page = await context.newPage();

    // abrir editor real de Typefully
    await page.goto("https://typefully.com/write", {
      waitUntil: "networkidle"
    });

    // esperar editor
    await page.waitForSelector('[data-testid="draft-editor"]', {
      timeout: 60000
    });

    // escribir contenido
    await page.click('[data-testid="draft-editor"]');

    await page.keyboard.type(content);

    console.log("Content typed");

    // esperar guardado automático
    await page.waitForTimeout(4000);

    await browser.close();

    res.json({ success: true });

  } catch (err) {

    console.error("PUBLISH ERROR:", err);

    res.status(500).json({
      error: err.message
    });

  }

});

app.get("/", (req, res) => {
  res.send("X Publisher running");
});

app.listen(3000, () => {
  console.log("🚀 X Publisher running on port 3000");
});
