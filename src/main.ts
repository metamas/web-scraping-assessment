import puppeteer from "puppeteer";

import { promptForCredentials, promptForAction, promptForLimit } from "./prompt.js";
import { amazonSignIn, amazonOrderHistory, OrderData } from "./amazon.js";

async function main() {
  const credentials = await promptForCredentials("Amazon");
  const action = await promptForAction();
  // Use headful mode in case manual MFA is required
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  await amazonSignIn(browser, credentials);

  let orders: OrderData[] = [];
  if (action === "Retrieve recent orders") {
    const limit = await promptForLimit();
    orders = await amazonOrderHistory(browser, limit);
  }

  console.dir({ count: orders.length, orders }, { depth: null, colors: true });
  await browser.close();
}

main();
