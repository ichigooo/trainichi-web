import type { Metadata } from "next";
import "./globals.css";
import { DM_Sans, Fraunces } from "next/font/google";

// "latin-ext" is required for the macron in "Aretē" (ē, U+0113).
const sans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});
const serif = Fraunces({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://trainichi.app"),
  title: "Aretē — Strength & climbing training for women",
  description:
    "Strength and climbing training, built for how women's bodies actually work.",
  openGraph: {
    title: "Aretē — Strength & climbing training for women",
    description:
      "Strength and climbing training, built for how women's bodies actually work.",
    url: "https://trainichi.app",
    siteName: "Aretē",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} bg-cream-bg text-cream-ink`}
    >
      <body className="min-h-screen bg-cream-bg font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
