import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { scene, sun, hemi, glass, lanternMat, waterMat, stars, boat, ripples, walkables, groundHeight, HOME_DOOR, SPAWN, WATER_Y } from './world.js';
import { state, load, save, hasSave, resetState, count } from './state.js';
import { ITEMS, RODS, WEEKDAYS } from './data.js';
import { ui, esc } from './ui.js';
import { sfx, initAudio, isMuted, setMuted } from './audio.js';
import { createPlayer } from './player.js';
import { createNPCs, talk, hearts, questFor, questMarker, isQuestActive, needText, NPC_DEFS } from './npcs.js';
import { createFarm } from './farm.js';
import { createFishing } from './fishing.js';

const $ = s => document.querySelector(s);
const GAME_MINUTES_PER_SECOND = 2;

// --- Renderer and camera --------------------------------------------------------

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.prepend(renderer.domElement);

const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, .1, 220);
camera.position.set(36, 35, 47);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 18;
controls.maxDistance = 90;
controls.maxPolarAngle = Math.PI / 2.12;
controls.autoRotate = true;
controls.autoRotateSpeed = .45;

// --- Game objects ---------------------------------------------------------------

const player = createPlayer();
const npcs = createNPCs();
const farm = createFarm();
const fishing = createFishing(player);
player.extraBlock = (x, z) => npcs.list.some(n => (n.pos.x - x) ** 2 + (n.pos.z - z) ** 2 < .36);
player.place(SPAWN.x, SPAWN.z);

let playing = false;
let current = null; // the action offered by the action button

// --- Day, night and weather ------------------------------------------------------

// [minute, sky, sun, hemisphere]
const SKY = [
  [0, '#1c2740', .12, .5], [300, '#1c2740', .12, .5], [390, '#f1cdb5', 1.2, 1.5], [480, '#d8e9e5', 3.2, 2.5],
  [1020, '#d8e9e5', 3.2, 2.5], [1110, '#f2bc94', 2, 1.9], [1200, '#5d6b8c', .5, 1], [1290, '#26344f', .15, .6], [1440, '#1c2740', .12, .5],
];
const skyA = new THREE.Color(), skyB = new THREE.Color(), rainGrey = new THREE.Color('#9aa7aa');
const waterDay = new THREE.Color('#67b8bc'), waterNight = new THREE.Color('#2d5468');
const sunDay = new THREE.Color('#ffe4b6'), sunNight = new THREE.Color('#9fb4ff');
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function applyTime(m) {
  let i = 0;
  while (i < SKY.length - 2 && SKY[i + 1][0] <= m) i++;
  const a = SKY[i], b = SKY[i + 1], t = (m - a[0]) / (b[0] - a[0]);
  const rain = state.weather === 'hujan' && playing;
  const night = playing ? Math.max(1 - smooth(300, 420, m), smooth(1080, 1230, m)) : 0;
  skyA.set(a[1]).lerp(skyB.set(b[1]), t);
  if (rain) skyA.lerp(rainGrey, .45 * (1 - night * .6));
  scene.background.copy(skyA);
  scene.fog.color.copy(skyA);
  renderer.setClearColor(skyA);
  sun.intensity = (a[2] + (b[2] - a[2]) * t) * (rain ? .45 : 1);
  hemi.intensity = (a[3] + (b[3] - a[3]) * t) * (rain ? .8 : 1);
  const arc = Math.max(0, Math.min(1, (m - 360) / 1080)) * Math.PI;
  sun.position.set(Math.cos(arc) * 40, 14 + Math.sin(arc) * 28, 18);
  sun.color.copy(sunDay).lerp(sunNight, night);
  glass.emissiveIntensity = night * 1.4;
  lanternMat.emissiveIntensity = night * 2.2;
  stars.material.opacity = rain ? 0 : night * .9;
  waterMat.color.copy(waterDay).lerp(waterNight, night * .8);
}

// Rain: short streaks recycled around the camera target.
const RAIN = 700;
const rainPos = new Float32Array(RAIN * 6);
for (let i = 0; i < RAIN; i++) {
  const x = (Math.random() - .5) * 40, y = Math.random() * 16, z = (Math.random() - .5) * 40;
  rainPos.set([x, y, z, x, y - .45, z], i * 6);
}
const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: '#d5e6ec', transparent: true, opacity: .5 }));
rain.frustumCulled = false;
rain.visible = false;
scene.add(rain);

function updateRain(dt) {
  rain.visible = playing && state.weather === 'hujan';
  if (!rain.visible) return;
  rain.position.set(controls.target.x, 0, controls.target.z);
  for (let i = 0; i < RAIN; i++) {
    const o = i * 6;
    let y = rainPos[o + 1] - 22 * dt;
    if (y < -1) y += 17;
    rainPos[o + 1] = y;
    rainPos[o + 4] = y - .45;
  }
  rainGeo.attributes.position.needsUpdate = true;
}

const clockText = m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m % 60 / 10) * 10).padStart(2, '0')}`;

async function newDay(passedOut) {
  fishing.stop();
  ui.action(null);
  await ui.fade(passedOut ? 'Sudah larut… kamu tertidur di bangku. Pak Kenji mengantarmu pulang.' : 'Selamat tidur…');
  state.day++;
  state.minutes = 360;
  state.weather = state.day > 2 && Math.random() < .22 ? 'hujan' : 'cerah';
  farm.grow(state.weather === 'hujan');
  state.talked = {};
  state.gifted = {};
  player.place(HOME_DOOR.x, HOME_DOOR.z + .4, 0);
  snapCamera();
  state.player = { x: player.position.x, z: player.position.z };
  save();
  await new Promise(r => setTimeout(r, 600));
  await ui.unfade();
  ui.banner(`${WEEKDAYS[(state.day - 1) % 7]} · Hari ${state.day}`, state.weather === 'hujan' ? 'Hujan rintik. Kebun tersiram dengan sendirinya.' : 'Cerah dan tenang.');
}

async function askSleep() {
  const early = state.minutes < 1080;
  const pick = await ui.dialog({
    name: 'Rumah',
    text: early ? 'Hari masih terang. Tidur sekarang dan lanjut ke besok pagi?' : 'Hari yang panjang. Tidur sekarang?',
    choices: [{ label: 'Tidur', value: 'yes' }, { label: 'Nanti saja', value: 'no' }],
  });
  if (pick === 'yes') await newDay(false);
}

// --- Actions ------------------------------------------------------------------------

const fwd = new THREE.Vector3();

function facingWater() {
  player.forward(fwd);
  for (const d of [1.4, 2.4, 3.4]) if (groundHeight(player.position.x + fwd.x * d, player.position.z + fwd.z * d) !== null) return false;
  return true;
}

function findAction() {
  if (fishing.active) return fishing.actionInfo();
  const p = player.position;
  let npc = null, best = 2;
  for (const n of npcs.list) {
    const d = Math.hypot(n.pos.x - p.x, n.pos.z - p.z);
    if (d < best) { best = d; npc = n; }
  }
  if (npc) return { label: `Bicara dengan ${npc.def.name}`, run: () => startTalk(npc) };

  player.forward(fwd);
  const plot = farm.plotAt(p.x + fwd.x * .9, p.z + fwd.z * .9) ?? farm.plotAt(p.x, p.z);
  farm.setHighlight(plot);
  if (plot !== null) return farm.actionFor(plot, ui.toast);

  if (Math.hypot(p.x - HOME_DOOR.x, p.z - HOME_DOOR.z) < 1.5) return { label: 'Tidur', run: askSleep };
  if (facingWater()) return { label: 'Mancing', run: () => fishing.start() };
  return null;
}

function doAction() {
  if (!playing || ui.busy) return;
  current = findAction();
  if (!current || current.disabled) return;
  initAudio();
  current.run();
}

async function startTalk(npc) {
  player.target = null;
  player.face(npc.pos.x, npc.pos.z);
  farm.setHighlight(null);
  ui.action(null);
  await talk(npc);
  save();
}

// --- Panels ---------------------------------------------------------------------------

function openBag() {
  if (ui.busy) return;
  ui.panel('Tas', body => {
    const ids = Object.keys(state.inv).filter(id => count(id) > 0);
    body.innerHTML = `<p class="muted">Koin: <b>${state.coins}</b> · ${esc(RODS[state.rod].name)}</p>` + (ids.length
      ? `<div class="grid">${ids.map(id => `<div class="cell"><span class="ic">${ITEMS[id].icon}</span><b>${count(id)}</b><small>${esc(ITEMS[id].name)}</small></div>`).join('')}</div>`
      : '<p class="empty">Tasmu kosong.</p>');
  }, 'i');
}

function openNotes() {
  if (ui.busy) return;
  ui.panel('Catatan', (body, close) => {
    const quests = NPC_DEFS.filter(d => questFor(d) && isQuestActive(d));
    const met = NPC_DEFS.filter(d => state.met[d.id]);
    body.innerHTML = `
      <h3>Permintaan</h3>
      ${quests.length ? quests.map(d => `<div class="row"><span class="ic">📜</span><span class="nm">${esc(d.name)}<small>${esc(needText(questFor(d)))}</small></span>${questMarker(d) ? '<span class="tagok">Siap</span>' : ''}</div>`).join('') : '<p class="empty">Belum ada. Ngobrollah dengan warga desa.</p>'}
      <h3>Warga</h3>
      ${met.length ? met.map(d => `<div class="row"><span class="nm">${esc(d.name)}<small>${esc(d.role)}</small></span><span class="hearts">${'♥'.repeat(hearts(d.id))}${'♡'.repeat(5 - hearts(d.id))}</span></div>`).join('') : '<p class="empty">Kamu belum berkenalan dengan siapa pun.</p>'}
      <h3>Catatan kecil</h3>
      <p class="muted">Ikan ditangkap: ${state.stats.fish} · Hasil panen: ${state.stats.harvest}</p>
      <p class="muted">Tanaman yang disiram tumbuh satu tahap setiap kamu tidur. Saat hujan, kebun tersiram sendiri. Ikan langka lebih sering muncul pagi, malam, atau saat hujan.</p>
      <p class="muted"><kbd>WASD</kbd> jalan · <kbd>E</kbd>/<kbd>Spasi</kbd> aksi · <kbd>1</kbd>–<kbd>3</kbd> pilih benih · <kbd>I</kbd> tas · <kbd>Q</kbd> catatan · <kbd>M</kbd> suara</p>
      <div class="danger"><button class="btn ghost" id="wipe">Hapus simpanan & mulai baru</button></div>`;
    const wipe = body.querySelector('#wipe');
    wipe.onclick = () => {
      if (wipe.dataset.sure) { resetState(); save(); close(); location.reload(); return; }
      wipe.dataset.sure = '1';
      wipe.textContent = 'Yakin? Klik sekali lagi';
    };
  }, 'q');
}

function toggleMute() {
  setMuted(!isMuted());
  $('#btnMute').textContent = isMuted() ? '🔇' : '🔊';
}
$('#btnMute').textContent = isMuted() ? '🔇' : '🔊';

// --- Input ------------------------------------------------------------------------------

const keys = new Set();
const MOVE_KEYS = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

addEventListener('keydown', e => {
  if (!playing || ui.busy) return;
  const k = e.key.toLowerCase();
  if (MOVE_KEYS.includes(k)) { keys.add(k); e.preventDefault(); return; }
  if (k === 'e' || k === ' ') {
    e.preventDefault();
    if (fishing.mode === 'reel') fishing.holding = true;
    else if (!e.repeat) doAction();
    return;
  }
  const seeds = seedSlots();
  if (k >= '1' && k <= '9' && seeds[+k - 1]) state.selectedSeed = seeds[+k - 1].id;
  if (k === 'i') openBag();
  if (k === 'q') openNotes();
  if (k === 'm') toggleMute();
});
addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  keys.delete(k);
  if (k === 'e' || k === ' ') fishing.holding = false;
});
addEventListener('blur', () => { keys.clear(); fishing.holding = false; });

const fishEl = $('#fish');
fishEl.addEventListener('pointerdown', e => { e.preventDefault(); fishing.holding = true; });
for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) fishEl.addEventListener(ev, () => { fishing.holding = false; });

$('#action').addEventListener('click', doAction);
$('#btnBag').onclick = openBag;
$('#btnNotes').onclick = openNotes;
$('#btnMute').onclick = toggleMute;

const camFwd = new THREE.Vector3(), camRight = new THREE.Vector3(), moveDir = new THREE.Vector3();
function keyboardDirection() {
  let f = 0, r = 0;
  if (keys.has('w') || keys.has('arrowup')) f++;
  if (keys.has('s') || keys.has('arrowdown')) f--;
  if (keys.has('d') || keys.has('arrowright')) r++;
  if (keys.has('a') || keys.has('arrowleft')) r--;
  if (!f && !r) return null;
  camera.getWorldDirection(camFwd).setY(0).normalize();
  camRight.set(-camFwd.z, 0, camFwd.x);
  return moveDir.copy(camFwd).multiplyScalar(f).addScaledVector(camRight, r).normalize();
}

// Tap or click (not drag) on the ground walks there; on a villager, walks over and talks.
const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
const waterPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -WATER_Y), waterHit = new THREE.Vector3();
let down = null;
renderer.domElement.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
renderer.domElement.addEventListener('pointerup', e => {
  if (!down || !playing || ui.busy) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), quick = performance.now() - down.t < 400;
  down = null;
  if (moved > 8 || !quick || fishing.mode === 'reel') return;
  initAudio();
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);

  const npcHit = raycaster.intersectObjects(npcs.list.map(n => n.char.root), true)[0];
  if (npcHit) {
    const npc = npcs.list.find(n => { let o = npcHit.object; while (o && o !== n.char.root) o = o.parent; return !!o; });
    fishing.stop();
    player.goTo(npc.pos.x, npc.pos.z, 1.4, () => startTalk(npc));
    return;
  }
  const ground = raycaster.intersectObjects(walkables, false)[0];
  if (ground) {
    fishing.stop();
    const { x, z } = ground.point, plot = farm.plotAt(x, z);
    if (plot !== null) {
      const px = farm.plots[plot].x, pz = farm.plots[plot].z;
      player.goTo(px, pz, 1, () => player.face(px, pz));
    } else player.goTo(x, z);
    return;
  }
  // Tapping the sea turns the player to face it, ready to fish.
  if (!fishing.active && raycaster.ray.intersectPlane(waterPlane, waterHit)) player.face(waterHit.x, waterHit.z);
});

// --- Hotbar, HUD and labels ----------------------------------------------------------------

function seedSlots() {
  return Object.keys(ITEMS).filter(id => ITEMS[id].kind === 'seed' && count(id) > 0).map(id => ({ id, icon: ITEMS[id].icon, name: ITEMS[id].name, count: count(id) }));
}

const tags = npcs.list.map(n => {
  const el = document.createElement('div');
  el.className = 'tag';
  el.innerHTML = `<i></i><b>${esc(n.def.name)}</b>`;
  $('#tags').append(el);
  return el;
});
const bubble = $('#bubble');
const proj = new THREE.Vector3();
function placeLabel(el, x, y, z) {
  proj.set(x, y, z).project(camera);
  const visible = proj.z < 1 && Math.abs(proj.x) < 1.1 && Math.abs(proj.y) < 1.1;
  el.style.display = visible ? '' : 'none';
  if (visible) el.style.transform = `translate(${(proj.x + 1) / 2 * innerWidth}px, ${(1 - proj.y) / 2 * innerHeight}px) translate(-50%, -100%)`;
}

function updateLabels() {
  npcs.list.forEach((n, i) => {
    const el = tags[i], d = Math.hypot(n.pos.x - player.position.x, n.pos.z - player.position.z);
    if (!playing || d > 14 || ui.busy) { el.style.display = 'none'; return; }
    const marker = questMarker(n.def);
    el.firstChild.textContent = marker;
    el.classList.toggle('mark', !!marker);
    placeLabel(el, n.pos.x, n.pos.y + 2 * (n.def.look.scale ?? 1), n.pos.z);
  });
  bubble.textContent = fishing.bubble;
  if (fishing.bubble) placeLabel(bubble, player.position.x, player.position.y + 2.1, player.position.z);
  else bubble.style.display = 'none';
}

function updateHud() {
  if (!state.selectedSeed || count(state.selectedSeed) <= 0) state.selectedSeed = seedSlots()[0]?.id ?? null;
  ui.hud({
    day: `${WEEKDAYS[(state.day - 1) % 7]} · Hari ${state.day}`,
    time: clockText(state.minutes),
    weather: state.weather === 'hujan' ? '🌧️' : state.minutes >= 1140 || state.minutes < 330 ? '🌙' : '☀️',
    coins: `🪙 ${state.coins}`,
  });
  ui.hotbar(seedSlots(), state.selectedSeed, id => { state.selectedSeed = id; sfx.ui(); });
}

// --- Camera follow --------------------------------------------------------------------------

const followDelta = new THREE.Vector3(), focus = new THREE.Vector3();
let intro = null;

function snapCamera() {
  focus.set(player.position.x, player.position.y + 1.1, player.position.z);
  followDelta.subVectors(focus, controls.target);
  controls.target.add(followDelta);
  camera.position.add(followDelta);
}

function followPlayer(dt) {
  focus.set(player.position.x, player.position.y + 1.1, player.position.z);
  if (intro) {
    intro.t = Math.min(1, intro.t + dt / 1.6);
    const k = smooth(0, 1, intro.t);
    controls.target.lerpVectors(intro.fromTarget, focus, k);
    camera.position.lerpVectors(intro.fromCam, intro.toCam.clone().add(focus), k);
    if (intro.t >= 1) intro = null;
    return;
  }
  followDelta.subVectors(focus, controls.target).multiplyScalar(1 - Math.exp(-8 * dt));
  controls.target.add(followDelta);
  camera.position.add(followDelta);
}

// --- Start --------------------------------------------------------------------------------

function begin(fresh) {
  if (fresh) resetState(); else load();
  farm.refreshAll();
  const saved = state.player;
  if (saved && groundHeight(saved.x, saved.z) !== null) player.place(saved.x, saved.z, Math.PI);
  else player.place(SPAWN.x, SPAWN.z, Math.PI);
  playing = true;
  controls.autoRotate = false;
  controls.minDistance = 6;
  controls.maxDistance = 34;
  controls.maxPolarAngle = Math.PI / 2.3;
  intro = { t: 0, fromTarget: controls.target.clone(), fromCam: camera.position.clone(), toCam: new THREE.Vector3(5, 9, 12) };
  $('#title').classList.add('gone');
  $('#hud').hidden = false;
  initAudio();
  ui.banner(`${WEEKDAYS[(state.day - 1) % 7]} · Hari ${state.day}`, fresh ? 'Selamat datang di Minato.' : 'Selamat datang kembali.');
  if (fresh) setTimeout(() => ui.toast('Sapa warga desa. Ikuti tanda ! di atas kepala mereka.', '👋'), 2500);
}

const btnContinue = $('#btnContinue'), btnNew = $('#btnNew');
btnContinue.hidden = !hasSave();
btnContinue.onclick = () => begin(false);
btnNew.onclick = () => {
  if (hasSave() && !btnNew.dataset.sure) { btnNew.dataset.sure = '1'; btnNew.textContent = 'Yakin? Simpanan lama akan ditimpa'; return; }
  begin(true);
};
$('#loading').hidden = true;
$('#titleActions').hidden = false;
window.__minatoReady = true;

let autosave = 0;
addEventListener('pagehide', () => { if (playing) { state.player = { x: player.position.x, z: player.position.z }; save(); } });
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// --- Loop -----------------------------------------------------------------------------------

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;

  if (playing) {
    if (ui.busy) {
      keys.clear();
    } else {
      state.minutes += dt * GAME_MINUTES_PER_SECOND;
      if (state.minutes >= 1440) { state.minutes = 1439; newDay(true); }
      const input = fishing.active ? null : keyboardDirection();
      if (fishing.active && keyboardDirection() && fishing.mode !== 'reel') fishing.stop();
      if (!fishing.active || input) player.update(dt, input);
      else player.update(0, null);
      current = findAction();
      ui.action(current);
      if ((autosave += dt) > 20) {
        autosave = 0;
        state.player = { x: player.position.x, z: player.position.z };
        save();
      }
    }
    npcs.update(dt, player.position);
    fishing.update(dt, t);
    followPlayer(dt);
    updateHud();
  } else {
    npcs.update(dt, { x: 999, z: 999 });
  }

  applyTime(playing ? state.minutes : 600);
  updateRain(dt);
  farm.update(t);
  boat.position.y = -.1 + Math.sin(t * 1.2) * .055;
  boat.rotation.x = Math.sin(t * .9) * .02;
  for (let i = 0; i < ripples.length; i++) ripples[i].position.y = -.53 + Math.sin(t + i) * .015;
  controls.update();
  updateLabels();
  renderer.render(scene, camera);
});

if (new URLSearchParams(location.search).has('debug')) window.__minato = { state, player, npcs, farm, fishing, camera, controls, newDay, begin };
