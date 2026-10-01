export default function ViewerLayout({ children }: { children: React.ReactNode }) {
  // No background of its own: the shared dot backdrop from the root layout is
  // what the visitor sees here, identical to the landing.
  return <div className="relative h-dvh w-full overflow-hidden">{children}</div>;
}
