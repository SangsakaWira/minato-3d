// Tiny synthesized sound effects plus a soft ocean bed; no audio files needed.
let ctx = null, master = null;
let muted = (() => { try { return localStorage.getItem('minato-muted') === '1'; } catch { return false; } })();

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
  master = ctx.createGain();
  master.gain.value = muted ? 0 : .9;
  master.connect(ctx.destination);
  startWaves();
}

function startWaves() {
  const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 600;
  const gain = ctx.createGain();
  gain.gain.value = .05;
  const lfo = ctx.createOscillator(), depth = ctx.createGain();
  lfo.frequency.value = .12;
  depth.gain.value = .035;
  lfo.connect(depth).connect(gain.gain);
  src.connect(lp).connect(gain).connect(master);
  src.start();
  lfo.start();
}

function tone(freq, dur, { type = 'sine', vol = .1, to = null, delay = 0 } = {}) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + .015);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + .05);
}

export const sfx = {
  ui: () => tone(660, .08, { vol: .04 }),
  cast: () => tone(500, .25, { type: 'triangle', to: 200, vol: .06 }),
  plop: () => tone(300, .18, { to: 120, vol: .12 }),
  bite: () => { tone(880, .12, { vol: .1 }); tone(1175, .15, { vol: .1, delay: .12 }); },
  catch: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .25, { vol: .08, delay: i * .09, type: 'triangle' })),
  fail: () => tone(330, .4, { to: 220, vol: .06, type: 'triangle' }),
  till: () => tone(140, .12, { type: 'square', vol: .035, to: 90 }),
  water: () => { for (let i = 0; i < 5; i++) tone(1200 + Math.random() * 800, .06, { vol: .025, delay: i * .04 }); },
  plant: () => tone(440, .12, { type: 'triangle', vol: .07, to: 660 }),
  harvest: () => { tone(660, .1, { vol: .08 }); tone(990, .16, { vol: .08, delay: .08 }); },
  coin: () => { tone(1319, .08, { vol: .05, type: 'square' }); tone(1760, .18, { vol: .04, type: 'square', delay: .07 }); },
  talk: () => tone(520 + Math.random() * 120, .05, { vol: .03, type: 'triangle' }),
};

export const isMuted = () => muted;
export function setMuted(m) {
  muted = m;
  if (master) master.gain.value = m ? 0 : .9;
  try { localStorage.setItem('minato-muted', m ? '1' : '0'); } catch { /* ignore */ }
}
