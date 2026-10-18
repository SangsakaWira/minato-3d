import * as THREE from 'three';
import { FARM, GROUND_Y, village, mat } from './world.js';
import { CROPS, ITEMS } from './data.js';
import { state, addItem, removeItem, count } from './state.js';
import { sfx } from './audio.js';

const soilMats = {
  wild: new THREE.MeshStandardMaterial({ color: '#c3ca90', roughness: 1 }),
  tilled: mat('#9a7350'),
  wet: mat('#6b4e36'),
};
const G = {
  soil: new THREE.BoxGeometry(1.25, .08, 1.25),
  mound: new THREE.SphereGeometry(.14, 8, 5),
  leaf: new THREE.SphereGeometry(.09, 6, 4),
  bush: new THREE.IcosahedronGeometry(.28, 1),
  stake: new THREE.CylinderGeometry(.025, .025, .8, 5),
  fruit: new THREE.SphereGeometry(.075, 8, 6),
  berry: new THREE.ConeGeometry(.055, .12, 7),
  root: new THREE.SphereGeometry(.14, 10, 8),
};
const M = {
  dirt: mat('#7d5a3c'),
  leaf: mat('#5f9a4a'),
  leafLight: mat('#86b35d'),
  stake: mat('#ad8156'),
  tomato: mat('#e2483c'),
  berry: mat('#e3344e'),
  radish: mat('#f6f1e7'),
};

function part(group, g, m, x, y, z, s = 1) {
  const p = new THREE.Mesh(g, m);
  p.position.set(x, y, z);
  p.scale.setScalar(s);
  p.castShadow = true;
  group.add(p);
  return p;
}

function buildCrop(group, plot) {
  group.clear();
  if (!plot.crop) return;
  const { days } = CROPS[plot.crop];
  const ripe = plot.stage >= days;
  if (plot.stage === 0) {
    part(group, G.mound, M.dirt, 0, 0, 0).scale.set(1, .35, 1);
    return;
  }
  const size = ripe ? 1 : .4 + .5 * plot.stage / days;
  const leaves = ripe ? 7 : plot.stage === 1 ? 2 : 4;
  for (let k = 0; k < leaves; k++) {
    const a = k / leaves * Math.PI * 2;
    const leaf = part(group, G.leaf, k % 2 ? M.leaf : M.leafLight, Math.cos(a) * .07 * size, .13 * size, Math.sin(a) * .07 * size);
    leaf.scale.set(.6 * size, 1.6 * size, 1.1 * size);
    leaf.rotation.set(Math.sin(a) * .7, 0, -Math.cos(a) * .7);
  }
  if (plot.crop === 'tomat' && plot.stage >= 2) {
    part(group, G.stake, M.stake, .12, .4, -.12);
    part(group, G.bush, M.leaf, 0, .42 * size, 0, size);
  }
  if (!ripe) return;
  if (plot.crop === 'lobak') {
    part(group, G.root, M.radish, 0, .02, 0).scale.set(1, 1.25, 1);
  } else if (plot.crop === 'tomat') {
    for (let k = 0; k < 5; k++) {
      const a = k * 1.3;
      part(group, G.fruit, M.tomato, Math.cos(a) * .24, .3 + (k % 3) * .1, Math.sin(a) * .24);
    }
  } else {
    for (let k = 0; k < 5; k++) {
      const a = k * 1.25 + .3;
      part(group, G.berry, M.berry, Math.cos(a) * .2, .08, Math.sin(a) * .2).rotation.x = Math.PI;
    }
  }
}

export function createFarm() {
  const plots = [];
  for (let r = 0; r < FARM.rows; r++) {
    for (let c = 0; c < FARM.cols; c++) {
      const x = FARM.x + c * FARM.step, z = FARM.z + r * FARM.step;
      const soil = new THREE.Mesh(G.soil, soilMats.wild);
      soil.position.set(x, GROUND_Y + .02, z);
      soil.receiveShadow = true;
      const crop = new THREE.Group();
      crop.position.set(x, GROUND_Y + .06, z);
      village.add(soil, crop);
      plots.push({ x, z, soil, crop });
    }
  }

  const highlight = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.32, .14, 1.32)), new THREE.LineBasicMaterial({ color: '#fffaf0' }));
  highlight.visible = false;
  village.add(highlight);

  function refresh(i) {
    const s = state.plots[i], p = plots[i];
    p.soil.material = !s.tilled ? soilMats.wild : s.watered ? soilMats.wet : soilMats.tilled;
    buildCrop(p.crop, s);
  }
  const refreshAll = () => plots.forEach((_, i) => refresh(i));

  function plotAt(x, z) {
    const c = Math.round((x - FARM.x) / FARM.step), r = Math.round((z - FARM.z) / FARM.step);
    if (c < 0 || r < 0 || c >= FARM.cols || r >= FARM.rows) return null;
    const i = r * FARM.cols + c;
    return Math.abs(x - plots[i].x) < .7 && Math.abs(z - plots[i].z) < .7 ? i : null;
  }

  function setHighlight(i) {
    highlight.visible = i !== null;
    if (i !== null) highlight.position.set(plots[i].x, GROUND_Y + .06, plots[i].z);
  }

  // What the action button does for plot i. `notify(text, icon)` reports results.
  function actionFor(i, notify) {
    const s = state.plots[i];
    const done = fn => () => { fn(); refresh(i); };
    if (!s.tilled) return { label: 'Cangkul tanah', run: done(() => { s.tilled = true; sfx.till(); }) };
    if (!s.crop) {
      const seed = state.selectedSeed;
      if (!seed || count(seed) <= 0) return { label: 'Butuh benih', disabled: true };
      const crop = ITEMS[seed].crop;
      return {
        label: `Tanam ${ITEMS[crop].name}`,
        run: done(() => {
          removeItem(seed);
          Object.assign(s, { crop, stage: 0 });
          sfx.plant();
        }),
      };
    }
    const def = CROPS[s.crop], item = ITEMS[s.crop];
    if (s.stage >= def.days) {
      return {
        label: `Panen ${item.name}`,
        run: done(() => {
          addItem(s.crop, def.yield);
          state.stats.harvest += def.yield;
          notify(`Panen ${def.yield}× ${item.name}!`, item.icon);
          Object.assign(s, { crop: null, stage: 0 });
          sfx.harvest();
        }),
      };
    }
    if (!s.watered) return { label: 'Siram', run: done(() => { s.watered = true; sfx.water(); }) };
    const left = def.days - s.stage;
    return { label: `Tumbuh… ${left} hari lagi`, disabled: true };
  }

  // Called once per new day, before weather is applied.
  function grow(rain) {
    for (const s of state.plots) {
      if (s.crop && s.watered && s.stage < CROPS[s.crop].days) s.stage++;
      s.watered = rain && s.tilled;
    }
    refreshAll();
  }

  function update(t) {
    plots.forEach((p, i) => { p.crop.rotation.z = Math.sin(t * 1.3 + i) * .04; });
  }

  return { plots, refresh, refreshAll, plotAt, setHighlight, actionFor, grow, update };
}
