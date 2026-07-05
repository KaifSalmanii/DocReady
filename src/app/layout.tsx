import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/components/ui/toast";
import { PWARegister } from "@/components/PWAInstall";

export const metadata: Metadata = {
  title: "DocReady – Gov Document Formatter & Compressor",
  description:
    "Format, Optimize & Compress PDFs, Photos, and Signatures for RTI, PAN, Aadhaar, and State Portals. 100% local processing – no data uploaded.",
  keywords: [
    "government document formatter",
    "passport photo crop",
    "PDF compressor",
    "Aadhaar photo resize",
    "PAN card photo",
    "RTI application",
    "document compressor India",
  ],
  authors: [{ name: "Kaif Salmani", url: "https://www.instagram.com/oyeeee_kaif" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DocReady",
  },
  openGraph: {
    title: "DocReady – Gov Document Formatter & Compressor",
    description: "Government Documents Ready in Seconds.",
    images: ["/og-image.png"],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A2540",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="google-site-verification" content="AYn5Cta8ihwOWUGxlb5E2keI48Fg2KPUgbaFE-4BS7c" />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased flex flex-col min-h-screen">
        <PWARegister />
        <ToastProvider />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
