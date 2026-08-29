"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Category, ListEntry } from "@/lib/types";
import { CATEGORY_LABEL, CATEGORY_ORDER } from "@/lib/categories";

export default function ListClient() {
  const [entries, setEntries] = useState<ListEntry[] | null>(null);
  // Checked-off rows linger for a moment so the strike-through is visible
  // before they disappear.
  const [leaving, setLeaving] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const res = await fetch("/api/entries?status=pending", {
        cache: "no-store",
      });
      const loaded = res.ok ? ((await res.json()).entries ?? []) : [];
      if (!cancelled) setEntries(loaded);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const check = useCallback(
    async (id: string) => {
      setLeaving((prev) => new Set(prev).add(id));
      try {
        navigator.vibrate?.(20);
      } catch {
        // ignore
      }

      await fetch(`/api/entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "bought" }),
      });

      setTimeout(() => {
        setEntries((prev) => prev?.filter((entry) => entry.id !== id) ?? null);
        setLeaving((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 280);
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    setEntries((prev) => prev?.filter((entry) => entry.id !== id) ?? null);
    await fetch(`/api/entries/${id}`, { method: "DELETE" });
  }, []);

  const grouped = groupByCategory(entries ?? []);
  const count = entries?.length ?? 0;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-32 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">
          List
          {count > 0 && (
            <span className="ml-2 text-xl font-normal text-muted">{count}</span>
          )}
        </h1>
        <Link
          href="/recipes"
          className="rounded-full bg-surface px-4 py-2 text-sm font-medium active:bg-surface-2"
        >
          Recipes
        </Link>
      </header>

      {entries === null && (
        <p className="mt-10 text-center text-sm text-muted">Loading…</p>
      )}

      {entries !== null && count === 0 && (
        <div className="mt-16 text-center">
          <p className="text-lg font-medium">Nothing on the list.</p>
          <p className="mt-2 text-sm text-muted">
            Tap the tag on the fridge when something runs out.
          </p>
        </div>
      )}

      <div className="mt-6 space-y-7">
        {CATEGORY_ORDER.filter((category) => grouped[category]?.length).map(
          (category) => (
            <section key={category}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">
                {CATEGORY_LABEL[category]}
              </h2>
              <ul className="overflow-hidden rounded-2xl border border-line">
                {grouped[category].map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center border-b border-line bg-surface last:border-b-0"
                  >
                    <button
                      onClick={() => void check(entry.id)}
                      className="flex flex-1 items-center gap-3 px-4 py-4 text-left active:bg-surface-2"
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                          leaving.has(entry.id)
                            ? "border-accent bg-accent"
                            : "border-line"
                        }`}
                      >
                        {leaving.has(entry.id) && <CheckIcon />}
                      </span>
                      <span
                        className={`text-lg capitalize transition ${
                          leaving.has(entry.id)
                            ? "text-muted line-through"
                            : "text-ink"
                        }`}
                      >
                        {entry.items.name}
                        {entry.qty_text && (
                          <span className="ml-2 text-sm text-muted">
                            {entry.qty_text}
                          </span>
                        )}
                      </span>
                    </button>
                    <button
                      onClick={() => void remove(entry.id)}
                      aria-label={`Remove ${entry.items.name}`}
                      className="px-4 py-4 text-muted active:text-ink"
                    >
                      <XIcon />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ),
        )}
      </div>

      <Link
        href="/add"
        className="fixed inset-x-5 bottom-[max(1.5rem,env(safe-area-inset-bottom))] mx-auto max-w-md rounded-2xl bg-accent py-4 text-center text-lg font-semibold text-accent-ink shadow-lg transition active:scale-[0.98]"
      >
        Add an item
      </Link>
    </main>
  );
}

function groupByCategory(entries: ListEntry[]): Record<Category, ListEntry[]> {
  const grouped = {} as Record<Category, ListEntry[]>;
  for (const entry of entries) {
    const category = (entry.items.category ?? "other") as Category;
    (grouped[category] ??= []).push(entry);
  }
  return grouped;
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#052e16"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
