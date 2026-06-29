import * as THREE from "three";
import { AUDITOR_GREY, CONFETTI_COLORS, clamp } from "./state";

// The Grey Auditor — the final boss. A dour bureaucrat clutching a clipboard.
// He's immune to joy until the rooftop is cheered; then confetti fills his
// "joy resistance" bar. At 100% his suit goes technicolor, the clipboard drops,
// and he breaks into the worm.
export class Boss {
  readonly group = new THREE.Group();
  readonly body: THREE.Mesh; // primary hit target
  active = false;
  defeated = false;
  joy = 0;
  onDefeated?: () => void;

  private readonly suitMats: THREE.MeshStandardMaterial[] = [];
  private readonly clipboard: THREE.Group;
  private readonly head: THREE.Mesh;
  private readonly mouth: THREE.Mesh;
  private readonly armL: THREE.Group;
  private readonly armR: THREE.Group;
  private readonly grey = new THREE.Color(AUDITOR_GREY);
  private readonly party = new THREE.Color(CONFETTI_COLORS[0]);
  private t = 0;
  private clipDrop = 0;

  constructor(position: THREE.Vector3) {
    const suit = () => {
      const m = new THREE.MeshStandardMaterial({ color: this.grey.clone(), roughness: 0.75, metalness: 0.05 });
      this.suitMats.push(m);
      return m;
    };

    // Torso (the main hittable mass).
    this.body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.6, 1.0), suit());
    this.body.position.y = 2.6;
    this.body.userData.boss = this;
    this.group.add(this.body);

    // Head with stern glasses.
    this.head = new THREE.Mesh(new THREE.SphereGeometry(0.7, 20, 16), suit());
    this.head.position.y = 4.4;
    this.group.add(this.head);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111118 });
    for (const sx of [-1, 1]) {
      const glasses = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 8, 16), eyeMat);
      glasses.position.set(sx * 0.25, 4.45, 0.62);
      this.group.add(glasses);
    }
    // A flat, disapproving mouth that becomes a grin.
    this.mouth = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 16, Math.PI), eyeMat);
    this.mouth.position.set(0, 4.1, 0.62);
    this.mouth.rotation.z = Math.PI; // frown
    this.group.add(this.mouth);

    // Legs.
    for (const sx of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.2, 0.7), suit());
      leg.position.set(sx * 0.45, 1.1, 0);
      this.group.add(leg);
    }

    // Arms (pivoted groups so they can flail).
    this.armL = this.makeArm(suit());
    this.armL.position.set(-1.05, 3.6, 0);
    this.armR = this.makeArm(suit());
    this.armR.position.set(1.05, 3.6, 0);
    this.group.add(this.armL, this.armR);

    // Clipboard held in front.
    this.clipboard = new THREE.Group();
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.2, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.8 }),
    );
    const paper = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 1.0, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 1 }),
    );
    paper.position.z = 0.05;
    this.clipboard.add(board, paper);
    this.clipboard.position.set(0, 3.0, 0.8);
    this.group.add(this.clipboard);

    this.group.position.copy(position);
    this.group.rotation.y = Math.PI; // face the player (who arrives from +z)
    this.group.visible = true;
  }

  private makeArm(mat: THREE.Material): THREE.Group {
    const g = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.4), mat);
    upper.position.y = -0.7;
    g.add(upper);
    return g;
  }

  activate(): void {
    this.active = true;
  }

  /** Land confetti on the Auditor. Returns true if this hit defeats him. */
  hit(amount = 0.06): boolean {
    if (!this.active || this.defeated) return false;
    this.joy = clamp(this.joy + amount, 0, 1);
    if (this.joy >= 1) {
      this.defeated = true;
      this.onDefeated?.();
      return true;
    }
    return false;
  }

  get hitTargets(): THREE.Object3D[] {
    return [this.body, this.head];
  }

  update(dt: number): void {
    this.t += dt;

    // Suit color tracks joy: grey -> cycling technicolor once defeated.
    const c = this.defeated ? this.party.setHSL((this.t * 0.3) % 1, 0.85, 0.6) : this.grey.clone().lerp(new THREE.Color(0xffffff), this.joy * 0.15);
    for (const m of this.suitMats) {
      m.color.copy(c);
      m.emissive.copy(c).multiplyScalar(this.defeated ? 0.4 : 0);
    }

    // Mouth: frown -> grin as joy rises.
    this.mouth.rotation.z = Math.PI * (1 - this.joy);

    if (this.defeated) {
      // Drop the clipboard and bust a move.
      this.clipDrop = Math.min(1, this.clipDrop + dt);
      this.clipboard.position.y = 3.0 - this.clipDrop * 2.8;
      this.clipboard.rotation.z += dt * 6;
      this.clipboard.visible = this.clipDrop < 1;

      const wob = Math.sin(this.t * 8);
      this.armL.rotation.z = 0.6 + wob * 0.8;
      this.armR.rotation.z = -0.6 - wob * 0.8;
      this.group.position.y = Math.abs(Math.sin(this.t * 6)) * 0.5;
      this.group.rotation.y = Math.PI + Math.sin(this.t * 3) * 0.4;
    } else if (this.active) {
      // Nervous shuffle while still resisting.
      this.group.position.y = Math.sin(this.t * 2) * 0.04;
    }
  }
}
