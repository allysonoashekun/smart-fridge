import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { route } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/entries/:id  { status: "pending" | "bought", qty_text?: string }
export const PATCH = route(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { status, qty_text } = body as {
    status?: "pending" | "bought";
    qty_text?: string;
  };

  const patch: Record<string, unknown> = {};

  if (status === "bought" || status === "pending") {
    patch.status = status;
    patch.bought_at = status === "bought" ? new Date().toISOString() : null;
  }
  if (typeof qty_text === "string") {
    patch.qty_text = qty_text.trim() || null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("list_entries")
    .update(patch)
    .eq("id", id)
    .select("*, items(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ entry: data });
});

// DELETE /api/entries/:id
export const DELETE = route(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;

  const { error } = await supabase.from("list_entries").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
});
