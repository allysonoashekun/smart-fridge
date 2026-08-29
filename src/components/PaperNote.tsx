import Image from "next/image";

type Pin = "star" | "circle";

// The star is the app's pin: it holds up both the list and the recipes note,
// so navigating between them doesn't swap the magnet out from under the page.
// /add gets its own, reusing a misc decorative magnet from FridgeScene so we
// don't need an extra asset file just for that pin.
//
// Both are real transparent PNG cutouts, so they render as-is: their own
// alpha silhouette, no forced CSS shape. Width/height below match each
// current file's aspect ratio so the browser doesn't stretch it; if you swap
// in a differently-shaped PNG, adjust these two numbers to match.
const PIN: Record<
  Pin,
  { src: string; width: number; height: number; rotate: string }
> = {
  star: {
    src: "/fridge/magnet-pin.png",
    width: 72,
    height: 64, // matches magnet-pin.png's own aspect ratio (114x101)
    rotate: "-rotate-6",
  },
  circle: {
    src: "/fridge/magnet-1.png",
    width: 56,
    height: 61, // matches magnet-1.png's own aspect ratio (92x100)
    rotate: "rotate-3",
  },
};

// paper.png is not a card: it's a finished 275x350 graphic of one torn sheet
// with its own transparent margins, and the sheet only covers x 55..237,
// y 28..318 of that file (55 being the worst-case column of the ragged left
// tear). Padding measured from the element's own box edges therefore drops
// text and buttons onto the fridge rather than the paper -- these insets push
// the content in to the sheet instead.
//
// They're percentages because the note scales with the viewport, and CSS
// resolves percentage padding against the box's WIDTH on all four sides -- so
// while the box keeps paper.png's 275/350 ratio, an offset of N image pixels
// is N/275 of the width vertically as much as horizontally. Every number
// below is (that pixel offset + a little breathing room) / 275. Re-measure
// them if paper.png is ever redrawn.
const SHEET_INSET = "pt-[13%] pr-[16%] pb-[14%] pl-[22%]";

export default function PaperNote({
  pin,
  rotate = "-rotate-[0.4deg]",
  className = "",
  children,
}: {
  pin: Pin;
  /** A small fixed tilt for the paper itself -- keep this subtle. */
  rotate?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const config = PIN[pin];

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className={`magnet-shadow pointer-events-none absolute -top-4 left-1/2 z-10 -translate-x-1/2 ${config.rotate}`}
      >
        <Image
          src={config.src}
          alt=""
          width={config.width}
          height={config.height}
          className="block"
        />
      </div>

      <div
        className={`paper-shadow relative aspect-[275/350] bg-[url('/fridge/paper.png')] bg-contain bg-top bg-no-repeat ${SHEET_INSET} ${rotate} ${className}`}
      >
        {/* aspect-[275/350] matches paper.png's own dimensions -- it's a
            finished graphic of one torn notepad sheet with its own
            transparent margins baked in, not a seamless tileable texture or a
            solid card. bg-contain shows it in full rather than cropping it to
            fill whatever height the content needs, and there's deliberately
            no background-color here -- the fridge shows through the image's
            own transparent margins, the same way it shows through the
            magnets, rather than a rectangular card sitting on top of it.
            paper-shadow (a drop-shadow filter, not box-shadow) follows that
            same transparency instead of casting a shadow around the full
            invisible rectangle. */}
        {/* The global body color is a near-white "ink" meant for the dark
            /unlock screen -- setting the base color here means any text we
            forget to recolor still lands on dark ink instead of vanishing
            white-on-cream. */}
        <div className="relative text-paper-ink">{children}</div>
      </div>
    </div>
  );
}
