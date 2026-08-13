import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Explain This",
  description:
    "Paste a code snippet and get a plain-English explanation plus complexity notes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
