# 🎉 Animated Fiesta — *The Last Party on Earth*

A first-person, browser-based confetti-cannon game built with **Three.js** + **TypeScript** (Vite).

The **Grey Auditor** has declared joy *fiscally irresponsible* and drained the
color from the universe. You are the last **Fiesta Director**. Armed with a
confetti cannon, blast grumpy objects back to full color, fill the **Fiesta
Meter**, travel through disco-ball **portals** across three escalating worlds —
the Beige Office, the Frozen Conga Cavern, and the Auditor's Rooftop — and
confetti the Grey Auditor himself until he does the worm.

## Controls

- **WASD / Arrows** — move
- **Mouse** — look (click to lock the pointer)
- **Click** — fire confetti
- Fill the **Fiesta Meter** to 100% to open the portal to the next world

## Run it

This project uses a `Makefile` as its command surface:

```bash
make install   # install dependencies
make dev       # start the dev server (http://localhost:5191)
make build     # type-check + production build into dist/
make preview   # serve the production build
make check     # type-check only (tsc --noEmit)
make help      # list all commands
```

Then open the printed local URL in a modern browser (Chrome recommended).

## Project layout

```
index.html            # canvas + UI overlay host
src/
  main.ts             # Game world-manager + render loop + state machine
  player.ts           # first-person controller (pointer-lock, WASD, head-bob)
  confetti.ts         # pooled confetti particle system + cannon
  grump.ts            # grumpy objects that recolor + flip frown→grin
  portal.ts           # disco-ball portal (dormant → active swirl)
  boss.ts             # The Grey Auditor (joy bar, defeat → the worm)
  ui.ts               # HUD: meter, world/objective, boss bar, intro + win screens
  audio.ts            # optional Web Audio blips (non-blocking)
  state.ts            # shared state, palette, helpers
  worlds/             # office.ts, cavern.ts, rooftop.ts + the World interface
tasks/                # PRD, task list, session state (AI development artifacts)
```

Built following the repository's `.ai-rules/` development process.
