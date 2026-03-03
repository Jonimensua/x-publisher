const express = require("express");
require("dotenv").config();
const OpenAI = require("openai");
const { chromium } = require("playwright");

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/generate-and-post", async (req, res) => {
  const { topic } = req.body;

  try {
    // 1️⃣ Generar contenido con OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Eres un experto en Twitter que escribe posts virales." },
        { role: "user", content: `Escribe un tweet sobre: ${topic}` }
      ],
    });

    const generatedText = completion.choices[0].message.content;

    // 2️⃣ Abrir navegador con sesión guardada
    const browser = await chromium.launch({ headless: true });

    const context = await browser.newContext({
      storageState: "auth.json"
    });

    const page = await context.newPage();

    // Ir a Typefully
    await page.goto("https://typefully.com");

    // Esperar editor real (no textarea)
    await page.waitForSelector('[contenteditable="true"]', { timeout: 60000 });

    // Escribir contenido
    await page.click('[contenteditable="true"]');
    await page.keyboard.type(generatedText);

    // Esperar guardado automático
    await page.waitForTimeout(5000);

    await browser.close();

    res.json({
      success: true,
      generatedText
    });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});