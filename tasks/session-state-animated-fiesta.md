# Session State: Animated Fiesta

## Validation Review Mode: auto-proceed
(Human opted in 2026-06-29. Write validation plan into task file, implement + validate
without per-task pause; stop and report on any failure.)

## Current Position
- Phase: 3 (Validation-First Implementation)
- Active task: 4.0 (Grump + joy restoration + Fiesta Meter)
- Completed parent tasks: 1.0 (scaffold), 2.0 (controller), 3.0 (confetti cannon)
- Branch: `ab/f/animated-fiesta`
- Dev server: `npm run dev` on **:5191** (background id bs6p5bonj)

## Environment Gotchas
- Port 5173 is squatted by a stale service worker from another local project ("DomainDriver") that intercepts requests. We use **port 5191** (`strictPort`). If a page shows the wrong app, unregister SWs for the origin.

## Human-Verify Ledger (env-limited checks for Phase 4 human gate)
- [ ] (2.0) Click canvas engages pointer-lock + mouse-look — Pointer Lock API needs real user gesture; confirmed wired in code. Verify with one real click in-browser.

## Human Decisions (expensive to lose)
- Stack: **Vite + Three.js + TypeScript**, plain ES modules.
- Scope: build **all 3 worlds end-to-end** (rougher first, then refine).
- Tone: **absurdist corporate satire** (Grey Auditor vs. Fiesta Director).
- Validation: **smoke + human-verify** — no full test harness. Checks = `make build`/`make check` exit 0 + Chrome-automation load/console-error + behavioral screenshots.
- Audio: non-blocking polish, NOT in acceptance criteria.
- Win: win screen + restart only (no required score/stat).
- Git: human authorized **commit + push** and waived **rule 09 (Git & Publication Boundaries)**. Session state (rule 06) still maintained. One commit per parent task.

## Command Surface (rule 07)
- Canonical: **Makefile** (created in task 1.0).
- `make install` → npm install; `make dev` → vite; `make build` → tsc + vite build; `make check` → tsc --noEmit; `make preview` → vite preview; `make clean`.

## Codebase Learnings
- Greenfield repo: no prior source, Makefile, tests, or CI workflows. No patterns to match — this feature sets them.
- Only `.ai-rules/`, `CLAUDE.md`, `.github/copilot-instructions.md`, `notes.md` (placeholder), `.gitignore` (ignores `.ai-local/`).

## What's Next
1. Implement task 1.0 scaffold; validate build + Chrome load.
2. Proceed through 2.0–8.0 per task file. Reconciliation audit after every 2 parent tasks (post-2.0, post-4.0, post-6.0, post-8.0).
3. Phase-gate audit before handing back / preparing PR.
