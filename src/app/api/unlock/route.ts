import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  safeEqual,
  sessionToken,
} from "@/lib/auth";
import { route } from "@/lib/api";

export const dynamic = "force-dynamic";

export const POST = route(async (req: Request) => {
  const passphrase = process.env.APP_PASSPHRASE;
  if (!passphrase) {
    return NextResponse.json(
      { error: "APP_PASSPHRASE is not set on the server." },
      { status: 500 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const given = String((body as { passphrase?: string }).passphrase ?? "");

  // A deliberate pause on every attempt. This is the only guessable surface in
  // the app, and it makes an online brute force impractical without needing a
  // rate limiter or anywhere to store attempt counts.
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (!safeEqual(given, passphrase)) {
    return NextResponse.json({ error: "Wrong passphrase." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await sessionToken(passphrase), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
});
