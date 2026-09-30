import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={grotesk.variable}>
      <body className="bg-ink font-sans text-chalk antialiased">{children}</body>
    </html>
  );
}
