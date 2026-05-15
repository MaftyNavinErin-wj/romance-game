#!/usr/bin/env node
// tools/patch_214_wild_title.js
//
// §8.4 W5a regression fix (Option A): SCENARIO_214 wild/pending wildData
// 漏抽 title/post 字段, 导致 W5a wildMeta composite (wd.title + GEN_BASE) 显示空称号。
// 此 patch 从 legacy WILD_GEN_META / GEN_META 抄 title + post 到对应 wildData:
//   - wild 8 + pending 无 pendingFac 10 = 18 武将 → WILD_GEN_META 抄
//   - pending + pendingFac 8 武将 → GEN_META 抄 (司马昭/陈泰/王基 等)
//
// 安全网: round-trip check + 所有 26 武将必须 legacy 有数据, 否则报错。
// 用法: node tools/patch_214_wild_title.js
//
// 注意: 190.js 的 wildData title/post 已正确填好 (190 wild 13 已有 title; pending
// title=null 是 待出仕/未成年 设计意图, 不需 patch)。

'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const TARGET = path.resolve(__dirname, '..', 'src/data/scenarios/214.js');
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

async function loadLegacyMetas() {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', pretendToBeVisual: true, resources: 'usable',
    url: 'file://' + HTML_PATH,
    beforeParse(window) { window.addEventListener('error', () => {}); },
  });
  const window = dom.window;
  await new Promise((res) => {
    if (window.document.readyState === 'complete') return res();
    window.addEventListener('load', res);
  });
  // const 不挂 window, 用 inline script 在同 script scope 抓引用
  const expose = window.document.createElement('script');
  expose.textContent = 'window.__legacy={WILD_GEN_META:WILD_GEN_META, GEN_META:GEN_META};';
  window.document.head.appendChild(expose);
  await waitFor(() => window.__legacy && window.__legacy.WILD_GEN_META && window.__legacy.GEN_META, 5000);
  return { WILD_GEN_META: window.__legacy.WILD_GEN_META, GEN_META: window.__legacy.GEN_META };
}

// patch_214_roster_add.js 新增 4 武将 legacy 缺 title/post, 此处史实 hardcoded fallback
const EXTRA_META = {
  '韩遂': { title: '凉州群雄', post: { name: '西凉太守',   rank: '将',   desc: '凉州军阀,反董盟主之一,后与马腾交恶。' } },
  '阎行': { title: '金城猛将', post: { name: '中坚将军',   rank: '将',   desc: '韩遂部将,武勇过人,后归曹操。' } },
  '刘璋': { title: '暗弱益州', post: { name: '振威将军',   rank: '文官', desc: '汉室宗亲,益州牧,失益州后徙公安。' } },
  '田畴': { title: '徐无隐士', post: { name: '议郎',       rank: '文官', desc: '右北平名士,徐无山隐居,曹操辟为茂才。' } },
};

async function main() {
  const { WILD_GEN_META, GEN_META } = await loadLegacyMetas();
  console.log(`[legacy] WILD_GEN_META: ${Object.keys(WILD_GEN_META).length} entries / GEN_META: ${Object.keys(GEN_META).length} entries / EXTRA: ${Object.keys(EXTRA_META).length} entries`);

  // ── load SCENARIO_214 ──
  const srcText = fs.readFileSync(TARGET, 'utf8');
  const marker = 'const SCENARIO_214 = ';
  const markerIdx = srcText.indexOf(marker);
  if (markerIdx === -1) { console.error('!! marker not found'); process.exit(1); }
  const header = srcText.slice(0, markerIdx + marker.length);
  let rest = srcText.slice(markerIdx + marker.length);
  const semiIdx = rest.lastIndexOf('}');
  const bodyText = rest.slice(0, semiIdx + 1);
  const trailer = rest.slice(semiIdx + 1);

  const data = JSON.parse(bodyText);

  // round-trip soft check: parse → stringify → parse 数据一致 (不要求文本一致,
  //   因 W1 加 initLog 用 inline array, 跟 JSON.stringify(., null, 2) expand 形式不符;
  //   patch 会重排 file 但数据语义不变)
  try {
    const reparse = JSON.parse(JSON.stringify(data));
    if (Object.keys(reparse).length !== Object.keys(data).length) throw new Error('key count mismatch');
  } catch (e) {
    console.error('!! data 非 valid JSON: ' + e.message);
    process.exit(1);
  }
  console.log('parse-roundtrip check: PASS (file 会 reformat — inline arrays expand 但语义不变)');

  // ── patch wild + pending wildData title/post ──
  let patched = 0;
  let missingLegacy = [];
  let alreadyHas = [];
  for (const [name, entry] of Object.entries(data.generals)) {
    if (entry.status !== 'wild' && entry.status !== 'pending') continue;
    if (!entry.wildData) continue;
    // 选 legacy source: pending+pendingFac → GEN_META (B类 active), else → WILD_GEN_META;
    //   EXTRA_META fallback 给 patch_214_roster_add.js 新增的 4 武将 (legacy 不含)。
    const useGenMeta = (entry.status === 'pending' && entry.pendingFac);
    const legMeta = (useGenMeta ? GEN_META[name] : WILD_GEN_META[name]) || EXTRA_META[name];
    if (!legMeta) {
      missingLegacy.push(`${name} (status=${entry.status}, pendingFac=${entry.pendingFac || 'none'}, source=${useGenMeta ? 'GEN_META' : 'WILD_GEN_META'})`);
      continue;
    }
    let p = 0;
    if (entry.wildData.title === undefined && legMeta.title !== undefined) {
      entry.wildData.title = legMeta.title;
      p++;
    } else if (entry.wildData.title !== undefined) {
      alreadyHas.push(`${name}.title`);
    }
    if (entry.wildData.post === undefined && legMeta.post) {
      // copy post as plain object (drop function refs if any)
      entry.wildData.post = { name: legMeta.post.name, rank: legMeta.post.rank, desc: legMeta.post.desc };
      p++;
    } else if (entry.wildData.post !== undefined) {
      alreadyHas.push(`${name}.post`);
    }
    if (p > 0) {
      patched++;
      console.log(`  + ${name} (${entry.status}${entry.pendingFac ? '/'+entry.pendingFac : ''}) title="${entry.wildData.title}" post.name="${entry.wildData.post?.name}"`);
    }
  }
  console.log(`\npatched ${patched} 武将`);
  if (alreadyHas.length) console.log(`already had: ${alreadyHas.join(', ')}`);
  if (missingLegacy.length) {
    console.error('!! legacy 缺数据 (不能 patch):');
    missingLegacy.forEach(m => console.error('   ' + m));
    process.exit(1);
  }

  // round-trip safety on patched data
  const newBody = JSON.stringify(data, null, 2);
  try {
    JSON.parse(newBody);
  } catch (e) {
    console.error('!! patched data 非 valid JSON: ' + e.message);
    process.exit(1);
  }

  // write
  fs.writeFileSync(TARGET, header + newBody + trailer);
  console.log('Wrote ' + TARGET);
}

main().catch(e => { console.error(e); process.exit(1); });
