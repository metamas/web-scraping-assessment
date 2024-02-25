import puppeteer from "puppeteer";

import { promptForCredentials, promptForAction, promptForLimit, promptForSearches } from "./prompt.js";
import { amazonSignIn, amazonOrderHistory, amazonOrderSearch, OrderData } from "./amazon.js";

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
  } else {
    const searches = (await promptForSearches())
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    orders = await amazonOrderSearch(browser, searches);
  }

  console.dir({ count: orders.length, orders }, { depth: null, colors: true });
  await browser.close();
}

main();
