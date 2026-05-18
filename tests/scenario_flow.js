// scenario_flow.js - runtime checks for scenario entry, switching, and save/load.
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const seedrandom = require('./vendor/seedrandom.js');

const SEED = 'project_romance_scenario_flow_001';
const HTML_PATH = path.resolve(__dirname, '..', 'project_romance_v181.html');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function scanNaN(obj, pathStr, hits) {
  if (obj == null) return;
  if (typeof obj === 'number') {
    if (Number.isNaN(obj)) hits.push(pathStr);
    return;
  }
  if (typeof obj !== 'object') return;
  for (const k of Object.keys(obj)) scanNaN(obj[k], `${pathStr}.${k}`, hits);
}

function waitFor(window, cond, ms) {
  return new Promise((res, rej) => {
    const t0 = Date.now();
    (function loop() {
      if (cond()) return res();
      if (Date.now() - t0 > ms) return rej(new Error('waitFor timeout'));
      setTimeout(loop, 20);
    })();
  });
}

async function loadWindow() {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    resources: 'usable',
    url: 'file://' + HTML_PATH,
    beforeParse(window) {
      window.Math.random = seedrandom(SEED);
      window.__SMOKE_TEST__ = true;
      window.addEventListener('error', () => {});
    },
  });
  const window = dom.window;
  await new Promise((res, rej) => {
    if (window.document.readyState === 'complete') return res();
    window.addEventListener('load', () => res());
    setTimeout(() => rej(new Error('load event timeout')), 15000);
  });
  await waitFor(window, () =>
    typeof window.startAs === 'function' &&
    typeof window.nextTurn === 'function' &&
    typeof window._serializeG === 'function' &&
    typeof window._deserializeG === 'function', 5000);

  const expose = window.document.createElement('script');
  expose.textContent = `
    window.__testStore = {};
    window.storage = {
      get: async key => Object.prototype.hasOwnProperty.call(window.__testStore, key) ? {key, value: window.__testStore[key]} : null,
      set: async (key, value) => { window.__testStore[key] = value; return {key, value}; },
      delete: async key => { delete window.__testStore[key]; return {key, deleted: true}; }
    };
    window.__getG = () => G;
    window.__mat = () => _scenarioMaterialized;
    window.__setFF = v => { _fastForward = !!v; };
    window.__scenarioFactions = () => getScenarioFactions();
    window.__facDef = fid => getFactionDef(fid);
    window.__scenarios = () => SCENARIOS;
    window.confirm = () => true;
  `;
  window.document.head.appendChild(expose);
  return window;
}

function checkNoNaN(G, label) {
  const hits = [];
  scanNaN({
    factions: G.factions,
    cities: G.cities,
    genLoyalty: G.genLoyalty,
    genMerit: G.genMerit,
    units: G.units,
  }, label, hits);
  assert(hits.length === 0, `${label} has NaN: ${hits.slice(0, 5).join(', ')}`);
}

function assert190(window, label, expectedPlayer = 'caocao') {
  const G = window.__getG();
  const mat = window.__mat();
  const facs = window.__scenarioFactions();
  assert(mat && mat.scenarioId === '190', `${label}: materialized scenario is not 190`);
  assert(G.scenarioId === '190', `${label}: G.scenarioId is not 190`);
  assert(G.startYear === 190, `${label}: startYear is not 190`);
  assert(G.playerFac === expectedPlayer, `${label}: playerFac is not ${expectedPlayer}`);
  assert(facs.length === 14, `${label}: expected 14 scenario factions, got ${facs.length}`);
  assert(window.__facDef(expectedPlayer), `${label}: ${expectedPlayer} faction def missing`);
  assert(!window.__facDef('wei'), `${label}: wei should not be in 190 faction defs`);
  assert(Object.keys(G.cities || {}).length === 55, `${label}: expected 55 cities`);
  assert((G.generals[expectedPlayer] || []).length > 0, `${label}: ${expectedPlayer} roster is empty`);
  assert((G.genPendingPool || []).length > 0, `${label}: pending pool is empty`);
  checkNoNaN(G, label);
}

function assert214(window, label) {
  const G = window.__getG();
  const mat = window.__mat();
  const facs = window.__scenarioFactions();
  assert(mat && mat.scenarioId === '214', `${label}: materialized scenario is not 214`);
  assert(G.scenarioId === '214', `${label}: G.scenarioId is not 214`);
  assert(G.startYear === 214, `${label}: startYear is not 214`);
  assert(G.playerFac === 'wei', `${label}: playerFac is not wei`);
  assert(facs.length === 4, `${label}: expected 4 scenario factions, got ${facs.length}`);
  assert(window.__facDef('wei'), `${label}: wei faction def missing`);
  assert(!window.__facDef('caocao'), `${label}: caocao should not be in 214 faction defs`);
  checkNoNaN(G, label);
}

function factionCards(window) {
  return Array.from(window.document.querySelectorAll('#factionSelectOverlay [onclick]'))
    .filter(el => (el.getAttribute('onclick') || '').includes('startAs'));
}

function suppressTutorial(window) {
  window.__getG().tutorialDone = true;
}

async function advance(window, turns, label) {
  window.__setFF(true);
  for (let i = 0; i < turns; i++) await window.nextTurn();
  checkNoNaN(window.__getG(), label);
}

async function main() {
  console.log(`[scenario-flow] seed=${SEED}`);
  const window = await loadWindow();

  console.log('[scenario-flow] faction select UI lists 190 playable factions');
  window.showFactionSelect('190');
  let cards = factionCards(window);
  assert(cards.length === 14, `190 faction select expected 14 cards, got ${cards.length}`);
  const caocaoCard = cards.find(el => /caocao/.test(el.getAttribute('onclick') || ''));
  assert(caocaoCard, '190 faction select missing caocao card');
  suppressTutorial(window);
  caocaoCard.click();
  assert190(window, '190 UI click caocao', 'caocao');

  window.showFactionSelect('214');
  cards = factionCards(window);
  assert(cards.length === 4, `214 faction select expected 4 cards, got ${cards.length}`);
  const weiCard = cards.find(el => /wei/.test(el.getAttribute('onclick') || ''));
  assert(weiCard, '214 faction select missing wei card');
  suppressTutorial(window);
  weiCard.click();
  assert214(window, '214 UI click wei');

  console.log('[scenario-flow] start every 190 playable faction');
  const playable190 = Object.entries(window.__scenarios()['190'].factions)
    .filter(([, f]) => f.playable === true)
    .map(([fid]) => fid);
  assert(playable190.length === 14, `190 playable count expected 14, got ${playable190.length}`);
  for (const fid of playable190) {
    suppressTutorial(window);
    window.startAs(fid, '190');
    assert190(window, `190 start ${fid}`, fid);
  }

  console.log('[scenario-flow] start 190 as caocao');
  suppressTutorial(window);
  window.startAs('caocao', '190');
  assert190(window, '190 start');
  await advance(window, 3, '190 advance');

  console.log('[scenario-flow] save 190, switch to 214, then reload 190');
  const save190 = window._serializeG();
  suppressTutorial(window);
  window.startAs('wei', '214');
  assert214(window, '214 switch');

  window._deserializeG(save190);
  assert190(window, '190 load');
  await advance(window, 1, '190 load advance');

  console.log('[scenario-flow] save/load panel shows and loads 190 slot');
  suppressTutorial(window);
  window.startAs('caocao', '190');
  assert(await window.saveToSlot(1), 'saveToSlot(1) failed');
  window.showSaveLoadPanel('load-title');
  await waitFor(window, () => {
    const el = window.document.querySelector('.save-slot[data-slot="1"] .slot-fac');
    return el && el.textContent.trim().length > 0;
  }, 5000);
  const slotFac = window.document.querySelector('.save-slot[data-slot="1"] .slot-fac').textContent.trim();
  assert(slotFac === '曹操', `190 save slot should display 曹操, got ${slotFac}`);
  window._selectSlot(1);
  assert(await window.loadFromSlot(1), 'loadFromSlot(1) failed');
  assert190(window, '190 slot load', 'caocao');

  console.log('[scenario-flow] save panel preserves legacy 214 slot names');
  suppressTutorial(window);
  window.startAs('wu', '214');
  assert(await window.saveToSlot(2), 'saveToSlot(2) failed');
  window.showSaveLoadPanel('load-title');
  await waitFor(window, () => {
    const el = window.document.querySelector('.save-slot[data-slot="2"] .slot-fac');
    return el && el.textContent.trim().length > 0;
  }, 5000);
  const slot2Fac = window.document.querySelector('.save-slot[data-slot="2"] .slot-fac').textContent.trim();
  assert(slot2Fac === '东吴', `214 Wu save slot should display 东吴, got ${slot2Fac}`);

  console.log('[scenario-flow] PASS');
}

main().catch(e => {
  console.error('[scenario-flow] FAIL:', e.message);
  process.exit(1);
});
