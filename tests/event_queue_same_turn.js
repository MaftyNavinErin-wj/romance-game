'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const seedrandom = require('./vendor/seedrandom.js');

const HTML_PATH = path.resolve(__dirname, '..', 'project_romance_v181.html');

function waitFor(pred, timeoutMs) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      try {
        if (pred()) return resolve();
      } catch (_) {}
      if (Date.now() - start > timeoutMs) return reject(new Error('waitFor timeout'));
      setTimeout(tick, 20);
    };
    tick();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const rng = seedrandom('event_queue_same_turn_001');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    resources: 'usable',
    url: 'file://' + HTML_PATH,
    beforeParse(window) {
      window.Math.random = rng;
    },
  });

  const { window } = dom;
  await waitFor(() => typeof window.initGame === 'function', 10000);

  const exposeScript = window.document.createElement('script');
  exposeScript.textContent = `
    window.__G__ = G;
    window.__makeEventQueueProbe = function(id, extraCtx) {
      return {
        def: {
          id,
          category: 'daily',
          icon: 'T',
          name: id,
          cooldown: 1,
          narrative(){ return 'probe narrative'; },
          choices(){ return [{ label: 'ok', desc: 'ok', effect(){ G._eventQueueProbeCount = (G._eventQueueProbeCount || 0) + 1; } }]; },
          aiChoose(){ return 0; }
        },
        fid: G.playerFac,
        forPlayer: true,
        ctx: Object.assign({ fid: G.playerFac, genName: G.generals[G.playerFac].find(g => g.role !== 'ruler').name }, extraCtx || {})
      };
    };
  `;
  window.document.head.appendChild(exposeScript);

  window.initGame();
  const G = window.__G__;
  G._eventQueueProbeCount = 0;
  G._pendingEvent = window.__makeEventQueueProbe('first');
  G._eventQueue = [window.__makeEventQueueProbe('second')];

  window.resolveEventChoice(0);
  await sleep(180);

  if (!G._pendingEvent || G._pendingEvent.def.id !== 'second') {
    throw new Error(`expected second event to pop in same turn, got ${G._pendingEvent?.def?.id || 'none'}`);
  }
  if (G._eventQueue.length !== 0) {
    throw new Error(`expected queue drained to pending event, got len=${G._eventQueue.length}`);
  }

  window.resolveEventChoice(0);
  await sleep(180);

  if (G._pendingEvent) throw new Error('expected no pending event after resolving second');
  if (G._eventQueue.length !== 0) throw new Error(`expected empty queue, got len=${G._eventQueue.length}`);
  if (G._eventQueueProbeCount !== 2) throw new Error(`expected 2 effects, got ${G._eventQueueProbeCount}`);

  const turnBeforeGuard = G.turn;
  G._eventQueue = [window.__makeEventQueueProbe('guarded')];
  await window.nextTurn();
  if (G.turn !== turnBeforeGuard) throw new Error(`expected queued event to block nextTurn, turn ${turnBeforeGuard} -> ${G.turn}`);
  if (!G._pendingEvent || G._pendingEvent.def.id !== 'guarded') {
    throw new Error(`expected nextTurn guard to pop queued event, got ${G._pendingEvent?.def?.id || 'none'}`);
  }
  window.resolveEventChoice(0);
  await sleep(180);
  if (G._eventQueueProbeCount !== 3) throw new Error(`expected guarded effect, got ${G._eventQueueProbeCount}`);

  const staleUnit = G.units.find(u => u.fac === G.playerFac);
  if (!staleUnit) throw new Error('missing player unit for stale-unit probe');
  G.units = G.units.filter(u => u.id !== staleUnit.id);
  const turnBeforeInvalid = G.turn;
  G._eventQueue = [window.__makeEventQueueProbe('stale-unit', { unit: staleUnit })];
  await window.nextTurn();
  if (G._pendingEvent?.def?.id === 'stale-unit') throw new Error('stale unit event should not be shown');
  if (G._eventQueue.length !== 0) throw new Error(`expected stale unit event to be discarded, got len=${G._eventQueue.length}`);
  if (G.turn <= turnBeforeInvalid) throw new Error(`expected nextTurn to continue after discarding invalid event, turn=${G.turn}`);

  dom.window.close();
  console.log('[event-queue] PASS: queued player events drain in the same turn');
}

main().catch(err => {
  console.error('[event-queue] FAIL:', err.message);
  process.exit(1);
});
