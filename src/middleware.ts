import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  safeEqual,
  sessionToken,
} from "@/lib/auth";

const PUBLIC_PATHS = ["/unlock", "/api/unlock"];

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const passphrase = process.env.APP_PASSPHRASE;

  // Fail closed. An unconfigured deployment is locked, not wide open -- the
  // opposite would silently publish your list the first time you forget a
  // variable in Vercel.
  if (!passphrase) {
    return deny(
      req,
      "APP_PASSPHRASE is not set on the server, so the app is locked.",
    );
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const expected = await sessionToken(passphrase);
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;

  if (cookie && safeEqual(cookie, expected)) {
    return NextResponse.next();
  }

  // One-tap unlock from the NFC tag: the tag URL may carry ?k=<TAG_KEY>, which
  // mints the same session. Only enabled if TAG_KEY is set, and the key is
  // separate from the passphrase so it can be rotated on its own.
  const tagKey = process.env.TAG_KEY;
  const provided = searchParams.get("k");

  if (tagKey && provided && safeEqual(provided, tagKey)) {
    // Redirect to the same URL minus ?k= so the key doesn't linger in the
    // address bar, history, or any outbound referrer.
    const clean = req.nextUrl.clone();
    clean.searchParams.delete("k");

    const res = NextResponse.redirect(clean);
    setSession(res, expected);
    return res;
  }

  return deny(req);
}

function setSession(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

function deny(req: NextRequest, message = "Locked.") {
  // API callers get a status they can act on; browsers get the unlock screen.
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: message }, { status: 401 });
  }

  const unlock = req.nextUrl.clone();
  unlock.pathname = "/unlock";
  unlock.search = "";
  // Come back to wherever you were headed -- normally /add?loc=fridge.
  unlock.searchParams.set(
    "next",
    req.nextUrl.pathname + req.nextUrl.search.replace(/(\?|&)k=[^&]*/, ""),
  );
  return NextResponse.redirect(unlock);
}

export const config = {
  // Everything except build assets and the PWA icons/manifest, which must stay
  // reachable or install-to-home-screen breaks.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon-192\\.png|icon-512\\.png|icon-maskable-512\\.png|apple-touch-icon\\.png).*)",
  ],
};
