import { Browser } from 'puppeteer';

async function amazonSignIn(browser: Browser, credentials: { username: string, password: string }) {
  const page = await browser.newPage();

  // Navigate to the Amazon sign in page
  await page.goto('https://www.amazon.com');
  // Hover the mouse over the "Hello, Sign in" link to reveal the sign in form
  await page.waitForSelector('#nav-link-accountList', {visible: true});
  await page.hover('#nav-link-accountList');
  await page.waitForSelector('#nav-flyout-ya-signin', {visible: true});
  await Promise.all([ page.waitForNavigation(), page.click('#nav-flyout-ya-signin') ]);

  await page.waitForSelector('#ap_email');
  await page.type('#ap_email', credentials.username);
  await Promise.all([ page.waitForNavigation(), page.click('#continue') ]);
  await page.waitForSelector('#ap_password');
  await page.type('#ap_password', credentials.password);
  await Promise.all([ page.waitForNavigation(), page.click('#signInSubmit') ]);


  // Successful sign in will redirect to the home page
  const isSignedIn = !page.url().includes('/ap/signin');

  if (isSignedIn) {
    console.log('Sign in successful');
  } else {
    throw new Error('Sign in failed');
  }
}

export default amazonSignIn;