import * as THREE from "three";
import { Player } from "./player";
import { ConfettiSystem } from "./confetti";
import { Grump } from "./grump";
import { UI } from "./ui";
import { Audio } from "./audio";
import { GameState } from "./state";
import { World } from "./worlds/types";
import { buildOffice } from "./worlds/office";
import { buildCavern } from "./worlds/cavern";
import { buildRooftop } from "./worlds/rooftop";

// ---------------------------------------------------------------------------
// Animated Fiesta — main (task 5.0)
// World manager: loads each world, swaps scene graphs on portal traversal, and
// runs the core loop (move, fire, cheer, fill meter, open portal, travel).
// ---------------------------------------------------------------------------

const WORLD_BUILDERS: Array<() => World> = [buildOffice, buildCavern, buildRooftop];

const app = document.getElementById("app");
const uiRoot = document.getElementById("ui-root");
if (!app || !uiRoot) throw new Error("mount points not found");

class Game {
  readonly scene = new THREE.Scene();
  readonly renderer = new THREE.WebGLRenderer({ antialias: true });
  readonly camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 600);
  readonly player: Player;
  readonly confetti = new ConfettiSystem();
  readonly ui: UI;
  readonly audio = new Audio();

  state = GameState.Playing;
  world!: World;
  index = 0;
  cheered = 0;
  private transitioning = false;

  private readonly raycaster = new THREE.Raycaster();
  private readonly fireDir = new THREE.Vector3();
  private readonly fireOrigin = new THREE.Vector3();
  private readonly aimDir = new THREE.Vector3();
  private readonly clock = new THREE.Clock();
  private readonly skyTmp = new THREE.Color();
  private readonly fadeEl: HTMLElement;
  frames = 0; // advanced each rendered frame (lets tests detect rAF throttling)

  constructor() {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    app!.appendChild(this.renderer.domElement);
    this.scene.fog = new THREE.Fog(0x000000, 20, 60);
    this.raycaster.far = 60;

    // Global fill light; worlds add their own accent lighting.
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sun = new THREE.DirectionalLight(0xffffff, 0.7);
    sun.position.set(6, 14, 8);
    this.scene.add(sun);

    this.player = new Player(this.camera, this.renderer.domElement);
    this.scene.add(this.confetti.points); // persists across world swaps
    this.ui = new UI(uiRoot!);

    // Transition fade overlay.
    this.fadeEl = document.createElement("div");
    this.fadeEl.style.cssText = `position:absolute; inset:0; background:#fff; opacity:0;
      transition:opacity 0.4s ease; pointer-events:none;`;
    uiRoot!.appendChild(this.fadeEl);

    // Click-to-lock and fire (only while actually playing).
    this.renderer.domElement.addEventListener("mousedown", () => {
      if (this.state !== GameState.Playing) return;
      if (this.player.locked) this.fire();
      else this.player.lock();
    });

    window.addEventListener("resize", () => this.onResize());

    this.loadWorld(0);
    this.state = GameState.Intro;
    this.ui.showIntro(() => this.start());
    this.animate();
  }

  start(): void {
    this.ui.hideIntro();
    this.state = GameState.Playing;
    this.player.active = true;
    this.audio.resume();
    this.player.lock();
  }

  get total(): number {
    return this.world.grumps.length;
  }
  get fiesta(): number {
    return this.total === 0 ? 0 : this.cheered / this.total;
  }

  loadWorld(i: number): void {
    if (this.world) {
      this.scene.remove(this.world.root);
      this.world.dispose();
    }
    this.index = i;
    this.world = WORLD_BUILDERS[i]();
    this.scene.add(this.world.root);
    this.cheered = 0;

    this.scene.background = this.world.skyGrey.clone();
    const fog = this.scene.fog as THREE.Fog;
    fog.color.copy(this.world.skyGrey);
    fog.near = this.world.fogNear;
    fog.far = this.world.fogFar;

    this.player.spawn(this.world.spawn.x, this.world.spawn.z, this.world.bounds);
    this.ui.setWorld(this.world.name, this.world.objective);
    this.ui.setFiesta(0);
    this.ui.hideBossBar();
    if (this.world.boss) {
      this.world.boss.onDefeated = () => this.win();
    }
  }

  fire(): void {
    this.camera.getWorldDirection(this.fireDir);
    this.fireOrigin.copy(this.camera.position).addScaledVector(this.fireDir, 0.6);
    this.fireOrigin.y -= 0.25;
    this.confetti.burst(this.fireOrigin, this.fireDir, 200);
    this.audio.fire();

    this.raycaster.set(this.camera.position, this.fireDir);

    // Boss takes priority once active (all grumps are already cheered by then).
    const boss = this.world.boss;
    if (boss && boss.active && !boss.defeated) {
      const bossHits = this.raycaster.intersectObjects(boss.hitTargets, false);
      if (bossHits.length > 0) {
        boss.hit(0.05);
        this.ui.setBossJoy(boss.joy);
        this.confetti.burst(bossHits[0].point.clone(), UP, 70);
        return;
      }
    }

    const bodies = this.world.grumps.filter((g) => !g.cheered).map((g) => g.body);
    const hits = this.raycaster.intersectObjects(bodies, false);
    if (hits.length > 0) {
      const grump = hits[0].object.userData.grump as Grump | undefined;
      if (grump && grump.cheer()) {
        this.cheered++;
        this.ui.setFiesta(this.fiesta);
        this.confetti.burst(grump.center.clone().setY(grump.center.y + 0.6), UP, 90);
        this.audio.cheer();
        if (this.cheered >= this.total) this.onWorldComplete();
      }
    }
  }

  private onWorldComplete(): void {
    if (this.world.portal) {
      this.world.portal.activate();
      this.audio.portal();
      this.ui.setObjective("FIESTA FULL — find the glowing portal! ✨");
    } else if (this.world.boss) {
      this.world.boss.activate();
      this.ui.showBossBar();
      this.ui.setObjective("THE GREY AUDITOR APPROACHES — bury him in confetti! 🎊");
    }
  }

  private win(): void {
    this.state = GameState.Win;
    this.confetti.rain(700);
    this.audio.win();
    this.ui.hideBossBar();
    this.ui.setObjective("VICTORY! 🎉");
    this.player.unlock();
    this.ui.showWin(() => this.restart());
  }

  private restart(): void {
    this.ui.hideWin();
    this.state = GameState.Playing;
    this.loadWorld(0);
  }

  private enterPortal(): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.audio.portal();
    this.confetti.burst(this.camera.position.clone(), UP, 160);
    this.fadeEl.style.opacity = "1";
    window.setTimeout(() => {
      const next = Math.min(this.index + 1, WORLD_BUILDERS.length - 1);
      this.loadWorld(next);
      this.fadeEl.style.opacity = "0";
      this.transitioning = false;
    }, 420);
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /** Public so tests can drive the proximity/traversal logic deterministically. */
  travelThroughPortal(): void {
    this.enterPortal();
  }

  /** Highlight the crosshair when aiming at a cheerable grump or the boss. */
  private updateAim(): void {
    if (this.state !== GameState.Playing) {
      this.ui.setAim(null);
      return;
    }
    this.camera.getWorldDirection(this.aimDir);
    this.raycaster.set(this.camera.position, this.aimDir);

    const boss = this.world.boss;
    if (boss && boss.active && !boss.defeated && this.raycaster.intersectObjects(boss.hitTargets, false).length) {
      this.ui.setAim("The Grey Auditor");
      return;
    }
    const bodies = this.world.grumps.filter((g) => !g.cheered).map((g) => g.body);
    const hit = this.raycaster.intersectObjects(bodies, false);
    if (hit.length) {
      const g = hit[0].object.userData.grump as Grump | undefined;
      this.ui.setAim(g?.label ?? "Grump");
      return;
    }
    this.ui.setAim(null);
  }

  private animate = (): void => {
    this.frames++;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.player.update(dt);
    this.confetti.update(dt);
    for (const g of this.world.grumps) g.update(dt);
    this.world.boss?.update(dt);
    this.world.update?.(dt, this.fiesta);

    this.updateAim();

    // Keep the party raining during the victory screen.
    if (this.state === GameState.Win && this.frames % 40 === 0) this.confetti.rain(160);

    // Ambiance: lerp sky + fog from grey toward vibrant as the meter fills.
    this.skyTmp.copy(this.world.skyGrey).lerp(this.world.skyVibrant, this.fiesta);
    (this.scene.background as THREE.Color).copy(this.skyTmp);
    (this.scene.fog as THREE.Fog).color.copy(this.skyTmp);

    if (this.world.portal) {
      this.world.portal.update(dt);
      if (!this.transitioning && this.world.portal.isPlayerInside(this.camera.position.x, this.camera.position.z)) {
        this.enterPortal();
      }
    }

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  };
}

const UP = new THREE.Vector3(0, 1, 0);

const game = new Game();

// --- Debug hooks for automated validation ----------------------------------
(window as unknown as { __fiesta: unknown }).__fiesta = {
  game,
  get worldIndex() {
    return game.index;
  },
  get worldName() {
    return game.world.name;
  },
  get cheered() {
    return game.cheered;
  },
  get total() {
    return game.total;
  },
  get portalActive() {
    return game.world.portal?.active ?? null;
  },
  // cheer every grump in the current world (test-only)
  completeWorld() {
    for (const g of game.world.grumps) {
      if (!g.cheered && g.cheer()) {
        game.cheered++;
      }
    }
    (game as unknown as { onWorldComplete(): void }).onWorldComplete();
    game.ui.setFiesta(game.fiesta);
    for (let s = 0; s < 12; s++) for (const g of game.world.grumps) g.update(0.05);
    return { name: game.world.name, cheered: game.cheered, total: game.total, portalActive: game.world.portal?.active ?? null };
  },
  get frames() {
    return game.frames;
  },
  get state() {
    return game.state;
  },
  // start the game from the intro without a real pointer-lock gesture (test-only)
  begin() {
    game.state = GameState.Playing;
    game.player.active = true;
    game.ui.hideIntro();
    return game.state;
  },
  // run one aim-feedback pass (rAF is throttled in hidden tabs) (test-only)
  tickAim() {
    (game as unknown as { updateAim(): void }).updateAim();
  },
  get bossActive() {
    return game.world.boss?.active ?? null;
  },
  get bossJoy() {
    return game.world.boss?.joy ?? null;
  },
  // Complete the rooftop, activate the boss, then confetti him to defeat (test-only).
  defeatBoss() {
    (game as unknown as { onWorldComplete(): void }).onWorldComplete();
    const boss = game.world.boss;
    if (!boss) return { error: "no boss in this world" };
    let guard = 0;
    while (!boss.defeated && guard++ < 100) {
      boss.hit(0.05);
      game.ui.setBossJoy(boss.joy);
    }
    return { defeated: boss.defeated, joy: boss.joy, state: game.state };
  },
  // Test the portal entry test geometrically (independent of the rAF loop).
  portalContains(px: number, pz: number) {
    const p = game.world.portal;
    return p ? p.isPlayerInside(px, pz) : null;
  },
  // Drive the real traversal (teleport into portal + trigger transition).
  enterPortal() {
    const p = game.world.portal;
    if (!p) return { error: "no portal in this world" };
    game.camera.position.set(p.group.position.x, 1.7, p.group.position.z);
    game.travelThroughPortal();
    return { teleportedInto: game.world.name };
  },
};

console.log("[fiesta] main ready");
