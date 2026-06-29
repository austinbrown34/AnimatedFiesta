import * as THREE from "three";
import { CONFETTI_COLORS } from "./state";

// A pooled confetti particle system rendered as a single THREE.Points.
// Particles are spawned in bursts from the confetti cannon, fall under gravity
// with a little flutter, fade out, and are recycled — the pool never grows.

function makeConfettiTexture(): THREE.Texture {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  // A soft rounded square — reads as a flake of confetti.
  ctx.fillStyle = "#fff";
  const r = 14;
  ctx.beginPath();
  ctx.moveTo(r, 2);
  ctx.arcTo(s - 2, 2, s - 2, s - 2, r);
  ctx.arcTo(s - 2, s - 2, 2, s - 2, r);
  ctx.arcTo(2, s - 2, 2, 2, r);
  ctx.arcTo(2, 2, s - 2, 2, r);
  ctx.closePath();
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

const GRAVITY = 16;
const DRAG = 0.9; // per-second velocity retention factor base

export class ConfettiSystem {
  readonly points: THREE.Points;
  readonly max: number;
  activeCount = 0;

  private readonly position: Float32Array;
  private readonly color: Float32Array;
  private readonly aData: Float32Array; // x = size, y = alpha
  private readonly vel: Float32Array; // vx, vy, vz
  private readonly life: Float32Array;
  private readonly maxLife: Float32Array;
  private readonly phase: Float32Array;
  private readonly free: number[] = [];

  private readonly geometry: THREE.BufferGeometry;
  private readonly tmp = new THREE.Color();
  private readonly dir = new THREE.Vector3();
  private readonly side = new THREE.Vector3();
  private readonly up = new THREE.Vector3(0, 1, 0);

  constructor(max = 2400) {
    this.max = max;
    this.position = new Float32Array(max * 3);
    this.color = new Float32Array(max * 3);
    this.aData = new Float32Array(max * 2);
    this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.phase = new Float32Array(max);

    for (let i = max - 1; i >= 0; i--) {
      this.free.push(i);
      this.position[i * 3 + 1] = -9999; // park unused particles out of view
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.position, 3));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(this.color, 3));
    this.geometry.setAttribute("aData", new THREE.BufferAttribute(this.aData, 2));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: makeConfettiTexture() },
        uScale: { value: window.innerHeight / 2 },
      },
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      vertexShader: /* glsl */ `
        attribute vec2 aData;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uScale;
        void main() {
          vColor = color;
          vAlpha = aData.y;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          // clamp so confetti spawned point-blank doesn't fill the screen
          gl_PointSize = clamp(aData.x * (uScale / -mv.z), 2.0, 64.0);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec4 t = texture2D(uTexture, gl_PointCoord);
          float a = t.a * vAlpha;
          if (a < 0.02) discard;
          gl_FragColor = vec4(vColor, a);
          #include <colorspace_fragment>
        }`,
    });

    this.points = new THREE.Points(this.geometry, material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 2;

    window.addEventListener("resize", () => {
      material.uniforms.uScale.value = window.innerHeight / 2;
    });
  }

  /** Spawn `count` confetti from `origin`, fired in a cone around `direction`. */
  burst(origin: THREE.Vector3, direction: THREE.Vector3, count = 220): void {
    this.dir.copy(direction).normalize();
    this.side.crossVectors(this.dir, this.up).normalize();
    const realUp = this.up.clone().crossVectors(this.side, this.dir).normalize();

    for (let n = 0; n < count; n++) {
      const i = this.free.pop();
      if (i === undefined) break; // pool exhausted — drop extras instead of growing

      // Velocity: forward cone + spread + upward pop.
      const speed = 7 + Math.random() * 9;
      const spread = 0.55;
      const vx =
        this.dir.x * speed +
        this.side.x * (Math.random() - 0.5) * speed * spread +
        realUp.x * (Math.random() - 0.1) * speed * spread;
      const vy =
        this.dir.y * speed +
        this.side.y * (Math.random() - 0.5) * speed * spread +
        realUp.y * (Math.random() - 0.1) * speed * spread +
        4; // pop up
      const vz =
        this.dir.z * speed +
        this.side.z * (Math.random() - 0.5) * speed * spread +
        realUp.z * (Math.random() - 0.1) * speed * spread;

      this.vel[i * 3] = vx;
      this.vel[i * 3 + 1] = vy;
      this.vel[i * 3 + 2] = vz;

      this.position[i * 3] = origin.x + (Math.random() - 0.5) * 0.3;
      this.position[i * 3 + 1] = origin.y + (Math.random() - 0.5) * 0.3;
      this.position[i * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.3;

      this.tmp.setHex(CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0]);
      this.color[i * 3] = this.tmp.r;
      this.color[i * 3 + 1] = this.tmp.g;
      this.color[i * 3 + 2] = this.tmp.b;

      this.aData[i * 2] = 9 + Math.random() * 13; // size
      this.aData[i * 2 + 1] = 1; // alpha

      this.maxLife[i] = 1.6 + Math.random() * 1.8;
      this.life[i] = this.maxLife[i];
      this.phase[i] = Math.random() * Math.PI * 2;
      this.activeCount++;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.aData.needsUpdate = true;
  }

  update(dt: number): void {
    if (this.activeCount === 0) return;
    const drag = Math.pow(DRAG, dt);

    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;

      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        // recycle
        this.position[i * 3 + 1] = -9999;
        this.aData[i * 2 + 1] = 0;
        this.free.push(i);
        this.activeCount--;
        continue;
      }

      // gravity + drag + flutter
      this.vel[i * 3 + 1] -= GRAVITY * dt;
      this.vel[i * 3] *= drag;
      this.vel[i * 3 + 2] *= drag;
      const flutter = Math.sin(this.phase[i] + (this.maxLife[i] - this.life[i]) * 9) * 2.2;

      this.position[i * 3] += (this.vel[i * 3] + flutter) * dt;
      this.position[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.position[i * 3 + 2] += this.vel[i * 3 + 2] * dt;

      // fade over the last 35% of life
      const t = this.life[i] / this.maxLife[i];
      this.aData[i * 2 + 1] = t < 0.35 ? t / 0.35 : 1;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.aData.needsUpdate = true;
  }
}
