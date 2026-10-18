import * as THREE from 'three';
import { scene, WATER_Y } from './world.js';
import { FISH, ITEMS, RODS } from './data.js';
import { state, addItem } from './state.js';
import { ui } from './ui.js';
import { sfx } from './audio.js';

const between = (a, b) => a + Math.random() * (b - a);

function pickFish() {
  const night = state.minutes >= 1140 || state.minutes < 330, rain = state.weather === 'hujan', morning = state.minutes < 600;
  const pool = FISH.map(f => ({ f, w: f.weight + (morning ? f.morning ?? 0 : 0) + (night || rain ? f.nightOrRain ?? 0 : 0) }));
  let roll = Math.random() * pool.reduce((s, p) => s + p.w, 0);
  for (const p of pool) if ((roll -= p.w) <= 0) return p.f;
  return pool[0].f;
}

// Modes: idle → cast → wait → bite → reel → idle.
export function createFishing(player) {
  const bobber = new THREE.Group();
  const red = new THREE.Mesh(new THREE.SphereGeometry(.11, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#e05a47' }));
  const white = new THREE.Mesh(new THREE.SphereGeometry(.11, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#fbf7ee' }));
  bobber.add(red, white);
  bobber.visible = false;
  scene.add(bobber);

  const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: '#fdfdf5', transparent: true, opacity: .7 }));
  line.frustumCulled = false;
  line.visible = false;
  scene.add(line);

  const tip = new THREE.Vector3(), castTo = new THREE.Vector3(), fwd = new THREE.Vector3();
  let timer = 0, fish = null, mg = null;

  const f = {
    mode: 'idle',
    holding: false,
    bubble: '',
    get active() { return f.mode !== 'idle'; },

    start() {
      player.forward(fwd);
      castTo.copy(player.position).addScaledVector(fwd, 3.6).setY(WATER_Y);
      f.mode = 'cast';
      timer = 0;
      player.rod.visible = true;
      player.char.fishing = true;
      bobber.visible = line.visible = true;
      sfx.cast();
    },

    stop() {
      f.mode = 'idle';
      f.bubble = '';
      f.holding = false;
      bobber.visible = line.visible = false;
      player.rod.visible = false;
      player.char.fishing = false;
      ui.fish.hide();
    },

    actionInfo() {
      if (f.mode === 'bite') return { label: 'Sentak!', run: f.hook };
      if (f.mode === 'cast' || f.mode === 'wait') return { label: 'Tarik kail', run: f.stop };
      return null;
    },

    hook() {
      f.mode = 'reel';
      f.bubble = '';
      const zone = RODS[state.rod].zone;
      mg = { zone, left: 50 - zone / 2, v: 0, x: 50, target: 50, retarget: 0, progress: .3 };
      ui.fish.show(`${RODS[state.rod].name} · Tahan Spasi / E atau tekan layar untuk menggeser area hijau.`);
    },

    update(dt, t) {
      if (f.mode === 'idle') return;
      player.rodTip.getWorldPosition(tip);

      if (f.mode === 'cast') {
        timer += dt;
        const k = Math.min(1, timer / .55);
        bobber.position.lerpVectors(tip, castTo, k);
        bobber.position.y += Math.sin(k * Math.PI) * 1.5;
        if (k >= 1) {
          f.mode = 'wait';
          timer = between(2.5, 7) * (state.weather === 'hujan' ? .7 : 1);
          sfx.plop();
        }
      } else if (f.mode === 'wait') {
        timer -= dt;
        bobber.position.y = WATER_Y + Math.sin(t * 2) * .03;
        if (timer <= 0) {
          f.mode = 'bite';
          timer = 1.5;
          fish = pickFish();
          f.bubble = '!';
          sfx.bite();
        }
      } else if (f.mode === 'bite') {
        timer -= dt;
        bobber.position.y = WATER_Y - .12 + Math.sin(t * 25) * .05;
        if (timer <= 0) {
          ui.toast('Ikannya lepas… tunggu gigitan berikutnya.', '🎣');
          f.mode = 'wait';
          f.bubble = '';
          timer = between(3, 7);
        }
      } else if (f.mode === 'reel') {
        reel(dt, t);
      }
      lineGeo.attributes.position.setXYZ(0, tip.x, tip.y, tip.z);
      lineGeo.attributes.position.setXYZ(1, bobber.position.x, bobber.position.y + .1, bobber.position.z);
      lineGeo.attributes.position.needsUpdate = true;
    },
  };

  // A gentle take on the classic "keep the fish in the zone" reel.
  function reel(dt, t) {
    const d = fish.diff;
    mg.v += (f.holding ? 170 : -130) * dt;
    mg.v *= 1 - Math.min(1, 1.6 * dt);
    mg.left += mg.v * dt;
    if (mg.left < 0) { mg.left = 0; mg.v *= -.3; }
    if (mg.left > 100 - mg.zone) { mg.left = 100 - mg.zone; mg.v *= -.3; }

    mg.retarget -= dt;
    if (mg.retarget <= 0) {
      mg.target = between(4, 96);
      mg.retarget = (1.7 - d) * between(.6, 1.6);
    }
    mg.x += (mg.target - mg.x) * Math.min(1, dt * (.8 + d * 2.5));

    const inside = mg.x >= mg.left && mg.x <= mg.left + mg.zone;
    mg.progress += (inside ? .32 : -(.12 + d * .12)) * dt;
    bobber.position.y = WATER_Y - .05 + Math.sin(t * 14) * .04;
    ui.fish.render(mg.left, mg.zone, mg.x, Math.max(0, Math.min(1, mg.progress)));

    if (mg.progress >= 1) {
      const item = ITEMS[fish.id];
      addItem(fish.id);
      state.stats.fish++;
      ui.toast(`Dapat ${item.name}!`, item.icon);
      sfx.catch();
      f.stop();
    } else if (mg.progress <= 0) {
      ui.toast('Ikannya berhasil kabur. Tidak apa-apa, laut masih luas.', '🌊');
      sfx.fail();
      f.stop();
    }
  }

  return f;
}
