import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { InstallPWA } from "@/components/pwa/InstallPWA";
import { CapacitorApp } from "@/components/pwa/CapacitorApp";
import { SpatialNavigationInit } from "@/components/pwa/SpatialNavigationInit";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BxPlayer - Premium IPTV Player",
    template: "%s | BxPlayer"
  },
  description: "The most advanced, professional, and ultra-fast IPTV media player.",
  keywords: ["IPTV", "Media Player", "Live TV", "Streaming", "VOD", "M3U", "Xtream"],
  authors: [{ name: "BxPlayer Team" }],
  creator: "BxPlayer",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "BxPlayer",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" }
    ],
    shortcut: ["/logo.png"],
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" }
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bxplayer.com",
    title: "BxPlayer - Premium IPTV Player",
    description: "The most advanced, professional, and ultra-fast IPTV media player.",
    siteName: "BxPlayer",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "BxPlayer Logo",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "BxPlayer - Premium IPTV Player",
    description: "The most advanced, professional, and ultra-fast IPTV media player.",
    images: ["/logo.png"],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <InstallPWA />
        <CapacitorApp />
        <SpatialNavigationInit />
      </body>
    </html>
  );
}
