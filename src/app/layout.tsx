import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={siteConfig.locale} className="h-full antialiased">
      <body className="relative flex min-h-full flex-col overflow-x-hidden bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
        <div aria-hidden="true" className="site-bottom-noise" />
        <SiteHeader />
        <div className="relative z-10 flex-1 pt-24 sm:pt-28">{children}</div>
      </body>
    </html>
  );
}
