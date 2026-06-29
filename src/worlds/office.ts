import * as THREE from "three";
import { Grump } from "../grump";
import { Portal } from "../portal";
import { PALETTE } from "../state";
import { box, faceCenter, floor, World, disposeObject } from "./types";

// World 1 — The Beige Office. Joy declared fiscally irresponsible; the open-plan
// despair must be confetti'd back to life.
export function buildOffice(): World {
  const root = new THREE.Group();
  const SIZE = 46;
  const bounds = 21;

  root.add(floor(SIZE, 0x9c968a, 0.97)); // sad carpet

  // Fluorescent ceiling.
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(SIZE, SIZE),
    new THREE.MeshStandardMaterial({ color: 0xceccc4, roughness: 1 }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 6;
  root.add(ceiling);
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      const panel = box(4, 0.1, 1.4, 0xf2f0e6, { emissive: 0xb9c4cf });
      (panel.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
      panel.position.set(i * 8, 5.92, j * 8);
      root.add(panel);
    }
  }

  // Cubicle partitions (beige walls).
  const wallMat = { rough: 0.9 } as const;
  for (let i = -2; i <= 2; i++) {
    const w1 = box(0.2, 1.6, 12, 0xb3ab97, wallMat);
    w1.position.set(i * 8, 0.8, -6);
    root.add(w1);
    const w2 = box(8, 1.6, 0.2, 0xb3ab97, wallMat);
    w2.position.set(i * 8 - 4, 0.8, 0);
    root.add(w2);
  }

  // Perimeter walls.
  for (const [x, z, w, d] of [
    [0, -SIZE / 2 + 0.5, SIZE, 1],
    [0, SIZE / 2 - 0.5, SIZE, 1],
    [-SIZE / 2 + 0.5, 0, 1, SIZE],
    [SIZE / 2 - 0.5, 0, 1, SIZE],
  ] as const) {
    const wall = box(w, 6, d, 0xc7c0b0);
    wall.position.set(x, 3, z);
    root.add(wall);
  }

  // --- Grumps: office objects ----------------------------------------------
  const grumps: Grump[] = [];
  const add = (
    x: number,
    z: number,
    color: number,
    shape: "box" | "cylinder" | "cone",
    size: number,
    label: string,
  ) => {
    const g = new Grump({ position: new THREE.Vector3(x, size * 0.5, z), color, shape, size, faceYaw: faceCenter(x, z), label });
    grumps.push(g);
    root.add(g.group);
  };
  add(-12, 8, PALETTE.cyan, "box", 1.6, "Printer (out of toner, naturally)");
  add(-4, 10, PALETTE.lime, "cone", 2.0, "Office fern");
  add(4, 9, PALETTE.yellow, "box", 1.4, "Monitor showing a spreadsheet");
  add(12, 8, PALETTE.cyan, "cylinder", 1.8, "Water cooler");
  add(-10, -2, PALETTE.pink, "box", 1.5, "Ergonomic chair");
  add(0, 3, PALETTE.orange, "box", 1.7, "The 3pm meeting");
  add(10, -2, PALETTE.purple, "box", 1.5, "Filing cabinet");
  add(-6, 14, PALETTE.pink, "cylinder", 1.4, "Stapler of sorrow");
  add(7, 14, PALETTE.lime, "cone", 1.6, "Another fern");

  // Desks under some grumps for flavor.
  for (const g of grumps) {
    if (Math.random() < 0.5) {
      const desk = box(2.6, 0.15, 1.6, 0x6f5a44, { rough: 0.8 });
      desk.position.set(g.center.x, 0.7, g.center.z);
      root.add(desk);
    }
  }

  // Portal at the far wall.
  const portal = new Portal(PALETTE.cyan, PALETTE.lime);
  portal.group.position.set(0, 0, -16);
  root.add(portal.group);

  // Accent light.
  const lamp = new THREE.PointLight(0xfff4e0, 0.4, 60);
  lamp.position.set(0, 5, 0);
  root.add(lamp);

  return {
    name: "The Beige Office",
    objective: "Restore joy to 9 grumpy office objects",
    root,
    grumps,
    portal,
    spawn: new THREE.Vector3(0, 1.7, 16),
    bounds,
    skyGrey: new THREE.Color(0x8d8a82),
    skyVibrant: new THREE.Color(0xffd9a0),
    fogNear: 18,
    fogFar: 60,
    update(_dt, fiesta) {
      lamp.intensity = 0.4 + fiesta * 1.0;
    },
    dispose() {
      disposeObject(root);
    },
  };
}
