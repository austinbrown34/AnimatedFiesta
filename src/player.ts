import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { clamp } from "./state";

// First-person controller: pointer-lock mouse-look + WASD movement on the
// ground plane, with a subtle "party walk" head-bob and world bounds so the
// player can never leave the floor or fall through it.
export class Player {
  readonly controls: PointerLockControls;

  /** Movement is only integrated while active (set true when a world is live). */
  active = false;
  /** Test hook: allow movement integration without a real pointer-lock gesture. */
  testMode = false;

  /** Half-extent of the square playfield; clamped each frame. */
  bounds = 24;
  eyeHeight = 1.7;

  private readonly keys = new Set<string>();
  private readonly velocity = new THREE.Vector3();
  private readonly direction = new THREE.Vector3();
  private bobTime = 0;

  private readonly accel = 70; // units/s^2 input force
  private readonly damping = 9; // higher = snappier stop
  private readonly maxSpeed = 9; // units/s

  constructor(
    readonly camera: THREE.PerspectiveCamera,
    domElement: HTMLElement,
  ) {
    this.controls = new PointerLockControls(camera, domElement);

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.code);
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  get locked(): boolean {
    return this.controls.isLocked;
  }

  lock(): void {
    this.controls.lock();
  }

  unlock(): void {
    this.controls.unlock();
  }

  /** Place the player at (x,z) at eye height, looking toward the arena center. */
  spawn(x: number, z: number, bounds = this.bounds): void {
    this.bounds = bounds;
    this.camera.position.set(x, this.eyeHeight, z);
    this.camera.lookAt(0, this.eyeHeight, 0);
    this.velocity.set(0, 0, 0);
  }

  private get canMove(): boolean {
    return this.active && (this.locked || this.testMode);
  }

  update(dt: number): void {
    // Exponential damping toward a stop.
    this.velocity.x -= this.velocity.x * this.damping * dt;
    this.velocity.z -= this.velocity.z * this.damping * dt;

    const forward =
      Number(this.keys.has("KeyW") || this.keys.has("ArrowUp")) -
      Number(this.keys.has("KeyS") || this.keys.has("ArrowDown"));
    const right =
      Number(this.keys.has("KeyD") || this.keys.has("ArrowRight")) -
      Number(this.keys.has("KeyA") || this.keys.has("ArrowLeft"));

    let moving = false;
    if (this.canMove && (forward !== 0 || right !== 0)) {
      this.direction.set(right, 0, forward).normalize();
      // PointerLockControls.moveForward uses +Z as backward, so negate below.
      this.velocity.z -= this.direction.z * this.accel * dt;
      this.velocity.x += this.direction.x * this.accel * dt;
      moving = true;
    }

    // Clamp horizontal speed.
    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    if (speed > this.maxSpeed) {
      const s = this.maxSpeed / speed;
      this.velocity.x *= s;
      this.velocity.z *= s;
    }

    if (this.canMove) {
      this.controls.moveRight(this.velocity.x * dt);
      this.controls.moveForward(-this.velocity.z * dt);
    }

    // Keep inside the playfield.
    this.camera.position.x = clamp(this.camera.position.x, -this.bounds, this.bounds);
    this.camera.position.z = clamp(this.camera.position.z, -this.bounds, this.bounds);

    // Head-bob: oscillate eye height while moving, settle when still.
    if (moving) this.bobTime += dt * (6 + speed);
    const bob = moving ? Math.sin(this.bobTime * 1.6) * 0.05 : 0;
    this.camera.position.y = this.eyeHeight + bob;
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.controls.dispose();
  }
}
