/**
 * The landing footer bar: one centred section label and nothing else. It is
 * faded in and out together with the ring by `RingGallery`, which owns the only
 * animation that touches it.
 */
export function RingCaption() {
  return (
    <div
      data-ring-caption
      className="ui-label pointer-events-none fixed inset-x-0 bottom-0 z-40 py-5 text-center text-chalk md:py-7"
      style={{ opacity: 0 }}
    >
      OUR PORTOFOLIO
    </div>
  );
}
