"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { ListEntry } from "@/lib/types";
import PaperNote from "@/components/PaperNote";

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

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[calc(max(1.5rem,env(safe-area-inset-top))_+_var(--fridge-drop))] pb-32">
      <PaperNote>
        <header>
          <div className="flex justify-end">
            <Link
              href="/recipes"
              className="rounded-full bg-paper-ink/8 px-4 py-2 text-sm font-medium text-paper-ink active:bg-paper-ink/14"
            >
              Recipes
            </Link>
          </div>
          <h1 className="mt-3 text-3xl tracking-tight text-paper-ink">
            Groceries
          </h1>
        </header>

        {entries === null && (
          <p className="mt-10 text-center text-sm text-paper-muted">
            Loading…
          </p>
        )}

        {entries !== null && entries.length === 0 && (
          <div className="mt-16 text-center">
            <p className="text-lg font-medium text-paper-ink">
              Nothing on the list.
            </p>
            <p className="mt-2 text-sm text-paper-muted">
              Tap the tag on the fridge when something runs out.
            </p>
          </div>
        )}

        <ul className="mt-6">
          {(entries ?? []).map((entry) => (
            <li
              key={entry.id}
              className="flex items-center border-b border-paper-line last:border-b-0"
            >
              <button
                onClick={() => void check(entry.id)}
                className="flex flex-1 items-center gap-3 py-2.5 text-left active:bg-paper-ink/5"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    leaving.has(entry.id)
                      ? "border-accent bg-accent text-accent-ink"
                      : "border-paper-muted/40"
                  }`}
                >
                  {leaving.has(entry.id) && <CheckIcon />}
                </span>
                <span
                  className={`text-lg capitalize transition ${
                    leaving.has(entry.id)
                      ? "text-paper-muted line-through"
                      : "text-paper-ink"
                  }`}
                >
                  {entry.items.name}
                  {entry.qty_text && (
                    <span className="ml-2 text-sm text-paper-muted">
                      {entry.qty_text}
                    </span>
                  )}
                </span>
              </button>
              <button
                onClick={() => void remove(entry.id)}
                aria-label={`Remove ${entry.items.name}`}
                className="py-2.5 pl-3 text-paper-muted active:text-paper-ink"
              >
                <XIcon />
              </button>
            </li>
          ))}
        </ul>
      </PaperNote>

      <Link
        href="/add"
        className="fixed inset-x-5 bottom-[max(1.5rem,env(safe-area-inset-bottom))] mx-auto max-w-md -rotate-1 rounded-2xl bg-accent py-4 text-center text-lg font-semibold text-accent-ink shadow-[0_10px_22px_-6px_rgba(0,0,0,0.5)] transition active:scale-[0.98]"
      >
        Add an item
      </Link>
    </main>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
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
