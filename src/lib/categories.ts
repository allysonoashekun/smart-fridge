import type { Category } from "./types";

// Aisle order. The list groups by category in this sequence so reading top to
// bottom roughly matches walking the store.
export const CATEGORY_ORDER: Category[] = [
  "produce",
  "bakery",
  "dairy",
  "meat",
  "frozen",
  "pantry",
  "household",
  "other",
];

export const CATEGORY_LABEL: Record<Category, string> = {
  produce: "Produce",
  bakery: "Bakery",
  dairy: "Dairy",
  meat: "Meat & Fish",
  frozen: "Frozen",
  pantry: "Pantry",
  household: "Household",
  other: "Other",
};

const KEYWORDS: Record<Exclude<Category, "other">, string[]> = {
  produce: [
    "apple", "avocado", "banana", "basil", "bean", "berry", "broccoli",
    "cabbage", "carrot", "celery", "cilantro", "cucumber", "garlic", "ginger",
    "grape", "green", "kale", "lemon", "lettuce", "lime", "mango", "mushroom",
    "onion", "orange", "parsley", "pepper", "potato", "salad", "spinach",
    "strawberr", "tomato", "zucchini",
  ],
  bakery: [
    "bagel", "baguette", "bread", "brioche", "bun", "croissant", "muffin",
    "pita", "roll", "sourdough", "tortilla",
  ],
  dairy: [
    "butter", "cheddar", "cheese", "cream", "egg", "feta", "ghee", "kefir",
    "milk", "mozzarella", "parmesan", "yog", "yoghurt", "yogurt",
  ],
  meat: [
    "bacon", "beef", "chicken", "chorizo", "cod", "fish", "ham", "lamb",
    "mince", "pork", "prawn", "salmon", "sausage", "shrimp", "steak", "tofu",
    "tuna", "turkey",
  ],
  frozen: ["frozen", "ice cream", "peas", "pizza"],
  pantry: [
    "baking", "cereal", "chickpea", "chocolate", "coffee", "flour", "honey",
    "jam", "lentil", "mustard", "noodle", "oat", "oil", "pasta", "peanut",
    "rice", "salt", "sauce", "soy", "spice", "stock", "sugar", "tea", "tin",
    "tomato paste", "vinegar",
  ],
  household: [
    "bag", "bin", "bleach", "detergent", "dish", "foil", "napkin", "paper",
    "shampoo", "soap", "sponge", "toilet", "toothpaste", "towel", "wrap",
  ],
};

/**
 * Best-effort category from the item name. Wrong guesses are cheap -- the
 * category only affects which heading the item sits under on the list.
 */
export function guessCategory(name: string): Category {
  const n = name.toLowerCase().trim();

  // Longest keyword wins, so "ice cream" beats "cream" and "tomato paste"
  // beats "tomato".
  let best: { category: Category; length: number } | null = null;

  for (const [category, words] of Object.entries(KEYWORDS)) {
    for (const word of words) {
      if (n.includes(word) && (!best || word.length > best.length)) {
        best = { category: category as Category, length: word.length };
      }
    }
  }

  return best?.category ?? "other";
}
