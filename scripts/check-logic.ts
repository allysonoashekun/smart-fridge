/**
 * Quick sanity checks for the pure logic that shapes what lands in the
 * database. Run with: npx tsx scripts/check-logic.ts
 */
import assert from "node:assert/strict";
import { parseNames } from "../src/lib/parse";
import { safeEqual, safeNext, sessionToken } from "../src/lib/auth";

// --- parseNames -----------------------------------------------------------
assert.deepEqual(parseNames("milk"), ["milk"]);
assert.deepEqual(parseNames("milk, eggs"), ["milk", "eggs"]);
assert.deepEqual(parseNames("milk, eggs and butter"), [
  "milk",
  "eggs",
  "butter",
]);
// Leading articles are noise from dictation.
assert.deepEqual(parseNames("some oat flour and a lemon"), [
  "oat flour",
  "lemon",
]);
assert.deepEqual(parseNames("   "), []);
assert.deepEqual(parseNames("bread\nmilk;jam"), ["bread", "milk", "jam"]);
// "and" inside a word must not split it.
assert.deepEqual(parseNames("sandwich bags"), ["sandwich bags"]);

// --- safeNext (open-redirect guard) --------------------------------------
assert.equal(safeNext("/add?loc=fridge"), "/add?loc=fridge");
assert.equal(safeNext("/"), "/");
// Everything below must collapse to "/" rather than send you off-site.
assert.equal(safeNext("//evil.com"), "/");
assert.equal(safeNext("https://evil.com"), "/");
assert.equal(safeNext("http://evil.com"), "/");
assert.equal(safeNext("/\\evil.com"), "/");
assert.equal(safeNext("/\tevil"), "/");
assert.equal(safeNext("javascript:alert(1)"), "/");
assert.equal(safeNext(undefined), "/");
assert.equal(safeNext(""), "/");

// --- safeEqual ------------------------------------------------------------
assert.equal(safeEqual("abc", "abc"), true);
assert.equal(safeEqual("abc", "abd"), false);
assert.equal(safeEqual("abc", "abcd"), false);
assert.equal(safeEqual("", ""), true);

// --- sessionToken ---------------------------------------------------------
async function checkSessionToken() {
  const token = await sessionToken("hunter2");
  assert.equal(token.length, 64, "HMAC-SHA256 should be 64 hex chars");
  assert.equal(token, await sessionToken("hunter2"), "must be deterministic");
  assert.notEqual(
    token,
    await sessionToken("hunter3"),
    "a changed passphrase must invalidate existing sessions",
  );
  assert.ok(!token.includes("hunter2"), "must not embed the passphrase");
}

void checkSessionToken().then(() => console.log("all logic checks passed"));
