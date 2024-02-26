import puppeteer from "puppeteer";

import {
  promptForCredentials,
  promptForAction,
  promptForLimit,
  promptForSearches,
  promptForContinue,
} from "./prompt.js";
import { amazonSignIn, amazonOrderHistory, amazonOrderSearch, OrderData } from "./amazon.js";

async function main() {
  const credentials = await promptForCredentials("Amazon");
  // Use headful mode in case manual MFA is required
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });

  // Sign in flow
  try {
    await amazonSignIn(browser, credentials);
  } catch (error) {
    console.error("  Sign in failed. Exiting...");
    await browser.close();
    return;
  }

  // Retrieve or search for orders
  do {
    const action = await promptForAction();
    let orders: OrderData[] = [];

    if (action === "Retrieve recent orders") {
      const limit = await promptForLimit();
      orders = await amazonOrderHistory(browser, limit);
      console.dir({ count: orders.length, orders }, { depth: null, colors: true });
    } else {
      const searches = (await promptForSearches())
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
      orders = await amazonOrderSearch(browser, searches);
      console.dir({ count: orders.length, orders }, { depth: null, colors: true });
    }
  } while (await promptForContinue());

  await browser.close();
}

main();
