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

export default amazonSignIn;
