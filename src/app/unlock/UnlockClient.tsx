"use client";

import { useState } from "react";

export default function UnlockClient({ next }: { next: string }) {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!passphrase.trim() || busy) return;

    setBusy(true);
    setError(null);

    const res = await fetch("/api/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passphrase }),
    });

    if (res.ok) {
      // Full navigation rather than a client push, so the new cookie is applied
      // to the server render of the destination.
      window.location.href = next;
      return;
    }

    const body = await res.json().catch(() => ({}));
    setError(body.error ?? "Could not unlock.");
    setPassphrase("");
    setBusy(false);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 pb-20">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
          <LockIcon />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Fridge</h1>
        <p className="mt-2 text-sm text-muted">
          Unlock once and this phone stays signed in.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="password"
          value={passphrase}
          onChange={(event) => setPassphrase(event.target.value)}
          placeholder="Passphrase"
          autoComplete="current-password"
          autoFocus
          className="rounded-2xl border border-line bg-surface px-4 py-4 text-lg text-ink outline-none placeholder:text-muted focus:border-accent"
        />
        <button
          type="submit"
          disabled={!passphrase.trim() || busy}
          className="rounded-2xl bg-accent py-4 text-lg font-semibold text-accent-ink transition active:scale-[0.98] disabled:opacity-30"
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-center text-sm text-red-400">{error}</p>
      )}
    </main>
  );
}

function LockIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
