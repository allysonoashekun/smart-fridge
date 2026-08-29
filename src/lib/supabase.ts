import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only. The service role key bypasses RLS, so this module must never be
// imported from a client component.
let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.local.example to .env.local and fill it in.",
    );
  }

  client = createClient(url, serviceKey, { auth: { persistSession: false } });
  return client;
}

// Connect lazily on first use rather than at import time, so `next build` can
// collect the routes without the environment being populated.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
