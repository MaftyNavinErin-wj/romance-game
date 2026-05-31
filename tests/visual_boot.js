'use strict';

const {
  launchGame,
  screenshot,
  start214ShuViaClicks,
  assertMainGameReady,
} = require('./visual_common');

async function main() {
  const { browser, page, artifactDir, consoleCollector } = await launchGame('boot');
  try {
    await screenshot(page, artifactDir, '01-title');
    await start214ShuViaClicks(page);
    const before = await assertMainGameReady(page);
    await screenshot(page, artifactDir, '02-main-turn-1');

    await page.evaluate(async () => {
      window.__visualSetFF(true);
      await fastForwardTurns(1);
      window.__visualSetFF(false);
    });
    await page.waitForFunction(() => window.__visualGetG().turn >= 2);
    const after = await assertMainGameReady(page);
    if (after.turn < before.turn + 1) {
      throw new Error(`Expected turn to advance from ${before.turn}, got ${after.turn}`);
    }
    await screenshot(page, artifactDir, '03-main-after-turn');

    consoleCollector.assertClean();
    console.log(`[visual:boot] PASS turn ${before.turn} -> ${after.turn}`);
    console.log(`[visual:boot] artifacts ${artifactDir}`);
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(`[visual:boot] FAIL ${err && err.stack ? err.stack : err}`);
  process.exit(1);
});
