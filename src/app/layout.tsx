import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";

import { TransitionProvider } from "@/components/transition/TransitionProvider";
import { siteConfig } from "@/config/site";

import "./globals.css";

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    siteName: siteConfig.name,
    locale: "id_ID",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070405",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={grotesk.variable}>
      <body className="bg-ink font-sans text-chalk antialiased">
        {/* One shared backdrop: the landing and the viewer must not differ by a
            single pixel while a photo flies between them. */}
        <div className="dot-field pointer-events-none fixed inset-0" aria-hidden />
        <TransitionProvider>{children}</TransitionProvider>
      </body>
    </html>
  );
}
