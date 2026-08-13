import type { Metadata } from "next";
import { IBM_Plex_Mono, Outfit } from "next/font/google";

import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Explain This",
  description:
    "Paste a code snippet and get a plain-English explanation, how hard it is to follow, and readability notes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${ibmPlexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
