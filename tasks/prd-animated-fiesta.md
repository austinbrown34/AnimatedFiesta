# PRD: Animated Fiesta — "The Last Party on Earth"

## Summary

A first-person, single-player browser game built with Three.js (Vite). The
universe has had its color and joy audited out of existence by **The Grey
Auditor**, a cosmic bureaucrat who declared fun "fiscally irresponsible." The
player is the last **Fiesta Director**, armed with a shoulder-mounted
**Confetti Cannon**. The objective: walk through three escalating, desaturated
worlds, blast grumpy objects with confetti to restore their color and joy, fill
each world's **Fiesta Meter**, and travel through spinning disco-ball **portals**
to the next world — culminating in a rooftop boss showdown against the Auditor
himself. The required ingredients (first-person navigation, portals, confetti)
are the three load-bearing pillars of the core loop.

## Codebase Analysis

### Explored
- `/` (repo root) — greenfield. No `package.json`, no `Makefile`, no `src/`, no build tooling.
- `.ai-rules/` — mandatory AI development rules (workflow, PRD, tasks, validation-first, command surface, git boundaries, phase-gate audits, design rules 30–38).
- `CLAUDE.md` — single line: `@.ai-rules/AGENTS.md` (delegates to rules).
- `.github/copilot-instructions.md` — present; no GitHub Actions CI workflows exist.
- `notes.md` — placeholder (`coming soon...`).
- `.gitignore` — ignores `.ai-local/` (styleguide overlays) only. Will need `node_modules/`, `dist/` added.

### Relevant Patterns
- This is a fresh repo; there are **no existing code patterns to match**. Patterns will be established by this feature.
- Project rules require a **Makefile as the canonical command surface** (rule 07). It does not exist yet and must be created (`make help/install/dev/build/check/clean`).
- Design work (UX, screens, feedback, states) is governed by rules 30–38 and applies here because this is a heavily user-facing experience.

### Constraints Discovered
- **No test infrastructure exists.** No test runner, linter, or type checker. Per rule 05, this is flagged below (see Open Questions / validation approach).
- **No Makefile / command surface exists** — must be created as part of this work (rule 07).
- Validation of a real-time 3D game is partly **manual/browser-based**. Per rule 04, browser-only checks will be marked for human verification; where possible, automated checks (build exit code, dev server boot, headless console-error scan via the Chrome automation tooling) will substitute for "it works" self-assessment.
- Runs **client-side only** — no backend, no database, no network calls. No secrets, no auth.

### Assumptions (need human confirmation)
- **Vite + Three.js** via npm (confirmed by human in pre-PRD Q&A).
- **All three worlds built end-to-end** at rougher fidelity first, then refined (confirmed by human).
- **Absurdist corporate-satire tone** (confirmed by human).
- Target browser is **Chrome** (matches available automation tooling); modern evergreen browsers generally supported, but Chrome is the verification target.
- Desktop keyboard + mouse only (pointer-lock first-person). **No mobile/touch** controls in scope.
- No audio is strictly required for acceptance, but a light Web Audio layer is a desirable polish item (non-blocking).
- **TypeScript** (decided by human in pre-PRD Q&A) with ES modules.

## Background

Nothing exists today — this is the first feature in a greenfield repository. The
repo currently contains only AI development rules, a CLAUDE.md pointer, a GitHub
copilot-instructions file, and placeholder notes. There is no application code,
no build tooling, and no command surface. This PRD establishes the project's
foundation (Vite + Three.js scaffold, Makefile command surface) alongside the
game itself.

## Goals

- Deliver a playable, self-contained browser game runnable via `make dev`.
- Implement the three required mechanics as the core loop: **first-person navigation**, **portals**, and **confetti**.
- Provide a clear, escalating objective: restore color/joy → fill Fiesta Meter → portal to next world → defeat the Auditor.
- Ship **three visually distinct worlds** end-to-end (Beige Office → Frozen Conga Cavern → Auditor's Rooftop).
- Make the experience legible and trustworthy per design rules: visible system status, orientation, feedback on actions, and a clear win state.
- Establish the Makefile command surface and a Vite build that produces deployable static artifacts.

## Non-Goals

- Multiplayer, networking, accounts, persistence/save games, or a backend.
- Mobile / touch / gamepad controls.
- Level editor, procedural generation, or user-generated content.
- Photorealistic assets or imported 3D model pipelines (geometry will be built from Three.js primitives + simple materials/shaders).
- Localization, analytics, monetization.
- A formal automated test suite for gameplay (see validation approach); smoke-level automated checks only.

## Architecture & Approach

**Stack:** Vite (dev server + bundler) + Three.js (`three` npm package, including
addons: `PointerLockControls`, `EffectComposer`/`UnrealBloomPass` for glow) +
**TypeScript** (`tsc --noEmit` as the type-check gate). ES modules.

**New files to be created (indicative — finalized in task breakdown):**
- `package.json`, `vite.config.js`, `index.html` — scaffold + HTML/UI overlay host.
- `Makefile` — canonical command surface (`help`, `install`, `dev`, `build`, `preview`, `check`, `clean`).
- `tsconfig.json` — TypeScript config (strict, bundler module resolution).
- `src/main.ts` — entry point, render loop, top-level game state machine (INTRO → PLAYING → WORLD_TRANSITION → WIN).
- `src/player.ts` — first-person controller (pointer-lock, WASD, look, head-bob, bounds).
- `src/confetti.ts` — confetti particle system + cannon (burst pool, gravity, recycling) and the firing raycast.
- `src/portal.ts` — disco-ball portal object (inactive/active states, swirl shader, proximity-trigger).
- `src/grump.ts` — "grumpy object" abstraction (desaturated → colorful transition, bounce, joy contribution).
- `src/worlds/` — one builder per world (`office.ts`, `cavern.ts`, `rooftop.ts`) plus a shared world interface (`types.ts`).
- `src/boss.ts` — The Grey Auditor (joy bar, win-trigger transformation).
- `src/ui.ts` — HTML/CSS HUD overlay (Fiesta Meter, world name, objective hint, crosshair, intro screen, win screen).
- `src/audio.ts` — optional light Web Audio synth (cheer blips, portal whoosh, bass drop) — non-blocking polish.
- `.gitignore` — add `node_modules/`, `dist/`.

**Data flow / state:**
- A central game state object drives a finite state machine; the render loop dispatches update/render per state.
- Each world is a swappable module exposing `build(scene)`, a set of grumps, a Fiesta-Meter target, and a portal. Switching worlds tears down the prior scene graph and builds the next.
- Firing raycasts from the camera; a hit on an un-cheered grump within range cheers it (color tween + bounce + confetti emit + meter increment). Reaching the meter target activates the world's portal.
- Color restoration ambiance: world background/fog lerps from grey toward vibrant as the Fiesta Meter fills.

**Validation approach (given no test infra):**
- Automated where feasible: `make build` exits 0; dev server boots; a headless/Chrome-automation pass loads the page and asserts **no uncaught console errors** and that key globals/canvas mount.
- Behavioral gameplay checks (movement, firing, color change, portal traversal, win) verified via the Chrome browser-automation tooling with screenshots, and flagged for **human verification** where automation cannot fully assert intent (e.g., "feels fun", visual polish).

## Acceptance Criteria

- [ ] **AC-1 (Build & run):** `make install` then `make dev` serves the game locally; `make build` exits 0 and produces a `dist/` bundle; loading the page shows no uncaught console errors.
- [ ] **AC-2 (First-person navigation):** Clicking the canvas engages pointer-lock; `WASD` translates the camera on the ground plane; mouse moves the view; the player is bounded to the world (cannot leave the floor/fall through it).
- [ ] **AC-3 (Confetti cannon):** A crosshair is visible; clicking fires a burst of ≥150 multi-colored confetti particles that spawn from the view, are affected by gravity, and fade/recycle; firing is repeatable without leaking particles indefinitely.
- [ ] **AC-4 (Color/joy restoration):** Firing while aimed at a *grumpy* (desaturated) object within range visibly recolors it, plays a bounce/pop animation, and increments the Fiesta Meter. An object that is already cheered does not increment the meter again.
- [ ] **AC-5 (Fiesta Meter & portal gating):** The HUD shows a Fiesta Meter that reflects progress (0–100%). The world's portal is visibly **inactive** until the meter reaches 100%, then visibly **activates** (spins/opens). Touching an inactive portal does nothing.
- [ ] **AC-6 (Portals & three worlds):** Walking into an **active** portal transitions to the next world. Three visually distinct worlds exist and are reachable in order: **Beige Office → Frozen Conga Cavern → Auditor's Rooftop**.
- [ ] **AC-7 (Boss finale & win):** Auditor's Rooftop contains the Grey Auditor with a "resistance/joy" bar; confetti-ing him fills it; at 100% a win sequence triggers (confetti celebration + a win screen). The game can be restarted from the win screen back to the intro.
- [ ] **AC-8 (Orientation & tone):** An intro screen states the premise (Grey Auditor drained the world; you are the last Fiesta Director) and the controls (move/look/fire) before play begins. Absurdist corporate-satire copy is present in intro and at least one in-world touch.
- [ ] **AC-9 (System status & feedback — design rules):** At all times during play the HUD shows the current world name and the active objective/hint; the crosshair or a cue gives feedback when aimed at a cheerable grump; the Fiesta Meter and win state make system status visible without guesswork.
- [ ] **AC-10 (Robustness):** A continuous ~2-minute play session in Chrome produces no uncaught console errors and remains interactive (no freeze); resizing the browser window keeps the canvas correctly sized.

## Open Questions (RESOLVED)

1. **Test infrastructure:** RESOLVED — smoke-level automated checks (build exit code, `tsc --noEmit`, Chrome-automation console-error/load assertion) plus human-verified behavioral checks. No full gameplay test harness.
2. **TypeScript vs. plain JS:** RESOLVED — **TypeScript**.
3. **Audio:** RESOLVED — non-blocking polish; not part of acceptance criteria.
4. **Scope of "win":** RESOLVED — win screen + restart is sufficient (no required score/stat).
