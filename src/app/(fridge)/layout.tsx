import type { Viewport } from "next";
import FridgeScene from "@/components/FridgeScene";

// Overrides the root layout's dark theme-color for just these three routes,
// so the browser chrome matches the steel background. /unlock sits outside
// this route group and keeps the root's dark value.
export const viewport: Viewport = {
  themeColor: "#9297a0",
  colorScheme: "light",
};

export default function FridgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FridgeScene>{children}</FridgeScene>;
}
