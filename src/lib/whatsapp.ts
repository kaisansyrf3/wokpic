/**
 * The owner's WhatsApp number is stored normalised (digits only, Indonesian
 * country code) so a `wa.me` link can be built anywhere without re-parsing.
 */

/** Digits of any Indonesian format as `62…`, or null when it cannot be one. */
export function normalizeWhatsApp(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  return /^62\d{8,13}$/.test(d) ? d : null;
}

/** Pre-filled message naming the package and, when known, the category tab it came from. */
export function buildWhatsAppUrl(
  number: string,
  brand: string,
  serviceName: string,
  categoryName?: string,
): string {
  const text = [
    `Halo ${brand}, saya tertarik dengan paket "${serviceName}"${categoryName ? ` (kategori ${categoryName})` : ""}.`,
    "Mohon informasi lebih lanjut.",
  ].join("\n");

  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
