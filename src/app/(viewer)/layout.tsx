export default function ViewerLayout({ children }: { children: React.ReactNode }) {
  return <div className="relative h-dvh w-full overflow-hidden bg-ink">{children}</div>;
}
