import AddClient from "./AddClient";

export const dynamic = "force-dynamic";

// The NFC tag points here: https://<host>/add?loc=fridge
export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<{ loc?: string }>;
}) {
  const { loc } = await searchParams;
  return <AddClient location={loc ?? "fridge"} />;
}
