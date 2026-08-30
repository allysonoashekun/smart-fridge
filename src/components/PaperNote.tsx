import Image from "next/image";

// The star is *the* pin: one magnet holds up every note in the app, so moving
// between the list, the recipes and /add never swaps it out from under the
// page. It's deliberately not configurable per page -- the fridge reads as one
// scene, and a pin that changes on navigation reads as a glitch. Per-page
// variety belongs in FridgeScene's decorative magnets instead.
//
// It's a real transparent PNG cutout, so it renders as-is: its own alpha
// silhouette, no forced CSS shape. Width/height below match the current
// file's aspect ratio so the browser doesn't stretch it; if you swap in a
// differently-shaped PNG, adjust these two numbers to match.
const PIN = {
  src: "/fridge/magnet-pin.png",
  width: 72,
  height: 64, // matches magnet-pin.png's own aspect ratio (114x101)
  rotate: "-rotate-6",
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
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className={`magnet-shadow pointer-events-none absolute -top-4 left-1/2 z-10 -translate-x-1/2 ${PIN.rotate}`}
      >
        <Image
          src={PIN.src}
          alt=""
          width={PIN.width}
          height={PIN.height}
          className="block"
        />
      </div>

      <div
        className={`paper-shadow relative aspect-[275/350] bg-[url('/fridge/paper.png')] bg-contain bg-top bg-no-repeat ${SHEET_INSET} ${className}`}
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
