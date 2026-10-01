import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/bom/site-header";

export const metadata: Metadata = {
  title: "BOM | Beyblade of Medan",
  description: "Rumah Beyblade X kompetitif di Sumatera. Built in Medan. Battle anywhere.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
