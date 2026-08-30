"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Item } from "@/lib/types";
import { parseNames } from "@/lib/parse";
import { wobbleClass } from "@/lib/wobble";
import PaperNote from "@/components/PaperNote";

type AddedEntry = { id: string };

type Toast = {
  text: string;
  entryIds: string[];
};

// Short buzz on add. Android honours it; iOS ignores it silently.
function buzz(ms = 30) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Some browsers throw rather than no-op. Not worth surfacing.
  }
}

export default function AddClient({ location }: { location: string }) {
  const [chips, setChips] = useState<Item[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Item[]>([]);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetching is kept separate from the state writes so both the mount effect
  // and refresh() can share it without setting state synchronously.
  const fetchState = useCallback(async () => {
    const [chipRes, listRes] = await Promise.all([
      fetch("/api/items", { cache: "no-store" }),
      fetch("/api/entries?status=pending", { cache: "no-store" }),
    ]);
    return {
      chips: chipRes.ok ? (((await chipRes.json()).items ?? []) as Item[]) : null,
      pending: listRes.ok
        ? ((await listRes.json()).entries?.length ?? 0)
        : null,
    };
  }, []);

  const refresh = useCallback(async () => {
    const state = await fetchState();
    if (state.chips) setChips(state.chips);
    if (state.pending !== null) setPendingCount(state.pending);
  }, [fetchState]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const state = await fetchState();
      if (cancelled) return;
      if (state.chips) setChips(state.chips);
      if (state.pending !== null) setPendingCount(state.pending);
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchState]);

  // Autocomplete against items you've added before.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/items?q=${encodeURIComponent(q)}`, {
        cache: "no-store",
      });
      const found = res.ok ? ((await res.json()).items ?? []) : [];
      if (!cancelled) setSuggestions(found);
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const onQueryChange = useCallback((value: string) => {
    setQuery(value);
    // Clearing here rather than in the effect keeps stale matches from
    // flashing while you delete back down to one character.
    if (value.trim().length < 2) setSuggestions([]);
  }, []);

  const showToast = useCallback((text: string, entryIds: string[]) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ text, entryIds });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  const add = useCallback(
    async (raw: string) => {
      const names = parseNames(raw);
      if (names.length === 0) return;

      setBusy(names[0]);
      // Optimistically drop tapped chips so a double-tap can't fire twice.
      setChips((prev) => prev.filter((c) => !names.includes(c.name)));

      try {
        const res = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ names, location }),
        });

        if (!res.ok) {
          const { error } = await res.json().catch(() => ({ error: "" }));
          showToast(error || "Could not add that", []);
          await refresh();
          return;
        }

        const { added } = (await res.json()) as { added: AddedEntry[] };
        buzz();
        setQuery("");
        setSuggestions([]);
        showToast(
          names.length === 1 ? `Added ${names[0]}` : `Added ${names.length} items`,
          added.map((entry) => entry.id),
        );
        await refresh();
      } finally {
        setBusy(null);
      }
    },
    [location, refresh, showToast],
  );

  const undo = useCallback(async () => {
    if (!toast?.entryIds.length) return;
    await Promise.all(
      toast.entryIds.map((id) =>
        fetch(`/api/entries/${id}`, { method: "DELETE" }),
      ),
    );
    setToast(null);
    await refresh();
  }, [toast, refresh]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-16 pt-[calc(max(1.5rem,env(safe-area-inset-top))_+_var(--fridge-drop))]">
      <PaperNote>
        <header className="flex items-center justify-end">
          <Link
            href="/"
            className="rounded-full bg-paper-ink/8 px-4 py-2 text-sm font-medium text-paper-ink active:bg-paper-ink/14"
          >
            List
            {pendingCount !== null && pendingCount > 0 && (
              <span className="ml-2 font-semibold text-paper-ink">
                {pendingCount}
              </span>
            )}
          </Link>
        </header>

        <h1 className="mt-6 text-3xl tracking-tight text-paper-ink">
          What ran out?
        </h1>

        {chips.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3">
            {chips.map((item) => (
              <button
                key={item.id}
                onClick={() => void add(item.name)}
                disabled={busy === item.name}
                className={`animate-rise min-h-[76px] rounded-lg bg-white/85 px-4 py-4 text-left text-lg font-medium capitalize leading-tight text-paper-ink shadow-[0_4px_10px_-3px_rgba(0,0,0,0.25)] transition active:scale-[0.96] active:bg-white/70 disabled:opacity-40 ${wobbleClass(item.name)}`}
              >
                {item.name}
              </button>
            ))}
          </div>
        )}

        {/* Deliberately not autofocused: a keyboard springing up would cover the
            chips, which are the fast path. */}
        <form
          className="mt-8 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void add(query);
          }}
        >
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Something else…"
            autoComplete="off"
            autoCapitalize="none"
            enterKeyHint="done"
            className="min-w-0 flex-1 rounded-2xl border border-paper-line bg-white/70 px-4 py-4 text-lg text-paper-ink outline-none placeholder:text-paper-muted focus:border-paper-ink"
          />
          <button
            type="submit"
            disabled={!query.trim()}
            className="rounded-2xl bg-accent px-6 text-lg font-semibold text-accent-ink shadow-[0_4px_10px_-3px_rgba(0,0,0,0.25)] transition active:scale-95 disabled:opacity-30"
          >
            Add
          </button>
        </form>

        {suggestions.length > 0 && (
          <ul className="mt-3 overflow-hidden rounded-2xl border border-paper-line">
            {suggestions.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => void add(item.name)}
                  className="w-full border-b border-paper-line bg-white/70 px-4 py-3 text-left text-base capitalize text-paper-ink last:border-b-0 active:bg-white/50"
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </PaperNote>

      {toast && (
        <div className="animate-rise fixed inset-x-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-paper px-5 py-4 text-paper-ink shadow-[0_10px_22px_-6px_rgba(0,0,0,0.5)]">
          <span className="text-base font-medium capitalize">{toast.text}</span>
          {toast.entryIds.length > 0 && (
            <button
              onClick={() => void undo()}
              className="shrink-0 text-base font-semibold text-paper-ink underline underline-offset-4 active:opacity-60"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </main>
  );
}
