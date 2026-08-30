import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { parseNames } from "@/lib/parse";
import { route } from "@/lib/api";

export const dynamic = "force-dynamic";

// GET /api/entries?status=pending
export const GET = route(async (req: Request) => {
  const status = new URL(req.url).searchParams.get("status") ?? "pending";

  const { data, error } = await supabase
    .from("list_entries")
    .select("*, items(*)")
    .eq("status", status)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ entries: data });
});

// POST /api/entries  { name | names, qty?, location? }
export const POST = route(async (req: Request) => {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, names, qty, location } = body as {
    name?: string;
    names?: string[];
    qty?: string;
    location?: string;
  };

  // A single `name` still goes through parseNames so typing "milk, eggs" into
  // the box behaves the same as saying it.
  const requested = Array.isArray(names)
    ? names.flatMap((n) => parseNames(String(n)))
    : parseNames(String(name ?? ""));

  if (requested.length === 0) {
    return NextResponse.json({ error: "No item names given" }, { status: 400 });
  }

  const added = [];
  for (const itemName of requested) {
    const { data, error } = await supabase
      .rpc("add_item", {
        p_name: itemName,
        p_location: location ?? null,
        p_qty: requested.length === 1 ? (qty ?? null) : null,
      })
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    added.push(data);
  }

  return NextResponse.json({ added }, { status: 201 });
});
