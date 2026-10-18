import * as THREE from 'three';

// Low-poly villager shared by the player and NPCs. Faces +z by default.
const geo = {
  leg: new THREE.BoxGeometry(.15, .42, .17).translate(0, -.21, 0),
  arm: new THREE.BoxGeometry(.11, .42, .11).translate(0, -.21, 0),
  hand: new THREE.SphereGeometry(.065, 8, 6),
  body: new THREE.CylinderGeometry(.2, .26, .62, 10),
  head: new THREE.SphereGeometry(.2, 14, 12),
  hair: new THREE.SphereGeometry(.215, 14, 10, 0, Math.PI * 2, 0, Math.PI * .55),
  cap: new THREE.SphereGeometry(.225, 14, 8, 0, Math.PI * 2, 0, Math.PI * .42),
  eye: new THREE.SphereGeometry(.025, 6, 6),
  brim: new THREE.CylinderGeometry(.42, .44, .03, 18),
  crown: new THREE.CylinderGeometry(.17, .21, .16, 14),
  band: new THREE.CylinderGeometry(.215, .215, .04, 14),
  bun: new THREE.SphereGeometry(.1, 10, 8),
  tail: new THREE.SphereGeometry(.08, 8, 6),
  apron: new THREE.BoxGeometry(.34, .42, .03),
};
const mats = new Map();
function m(c) {
  if (!mats.has(c)) mats.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: .8 }));
  return mats.get(c);
}

export function makeCharacter({ shirt, pants = '#4a5568', skin = '#f0c8a0', hair = '#3a2b22', hat = null, hatColor = '#e3c77d', apron = null, scale = 1 }) {
  const root = new THREE.Group(), body = new THREE.Group();
  body.scale.setScalar(scale);
  root.add(body);
  const part = (g, c, x, y, z, parent = body) => {
    const p = new THREE.Mesh(g, m(c));
    p.position.set(x, y, z);
    p.castShadow = true;
    parent.add(p);
    return p;
  };
  const limb = (g, c, x, y) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    body.add(pivot);
    part(g, c, 0, 0, 0, pivot);
    return pivot;
  };

  const hip = .44;
  const legL = limb(geo.leg, pants, -.09, hip), legR = limb(geo.leg, pants, .09, hip);
  part(geo.body, shirt, 0, hip + .3, 0);
  if (apron) part(geo.apron, apron, 0, hip + .2, .235);
  const armL = limb(geo.arm, shirt, -.27, hip + .56), armR = limb(geo.arm, shirt, .27, hip + .56);
  part(geo.hand, skin, 0, -.44, 0, armL);
  part(geo.hand, skin, 0, -.44, 0, armR);

  const head = new THREE.Group();
  head.position.set(0, hip + .82, 0);
  body.add(head);
  part(geo.head, skin, 0, 0, 0, head);
  part(geo.hair, hair, 0, .02, -.012, head);
  for (const s of [-1, 1]) part(geo.eye, '#2a2a2a', s * .07, .01, .185, head);
  if (hat === 'straw') {
    part(geo.brim, hatColor, 0, .14, 0, head);
    part(geo.crown, hatColor, 0, .23, 0, head);
    part(geo.band, '#c0574a', 0, .17, 0, head).scale.set(.85, 1, .85);
  } else if (hat === 'cap') {
    part(geo.cap, hatColor, 0, .04, 0, head);
    part(new THREE.BoxGeometry(.22, .02, .16), hatColor, 0, .07, .2, head);
  } else if (hat === 'scarf') {
    part(geo.cap, hatColor, 0, .03, -.01, head);
  } else if (hat === 'bun') {
    part(geo.bun, hair, 0, .12, -.17, head);
  } else if (hat === 'pigtails') {
    for (const s of [-1, 1]) part(geo.tail, hair, s * .2, -.03, -.08, head);
  }

  return {
    root, body, head, legL, legR, armL, armR,
    fishing: false,
    pose(phase, amount) {
      const swing = Math.sin(phase);
      legL.rotation.x = swing * .7 * amount;
      legR.rotation.x = -swing * .7 * amount;
      armL.rotation.x = -swing * .5 * amount;
      armR.rotation.x = this.fishing ? -.9 : swing * .5 * amount;
      body.position.y = Math.abs(swing) * .05 * amount;
    },
  };
}
