export type Category =
  | "produce"
  | "bakery"
  | "dairy"
  | "meat"
  | "frozen"
  | "pantry"
  | "household"
  | "other";

export type Item = {
  id: string;
  name: string;
  category: Category;
  add_count: number;
  last_added_at: string | null;
};

export type ListEntry = {
  id: string;
  item_id: string;
  qty_text: string | null;
  status: "pending" | "bought";
  location: string | null;
  created_at: string;
  bought_at: string | null;
  items: Item;
};

export type Recipe = {
  name: string;
  uses_from_list: string[];
  also_needed: string[];
  time_minutes: number;
  steps: string[];
};
