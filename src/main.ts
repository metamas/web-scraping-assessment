import puppeteer from 'puppeteer';

import promptForCredentials from './prompt.js';
import amazonSignIn from './auth.js';

async function main() {
  // Use headful mode for potential MFA
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null }); 
  const credentials = await promptForCredentials('Amazon');
  
  try {
    await amazonSignIn(browser, credentials);
  } catch (error) {
    console.error(error);
  }

  await browser.close();
}

main();