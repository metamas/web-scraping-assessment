import { Page } from "puppeteer";

async function amazonSignIn(page: Page, credentials: { username: string; password: string }) {
  // Amazon does not allow directly navigating to the sign in page.
  await page.goto("https://www.amazon.com");
  // Sometimes Amazon returns an alternative landing page that requires an extra step
  const isIntermediaryPage = await page.$("#navbar-backup-backup");

  if (isIntermediaryPage) {
    await page.waitForSelector(".nav-bb-right a");
    await Promise.all([page.waitForNavigation(), page.click(".nav-bb-right a")]);
  }

  // Hover the mouse to reveal sign in form link
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
    console.log("Sign in successful");
  } else {
    throw new Error("Sign in failed");
  }
}

async function amazonOrders(page: Page, count: number = 10) {
  // TODO: Compare element classes to /your-orders/orders
  await page.goto("https://www.amazon.com/gp/css/order-history");

  let ordersData = [];
  let yearOptions = await page.$$eval("#time-filter option", (options) =>
    options.map((opt) => opt.value).filter((val) => val.startsWith("year-") || val === "archived")
  );
  const orderInfoRegex = /order placed (.+?) total (\$\d+\.\d{2}) ship to (.+)/i;

  for (const yearValue of yearOptions) {
    if (ordersData.length >= count) break;

    // Select a year and wait for the page reload with those orders
    await Promise.all([page.waitForNavigation(), page.select("#time-filter", yearValue)]);

    // Handle potential pagination within each year of orders
    let hasNextPage = true;
    while (hasNextPage && ordersData.length < count) {
      if (ordersData.length >= count) break;
      const orders = await page.$$(".order-card");

      for (const order of orders) {
        if (ordersData.length >= count) break;

        const orderInfoTxt = await order.$eval(".order-info .a-col-left", (el) => el.textContent);
        const orderInfoMatch = orderInfoTxt?.trim().replace(/\s+/g, " ").match(orderInfoRegex);

        const date = orderInfoMatch?.[1] ?? "not found";
        const price = orderInfoMatch?.[2] ?? "not found";
        const recipient = orderInfoMatch?.[3] ?? "not found";

        const items = await order.$$eval(".shipment", (els) => {
          return els.map((el) => ({
            link: el.querySelector(".a-link-normal")?.getAttribute("href"),
            name: el.querySelector(".a-link-normal")?.textContent?.trim(),
          }));
        });

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

  return ordersData.slice(0, count);
}

export { amazonSignIn, amazonOrders };
