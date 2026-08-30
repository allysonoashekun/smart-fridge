import type { Metadata, Viewport } from "next";
import { Cal_Sans, Schoolbell } from "next/font/google";
import "./globals.css";

// The app's voice is a felt-tip pen on a fridge note, so Schoolbell carries
// every bit of copy. It ships one weight (400) and latin only -- Tailwind's
// font-medium/semibold utilities therefore render as synthetic bold, which
// reads as a heavier pen stroke and is the intended look.
//
// Exposed as a CSS variable rather than applied via schoolbell.className so
// globals.css can hand it to Tailwind as the `font-hand` family and keep
// `font-sans` available for the one thing that stays in UI type: control
// labels (see globals.css).
const schoolbell = Schoolbell({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-schoolbell",
});

// Page titles ("List", "What ran out?", "Cook this") step out of the pen and
// into Cal Sans, so the thing you read first has a fixed, printed shape while
// the body copy stays handwritten. It ships one weight (400) only, so the
// headings drop Tailwind's font-semibold -- synthetic bold here would smear
// the letterforms rather than read as a heavier pen stroke.
const calSans = Cal_Sans({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cal-sans",
});

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
    <html lang="en" className={`${schoolbell.variable} ${calSans.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
