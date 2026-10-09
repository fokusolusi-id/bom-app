import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/bom/site-header";
import { HideOnAdmin } from "@/components/bom/hide-on-admin";
import { SiteFooter } from "@/components/bom/site-footer";

export const metadata: Metadata = {
  title: "BOM | Beyblade of Medan",
  description: "Rumah Beyblade X kompetitif di Sumatera Utara, tempat pemain Medan naik kelas sampai ke panggung dunia. Built in Medan. Battle anywhere.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <HideOnAdmin><SiteHeader /></HideOnAdmin>
        {children}
        <HideOnAdmin><SiteFooter /></HideOnAdmin>
      </body>
    </html>
  );
}
