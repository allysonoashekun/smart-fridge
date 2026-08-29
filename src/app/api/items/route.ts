import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { route } from "@/lib/api";

export const dynamic = "force-dynamic";

// GET /api/items            -> top chip candidates (most added, not on the list)
// GET /api/items?q=mil      -> autocomplete matches
export const GET = route(async (req: Request) => {
  const q = new URL(req.url).searchParams.get("q")?.trim();

  if (q) {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .ilike("name", `%${q}%`)
      .order("add_count", { ascending: false })
      .limit(8);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ items: data });
  }

  const { data, error } = await supabase.rpc("top_items", { p_limit: 12 });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data });
});
