const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatRupiah(value: number | string | null | undefined): string {
  const amount = typeof value === "string" ? Number.parseInt(value, 10) : value;
  if (!Number.isFinite(amount as number)) return rupiahFormatter.format(0);
  return rupiahFormatter.format(amount as number);
}
