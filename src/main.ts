import puppeteer from "puppeteer";

import promptForCredentials from "./prompt.js";
import { amazonSignIn, amazonOrderHistory } from "./amazon.js";

async function main() {
  const credentials = await promptForCredentials("Amazon");
  // Use headful mode in case manual MFA is required
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });

  await amazonSignIn(browser, credentials);
  const orders = await amazonOrderHistory(browser);
  console.dir({ count: orders.length, orders }, { depth: null, colors: true });
  await browser.close();
}

main();
