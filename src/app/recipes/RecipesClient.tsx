"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Recipe } from "@/lib/types";

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
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-32 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Cook this</h1>
        <Link
          href="/"
          className="rounded-full bg-surface px-4 py-2 text-sm font-medium active:bg-surface-2"
        >
          List
        </Link>
      </header>

      <p className="mt-2 text-sm text-muted">
        Meals you&apos;ll be able to make once you&apos;ve done this shop.
      </p>

      {loading && (
        <p className="mt-12 text-center text-sm text-muted">
          Working out what you can cook…
        </p>
      )}

      {error && !loading && (
        <div className="mt-12 text-center">
          <p className="text-base">{error}</p>
          <button
            onClick={retry}
            className="mt-4 rounded-full bg-surface px-5 py-2 text-sm font-medium active:bg-surface-2"
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
              className="animate-rise overflow-hidden rounded-2xl border border-line bg-surface"
            >
              <button
                onClick={() => setOpen(isOpen ? null : recipe.name)}
                className="w-full px-5 py-4 text-left active:bg-surface-2"
              >
                <h2 className="text-xl font-semibold">{recipe.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {recipe.time_minutes} min · uses{" "}
                  <span className="text-accent">
                    {recipe.uses_from_list.length}
                  </span>{" "}
                  from your list
                  {recipe.also_needed.length > 0 &&
                    ` · needs ${recipe.also_needed.length} more`}
                </p>
              </button>

              {isOpen && (
                <div className="border-t border-line px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    {recipe.uses_from_list.map((name) => (
                      <span
                        key={name}
                        className="rounded-full bg-accent/15 px-3 py-1 text-sm capitalize text-accent"
                      >
                        {name}
                      </span>
                    ))}
                  </div>

                  {recipe.also_needed.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">
                        Also need
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {recipe.also_needed.map((name) => (
                          <button
                            key={name}
                            onClick={() => void addMissing(name)}
                            disabled={added.has(name)}
                            className="rounded-full border border-line px-3 py-1.5 text-sm capitalize active:bg-surface-2 disabled:border-accent disabled:text-accent"
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
                        <span className="shrink-0 text-muted tabular-nums">
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
    </main>
  );
}
