import * as THREE from "three";

// A disco-ball portal. Dormant and grey until the Fiesta Meter hits 100%, then
// it ignites: the ring blazes, a vortex swirls, and a mirror-ball spins above.
export class Portal {
  readonly group = new THREE.Group();
  active = false;
  /** xz entry radius — walk within this of an active portal to travel. */
  readonly radius = 2.2;

  private readonly ring: THREE.Mesh;
  private readonly ringMat: THREE.MeshStandardMaterial;
  private readonly ball: THREE.Mesh;
  private readonly swirlMat: THREE.ShaderMaterial;
  private t = 0;
  private glow = 0; // eased 0 (dormant) -> 1 (active)

  constructor(colA = 0xff3ea5, colB = 0x2ee6e6) {
    // Vortex disc.
    this.swirlMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uGlow: { value: 0 },
        uColA: { value: new THREE.Color(colA) },
        uColB: { value: new THREE.Color(colB) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform float uTime; uniform float uGlow;
        uniform vec3 uColA; uniform vec3 uColB;
        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          float r = length(p);
          if (r > 1.0) discard;
          float a = atan(p.y, p.x);
          float swirl = sin(a * 5.0 + uTime * 3.0 - r * 12.0);
          vec3 col = mix(uColB, uColA, 0.5 + 0.5 * swirl);
          col = mix(vec3(0.16, 0.16, 0.19), col, 0.25 + 0.75 * uGlow);
          float core = smoothstep(1.0, 0.1, r);
          float alpha = core * (0.45 + 0.45 * swirl) * (0.45 + 0.55 * uGlow);
          gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
          #include <colorspace_fragment>
        }`,
    });
    const swirl = new THREE.Mesh(new THREE.CircleGeometry(1.7, 48), this.swirlMat);
    swirl.position.y = 2.0;
    this.group.add(swirl);

    // Ring frame.
    this.ringMat = new THREE.MeshStandardMaterial({
      color: 0x6a6a72,
      emissive: new THREE.Color(colA),
      emissiveIntensity: 0,
      metalness: 0.6,
      roughness: 0.3,
    });
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.16, 16, 48), this.ringMat);
    this.ring.position.y = 2.0;
    this.group.add(this.ring);

    // Mirror ball above the arch.
    this.ball = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.45, 1),
      new THREE.MeshStandardMaterial({ color: 0xcfd2dd, metalness: 1, roughness: 0.15, flatShading: true }),
    );
    this.ball.position.y = 4.3;
    this.group.add(this.ball);

    // Base pad.
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.3, 0.2, 32),
      new THREE.MeshStandardMaterial({ color: 0x3a3a42, roughness: 0.9 }),
    );
    pad.position.y = 0.1;
    this.group.add(pad);
  }

  activate(): void {
    this.active = true;
  }

  /** True when the player (xz) is inside an active portal's entry radius. */
  isPlayerInside(px: number, pz: number): boolean {
    if (!this.active) return false;
    const dx = px - this.group.position.x;
    const dz = pz - this.group.position.z;
    return dx * dx + dz * dz <= this.radius * this.radius;
  }

  update(dt: number): void {
    this.t += dt;
    const goal = this.active ? 1 : 0;
    this.glow += (goal - this.glow) * Math.min(dt * 3, 1);

    this.swirlMat.uniforms.uTime.value = this.t;
    this.swirlMat.uniforms.uGlow.value = this.glow;
    this.ringMat.emissiveIntensity = 1.6 * this.glow;

    if (this.active) {
      this.ring.rotation.z += dt * 1.2;
      this.ball.rotation.y += dt * 2.0;
      this.ball.position.y = 4.3 + Math.sin(this.t * 2) * 0.12;
    }
  }
}
