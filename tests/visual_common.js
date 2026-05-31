'use strict';

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright-core');

const ROOT_DIR = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT_DIR, 'project_romance_v181.html');
const ARTIFACT_ROOT = path.join(__dirname, 'artifacts', 'visual');

function findChromeExecutable() {
  const candidates = [
    process.env.PR_CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
  ].filter(Boolean);

  const found = candidates.find(p => fs.existsSync(p));
  if (!found) {
    throw new Error('Chrome executable not found. Set PR_CHROME_PATH to a Chrome/Chromium executable.');
  }
  return found;
}

function ensureArtifactDir(testName) {
  const dir = path.join(ARTIFACT_ROOT, testName);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function createConsoleCollector(page) {
  const issues = [];
  page.on('console', msg => {
    if (msg.type() === 'error') issues.push(`[console.error] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    issues.push(`[pageerror] ${err && err.stack ? err.stack : String(err)}`);
  });
  return {
    issues,
    assertClean() {
      if (issues.length) throw new Error(`Browser console/page errors:\n${issues.join('\n')}`);
    },
  };
}

async function launchGame(testName) {
  const artifactDir = ensureArtifactDir(testName);
  const browser = await chromium.launch({
    executablePath: findChromeExecutable(),
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  await context.addInitScript(() => {
    let seed = 0x5eed1234;
    Math.random = () => {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  });

  const page = await context.newPage();
  const consoleCollector = createConsoleCollector(page);
  await page.goto(pathToFileURL(HTML_PATH).href, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#titleScreen', { state: 'visible', timeout: 10000 });
  await exposeGameTestHooks(page);

  return { browser, context, page, artifactDir, consoleCollector };
}

async function exposeGameTestHooks(page) {
  await page.addScriptTag({
    content: `
      window.__visualGetG = function(){ return G; };
      window.__visualSetFF = function(v){ _fastForward = !!v; };
    `,
  });
}

async function screenshot(page, artifactDir, name) {
  const filePath = path.join(artifactDir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

async function start214ShuViaClicks(page) {
  await page.locator('#titleScreen .ts-btn.primary').click();
  await page.waitForSelector('#scenarioScreen', { state: 'visible', timeout: 10000 });
  await page.locator('#scenarioScreen .scenario-card').first().click();
  await page.waitForSelector('#factionSelectOverlay', { state: 'visible', timeout: 10000 });
  await page.locator("#factionSelectOverlay div[onclick*=\"startAs('shu'\"]").first().click();
  await page.waitForFunction(() => typeof G !== 'undefined' && G.playerFac === 'shu' && !!document.getElementById('mapRoot'));
  await closeTutorialIfPresent(page);
}

async function start214ShuDirect(page) {
  await page.evaluate(() => {
    document.getElementById('titleScreen')?.remove();
    document.getElementById('scenarioScreen')?.remove();
    document.getElementById('factionSelectOverlay')?.remove();
    startAs('shu', '214');
  });
  await page.waitForFunction(() => typeof G !== 'undefined' && G.playerFac === 'shu' && !!document.getElementById('mapRoot'));
  await closeTutorialIfPresent(page);
}

async function closeTutorialIfPresent(page) {
  await page.evaluate(() => {
    if (document.getElementById('tutOverlay') && typeof closeTutorial === 'function') closeTutorial();
  });
  await page.waitForFunction(() => !document.getElementById('tutOverlay'));
}

async function assertMainGameReady(page) {
  const state = await page.evaluate(() => {
    const g = window.__visualGetG();
    return {
      playerFac: g.playerFac,
      scenarioId: g.scenarioId,
      turn: g.turn,
      hasMap: !!document.getElementById('mapRoot'),
      hasTurnButton: !!document.getElementById('btnTurn'),
      turnText: document.getElementById('turnDisp')?.textContent || '',
      rightText: document.getElementById('rightContent')?.textContent || '',
    };
  });
  if (state.playerFac !== 'shu') throw new Error(`Expected playerFac=shu, got ${state.playerFac}`);
  if (state.scenarioId !== '214') throw new Error(`Expected scenarioId=214, got ${state.scenarioId}`);
  if (!state.hasMap) throw new Error('Expected #mapRoot after boot');
  if (!state.hasTurnButton) throw new Error('Expected #btnTurn after boot');
  return state;
}

module.exports = {
  launchGame,
  screenshot,
  start214ShuViaClicks,
  start214ShuDirect,
  assertMainGameReady,
};
