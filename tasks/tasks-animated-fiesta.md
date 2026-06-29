# Tasks: Animated Fiesta

> Generated from [PRD: Animated Fiesta](prd-animated-fiesta.md)

## Acceptance Criteria Traceability

| AC    | Criterion (short)                                   | Tasks         |
|-------|-----------------------------------------------------|---------------|
| AC-1  | Build & run (`make dev`/`build`, no console errors) | 1.0           |
| AC-2  | First-person navigation (pointer-lock, WASD, bounds)| 2.0           |
| AC-3  | Confetti cannon (≥150 particles, gravity, recycled) | 3.0           |
| AC-4  | Color/joy restoration (recolor, bounce, +meter)     | 4.0           |
| AC-5  | Fiesta Meter + portal gating (inactive→active@100%) | 4.0, 5.0      |
| AC-6  | Portals + 3 distinct worlds in order                | 5.0           |
| AC-7  | Boss finale + win + restart                         | 6.0           |
| AC-8  | Intro/orientation + satire tone                     | 7.0           |
| AC-9  | System status & feedback (world/objective/aim cue)  | 7.0           |
| AC-10 | Robustness (~2-min no-error session, resize)        | 8.0           |

## Relevant Files

(Greenfield repo — these are new files this feature creates. Confirmed no pre-existing
source, Makefile, or tests by reading the repo root.)

- `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html` — scaffold + UI host
- `Makefile` — canonical command surface (rule 07)
- `.gitignore` — extend with `node_modules/`, `dist/`
- `src/main.ts` — entry, render loop, game state machine
- `src/state.ts` — shared game state + types
- `src/player.ts` — first-person controller
- `src/confetti.ts` — confetti particle system + cannon
- `src/grump.ts` — grumpy-object abstraction
- `src/portal.ts` — disco-ball portal
- `src/worlds/types.ts`, `src/worlds/office.ts`, `src/worlds/cavern.ts`, `src/worlds/rooftop.ts` — world builders
- `src/boss.ts` — Grey Auditor boss
- `src/ui.ts` — HUD/intro/win overlay
- `src/audio.ts` — optional Web Audio polish

### Notes
- No test runner. Validation = `make build` (tsc + vite build) exit 0, `make check` (`tsc --noEmit`) exit 0, and Chrome browser-automation load/console-error + behavioral checks (screenshots). Gameplay "feel" flagged for human verification.
- Run dev: `make dev`. Build: `make build`. Type-check: `make check`.

---

## Tasks

- [x] **1.0 Project scaffold & command surface**                      <- Serves: AC-1
  - [x] 1.1 `package.json` with `three`, `vite`, `typescript`, `@types/three`; scripts dev/build/preview/check
  - [x] 1.2 `vite.config.ts`, `tsconfig.json` (strict), `index.html` with canvas + UI overlay root
  - [x] 1.3 `Makefile` (`help`, `install`, `dev`, `build`, `preview`, `check`, `clean`) + `.gitignore` (`node_modules/`, `dist/`)
  - [x] 1.4 Minimal `src/main.ts` that mounts a Three.js renderer + spinning placeholder so the pipeline is provably wired
  - **Validates when:**
    - `make install` exits 0 (deps installed)
    - `make check` (`tsc --noEmit`) exits 0
    - `make build` exits 0 and produces `dist/index.html` + bundled JS
    - Chrome loads dev/preview URL: canvas present, **no uncaught console errors**

  **Validation Results (1.0):**

  | # | Check | Result | Notes |
  |---|-------|--------|-------|
  | 1 | `make install` exits 0 | PASS | 22 packages, 0 vulnerabilities |
  | 2 | `make check` (`tsc --noEmit`) exits 0 | PASS | exit 0 |
  | 3 | `make build` exits 0 + dist produced | PASS | `dist/index.html` + bundled JS (467 kB) |
  | 4 | Chrome loads, canvas present | PASS | canvas 2560×1323, `#ui-root` present, title correct |
  | 5 | No uncaught **app** console errors | PASS | only error is from an unrelated Chrome extension (`chrome-extension://…/content.js`), not app code |

- [x] **2.0 First-person player controller**                          <- Serves: AC-2
  - [x] 2.1 `src/player.ts`: PointerLockControls, click-to-lock, WASD velocity integration
  - [x] 2.2 Mouse-look via controls; ground-plane movement; head-bob on move
  - [x] 2.3 World bounds clamp + fixed eye height (no fall-through)
  - **Validates when:**
    - `make check` exits 0
    - Chrome: clicking canvas locks pointer (screenshot shows lock / instructions hidden)
    - Pressing W changes camera Z position (verified via injected debug readout / console)
    - Camera Y stays at eye height; X/Z clamped within bounds (no NaN, no escape)

  **Validation Results (2.0):**

  | # | Check | Result | Notes |
  |---|-------|--------|-------|
  | 1 | `make check` exits 0 | PASS | exit 0 |
  | 2 | W moves forward (camera −Z) | PASS | z 0 → −11.2 over held W |
  | 3 | D moves right (camera +X) | PASS | x 0 → +11.2 over held D |
  | 4 | Eye height stays ~1.7 (head-bob) | PASS | y ≈ 1.74 (bob oscillation), settles to 1.7 |
  | 5 | Bounds clamp; no NaN; no escape | PASS | within ±24, all finite |
  | 6 | Instructions overlay renders | PASS | screenshot shows title + controls |
  | 7 | Click engages pointer-lock | **HUMAN-VERIFY** | Pointer Lock API needs a real user gesture; synthetic automation click does not satisfy it. Wiring confirmed in code (click→`lock()`; lock event hides overlay). Needs one real click in-browser. |

- [x] **3.0 Confetti cannon & particle system**                       <- Serves: AC-3
  - [x] 3.1 `src/confetti.ts`: pooled particle system (BufferGeometry positions+colors), gravity, lifetime, recycle
  - [x] 3.2 Crosshair element; mouse-click fires a burst of ≥150 multicolored particles from the view
  - [x] 3.3 Cap pool size; dead particles recycled (no unbounded growth)
  - **Validates when:**
    - `make check` exits 0
    - Chrome: clicking spawns visible confetti (screenshot before/after)
    - Debug readout: active particle count rises on fire, returns toward baseline after lifetimes (no monotonic leak across 10 fires)

  **Validation Results (3.0):**

  | # | Check | Result | Notes |
  |---|-------|--------|-------|
  | 1 | `make check` exits 0 | PASS | exit 0 |
  | 2 | Fire spawns ≥150 particles | PASS | 220 per burst (baseline 0 → 220) |
  | 3 | Multicolored + gravity | PASS | all 6 palette colors; arcs/falls under gravity (screenshot) |
  | 4 | Pool capped, no growth | PASS | 12×220 requested → caps at pool max 2400 (extras dropped) |
  | 5 | Recycles, no leak | PASS | drains to 0 after 5 s sim; pool reusable (220 again) |
  | 6 | No app/shader console errors | PASS | only unrelated Chrome-extension error present |
  | 7 | Crosshair renders | PASS | centered pink reticle visible |

- [x] **4.0 Grump + joy restoration + Fiesta Meter**                   <- Serves: AC-4, AC-5
  - [x] 4.1 `src/grump.ts`: object with desaturated + target color; `cheer()` tweens color, bounce/pop, emits confetti, marks cheered
  - [x] 4.2 Fire raycast from camera; nearest un-cheered grump within range gets cheered on click
  - [x] 4.3 Fiesta Meter state + HUD bar in `src/ui.ts`; increments once per grump (no double-count); reaches 100% when all cheered
  - **Validates when:**
    - `make check` exits 0
    - Chrome: aiming at a grump + firing recolors it + bounces (screenshot before/after)
    - Debug: meter increments on first cheer of a grump, does NOT change on re-firing same grump
    - Meter reaches 100% after cheering all grumps in a test world

  **Validation Results (4.0):**

  | # | Check | Result | Notes |
  |---|-------|--------|-------|
  | 1 | `make check` exits 0 | PASS | exit 0 |
  | 2 | Aim+fire recolors grump | PASS | grey `8a8a90` → `fe40a5` (≈ target pink `ff3ea5`) |
  | 3 | Bounce + face flip | PASS | squash-stretch bounce; frown→grin (screenshot shows colored grumps with faces) |
  | 4 | Meter increments once per grump | PASS | count 0→1 on first cheer |
  | 5 | Re-firing same grump does NOT re-count | PASS | count stays 1 after second fire at same grump |
  | 6 | Meter reaches 100% when all cheered | PASS | 12/12 cheered → fill width 100%, label "100%" |
  | 7 | No app console errors | PASS | only unrelated Chrome-extension error |

- [x] **5.0 Portals & world manager (3 worlds)**                       <- Serves: AC-5, AC-6
  - [x] 5.1 `src/portal.ts`: disco-ball portal, inactive (dim/still) vs active (glowing/spinning) states; activates at meter 100%
  - [x] 5.2 World manager in `src/main.ts`: build/teardown scene graph; proximity check enters active portal → next world
  - [x] 5.3 `src/worlds/office.ts`, `cavern.ts`, `rooftop.ts` (+ `types.ts`): 3 visually distinct worlds with grumps + portal
  - **Validates when:**
    - `make check` exits 0
    - Chrome: portal is visibly inactive until meter 100%, then visibly active (screenshots)
    - Walking into inactive portal does nothing; walking into active portal swaps to next world (screenshots of all 3 worlds, visually distinct)

  **Validation Results (5.0):**

  | # | Check | Result | Notes |
  |---|-------|--------|-------|
  | 1 | `make check` exits 0 | PASS | exit 0 |
  | 2 | Portal inactive until meter 100% | PASS | inactive before complete; `activate()` on 100% → active=true (screenshot shows glowing cyan ring) |
  | 3 | Entry geometry correct | PASS | `portalContains`: inactive-inside=false, active-inside=true, active-outside=false |
  | 4 | Active portal → next world | PASS | Office→Cavern→Rooftop via traversal (worldIndex 0→1→2) |
  | 5 | 3 distinct worlds in order | PASS | Beige Office (9 grumps), Frozen Conga Cavern (10), Auditor's Rooftop (7); screenshots clearly distinct |
  | 6 | Final world has no portal | PASS | rooftop `portal === null` |
  | 7 | No app console errors | PASS | only unrelated Chrome-extension error |

  > Env note: live proximity traversal runs in the rAF loop; the automation tab is `hidden` (rAF throttled), so traversal was driven through the same `enterPortal` code path while the entry geometry was unit-verified separately. The "walk into the portal during normal play" wiring is logged on the human-verify ledger (low risk).

- [x] **6.0 Boss finale & win/restart**                                <- Serves: AC-7
  - [x] 6.1 `src/boss.ts`: Grey Auditor figure with joy/resistance bar that fills as confetti hits him
  - [x] 6.2 At 100% joy: win sequence (confetti celebration) + transition to win screen
  - [x] 6.3 Win screen in `src/ui.ts` with restart → returns to intro/world 1
  - **Validates when:**
    - `make check` exits 0
    - Chrome: firing at Auditor raises his joy bar; at 100% the win screen appears (screenshots)
    - Restart button returns to intro and a new run is playable

  **Validation Results (6.0):**

  | # | Check | Result | Notes |
  |---|-------|--------|-------|
  | 1 | `make check` exits 0 | PASS | exit 0 |
  | 2 | Auditor renders, dormant until rooftop cheered | PASS | `bossActive=false` at load; activates on world-complete (screenshot: grey Auditor + clipboard) |
  | 3 | Confetti hits raise joy bar | PASS | `hit()` raises `joy`; bar fills; reached `joy=1` |
  | 4 | 100% joy → win sequence + screen | PASS | `state="win"`, win screen visible, confetti rain, boss colorizes/dances (screenshot) |
  | 5 | Restart → world 1, playable | PASS | restart button → worldIndex 0 "The Beige Office", `state=playing`, meter reset, win hidden |
  | 6 | No app console errors | PASS | only unrelated Chrome-extension error |

- [ ] **7.0 UX shell & tone**                                          <- Serves: AC-8, AC-9
  - [ ] 7.1 Intro screen: premise (Grey Auditor / last Fiesta Director) + controls; "click to begin"
  - [ ] 7.2 HUD: current world name + active objective/hint always visible during play
  - [ ] 7.3 Aim feedback: crosshair changes/highlights when aimed at a cheerable grump; satire copy in ≥1 in-world touch
  - **Validates when:**
    - `make check` exits 0
    - Chrome: intro screen shows premise + controls before play (screenshot)
    - During play, world name + objective visible (screenshot); crosshair changes state when aimed at a grump vs not (screenshots)

- [ ] **8.0 Robustness & polish**                                      <- Serves: AC-10
  - [ ] 8.1 Window-resize handler keeps canvas/camera aspect correct
  - [ ] 8.2 ~2-minute Chrome session: assert no uncaught console errors, stays interactive
  - [ ] 8.3 Perf pass (instancing/pool caps where needed); optional audio polish (`src/audio.ts`, non-blocking)
  - **Validates when:**
    - `make build` exits 0
    - Chrome: resize window → canvas resizes without distortion (screenshots at 2 sizes)
    - ~2-min session scan: console-error count == 0; page still responds to input at end
