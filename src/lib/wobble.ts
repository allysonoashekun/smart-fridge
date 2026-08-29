// A fixed set of slight tilts, picked deterministically from a string. Used to
// give grocery chips and recipe cards a "hand-placed on paper" look.
//
// This must NOT be Math.random() -- these components render on the server
// first and then hydrate on the client, and a value that differs between the
// two passes throws a hydration mismatch error. Hashing the item's own name
// gives the same tilt on both passes, and a different tilt from its neighbors.
const TILTS = [
  "-rotate-2",
  "rotate-1",
  "rotate-2",
  "-rotate-1",
  "rotate-3",
  "-rotate-3",
] as const;

export function wobbleClass(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return TILTS[Math.abs(hash) % TILTS.length];
}
