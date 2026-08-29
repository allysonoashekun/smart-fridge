"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Recipe } from "@/lib/types";
import { wobbleClass } from "@/lib/wobble";
import PaperNote from "@/components/PaperNote";

export default function RecipesClient() {
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  // Bumped by "Try again" to re-run the effect.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/recipes", { method: "POST" });
        const body = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setError(body.error ?? "Something went wrong.");
          setRecipes(null);
        } else {
          setRecipes(body.recipes ?? []);
        }
      } catch {
        if (!cancelled) setError("Could not reach the server.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  const addMissing = useCallback(async (name: string) => {
    setAdded((prev) => new Set(prev).add(name));
    try {
      navigator.vibrate?.(30);
    } catch {
      // ignore
    }
    await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-16 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <PaperNote pin="star" rotate="rotate-[0.3deg]">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-paper-ink">
            Cook this
          </h1>
          <Link
            href="/"
            className="rounded-full bg-paper-ink/8 px-4 py-2 text-sm font-medium text-paper-ink active:bg-paper-ink/14"
          >
            List
          </Link>
        </header>

        <p className="mt-2 text-sm text-paper-muted">
          Meals you&apos;ll be able to make once you&apos;ve done this shop.
        </p>

        {loading && (
          <p className="mt-12 text-center text-sm text-paper-muted">
            Working out what you can cook…
          </p>
        )}

        {error && !loading && (
          <div className="mt-12 text-center">
            <p className="text-base text-paper-ink">{error}</p>
            <button
              onClick={retry}
              className="mt-4 rounded-full bg-paper-ink/8 px-5 py-2 text-sm font-medium text-paper-ink active:bg-paper-ink/14"
            >
              Try again
            </button>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {recipes?.map((recipe) => {
            const isOpen = open === recipe.name;
            return (
              <article
                key={recipe.name}
                className={`animate-rise overflow-hidden rounded-lg bg-white/85 shadow-[0_4px_10px_-3px_rgba(0,0,0,0.25)] ${wobbleClass(recipe.name)}`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : recipe.name)}
                  className="w-full px-5 py-4 text-left active:bg-paper-ink/5"
                >
                  <h2 className="text-xl font-semibold text-paper-ink">
                    {recipe.name}
                  </h2>
                  <p className="mt-1 text-sm text-paper-muted">
                    {recipe.time_minutes} min · uses{" "}
                    <span className="font-semibold text-paper-ink">
                      {recipe.uses_from_list.length}
                    </span>{" "}
                    from your list
                    {recipe.also_needed.length > 0 &&
                      ` · needs ${recipe.also_needed.length} more`}
                  </p>
                </button>

                {isOpen && (
                  <div className="border-t border-paper-line px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {recipe.uses_from_list.map((name) => (
                        <span
                          key={name}
                          className="rounded-full bg-paper-ink/10 px-3 py-1 text-sm capitalize text-paper-ink"
                        >
                          {name}
                        </span>
                      ))}
                    </div>

                    {recipe.also_needed.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-paper-muted">
                          Also need
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {recipe.also_needed.map((name) => (
                            <button
                              key={name}
                              onClick={() => void addMissing(name)}
                              disabled={added.has(name)}
                              className="rounded-full border border-paper-line px-3 py-1.5 text-sm capitalize text-paper-ink active:bg-paper-ink/10 disabled:border-paper-ink disabled:text-paper-ink"
                            >
                              {added.has(name) ? `✓ ${name}` : `+ ${name}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <ol className="mt-4 space-y-2">
                      {recipe.steps.map((step, index) => (
                        <li key={index} className="flex gap-3 text-[15px]">
                          <span className="shrink-0 text-paper-muted tabular-nums">
                            {index + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </PaperNote>
    </main>
  );
}
