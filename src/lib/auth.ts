// Shared between middleware (edge runtime) and route handlers (node), so this
// module must stick to Web Crypto and avoid any node: imports.

export const SESSION_COOKIE = "fridge_session";

// Chrome caps cookie lifetime at 400 days. The whole point is that you unlock a
// phone once and never think about it again, so ask for the maximum.
export const SESSION_MAX_AGE = 400 * 24 * 60 * 60;

/**
 * The cookie value: an HMAC of a fixed string, keyed by the passphrase. Storing
 * this rather than the passphrase itself means a stolen cookie doesn't reveal
 * what you type at /unlock. It's deterministic, so changing APP_PASSPHRASE
 * invalidates every existing session -- that's the logout-everywhere button.
 */
export async function sessionToken(passphrase: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode("fridge-session-v1"),
  );
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * `next` on the unlock screen arrives from the query string, so it's
 * attacker-controllable. Only same-site absolute paths pass -- "//evil.com" and
 * "https://evil.com" are rejected, or the unlock screen becomes an open
 * redirect that sends you off-site with a fresh session.
 */
export function safeNext(next: string | undefined | null): string {
  if (!next) return "/";
  // Reject anything that isn't a plain path, plus backslashes and control
  // characters, which some browsers normalise into "//".
  if (!next.startsWith("/")) return "/";
  if (next.startsWith("//") || next.startsWith("/\\")) return "/";
  if (/[\x00-\x1f\\]/.test(next)) return "/";
  return next;
}

/** Comparison that doesn't leak how much of the value matched. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
