import puppeteer from "puppeteer";

import promptForCredentials from "./prompt.js";
import amazonSignIn from "./auth.js";

async function main() {
  const credentials = await promptForCredentials("Amazon");
  // Use headful mode in case manual MFA is required
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = (await browser.pages())[0];

  await amazonSignIn(page, credentials);
  await browser.close();
}

main();
