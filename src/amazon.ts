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

  // Expand time filter from last 30 days to the current year
  // Finding the first available year option is more resilient than selecting by element index
  const setTimeFilter = page.evaluate(() => {
    const timeFilter = document.querySelector("#time-filter") as HTMLSelectElement;
    const timeOptions = Array.from(timeFilter.options);
    const currentYearOption = timeOptions.find((opt) => opt.value.includes("year"))?.value;

    if (currentYearOption) {
      timeFilter.value = currentYearOption;
      // Trigger change event since setting value programmatically won't do it
      timeFilter?.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  await Promise.all([page.waitForNavigation(), setTimeFilter]);
  await page.waitForSelector(".order-card");

  const orders = (await page.$$(".order-card")).slice(0, count);
  const orderInfoRegex = /order placed (.+?) total (\$\d+\.\d{2}) ship to (.+)/i;

  const ordersData = await Promise.all(
    orders.map(async (order) => {
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

      return {
        date,
        price,
        recipient,
        items,
      };
    })
  );

  return ordersData;
}

export { amazonSignIn, amazonOrders };
