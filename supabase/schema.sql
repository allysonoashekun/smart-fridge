-- Smart Fridge schema. Paste into the Supabase SQL editor and run.
-- Single-user hobby app: RLS stays off and all access goes through
-- server-side API routes holding the service role key.

create extension if not exists pgcrypto;

-- Catalog of every item you've ever added. `add_count` is what powers the
-- one-tap chips on /add -- after a couple of weeks it knows that milk, eggs
-- and butter are most of what you ever put on the list.
create table if not exists items (
  id            uuid primary key default gen_random_uuid(),
  name          text unique not null,
  category      text not null default 'other',
  add_count     int  not null default 0,
  last_added_at timestamptz
);

create table if not exists list_entries (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references items(id) on delete cascade,
  qty_text   text,
  status     text not null default 'pending' check (status in ('pending', 'bought')),
  location   text,
  created_at timestamptz not null default now(),
  bought_at  timestamptz
);

create index if not exists items_add_count_idx on items (add_count desc);
create index if not exists list_entries_status_idx on list_entries (status);
create index if not exists list_entries_item_idx on list_entries (item_id);

-- Only one pending entry per item: tapping "milk" twice shouldn't put milk on
-- the list twice. Enforced in the database so a double-tap can't race past it.
create unique index if not exists list_entries_one_pending_per_item
  on list_entries (item_id) where status = 'pending';

-- Cached recipe suggestions, keyed on a hash of the pending list, so
-- re-opening /recipes without changing the list costs nothing.
create table if not exists recipe_cache (
  list_hash  text primary key,
  payload    jsonb not null,
  created_at timestamptz not null default now()
);


-- Add an item by name in one atomic round-trip: upsert the catalog row, bump
-- its frequency, then put it on the list unless it's already pending.
create or replace function add_item(
  p_name     text,
  p_category text default 'other',
  p_location text default null,
  p_qty      text default null
)
returns list_entries
language plpgsql
as $$
declare
  v_name  text := lower(btrim(p_name));
  v_item  items;
  v_entry list_entries;
begin
  if v_name = '' then
    raise exception 'item name cannot be empty';
  end if;

  insert into items (name, category, add_count, last_added_at)
  values (v_name, coalesce(p_category, 'other'), 1, now())
  on conflict (name) do update
    set add_count     = items.add_count + 1,
        last_added_at = now()
  returning * into v_item;

  select * into v_entry
    from list_entries
   where item_id = v_item.id and status = 'pending'
   limit 1;

  if found then
    return v_entry;
  end if;

  insert into list_entries (item_id, qty_text, location)
  values (v_item.id, nullif(btrim(coalesce(p_qty, '')), ''), p_location)
  returning * into v_entry;

  return v_entry;
end;
$$;


-- Chip candidates for /add: most-added items that aren't already on the list.
create or replace function top_items(p_limit int default 12)
returns setof items
language sql
stable
as $$
  select i.*
    from items i
   where not exists (
     select 1 from list_entries e
      where e.item_id = i.id and e.status = 'pending'
   )
   order by i.add_count desc, i.last_added_at desc nulls last
   limit p_limit;
$$;
