import * as THREE from "three";

// ---------------------------------------------------------------------------
// Animated Fiesta — bootstrap (task 1.0)
// Proves the Vite + TypeScript + Three.js pipeline is wired end to end with a
// spinning placeholder. Real game systems land in subsequent tasks.
// ---------------------------------------------------------------------------

const app = document.getElementById("app");
if (!app) throw new Error("#app mount point not found");

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c0c0f);

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 0, 4);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const key = new THREE.DirectionalLight(0xffffff, 1.2);
key.position.set(3, 5, 2);
scene.add(key);

// Placeholder: a confetti-colored spinning cube.
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1.4, 1.4, 1.4),
  new THREE.MeshStandardMaterial({ color: 0xff3ea5, roughness: 0.4, metalness: 0.1 }),
);
scene.add(cube);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
function animate() {
  const dt = clock.getDelta();
  cube.rotation.x += dt * 0.8;
  cube.rotation.y += dt * 1.1;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

console.log("[fiesta] bootstrap ok");
