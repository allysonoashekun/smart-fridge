/**
 * Quick sanity checks for the pure logic that shapes what lands in the
 * database. Run with: npx tsx scripts/check-logic.ts
 */
import assert from "node:assert/strict";
import { parseNames } from "../src/lib/parse";
import { guessCategory } from "../src/lib/categories";

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

// --- guessCategory --------------------------------------------------------
assert.equal(guessCategory("whole milk"), "dairy");
assert.equal(guessCategory("Sourdough Bread"), "bakery");
assert.equal(guessCategory("chicken thighs"), "meat");
assert.equal(guessCategory("bananas"), "produce");
assert.equal(guessCategory("olive oil"), "pantry");
assert.equal(guessCategory("dish soap"), "household");
assert.equal(guessCategory("wombat"), "other");
// Longest keyword wins, so these don't fall to the wrong aisle.
assert.equal(guessCategory("ice cream"), "frozen");
assert.equal(guessCategory("tomato paste"), "pantry");

console.log("all logic checks passed");
