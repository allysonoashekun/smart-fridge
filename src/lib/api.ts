import { NextResponse } from "next/server";

/**
 * Wraps a route handler so anything thrown comes back as JSON the client can
 * actually display -- most usefully the "you haven't set SUPABASE_URL" message,
 * which is otherwise an opaque 500 during first-time setup.
 */
export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "Unexpected server error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}
