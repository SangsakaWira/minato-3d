import * as THREE from 'three';

// Top surface of the extruded land (bevel included) and the visible water line.
export const GROUND_Y = 1.5;
export const WATER_Y = -0.55;

export const scene = new THREE.Scene();
scene.background = new THREE.Color('#d8e9e5');
scene.fog = new THREE.Fog('#d8e9e5', 60, 130);

export const village = new THREE.Group();
village.name = 'Minato coastal village';
scene.add(village);

// Meshes the player can stand on, and things the player cannot walk through.
export const walkables = [];
export const obstacles = [];

export const mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: .85 });
export const cream = mat('#f2eddb'), wood = mat('#ad8156'), roof = mat('#526b70'), green = mat('#719a65'), stone = mat('#a8afa1');
const plankWood = mat('#c49a6c');
export const glass = new THREE.MeshStandardMaterial({ color: '#9dced0', roughness: .23, metalness: .2, emissive: '#ffc56b', emissiveIntensity: 0 });
export const lanternMat = new THREE.MeshStandardMaterial({ color: '#f6ead0', roughness: .6, emissive: '#ffb85c', emissiveIntensity: 0 });
export const waterMat = new THREE.MeshStandardMaterial({ color: '#67b8bc', roughness: .35, metalness: .1 });

export function mesh(g, m, x, y, z, parent = village) {
  const a = new THREE.Mesh(g, m);
  a.position.set(x, y, z);
  a.castShadow = true;
  a.receiveShadow = true;
  parent.add(a);
  return a;
}
export function box(w, h, d, m, x, y, z, p) { return mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z, p); }

let seed = 42;
export function rand() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }

export const hemi = new THREE.HemisphereLight('#fff5dc', '#7b9a89', 2.5);
scene.add(hemi);
export const sun = new THREE.DirectionalLight('#ffe4b6', 3.2);
sun.position.set(-20, 40, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40 });
sun.shadow.normalBias = .04;
scene.add(sun, sun.target);

// --- Layout -----------------------------------------------------------------

export const FARM = { x: 14.4, z: -14.6, cols: 4, rows: 3, step: 1.4 };
export const HOME_DOOR = { x: -16, z: -2.1 };
export const SPAWN = { x: -13, z: -1.4 };

const HOUSES = [
  { x: -15, z: 3, w: 4, d: 3, h: 2.8, cafe: true },
  { x: -16, z: -4, w: 3.5, d: 3, h: 2.7 },
  { x: -10, z: -9, w: 3, d: 2.8, h: 2.7 },
  { x: -4, z: -13, w: 3.6, d: 3, h: 2.7 },
  { x: 3, z: -14, w: 3.4, d: 2.7, h: 2.7 },
  { x: 9.5, z: -13.6, w: 3.2, d: 3, h: 2.7 },
];
const LANE = [[-17, 14], [-13.2, 8], [-12.2, 1.5], [-11.2, -3.5], [-8.2, -7.4], [-6, -9.6], [-1.6, -11.4]];
const BRANCHES = [[[-11.6, -1.6], [-16, -2.3]], [[-9.4, -6.4], [-10, -7.4]], [[-4.6, -10.3], [-4, -11.3]], [[14.4, -9.2], [15.6, -10.6]]];

// Areas kept free of trees so houses, the farm and the lanes stay reachable.
const reserved = [];
const reserve = (minX, maxX, minZ, maxZ) => reserved.push({ minX, maxX, minZ, maxZ });
for (const h of HOUSES) reserve(h.x - h.w / 2 - .9, h.x + h.w / 2 + .9, h.z - h.d / 2 - .9, h.z + h.d / 2 + (h.cafe ? 3.6 : 1.4));
reserve(FARM.x - 1.3, FARM.x + (FARM.cols - 1) * FARM.step + 1.3, FARM.z - 1.3, FARM.z + (FARM.rows - 1) * FARM.step + 1.6);
reserve(15.5, 20.5, -11, -8.4);
reserve(-14.5, -11.5, -2.6, -.2);

function distToSegment(px, pz, ax, az, bx, bz) {
  const vx = bx - ax, vz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz)));
  return Math.hypot(px - ax - vx * t, pz - az - vz * t);
}
function isClear(x, z, pad = 0) {
  for (const r of reserved) if (x > r.minX - pad && x < r.maxX + pad && z > r.minZ - pad && z < r.maxZ + pad) return false;
  for (const line of [LANE, ...BRANCHES])
    for (let i = 0; i < line.length - 1; i++)
      if (distToSegment(x, z, ...line[i], ...line[i + 1]) < 1.3 + pad) return false;
  return true;
}

// --- Land and water -----------------------------------------------------------

// A compact crescent of land embraces the water; all paths remain on its western bank.
const shape = new THREE.Shape();
shape.moveTo(-22, -19); shape.lineTo(15, -19); shape.quadraticCurveTo(23, -14, 21, -6); shape.lineTo(16, -5);
shape.quadraticCurveTo(9, -17, -1, -11); shape.quadraticCurveTo(-10, -9, -9, 1); shape.quadraticCurveTo(-8, 9, -16, 17);
shape.lineTo(-22, 17); shape.closePath();
const groundGeo = new THREE.ExtrudeGeometry(shape, { depth: 2, bevelEnabled: true, bevelSize: .6, bevelThickness: .5, bevelSegments: 2, steps: 1 });
groundGeo.rotateX(Math.PI / 2);
walkables.push(mesh(groundGeo, mat('#b2c28b'), 0, 1, 0));

const waterGeo = new THREE.PlaneGeometry(105, 105, 1, 1);
waterGeo.rotateX(-Math.PI / 2);
const water = mesh(waterGeo, waterMat, 0, -.65, 0);
water.castShadow = false;

// --- Vegetation ---------------------------------------------------------------

const leafMats = ['#749b63', '#91ad70', '#577f61'].map(mat);
function tree(x, z, s = 1) {
  const leaves = leafMats[Math.floor(rand() * 3)];
  mesh(new THREE.CylinderGeometry(.12 * s, .18 * s, 1.4 * s, 6), wood, x, GROUND_Y + .7 * s, z);
  const crown = mesh(new THREE.IcosahedronGeometry(1.25 * s, 1), leaves, x, GROUND_Y + 2.1 * s, z);
  crown.scale.y = 1.15;
  obstacles.push({ x, z, r: .3 + .25 * s });
}
// Seeded rocks and vegetation make the scene reproducible.
for (let i = 0; i < 95; i++) {
  const x = -21 + rand() * 32, z = -18 + rand() * 5, s = .65 + rand() * 1.1, hill = 1 + rand();
  if (!isClear(x, z, 2)) { rand(); continue; }
  mesh(new THREE.IcosahedronGeometry(3, 1), green, x, -.1, z).scale.set(1, hill, 1);
  tree(x, z, s);
}
for (let i = 0; i < 28; i++) {
  const x = -20 + rand() * 5, z = -12 + rand() * 26, s = .65 + rand() * .65;
  if (isClear(x, z, .4)) tree(x, z, s); else rand();
}

function path(points, width = .9) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], 0, p[1])));
  const m = mesh(new THREE.TubeGeometry(curve, 70, width / 2, 6, false), mat('#dcd7bd'), 0, GROUND_Y + .005, 0);
  m.scale.y = .06;
  m.castShadow = false;
}
path(LANE, 1.4);
for (const b of BRANCHES) path(b, .8);

// --- Buildings ----------------------------------------------------------------

function house({ x, z, w, d, h, cafe }) {
  const g = new THREE.Group();
  g.position.set(x, GROUND_Y, z);
  g.name = cafe ? 'Seaside cafe' : 'Modern house';
  village.add(g);
  box(w, h, d, cream, 0, h / 2, 0, g);
  box(w + .25, .22, d + .28, roof, 0, h + .1, 0, g);
  for (let a = -1; a <= 1; a += 2) {
    box(.7, 1, .05, glass, a * w * .26, h * .57, d / 2 + .03, g);
    box(.8, .08, .14, wood, a * w * .26, h * .57 - .55, d / 2 + .07, g);
  }
  box(.65, 1.8, .08, wood, 0, .9, d / 2 + .05, g);
  obstacles.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
  if (cafe) {
    walkables.push(box(w + 1, .15, 2.7, wood, 0, .08, d / 2 + 1.3, g));
    box(w * .8, h * .7, .08, glass, 0, h * .5, d / 2 + .08, g);
    for (const a of [-1, 1]) {
      mesh(new THREE.CylinderGeometry(.52, .52, .12, 20), cream, a * 1.2, .9, d / 2 + 1.4, g);
      box(.1, .85, .1, wood, a * 1.2, .45, d / 2 + 1.4, g);
      obstacles.push({ x: x + a * 1.2, z: z + d / 2 + 1.4, r: .5 });
    }
  }
}
HOUSES.forEach(house);

// Sato's vegetable stall beside the farm.
function stall(x, z) {
  const g = new THREE.Group();
  g.position.set(x, GROUND_Y, z);
  g.rotation.y = -Math.PI / 2;
  village.add(g);
  box(1.6, .8, .7, wood, 0, .4, 0, g);
  for (const a of [-.75, .75]) box(.08, 1.7, .08, wood, a, .85, -.3, g);
  const awning = [mat('#e07a5f'), cream];
  for (let i = 0; i < 6; i++) box(.3, .08, 1, awning[i % 2], -.75 + i * .3, 1.75, 0, g);
  const veg = [mat('#e2483c'), mat('#f4efe6'), mat('#e85d75')];
  for (let i = 0; i < 9; i++) mesh(new THREE.SphereGeometry(.09, 8, 6), veg[i % 3], -.55 + (i % 5) * .27, .88, -.1 + Math.floor(i / 5) * .2, g);
  obstacles.push({ minX: x - .4, maxX: x + .4, minZ: z - .85, maxZ: z + .85 });
}
stall(19.2, -9.7);

// Stone lanterns glow after sunset.
function lantern(x, z) {
  box(.34, .12, .34, stone, x, GROUND_Y + .06, z);
  mesh(new THREE.CylinderGeometry(.07, .09, .6, 6), stone, x, GROUND_Y + .42, z);
  box(.3, .26, .3, lanternMat, x, GROUND_Y + .85, z);
  mesh(new THREE.ConeGeometry(.3, .22, 4), roof, x, GROUND_Y + 1.09, z).rotation.y = Math.PI / 4;
  obstacles.push({ x, z, r: .25 });
}
[[-15.3, 10], [-10.2, -2.2], [-6.4, -10.9], [13.1, -10.2]].forEach(p => lantern(...p));

// --- Waterfront ---------------------------------------------------------------

const pierA = box(11, .6, 1.6, stone, 15, .9, -4), pierB = box(1.7, .6, 5, stone, 20, .9, -2.3);
walkables.push(pierA, pierB);
for (let x = 10; x < 21; x += 2) {
  mesh(new THREE.CylinderGeometry(.1, .13, .5, 8), roof, x, 1.45, -3.5);
  obstacles.push({ x, z: -3.5, r: .18 });
}

// A plank promenade follows the cove, linking the village to the farm and pier.
const cove = new THREE.QuadraticBezierCurve(new THREE.Vector2(16, -5), new THREE.Vector2(9, -17), new THREE.Vector2(-1, -11));
const postGeo = new THREE.CylinderGeometry(.07, .07, 1.6, 6);
for (let i = 0, n = 28; i < n; i++) {
  const a = cove.getPoint(.1 + .88 * i / n), b = cove.getPoint(.1 + .88 * (i + 1) / n);
  const dx = b.x - a.x, dz = b.y - a.y, len = Math.hypot(dx, dz);
  const mx = (a.x + b.x) / 2, mz = (a.y + b.y) / 2;
  let nx = -dz / len, nz = dx / len;
  if ((6 - mx) * nx + (-6 - mz) * nz < 0) { nx = -nx; nz = -nz; }
  const plank = box(len + .12, .22, 1.6, plankWood, mx + nx * .95, GROUND_Y - .19, mz + nz * .95);
  plank.rotation.y = -Math.atan2(dz, dx);
  walkables.push(plank);
  if (i % 3 === 0) for (const off of [.3, 1.6]) mesh(postGeo, wood, mx + nx * off, .4, mz + nz * off);
}

for (let i = 0; i < 38; i++) {
  const t = i / 37 * Math.PI, x = -1 + 11 * Math.cos(t), z = -1 - 9 * Math.sin(t);
  mesh(new THREE.DodecahedronGeometry(.4 + rand() * .7), stone, x, -.3, z).scale.y = .6;
}

// A small boat, with hull, cabin and mast.
export const boat = new THREE.Group();
boat.name = 'Fishing boat';
boat.position.set(16, -.1, -1.3);
village.add(boat);
mesh(new THREE.SphereGeometry(1, 16, 8), cream, 0, 0, 0, boat).scale.set(2.1, .45, .7);
box(1, .7, .85, cream, .3, .55, 0, boat);
box(.6, .35, .87, glass, .3, .65, 0, boat);
box(.06, 2.8, .06, wood, -.45, 1.5, 0, boat);

const petals = ['#fff2ba', '#eaa59a', '#e0c5e1'].map(mat);
const petalGeo = new THREE.IcosahedronGeometry(.25, 0);
for (let i = 0; i < 28; i++) {
  const x = -17 + rand() * 4, z = -9 + rand() * 20;
  if (isClear(x, z, -.5)) mesh(petalGeo, petals[i % 3], x, GROUND_Y + .1, z);
}

// Fine water lines give an illustrated, rather than photographic, surface.
export const ripples = [];
const rippleMat = mat('#b2e0d8');
for (let i = 0; i < 70; i++) {
  const x = -6 + rand() * 37, z = 3 + rand() * 23;
  const r = box(.2 + rand() * .8, .012, .035, rippleMat, x, -.53, z);
  r.castShadow = false;
  ripples.push(r);
}

const starPos = [];
for (let i = 0; i < 350; i++) {
  const th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI * .45;
  starPos.push(95 * Math.cos(ph) * Math.cos(th), 95 * Math.sin(ph) + 5, 95 * Math.cos(ph) * Math.sin(th));
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
export const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#fff8e7', size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
scene.add(stars);

scene.updateMatrixWorld(true);

// --- Queries ------------------------------------------------------------------

const ray = new THREE.Raycaster();
const DOWN = new THREE.Vector3(0, -1, 0), from = new THREE.Vector3();
ray.far = 20;

// Height of the walkable surface at (x, z), or null over open water.
export function groundHeight(x, z) {
  from.set(x, 12, z);
  ray.set(from, DOWN);
  const hit = ray.intersectObjects(walkables, false)[0];
  return hit && hit.point.y > .9 ? hit.point.y : null;
}

export function blocked(x, z, r = .3) {
  for (const o of obstacles) {
    if (o.r !== undefined) {
      const dx = x - o.x, dz = z - o.z;
      if (dx * dx + dz * dz < (o.r + r) ** 2) return true;
    } else if (x > o.minX - r && x < o.maxX + r && z > o.minZ - r && z < o.maxZ + r) return true;
  }
  return false;
}
