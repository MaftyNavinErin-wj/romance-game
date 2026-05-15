// verify_w5a_titles.js — 验 W5a-fix (214 wildData title patch) 后 m.wildMeta 真含 title
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

async function check(scenarioId) {
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
  await waitFor(() => typeof window.initGame === 'function', 10000);
  const expose = window.document.createElement('script');
  expose.textContent = 'window.__getM=()=>_scenarioMaterialized;';
  window.document.head.appendChild(expose);
  try { window.initGame(scenarioId); } catch {}
  const M = window.__getM();
  console.log(`\n--- ${scenarioId} m.wildMeta (${Object.keys(M.wildMeta).length} entries) ---`);
  const noTitle = [];
  for (const [name, meta] of Object.entries(M.wildMeta)) {
    if (!meta.title) noTitle.push(name);
  }
  console.log(`  含 title: ${Object.keys(M.wildMeta).length - noTitle.length} / ${Object.keys(M.wildMeta).length}`);
  if (noTitle.length) console.log(`  缺 title (${noTitle.length}): ${noTitle.slice(0,15).join(', ')}`);
  // sample
  for (const n of ['庞德','孟达','阎行','刘璋','田畴','韩遂','司马昭','陈泰']) {
    if (M.wildMeta[n]) console.log(`  ${n}: title="${M.wildMeta[n].title}" post="${M.wildMeta[n].post?.name}"`);
  }
}

(async () => {
  await check('214');
  await check('190');
})();
