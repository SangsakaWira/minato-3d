import * as THREE from 'three';
import { scene, groundHeight, blocked } from './world.js';
import { makeCharacter } from './character.js';

const SPEED = 4.2;

export function turnToward(current, target, k) {
  const d = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + d * Math.min(1, k);
}

export function createPlayer() {
  const char = makeCharacter({ shirt: '#f4a261', pants: '#2f4858', hair: '#2b2018', hat: 'straw' });
  scene.add(char.root);

  // Rod rides on the right hand; pointing forward and up while the arm is raised.
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.015, .03, 1.8, 6).translate(0, .9, 0), new THREE.MeshStandardMaterial({ color: '#8a5a32', roughness: .7 }));
  rod.position.set(0, -.44, 0);
  rod.rotation.x = 1.82;
  rod.visible = false;
  char.armR.add(rod);
  const rodTip = new THREE.Object3D();
  rodTip.position.set(0, 1.8, 0);
  rod.add(rodTip);

  const p = {
    char, rod, rodTip,
    position: char.root.position,
    heading: 0,
    target: null,
    walk: 0,
    phase: 0,
    groundY: 1.5,
    extraBlock: () => false,
  };

  p.place = (x, z, heading = 0) => {
    p.groundY = groundHeight(x, z) ?? 1.5;
    p.position.set(x, p.groundY, z);
    p.heading = heading;
    p.target = null;
  };
  p.forward = (out = new THREE.Vector3()) => out.set(Math.sin(p.heading), 0, Math.cos(p.heading));
  p.face = (x, z) => { p.heading = Math.atan2(x - p.position.x, z - p.position.z); };
  p.goTo = (x, z, stop = .15, onArrive = null) => { p.target = { x, z, stop, onArrive }; };

  function tryMove(x, z) {
    const h = groundHeight(x, z);
    if (h === null || blocked(x, z, .28) || p.extraBlock(x, z)) return false;
    p.position.x = x;
    p.position.z = z;
    p.groundY = h;
    return true;
  }

  // `input` is a unit XZ direction from the keyboard, or null to follow a tap target.
  p.update = (dt, input) => {
    let dx = 0, dz = 0;
    if (input) {
      dx = input.x; dz = input.z;
      p.target = null;
    } else if (p.target) {
      const tx = p.target.x - p.position.x, tz = p.target.z - p.position.z, d = Math.hypot(tx, tz);
      if (d <= p.target.stop) {
        const t = p.target;
        p.target = null;
        t.onArrive?.();
      } else { dx = tx / d; dz = tz / d; }
    }
    const moving = dx !== 0 || dz !== 0;
    if (moving) {
      const step = SPEED * dt, x = p.position.x, z = p.position.z;
      const moved = tryMove(x + dx * step, z + dz * step) || tryMove(x + dx * step, z) || tryMove(x, z + dz * step);
      if (!moved && p.target) p.target = null;
      p.heading = turnToward(p.heading, Math.atan2(dx, dz), dt * 12);
    }
    p.position.y += (p.groundY - p.position.y) * Math.min(1, dt * 14);
    p.walk += ((moving ? 1 : 0) - p.walk) * Math.min(1, dt * 10);
    p.phase += dt * 11 * p.walk;
    char.root.rotation.y = p.heading;
    char.pose(p.phase, p.walk);
  };

  return p;
}
