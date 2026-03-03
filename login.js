const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://typefully.com/login");

  console.log("Haz login manualmente con tu email y código.");
  console.log("Cuando estés dentro del dashboard, vuelve aquí y presiona ENTER.");

  await new Promise(resolve => process.stdin.once("data", resolve));

  await context.storageState({ path: "auth.json" });

  console.log("Sesión guardada en auth.json ✅");
  await browser.close();
})();