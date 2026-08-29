import { safeNext } from "@/lib/auth";
import UnlockClient from "./UnlockClient";

export const dynamic = "force-dynamic";

export default async function UnlockPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <UnlockClient next={safeNext(next)} />;
}
