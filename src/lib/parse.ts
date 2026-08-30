/**
 * Split a typed phrase into individual item names.
 * "milk, eggs and some oat flour" -> ["milk", "eggs", "some oat flour"]
 */
export function parseNames(input: string): string[] {
  return input
    .split(/,|\band\b|\bplus\b|\n|;/i)
    .map((part) => part.trim().replace(/^(some|a|an|the)\s+/i, "").trim())
    .filter((part) => part.length > 0 && part.length <= 60);
}
