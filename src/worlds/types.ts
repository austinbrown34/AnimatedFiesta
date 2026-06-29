import * as THREE from "three";
import { Grump } from "../grump";
import { Portal } from "../portal";

// A self-contained level. The Game manager adds `root` to the scene, applies
// sky/fog, spawns the player, and lerps the ambiance from grey toward vibrant
// as the Fiesta Meter fills.
export interface World {
  readonly name: string;
  readonly objective: string;
  readonly root: THREE.Group;
  readonly grumps: Grump[];
  /** Portal to the next world; null on the final (boss) world. */
  readonly portal: Portal | null;
  readonly spawn: THREE.Vector3;
  readonly bounds: number;
  /** Sky color when drained (fiesta 0) and when fully restored (fiesta 1). */
  readonly skyGrey: THREE.Color;
  readonly skyVibrant: THREE.Color;
  readonly fogNear: number;
  readonly fogFar: number;
  /** Optional ambient animation hook. */
  update?(dt: number, fiesta: number): void;
  dispose(): void;
}

// --- Scenery helpers -------------------------------------------------------

export function box(
  w: number,
  h: number,
  d: number,
  color: number,
  opts: { rough?: number; metal?: number; emissive?: number } = {},
): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({
      color,
      roughness: opts.rough ?? 0.85,
      metalness: opts.metal ?? 0.05,
      emissive: new THREE.Color(opts.emissive ?? 0x000000),
      emissiveIntensity: opts.emissive ? 1 : 0,
    }),
  );
}

export function floor(size: number, color: number, rough = 0.95): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshStandardMaterial({ color, roughness: rough }),
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}

// Recursively free GPU resources for a world's subtree.
export function disposeObject(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else if (mat) mat.dispose();
  });
}

/** Yaw so an object at (x,z) faces toward the origin (where the player tends to be). */
export function faceCenter(x: number, z: number): number {
  return Math.atan2(-x, -z);
}
