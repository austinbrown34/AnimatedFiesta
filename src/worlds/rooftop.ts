import * as THREE from "three";
import { Grump } from "../grump";
import { Boss } from "../boss";
import { PALETTE } from "../state";
import { box, faceCenter, floor, World, disposeObject } from "./types";

// World 3 — The Auditor's Rooftop. The final stage. The boss (The Grey Auditor)
// and the win sequence are wired in task 6; this builds the arena + grumps.
export function buildRooftop(): World {
  const root = new THREE.Group();
  const SIZE = 44;
  const bounds = 20;

  root.add(floor(SIZE, 0x2a2a36, 0.9)); // rooftop deck

  // Parapet around the edge.
  for (const [x, z, w, d] of [
    [0, -SIZE / 2 + 0.5, SIZE, 1],
    [0, SIZE / 2 - 0.5, SIZE, 1],
    [-SIZE / 2 + 0.5, 0, 1, SIZE],
    [SIZE / 2 - 0.5, 0, 1, SIZE],
  ] as const) {
    const wall = box(w, 1.4, d, 0x3c3c48, { rough: 0.9 });
    wall.position.set(x, 0.7, z);
    root.add(wall);
  }

  // City skyline beyond the parapet (boxes with emissive windows).
  for (let i = 0; i < 40; i++) {
    const h = 6 + Math.random() * 28;
    const w = 3 + Math.random() * 5;
    const b = box(w, h, w, 0x12121a, { emissive: 0x223044 });
    (b.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.35 + Math.random() * 0.4;
    const edge = SIZE / 2 + 6 + Math.random() * 30;
    const side = i % 4;
    const along = (Math.random() - 0.5) * 90;
    if (side === 0) b.position.set(along, h / 2 - 4, -edge);
    else if (side === 1) b.position.set(along, h / 2 - 4, edge);
    else if (side === 2) b.position.set(-edge, h / 2 - 4, along);
    else b.position.set(edge, h / 2 - 4, along);
    root.add(b);
  }

  // String lights overhead.
  const bulbColors = [PALETTE.pink, PALETTE.cyan, PALETTE.yellow, PALETTE.lime];
  for (let i = 0; i < 24; i++) {
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 8),
      new THREE.MeshStandardMaterial({
        color: bulbColors[i % bulbColors.length],
        emissive: new THREE.Color(bulbColors[i % bulbColors.length]),
        emissiveIntensity: 0.8,
      }),
    );
    bulb.position.set(-18 + (i / 23) * 36, 5 + Math.sin(i * 0.6) * 0.4, -2);
    root.add(bulb);
  }

  // DJ booth (decor).
  const booth = box(5, 1.4, 2, 0x1c1c26, { rough: 0.7 });
  booth.position.set(0, 0.7, -12);
  root.add(booth);

  // --- Grumps: rooftop clutter ---------------------------------------------
  const grumps: Grump[] = [];
  const add = (x: number, z: number, color: number, shape: "box" | "cylinder" | "cone", size: number, label: string) => {
    const g = new Grump({ position: new THREE.Vector3(x, size * 0.5, z), color, shape, size, faceYaw: faceCenter(x, z), label });
    grumps.push(g);
    root.add(g.group);
  };
  add(-12, 6, PALETTE.cyan, "box", 2.0, "Wheezing A/C unit");
  add(12, 6, PALETTE.orange, "box", 2.0, "Another A/C unit");
  add(-8, -4, PALETTE.lime, "cylinder", 1.6, "Forgotten keg");
  add(8, -4, PALETTE.pink, "cone", 1.8, "Traffic cone (invited itself)");
  add(0, 8, PALETTE.yellow, "cylinder", 1.5, "Lonely pigeon");
  add(-14, -2, PALETTE.purple, "box", 1.4, "HVAC vent");
  add(14, -2, PALETTE.cyan, "box", 1.4, "Satellite dish stand");

  const moon = new THREE.PointLight(0xbfd0ff, 0.5, 120);
  moon.position.set(10, 30, 20);
  root.add(moon);
  root.add(new THREE.HemisphereLight(0x35406b, 0x101018, 0.5));

  // The Grey Auditor stands behind the DJ booth, dormant until the rooftop sings.
  const boss = new Boss(new THREE.Vector3(0, 0, -15));
  root.add(boss.group);

  return {
    name: "The Auditor's Rooftop",
    objective: "Cheer the rooftop, then face The Grey Auditor",
    root,
    grumps,
    portal: null, // final world — victory comes from the boss (task 6)
    boss,
    spawn: new THREE.Vector3(0, 1.7, 15),
    bounds,
    skyGrey: new THREE.Color(0x12121c),
    skyVibrant: new THREE.Color(0x3a1840),
    fogNear: 22,
    fogFar: 80,
    update() {},
    dispose() {
      disposeObject(root);
    },
  };
}
