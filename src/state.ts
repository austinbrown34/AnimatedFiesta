// Shared game state, types, and the Animated Fiesta color palette.

export enum GameState {
  Intro = "intro",
  Playing = "playing",
  Transition = "transition",
  Win = "win",
}

// The fiesta palette — deliberately loud. Greyed-out worlds lerp toward these.
export const PALETTE = {
  pink: 0xff3ea5,
  cyan: 0x2ee6e6,
  yellow: 0xffd23f,
  lime: 0x6ee86e,
  orange: 0xff8c42,
  purple: 0x9b5de5,
  white: 0xffffff,
} as const;

export const CONFETTI_COLORS: number[] = [
  PALETTE.pink,
  PALETTE.cyan,
  PALETTE.yellow,
  PALETTE.lime,
  PALETTE.orange,
  PALETTE.purple,
];

// The flat, soul-crushing grey the Grey Auditor leaves behind.
export const AUDITOR_GREY = 0x8a8a90;

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
