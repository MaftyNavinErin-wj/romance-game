// verify_190_realflow.js — 验 190 「pre-existing renderAll bug」 是否仅 test harness 漏 G.playerFac
// 真实 UI 流程: onScenarioSelect('190') → showFactionSelect('190') → startAs(fid, '190') → initGame('190')
// startAs 先 G.playerFac = fid 然后 initGame, 跟我们 dump 直接 initGame('190') 不一样
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML_PATH = path.resolve(__dirname, '..', 'project_romance_v181.html');

function waitFor(cond, ms) {
  return new Promise((res, rej) => {
    const t0 = Date.now();
    (function loop() {
      if (cond()) return res();
      if (Date.now() - t0 > ms) return rej(new Error('waitFor timeout'));
      setTimeout(loop, 20);
    })();
  });
}

async function tryRoute(label, body) {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', pretendToBeVisual: true, resources: 'usable',
    url: 'file://' + HTML_PATH,
    beforeParse(w) { w.addEventListener('error', () => {}); },
  });
  const window = dom.window;
  await new Promise((res) => {
    if (window.document.readyState === 'complete') return res();
    window.addEventListener('load', res);
  });
  await waitFor(() => typeof window.initGame === 'function' && typeof window.startAs === 'function', 10000);
  let err = null;
  try { body(window); } catch (e) { err = e.message + '\n' + (e.stack || '').split('\n').slice(0,5).join('\n'); }
  console.log(`[${label}] ${err ? 'THREW:\n  ' + err : 'OK'}`);
}

(async () => {
  await tryRoute('190 直 initGame (旧 harness 路径)', w => {
    w.initGame('190');
  });
  await tryRoute('214 showFactionSelect (验 dynamic facData)', w => {
    w.showFactionSelect('214');
    const ov = w.document.getElementById('factionSelectOverlay');
    if (!ov) throw new Error('overlay not created');
    const cards = ov.querySelectorAll('div[onclick^="startAs"]');
    console.log(`   214 facData cards: ${cards.length} (expect 4: wei/shu/wu/nanman)`);
  });
  await tryRoute('190 showFactionSelect (验 14 势力卡)', w => {
    w.showFactionSelect('190');
    const ov = w.document.getElementById('factionSelectOverlay');
    if (!ov) throw new Error('overlay not created');
    const cards = ov.querySelectorAll('div[onclick^="startAs"]');
    console.log(`   190 facData cards: ${cards.length} (expect 14)`);
    if (cards.length !== 14) throw new Error(`expected 14 cards, got ${cards.length}`);
  });
  await tryRoute('190 startAs caocao (真 UI 路径)', w => {
    w.startAs('caocao', '190');
  });
  await tryRoute('190 startAs dongzhuo (真 UI 路径)', w => {
    w.startAs('dongzhuo', '190');
  });
})();
