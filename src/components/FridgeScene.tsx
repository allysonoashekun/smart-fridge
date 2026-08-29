import Image from "next/image";

// Fixed decorative magnets scattered on the door. magnet-1/2/3 are real
// transparent PNG cutouts -- no forced shape or frame, just their own alpha
// silhouette plus a drop-shadow (which, unlike box-shadow, follows alpha
// edges rather than the image's rectangular box). Width/height below match
// each current file's aspect ratio so the browser doesn't stretch it; if you
// swap in a differently-shaped PNG, adjust these two numbers to match.
//
// Positioned with `fixed` (not `absolute`) so they stay stuck to the fridge
// rather than scrolling away with a long list or a long recipe.
const MAGNETS = [
  {
    src: "/fridge/magnet-1.png",
    width: 64,
    height: 70,
    position: "top-8 left-5 -rotate-12",
  },
  {
    src: "/fridge/magnet-3.png",
    width: 64,
    height: 59,
    position: "top-24 right-4 rotate-6",
  },
  {
    src: "/fridge/magnet-2.png",
    width: 72,
    height: 68,
    position: "top-1/2 left-6 -translate-y-1/2 -rotate-6",
  },
];

export default function FridgeScene({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* A true `fixed` layer rather than `background-attachment: fixed` --
          the latter is unreliable on iOS Safari.

          z-0, not a negative z-index: body has its own opaque background
          (globals.css, for /unlock), and per the CSS stacking spec that
          paints AFTER negative-z-index descendants regardless of DOM
          nesting -- a negative z-index here would render fully behind it,
          invisible. Staying at z-0/z-10 (like the magnets/content below)
          and relying on DOM order keeps this in the same later bucket that
          actually paints on top of body's background. */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 bg-[url('/fridge/metal.jpg')] bg-cover bg-center"
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.36)), " +
            "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.12), transparent 60%)",
        }}
      />

      {MAGNETS.map((magnet) => (
        <div
          key={magnet.src}
          aria-hidden="true"
          className={`magnet-shadow pointer-events-none fixed z-0 ${magnet.position}`}
        >
          <Image
            src={magnet.src}
            alt=""
            width={magnet.width}
            height={magnet.height}
            className="block"
          />
        </div>
      ))}

      <div className="relative z-10 min-h-dvh">{children}</div>
    </>
  );
}
