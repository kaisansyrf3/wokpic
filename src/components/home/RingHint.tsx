type RingHintProps = {
  /** Passed as a plain prop (React 19) so the ring can position it from geometry. */
  ref?: React.Ref<HTMLParagraphElement>;
};

/**
 * The standing invitation in the middle of the ring. Deliberately static and
 * non-interactive: it never moves, never takes focus, and fades with the ring.
 */
export function RingHint({ ref }: RingHintProps) {
  return (
    <p
      ref={ref}
      className="pointer-events-none absolute left-0 top-0 z-20 select-none text-center text-ash leading-[1.5] tracking-[0.06em] text-[11.5px] md:text-[13.5px]"
    >
      Klik gambar untuk melihat portofolio kami
    </p>
  );
}
