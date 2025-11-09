import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { StructuredData } from "./components/StructuredData";

export const metadata: Metadata = {
  // Basic SEO
  title: {
    default: "CryptoLotto - Transparent Blockchain Lottery | Daily & Weekly Draws",
    template: "%s | CryptoLotto"
  },
  description: "Play the world's most transparent blockchain lottery on BASE. Daily $0.25 tickets, weekly jackpots, quantum-random draws. 100% on-chain, verifiable, and fair. Win crypto prizes instantly!",
  keywords: [
    "crypto lottery",
    "blockchain lottery",
    "BASE lottery",
    "decentralized lottery",
    "crypto lotto",
    "blockchain gambling",
    "crypto jackpot",
    "on-chain lottery",
    "transparent lottery",
    "crypto prize",
    "daily lottery",
    "weekly lottery",
    "quantum random",
    "provably fair",
    "web3 lottery",
    "polygon lottery",
    "ethereum lottery"
  ],
  authors: [{ name: "CryptoLotto Team" }],
  creator: "CryptoLotto",
  publisher: "CryptoLotto",

  // Manifest & App
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CryptoLotto",
  },
  formatDetection: {
    telephone: false,
  },

  // Open Graph (Facebook, LinkedIn, WhatsApp)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cryptolotto.app",
    siteName: "CryptoLotto",
    title: "CryptoLotto - Transparent Blockchain Lottery | Daily & Weekly Draws",
    description: "Play the world's most transparent blockchain lottery. $0.25 tickets, quantum-random draws, instant crypto prizes. 100% on-chain and verifiable!",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CryptoLotto - Blockchain Lottery",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    site: "@CryptoLotto",
    creator: "@CryptoLotto",
    title: "CryptoLotto - Transparent Blockchain Lottery",
    description: "Daily & Weekly crypto lottery with $0.25 tickets. Quantum-random, provably fair, instant payouts!",
    images: ["/og-image.png"],
  },

  // Additional SEO
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verification (add these after you get them)
  verification: {
    google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },

  // Category
  category: "technology",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#00f0ff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <StructuredData />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
