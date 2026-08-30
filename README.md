# Fridge

An NFC tag lives on the fridge door. Tap your phone against it and the app opens
straight to "what ran out?" — one tap adds the item to the grocery list. When
you're planning a shop, `/recipes` tells you what you'll be able to cook.

## How the NFC part works

The tag is a dumb NTAG215 sticker. It holds ~500 bytes and has no power or
state — it's purely a launcher holding one URL:

```
https://<your-domain>/add?loc=fridge
```

- **iPhone XS+** — background tag reading is always on. Tap the fridge with the
  phone locked → buzz → notification → tap → you're on the add screen.
- **Android** — the URL fires an intent and opens immediately. With the PWA
  installed, Android routes it into the installed app, chrome-less.

Extra tags cost about $0.30, so `?loc=freezer` and `?loc=pantry` are worth it —
the app reads the param and labels the screen accordingly.

> **Buy "on-metal" (ferrite-backed) tags.** Fridge doors are steel, and steel
> detunes an ordinary NFC sticker badly enough that it often won't read at all.
> This is the single most likely way the project fails on day one.

Write the tag once with the free **NFC Tools** app (iOS/Android) — choose
Write → Add a record → URL. There's no reason to build a tag writer.

## Setup

1. **Create a Supabase project** (free tier), then open the SQL editor and run
   [`supabase/schema.sql`](supabase/schema.sql).

2. **Configure the environment:**

   ```sh
   cp .env.local.example .env.local
   ```

   Fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from
   Project Settings → API. Use the **service_role** key, not the anon key — it's
   only ever read server-side in API routes. `ANTHROPIC_API_KEY` is needed only
   for `/recipes`. `APP_PASSPHRASE` is **required** — without it the app stays
   locked (see Notes).

3. **Run it:**

   ```sh
   npm install
   npm run dev
   ```

   Open http://localhost:3000/add?loc=fridge.

4. **Deploy** to Vercel, add the same three environment variables there, then
   write your deployed `/add?loc=fridge` URL to the tag.

5. On your phone, open the deployed site and **Add to Home Screen** so it runs
   full-screen with its own icon.

## Notes

**Access control.** Every page and API route sits behind
[`src/middleware.ts`](src/middleware.ts), which requires a session cookie. You
unlock a device once at `/unlock` by typing `APP_PASSPHRASE`, and the cookie
lasts 400 days — the browser maximum — so you never see the screen again on that
phone.

The cookie holds an HMAC of a fixed string keyed by the passphrase, not the
passphrase itself. It's deterministic, which means **changing `APP_PASSPHRASE`
signs out every device at once** — that's your revoke button if a phone is lost.

If the app is misconfigured it fails *closed*: with no `APP_PASSPHRASE` set,
everything is locked rather than public.

**One-tap unlock from the tag (optional).** Set `TAG_KEY` and write the tag as
`/add?loc=fridge&k=<TAG_KEY>`. A tap then mints the session with nothing to
type, and the middleware immediately redirects to the clean URL so the key never
lingers in history or a referrer header. The tradeoff is that anyone who taps
that tag with their own phone is in — reasonable when the tag is inside your
kitchen, but leave `TAG_KEY` unset if you'd rather type the passphrase once per
device.

This is a single-user design: there are no accounts, RLS is off, and every query
runs through server-side routes holding the service key. If you later want a
shared household list with per-person history, that's the point to move to
Supabase Auth rather than extend this.

**Why a database rather than `localStorage`.** On iOS, an installed home-screen
PWA has *separate* storage from Safari — and an NFC tap opens Safari. A
local-only list would silently split into two lists that never see each other.

## Layout

```
src/app/add/        the NFC landing screen — chips, autocomplete
src/app/            the list, grouped into store aisles
src/app/recipes/    meal suggestions from the pending list
src/app/api/        entries, items, recipes
src/lib/            supabase client, name parsing
supabase/schema.sql tables + the add_item / top_items functions
scripts/            npx tsx scripts/check-logic.ts
```

The one-tap chips are driven by `items.add_count`: every add bumps a counter, and
`top_items()` returns your most-added items that aren't already on the list. After
a couple of weeks it knows milk, eggs and butter are most of what you ever add.

## Recipes

Your grocery list is a list of things you *don't have*, so "recipes from your
list" would mean food you can't currently cook. The framing that works is
pre-shop planning: **"these 3 recipes use 5 of your 6 items — add 2 more and you
can cook all three."** Missing ingredients render as one-tap buttons that add
straight back to the list.

`POST /api/recipes` calls `claude-opus-5` with a Zod structured-output schema and
caches the result against a hash of the pending list, so reopening the page
without changing the list is free. A call costs a few cents.
