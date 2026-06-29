import * as THREE from "three";
import { Player } from "./player";
import { GameState, PALETTE } from "./state";

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

// Colored pillars so motion/parallax is obvious.
const pillarColors = [PALETTE.pink, PALETTE.cyan, PALETTE.yellow, PALETTE.lime, PALETTE.orange, PALETTE.purple];
for (let i = 0; i < 12; i++) {
  const a = (i / 12) * Math.PI * 2;
  const r = 14;
  const pillar = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 4, 1.5),
    new THREE.MeshStandardMaterial({ color: pillarColors[i % pillarColors.length], roughness: 0.5 }),
  );
  pillar.position.set(Math.cos(a) * r, 2, Math.sin(a) * r);
  scene.add(pillar);
}

// --- Player ----------------------------------------------------------------
const player = new Player(camera, renderer.domElement);
player.spawn(0, 0, ROOM - 1);
player.active = true;

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
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// --- Debug hook for automated validation -----------------------------------
(window as unknown as { __fiesta: unknown }).__fiesta = {
  state: GameState.Playing,
  player,
  camera,
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
