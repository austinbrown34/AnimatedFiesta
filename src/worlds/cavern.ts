import * as THREE from "three";
import { Grump } from "../grump";
import { Portal } from "../portal";
import { PALETTE } from "../state";
import { box, faceCenter, floor, World, disposeObject } from "./types";

// World 2 — The Frozen Conga Cavern. An underground rave the Auditor paused
// mid-beat. Thaw the dancers and the bass drops again.
export function buildCavern(): World {
  const root = new THREE.Group();
  const SIZE = 50;
  const bounds = 22;

  root.add(floor(SIZE, 0x23232e, 0.95));

  // Cave perimeter (dark rock).
  for (const [x, z, w, d] of [
    [0, -SIZE / 2 + 1, SIZE, 2],
    [0, SIZE / 2 - 1, SIZE, 2],
    [-SIZE / 2 + 1, 0, 2, SIZE],
    [SIZE / 2 - 1, 0, 2, SIZE],
  ] as const) {
    const wall = box(w, 10, d, 0x1a1a24, { rough: 1 });
    wall.position.set(x, 5, z);
    root.add(wall);
  }

  // Stalactites (down) and stalagmites (up).
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x2c2c3a, roughness: 1 });
  for (let i = 0; i < 26; i++) {
    const h = 1.5 + Math.random() * 3;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.6 + Math.random(), h, 7), rockMat);
    const x = (Math.random() - 0.5) * (SIZE - 8);
    const z = (Math.random() - 0.5) * (SIZE - 8);
    if (Math.random() < 0.5) {
      cone.position.set(x, 9 - h / 2, z); // stalactite
      cone.rotation.z = Math.PI;
    } else {
      cone.position.set(x, h / 2, z); // stalagmite
    }
    root.add(cone);
  }

  // Speaker stacks.
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const sp = box(2.4, 2.2, 1.8, 0x111118, { rough: 0.7 });
      sp.position.set(sx * 17, 1.1 + k * 2.3, -12);
      root.add(sp);
      const cone = new THREE.Mesh(
        new THREE.CircleGeometry(0.7, 20),
        new THREE.MeshStandardMaterial({ color: 0x33333f, roughness: 0.6 }),
      );
      cone.position.set(sx * 17, 1.1 + k * 2.3, -11.05);
      root.add(cone);
    }
  }

  // Hanging disco ball.
  const discoBall = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.5, 1),
    new THREE.MeshStandardMaterial({ color: 0xcfd2dd, metalness: 1, roughness: 0.12, flatShading: true }),
  );
  discoBall.position.set(0, 7.5, 0);
  root.add(discoBall);
  const cord = box(0.05, 1.5, 0.05, 0x444450);
  cord.position.set(0, 8.7, 0);
  root.add(cord);

  // --- Grumps: frozen dancers ----------------------------------------------
  const grumps: Grump[] = [];
  const danceColors = [PALETTE.pink, PALETTE.cyan, PALETTE.yellow, PALETTE.lime, PALETTE.purple, PALETTE.orange];
  const count = 10;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const r = 6 + (i % 3) * 3;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const g = new Grump({
      position: new THREE.Vector3(x, 1.1, z),
      color: danceColors[i % danceColors.length],
      shape: "cylinder",
      size: 2.0,
      faceYaw: faceCenter(x, z),
      label: "Frozen dancer",
    });
    grumps.push(g);
    root.add(g.group);
  }

  // Portal.
  const portal = new Portal(PALETTE.purple, PALETTE.pink);
  portal.group.position.set(0, 0, 18);
  root.add(portal.group);

  // Lighting: moody, with two neon point lights.
  const p1 = new THREE.PointLight(0xff3ea5, 0.6, 40);
  p1.position.set(-12, 6, 0);
  const p2 = new THREE.PointLight(0x2ee6e6, 0.6, 40);
  p2.position.set(12, 6, 4);
  root.add(p1, p2);

  let t = 0;
  return {
    name: "The Frozen Conga Cavern",
    objective: "Thaw 10 frozen dancers",
    root,
    grumps,
    portal,
    spawn: new THREE.Vector3(0, 1.7, -18),
    bounds,
    skyGrey: new THREE.Color(0x14141c),
    skyVibrant: new THREE.Color(0x3a1452),
    fogNear: 16,
    fogFar: 55,
    update(dt, fiesta) {
      t += dt;
      // The disco ball wakes up as the party returns.
      discoBall.rotation.y += dt * (0.2 + fiesta * 2.5);
      p1.intensity = 0.6 + fiesta * 1.2 + Math.sin(t * 6) * 0.1 * fiesta;
      p2.intensity = 0.6 + fiesta * 1.2 + Math.cos(t * 6) * 0.1 * fiesta;
    },
    dispose() {
      disposeObject(root);
    },
  };
}
