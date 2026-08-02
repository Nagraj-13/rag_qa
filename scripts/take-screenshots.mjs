/**
 * Native Puppeteer Click Pipeline
 * Uses page.click() to fire native mouse events into React 19 synthetic event dispatchers.
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const screenshotDir = path.join(projectRoot, 'docs', 'screenshots');

const APP_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@email.com';
const ADMIN_PASSWORD = 'admin123';

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runScreenshotPipeline() {
  console.log('🎬 Starting Native Puppeteer Screenshot Pipeline...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 1: Landing Page
  // ───────────────────────────────────────────────────────────────────────────
  console.log('📄 Step 1: Landing Page (http://localhost:3000)');
  await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 15000 });
  await sleep(3000);
  
  await page.screenshot({ path: path.join(screenshotDir, '01_landing_page.png'), fullPage: false });
  console.log('   📸 Saved: docs/screenshots/01_landing_page.png');

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 2: Support Chat & Query Execution
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n📄 Step 2: Clicking "Start a Conversation" button...');
  
  // Find chat button in nav or hero and click with native mouse click
  const chatButton = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent && (b.textContent.includes('Start a Conversation') || b.textContent.includes('Support Chat')));
  });

  if (chatButton && chatButton.asElement()) {
    await chatButton.asElement().click();
    console.log('   Clicked chat button natively!');
  } else {
    console.warn('   ⚠️ Could not find chat button');
  }

  console.log('   Waiting 4 seconds for Chat UI to render...');
  await sleep(4000);

  // Type query in chat
  const chatInputSelector = 'input[type="text"], textarea';
  const hasInput = await page.$(chatInputSelector);
  if (hasInput) {
    console.log('   Writing query: "What is your refund policy?"...');
    await page.focus(chatInputSelector);
    await page.type(chatInputSelector, 'What is your refund policy?', { delay: 40 });
    await sleep(500);

    console.log('   Submitting query...');
    await page.keyboard.press('Enter');

    console.log('   Waiting 10 seconds for AI response synthesis & citations to render...');
    await sleep(10000);
  } else {
    console.warn('   ⚠️ Chat input field not found');
  }

  await page.screenshot({ path: path.join(screenshotDir, '02_chat_interface.png'), fullPage: false });
  console.log('   📸 Saved: docs/screenshots/02_chat_interface.png');

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 3: Return to Landing Page & Admin Sign In
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n📄 Step 3: Returning to Landing Page & Signing In as Admin');
  await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 15000 });
  await sleep(2000);

  console.log('   Clicking "Sign In" button in header...');
  const signInButton = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent && b.textContent.includes('Sign In'));
  });
  if (signInButton && signInButton.asElement()) {
    await signInButton.asElement().click();
  }
  await sleep(2000);

  console.log(`   Entering credentials (${ADMIN_EMAIL} / ${ADMIN_PASSWORD})...`);
  await page.waitForSelector('input[type="email"]', { timeout: 5000 });
  await page.focus('input[type="email"]');
  await page.type('input[type="email"]', ADMIN_EMAIL, { delay: 30 });

  await page.waitForSelector('input[type="password"]', { timeout: 5000 });
  await page.focus('input[type="password"]');
  await page.type('input[type="password"]', ADMIN_PASSWORD, { delay: 30 });
  await sleep(500);

  console.log('   Submitting sign-in form...');
  const submitButton = await page.$('form button[type="submit"]');
  if (submitButton) {
    await submitButton.click();
  }
  await sleep(5000);

  console.log('   Clicking "Admin" button in header navigation...');
  const adminButton = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent && b.textContent.includes('Admin'));
  });
  if (adminButton && adminButton.asElement()) {
    await adminButton.asElement().click();
  }

  console.log('   Waiting 5 seconds for Knowledge Base documents to load...');
  await sleep(5000);

  await page.screenshot({ path: path.join(screenshotDir, '03_knowledge_base.png'), fullPage: false });
  console.log('   📸 Saved: docs/screenshots/03_knowledge_base.png');

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 4: Admin Analytics Dashboard
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n📄 Step 4: Opening Admin Analytics Dashboard');
  const analyticsButton = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent && b.textContent.includes('Analytics'));
  });
  if (analyticsButton && analyticsButton.asElement()) {
    await analyticsButton.asElement().click();
  }

  console.log('   Waiting 5 seconds for telemetry dashboard & metrics to load...');
  await sleep(5000);

  await page.screenshot({ path: path.join(screenshotDir, '04_admin_analytics.png'), fullPage: false });
  console.log('   📸 Saved: docs/screenshots/04_admin_analytics.png');

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 5: Admin System Settings
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n📄 Step 5: Opening Admin System Settings');
  const settingsButton = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent && b.textContent.includes('Settings'));
  });
  if (settingsButton && settingsButton.asElement()) {
    await settingsButton.asElement().click();
  }

  console.log('   Waiting 5 seconds for system settings & router health to load...');
  await sleep(5000);

  await page.screenshot({ path: path.join(screenshotDir, '05_settings_page.png'), fullPage: false });
  console.log('   📸 Saved: docs/screenshots/05_settings_page.png');

  await browser.close();
  console.log('\n🎉 ALL 5 SCREENSHOTS CAPTURED SUCCESSFULLY!');
  console.log(`📁 Directory: ${screenshotDir}`);
}

runScreenshotPipeline().catch(err => {
  console.error('Screenshot execution error:', err);
  process.exit(1);
});
