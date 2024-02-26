import { Browser, Page, ElementHandle } from "puppeteer";

const BASE_URL = "https://www.amazon.com";
const ORDERS_URL = BASE_URL + "/your-orders/orders";

export type OrderData = {
  date: string;
  price: string;
  recipient: string;
  items: {
    link: string | null;
    name: string | null;
  }[];
};

async function amazonSignIn(browser: Browser, credentials: { username: string; password: string }) {
  const page = (await browser.pages())[0];
  // Amazon does not allow directly navigating to the sign in page.
  await page.goto(BASE_URL);
  // Sometimes Amazon returns an alternative landing page that requires an extra step
  const isIntermediaryPage = await page.$("#navbar-backup-backup");

  if (isIntermediaryPage) {
    await page.waitForSelector(".nav-bb-right a");
    await Promise.all([page.waitForNavigation(), page.click(".nav-bb-right a")]);
  }

  // Hover the mouse to reveal sign in form link
  // TODO: Handle occasional captcha page
  await page.waitForSelector("#nav-link-accountList", { visible: true });
  await page.hover("#nav-link-accountList");
  await page.waitForSelector("#nav-flyout-ya-signin", { visible: true });
  await Promise.all([page.waitForNavigation(), page.click("#nav-flyout-ya-signin")]);

  await page.waitForSelector("#ap_email");
  await page.type("#ap_email", credentials.username);
  await Promise.all([page.waitForNavigation(), page.click("#continue")]);
  await page.waitForSelector("#ap_password");
  await page.type("#ap_password", credentials.password);
  await Promise.all([page.waitForNavigation(), page.click("#signInSubmit")]);

  if (page.url().includes("/ap/cvf")) {
    console.log("Amazon requires further verification.");
    console.log("You have 2 minutes to manually verify...");
    await page.waitForNavigation({ timeout: 60000 * 2 });
  }

  // Successful sign in will redirect to the home page
  if (!page.url().includes("/ap/signin")) {
    console.log("  Sign in successful");
  } else {
    throw new Error("Sign in failed");
  }
}

function parseOrderInfo(orderInfoTxt: string): { date: string; price: string; recipient: string } {
  const orderInfoRegex = /order placed (.+?) total (\$\d+\.\d{2}) ship to (.+)/i;
  const orderInfoMatch = orderInfoTxt?.trim().replace(/\s+/g, " ").match(orderInfoRegex);

  return {
    date: orderInfoMatch?.[1] ?? "not found",
    price: orderInfoMatch?.[2] ?? "not found",
    recipient: orderInfoMatch?.[3] ?? "not found",
  };
}

async function parseOrderItems(el: Page | ElementHandle): Promise<{ link: string | null; name: string | null }[]> {
  return el.$$eval(
    ".shipment",
    (els, url) => {
      return els.map((el) => ({
        link: url + el.querySelector(".yohtmlc-item .a-link-normal")?.getAttribute("href") ?? null,
        name: el.querySelector(".yohtmlc-item .a-link-normal")?.textContent?.trim() ?? null,
      }));
    },
    BASE_URL
  );
  // TODO: Go to each item's link to retrieve individual item prices
}

async function amazonOrderHistory(browser: Browser, limit: number = 10): Promise<OrderData[]> {
  const page = await browser.newPage();
  await page.goto(ORDERS_URL, { waitUntil: "domcontentloaded" });

  let ordersData = [];
  let yearOptions = await page.$$eval("#time-filter option", (options) =>
    options.map((opt) => opt.value).filter((val) => val.startsWith("year-") || val === "archived")
  );

  for (const yearValue of yearOptions) {
    if (ordersData.length >= limit) break;

    // Select a year and wait for the page reload with those orders
    await Promise.all([page.waitForNavigation(), page.select("#time-filter", yearValue)]);

    // Handle potential pagination within each year of orders
    let hasNextPage = true;
    while (hasNextPage && ordersData.length < limit) {
      if (ordersData.length >= limit) break;
      const orders = await page.$$(".order-card");

      for (const order of orders) {
        if (ordersData.length >= limit) break;

        const orderInfoTxt = await order.$eval(".order-info .a-col-left", (el) => el.textContent ?? "");
        const { date, price, recipient } = parseOrderInfo(orderInfoTxt);
        const items = await parseOrderItems(order);

        ordersData.push({
          date,
          price,
          recipient,
          items,
        });
      }

      // Check for enabled "Next" button to determine further pagination
      hasNextPage = (await page.$(".a-pagination .a-last a")) !== null;

      if (hasNextPage) {
        await Promise.all([page.waitForNavigation(), page.click(".a-pagination .a-last a")]);
      }
    }
  }

  await page.close();
  return ordersData.slice(0, limit) as OrderData[];
}

async function amazonOrderSearch(browser: Browser, searches: string[]): Promise<OrderData[]> {
  const searchPage = await browser.newPage();
  await searchPage.goto(ORDERS_URL, { waitUntil: "domcontentloaded" });

  let orderLinks = [];
  for (const search of searches) {
    await searchPage.waitForSelector("#searchOrdersInput");
    // Clear the search input and type the new search term
    await searchPage.click("#searchOrdersInput", { clickCount: 3 });
    await searchPage.keyboard.press("Backspace");
    await searchPage.type("#searchOrdersInput", search);
    await Promise.all([searchPage.waitForNavigation(), searchPage.click(".a-button-search input")]);

    let hasNextPage = true;
    while (hasNextPage) {
      const someOrderLinks = await searchPage.$$eval(
        "#ordersContainer .a-fixed-left-grid .a-col-right .a-row:nth-child(1) a",
        (els, url) => els.map((el) => url + el.getAttribute("href")),
        BASE_URL
      );

      orderLinks.push(...someOrderLinks);
      hasNextPage = (await searchPage.$(".a-pagination .a-last a")) !== null;

      if (hasNextPage) {
        await Promise.all([searchPage.waitForNavigation(), searchPage.click(".a-pagination .a-last a")]);
      }
    }
  }
  await searchPage.close();

  // Go to each order page to retrieve order details
  // TODO: Add conditional batch processing to avoid opening too many pages at once
  // TODO: Deduplicate order links by order ID
  const ordersData = orderLinks.map(async (link) => {
    const orderPage = await browser.newPage();
    await orderPage.goto(link, { waitUntil: "domcontentloaded" });

    const orderInfoTxt = await orderPage.$eval(".order-info .a-col-left", (el) => el.textContent ?? "");
    const { date, price, recipient } = parseOrderInfo(orderInfoTxt);
    const items = await parseOrderItems(orderPage);

    await orderPage.close();

    return {
      date,
      price,
      recipient,
      items,
    };
  });

  return Promise.all(ordersData);
}

export { amazonSignIn, amazonOrderHistory, amazonOrderSearch };
