import * as THREE from "three";
import { AUDITOR_GREY, clamp } from "./state";

export type GrumpShape = "box" | "sphere" | "cone" | "cylinder";

export interface GrumpSpec {
  position: THREE.Vector3;
  /** The joyful color it springs back to when cheered. */
  color: number;
  shape?: GrumpShape;
  size?: number;
  /** Yaw (radians) so the grump's face points toward the player. */
  faceYaw?: number;
  /** Optional label, e.g. "Printer", surfaced for flavor/aim feedback. */
  label?: string;
}

// A grumpy, desaturated object. Hit it with confetti and it springs back to
// full color with a squash-stretch bounce and a frown that flips to a grin.
export class Grump {
  readonly group = new THREE.Group();
  readonly body: THREE.Mesh;
  readonly label: string;
  cheered = false;

  private readonly material: THREE.MeshStandardMaterial;
  private readonly grey = new THREE.Color(AUDITOR_GREY);
  private readonly target: THREE.Color;
  private readonly mouth: THREE.Mesh;
  private readonly baseScale: number;

  private colorT = 0; // 0 grey -> 1 full color
  private bounce = 0; // decays 1 -> 0 after a cheer

  constructor(spec: GrumpSpec) {
    const size = spec.size ?? 1.6;
    this.baseScale = 1;
    this.label = spec.label ?? "Grump";
    this.target = new THREE.Color(spec.color);

    this.material = new THREE.MeshStandardMaterial({
      color: this.grey.clone(),
      roughness: 0.7,
      metalness: 0.05,
      emissive: new THREE.Color(0x000000),
    });

    this.body = new THREE.Mesh(grumpGeometry(spec.shape ?? "box", size), this.material);
    this.body.userData.grump = this;
    this.group.add(this.body);

    // --- Face (eyes + mouth) on the +Z face, then yaw the whole grump ------
    const face = new THREE.Group();
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x16161c });
    const eyeGeo = new THREE.SphereGeometry(size * 0.09, 12, 12);
    const eyeY = size * 0.18;
    const eyeX = size * 0.22;
    const front = size * 0.5 + 0.02;
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(sx * eyeX, eyeY, front);
      face.add(eye);
    }
    // Mouth: a half-torus arc. Starts as a frown; flips to a grin when cheered.
    this.mouth = new THREE.Mesh(
      new THREE.TorusGeometry(size * 0.2, size * 0.045, 8, 16, Math.PI),
      eyeMat,
    );
    this.mouth.position.set(0, -size * 0.2, front);
    this.mouth.rotation.z = Math.PI; // frown (arc opens downward)
    face.add(this.mouth);

    this.group.add(face);
    this.group.position.copy(spec.position);
    this.group.rotation.y = spec.faceYaw ?? 0;
  }

  /** Returns true the first time it's cheered, false if already cheered. */
  cheer(): boolean {
    if (this.cheered) return false;
    this.cheered = true;
    this.bounce = 1;
    return true;
  }

  /** World-space center, for aiming confetti celebrations at it. */
  get center(): THREE.Vector3 {
    return this.group.position;
  }

  update(dt: number): void {
    // Ease color toward target once cheered.
    const goal = this.cheered ? 1 : 0;
    this.colorT += (goal - this.colorT) * clamp(dt * 6, 0, 1);
    this.material.color.copy(this.grey).lerp(this.target, this.colorT);
    this.material.emissive.copy(this.target).multiplyScalar(0.25 * this.colorT);

    // Mouth flips frown (PI) -> grin (0) as it cheers up.
    this.mouth.rotation.z = Math.PI * (1 - this.colorT);
    this.mouth.position.y = (-0.2 + 0.12 * this.colorT) * this.bodySize;

    // Squash-stretch bounce on cheer.
    if (this.bounce > 0) {
      this.bounce = Math.max(0, this.bounce - dt * 1.8);
      const e = this.bounce;
      const wobble = Math.sin(e * Math.PI * 4) * e;
      this.group.scale.set(
        this.baseScale * (1 - wobble * 0.18),
        this.baseScale * (1 + wobble * 0.28),
        this.baseScale * (1 - wobble * 0.18),
      );
    } else {
      this.group.scale.setScalar(this.baseScale);
    }
  }

  private get bodySize(): number {
    return (this.body.geometry.boundingBox?.max.y ?? 0.8) * 2;
  }
}

function grumpGeometry(shape: GrumpShape, size: number): THREE.BufferGeometry {
  let geo: THREE.BufferGeometry;
  switch (shape) {
    case "sphere":
      geo = new THREE.SphereGeometry(size * 0.5, 24, 18);
      break;
    case "cone":
      geo = new THREE.ConeGeometry(size * 0.5, size, 20);
      break;
    case "cylinder":
      geo = new THREE.CylinderGeometry(size * 0.42, size * 0.42, size, 22);
      break;
    default:
      geo = new THREE.BoxGeometry(size, size, size);
  }
  geo.computeBoundingBox();
  return geo;
}
