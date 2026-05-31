'use strict';

const {
  launchGame,
  screenshot,
  start214ShuDirect,
  assertMainGameReady,
} = require('./visual_common');

async function main() {
  const { browser, page, artifactDir, consoleCollector } = await launchGame('appoint');
  try {
    await start214ShuDirect(page);
    await assertMainGameReady(page);
    const postPlan = await verifyPostAppointment(page, artifactDir);
    await verifyPrefectAppointment(page, artifactDir, postPlan.genName);
    consoleCollector.assertClean();
    console.log('[visual:appoint] PASS');
    console.log(`[visual:appoint] artifacts ${artifactDir}`);
  } finally {
    await browser.close();
  }
}

async function verifyPostAppointment(page, artifactDir) {
  const plan = await page.evaluate(() => {
    switchTab('post');
    const g = window.__visualGetG();
    const fid = g.playerFac;
    const slots = getPostSlots(fid);
    const posts = getFacPosts(fid);
    const gens = (g.generals[fid] || []).filter(gen => gen.role !== 'ruler' && !(g.genPost && g.genPost[gen.name]));

    for (const postDef of ALL_POSTS) {
      const slotArr = slots[postDef.track];
      const maxSlots = slotArr ? slotArr[3 - postDef.tier] : 0;
      if (!maxSlots) continue;
      const holders = posts.filter(({ postDef: p }) => p.track === postDef.track && p.tier === postDef.tier);
      if (holders.length >= maxSlots) continue;
      if (holders.some(({ postDef: p }) => p.name === postDef.name)) continue;
      const candidate = gens.find(gen => (g.genMerit[gen.name] || 0) >= postDef.merit);
      if (candidate) return { fid, postName: postDef.name, genName: candidate.name };
    }
    return null;
  });
  if (!plan) throw new Error('No available post appointment candidate found');

  await page.waitForSelector('#rightContent', { state: 'visible' });
  await screenshot(page, artifactDir, '01-post-tab-before');
  await page.evaluate(({ postName, fid }) => openPostAppoint(postName, fid), plan);
  await page.waitForFunction(() => {
    const m = document.getElementById('postModal');
    return m && getComputedStyle(m).display !== 'none';
  });
  await page.evaluate(({ genName }) => {
    const rows = Array.from(document.querySelectorAll('#postModal div'));
    const row = rows.find(el => {
      const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
      return text.startsWith(genName + ' ') && el.onclick;
    });
    if (row) row.setAttribute('data-visual-post-candidate', '1');
  }, plan);
  const postCandidateRow = page.locator('[data-visual-post-candidate="1"]');
  await postCandidateRow.hover();
  await page.waitForFunction(({ genName, postName }) => {
    const tip = document.getElementById('_tip');
    return tip && getComputedStyle(tip).display !== 'none'
      && tip.textContent.includes(genName)
      && tip.textContent.includes(postName);
  }, plan);
  const postTipText = await page.locator('#_tip').innerText();
  if (!postTipText.includes(plan.genName) || !postTipText.includes(plan.postName)) {
    throw new Error(`Expected post impact tooltip for ${plan.genName}/${plan.postName}, got:\n${postTipText}`);
  }
  if (!postTipText.includes('官职效果生效') || !postTipText.includes('忠诚 +8')) {
    throw new Error(`Expected post impact tooltip to explain office and loyalty effects, got:\n${postTipText}`);
  }
  await screenshot(page, artifactDir, '02-post-impact-tip');
  await postCandidateRow.click();
  await page.waitForFunction(({ genName, postName }) => {
    const g = window.__visualGetG();
    return g.genPost && g.genPost[genName] === postName;
  }, plan);
  await screenshot(page, artifactDir, '03-post-tab-after');
  return plan;
}

async function verifyPrefectAppointment(page, artifactDir, preferredGenName) {
  const plan = await page.evaluate((preferred) => {
    const g = window.__visualGetG();
    const fid = g.playerFac;
    const candidate = (g.generals[fid] || []).find(gen => gen.role !== 'ruler' && gen.name === preferred);
    if (!candidate) return { error: `Preferred post holder ${preferred} is not available for prefect appointment` };
    const city = Object.values(g.cities).find(c => c.fac === fid && c.prefect !== candidate.name);
    if (!city) return { error: `No owned city can appoint ${preferred} as a new prefect` };
    return { cityId: city.id, cityName: city.name, genName: candidate.name };
  }, preferredGenName);
  if (!plan) throw new Error('No available prefect appointment candidate found');
  if (plan.error) throw new Error(plan.error);

  await page.evaluate(({ cityId }) => openPrefectModal(cityId), plan);
  await page.waitForFunction(() => {
    const m = document.getElementById('genericModal');
    return m && getComputedStyle(m).display !== 'none'
      && document.getElementById('genericModalTitle')?.textContent.includes('太守');
  });
  await screenshot(page, artifactDir, '04-prefect-modal');
  await page.locator('#genericModalBody').getByText(plan.genName, { exact: true }).first().click();
  await page.waitForFunction(({ genName }) => {
    return document.getElementById('genericModalTitle')?.textContent.includes('确认')
      && document.getElementById('genericModalBody')?.textContent.includes(genName);
  }, plan);
  const previewText = await page.locator('#genericModalBody').innerText();
  if (!previewText.includes('太守效果减半')) {
    throw new Error(`Expected prefect preview to explain reduced duty effect, got:\n${previewText}`);
  }
  if (!previewText.includes('官职效果不受影响')) {
    throw new Error(`Expected prefect preview to preserve office effect, got:\n${previewText}`);
  }
  await screenshot(page, artifactDir, '05-prefect-confirm-preview');
  await page.locator('#genericModalBody button').last().click();
  await page.waitForFunction(({ cityId, genName }) => {
    const g = window.__visualGetG();
    return g.cities[cityId] && g.cities[cityId].prefect === genName
      && g.genPost && !!g.genPost[genName];
  }, plan);
  await screenshot(page, artifactDir, '06-prefect-after');
}

main().catch(err => {
  console.error(`[visual:appoint] FAIL ${err && err.stack ? err.stack : err}`);
  process.exit(1);
});
