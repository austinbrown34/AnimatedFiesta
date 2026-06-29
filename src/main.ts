import * as THREE from "three";
import { Player } from "./player";
import { ConfettiSystem } from "./confetti";
import { Grump } from "./grump";
import { UI } from "./ui";
import { CONFETTI_COLORS, GameState, PALETTE } from "./state";

// ---------------------------------------------------------------------------
// Animated Fiesta — main (task 2.0)
// Renderer + scene + first-person Player in a temporary "calibration room".
// World/portal/confetti systems arrive in later tasks.
// ---------------------------------------------------------------------------

const app = document.getElementById("app");
const uiRoot = document.getElementById("ui-root");
if (!app || !uiRoot) throw new Error("mount points not found");

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x14141a);
scene.fog = new THREE.Fog(0x14141a, 20, 70);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  500,
);

scene.add(new THREE.AmbientLight(0xffffff, 0.55));
const key = new THREE.DirectionalLight(0xffffff, 1.1);
key.position.set(8, 14, 6);
scene.add(key);

// --- Temporary calibration room (replaced by real worlds in task 5) --------
const ROOM = 24;
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(ROOM * 2, ROOM * 2),
  new THREE.MeshStandardMaterial({ color: 0x2a2a33, roughness: 0.95 }),
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const grid = new THREE.GridHelper(ROOM * 2, 24, 0x4a4a55, 0x33333d);
scene.add(grid);

// --- Grumps (calibration ring; real worlds populate these in task 5) ------
const shapes = ["box", "sphere", "cone", "cylinder"] as const;
const grumps: Grump[] = [];
for (let i = 0; i < 12; i++) {
  const a = (i / 12) * Math.PI * 2;
  const r = 13;
  const pos = new THREE.Vector3(Math.cos(a) * r, 1.4, Math.sin(a) * r);
  const grump = new Grump({
    position: pos,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    shape: shapes[i % shapes.length],
    size: 1.8,
    faceYaw: Math.atan2(-pos.x, -pos.z), // face the center/player
    label: "Grump",
  });
  grumps.push(grump);
  scene.add(grump.group);
}

// --- Player ----------------------------------------------------------------
const player = new Player(camera, renderer.domElement);
player.spawn(0, 0, ROOM - 1);
player.active = true;

// --- Confetti cannon -------------------------------------------------------
const confetti = new ConfettiSystem();
scene.add(confetti.points);

const ui = new UI(uiRoot);

const _fireDir = new THREE.Vector3();
const _fireOrigin = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
raycaster.far = 60;
const FIESTA_TOTAL = () => grumps.length;
let cheeredCount = 0;

function syncMeter(): void {
  ui.setFiesta(FIESTA_TOTAL() === 0 ? 0 : cheeredCount / FIESTA_TOTAL());
}

function fire(): void {
  camera.getWorldDirection(_fireDir);
  _fireOrigin.copy(camera.position).addScaledVector(_fireDir, 0.6);
  _fireOrigin.y -= 0.25; // muzzle sits a touch below the eyeline
  confetti.burst(_fireOrigin, _fireDir, 220);

  // Raycast from screen center; cheer the nearest un-cheered grump in range.
  raycaster.set(camera.position, _fireDir);
  const bodies = grumps.filter((g) => !g.cheered).map((g) => g.body);
  const hits = raycaster.intersectObjects(bodies, false);
  if (hits.length > 0) {
    const grump = hits[0].object.userData.grump as Grump | undefined;
    if (grump && grump.cheer()) {
      cheeredCount++;
      syncMeter();
      // celebratory pop right at the grump
      confetti.burst(grump.center.clone().setY(grump.center.y + 0.5), new THREE.Vector3(0, 1, 0), 90);
    }
  }
}
renderer.domElement.addEventListener("mousedown", () => {
  if (player.locked) fire();
});
syncMeter();

// Crosshair (a confetti-pink reticle).
const crosshair = document.createElement("div");
crosshair.style.cssText = `
  position:absolute; left:50%; top:50%; width:18px; height:18px;
  transform:translate(-50%,-50%); pointer-events:none;`;
crosshair.innerHTML = `
  <div style="position:absolute; left:50%; top:50%; width:4px; height:4px; transform:translate(-50%,-50%);
       border-radius:50%; background:${cssHex(PALETTE.pink)}; box-shadow:0 0 6px ${cssHex(PALETTE.pink)}"></div>`;
uiRoot.appendChild(crosshair);

// --- Minimal click-to-lock + instruction overlay (full UI in task 7) -------
const instructions = document.createElement("div");
instructions.className = "clickable";
instructions.style.cssText = `
  position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  flex-direction:column; gap:10px; text-align:center; background:rgba(8,8,12,0.55);
  font-size:20px; letter-spacing:0.5px; cursor:pointer;`;
instructions.innerHTML = `
  <div style="font-size:30px; font-weight:bold; color:${cssHex(PALETTE.pink)}">ANIMATED FIESTA</div>
  <div>Click to look around · <b>WASD</b> to move</div>
  <div style="opacity:0.6; font-size:14px">(calibration room — task 2.0)</div>`;
uiRoot.appendChild(instructions);

instructions.addEventListener("click", () => player.lock());
player.controls.addEventListener("lock", () => (instructions.style.display = "none"));
player.controls.addEventListener("unlock", () => (instructions.style.display = "flex"));

function cssHex(n: number): string {
  return "#" + n.toString(16).padStart(6, "0");
}

// --- Resize ----------------------------------------------------------------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Loop ------------------------------------------------------------------
const clock = new THREE.Clock();
function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  player.update(dt);
  confetti.update(dt);
  for (const g of grumps) g.update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// --- Debug hook for automated validation -----------------------------------
(window as unknown as { __fiesta: unknown }).__fiesta = {
  state: GameState.Playing,
  player,
  camera,
  confetti,
  fire,
  grumps,
  get cheered() {
    return cheeredCount;
  },
  get total() {
    return grumps.length;
  },
  // aim the camera at grump i, then fire (test-only)
  aimAndFire(i: number) {
    const g = grumps[i];
    camera.position.set(g.center.x, g.center.y + 4, g.center.z + 6);
    camera.lookAt(g.center);
    fire();
    const mat = g.body.material as THREE.MeshStandardMaterial;
    return { cheered: g.cheered, color: mat.color.getHexString() };
  },
  // step the confetti sim forward without the rAF loop (test-only)
  stepConfetti(seconds: number, dt = 0.05) {
    const steps = Math.ceil(seconds / dt);
    for (let i = 0; i < steps; i++) confetti.update(dt);
    return confetti.activeCount;
  },
  // advance grump animations (color/bounce) without the rAF loop (test-only)
  stepGrumps(seconds: number, dt = 0.05) {
    const steps = Math.ceil(seconds / dt);
    for (let s = 0; s < steps; s++) for (const g of grumps) g.update(dt);
  },
  // step the player N frames with the given keys held (test-only movement)
  testStep(keys: string[], frames = 30, dt = 0.05) {
    player.testMode = true;
    const codeFor: Record<string, string> = { w: "KeyW", a: "KeyA", s: "KeyS", d: "KeyD" };
    for (const k of keys) window.dispatchEvent(new KeyboardEvent("keydown", { code: codeFor[k] ?? k }));
    for (let i = 0; i < frames; i++) player.update(dt);
    for (const k of keys) window.dispatchEvent(new KeyboardEvent("keyup", { code: codeFor[k] ?? k }));
    player.testMode = false;
    return { x: camera.position.x, y: camera.position.y, z: camera.position.z };
  },
};

console.log("[fiesta] main ready");
