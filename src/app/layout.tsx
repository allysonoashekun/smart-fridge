import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fridge",
  description: "Tap the fridge, add to the list.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Fridge",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0d0f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // The add screen is a fixed layout; letting it zoom on a double-tap only
  // gets in the way when you're standing at an open fridge.
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
