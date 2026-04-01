import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import { getThemeModeInitScript } from "@/lib/theme-mode";
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
    <html
      lang={siteConfig.locale}
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full overflow-x-hidden">
        <script dangerouslySetInnerHTML={{ __html: getThemeModeInitScript() }} />
        {children}
      </body>
    </html>
  );
}
