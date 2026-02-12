import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trainichi - Instagram oEmbed Integration Demo",
  description:
    "Demonstration of Trainichi's Instagram oEmbed integration for importing fitness workout videos into the app.",
  openGraph: {
    title: "Trainichi - Instagram oEmbed Integration",
    description:
      "See how Trainichi uses Instagram oEmbed to let users import workout videos into their personal training library.",
    images: [
      {
        url: "/instagram-embed-screenshot.png",
        width: 540,
        height: 700,
        alt: "Instagram workout video embed in Trainichi app",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trainichi - Instagram oEmbed Integration",
    description:
      "See how Trainichi uses Instagram oEmbed to let users import workout videos.",
    images: ["/instagram-embed-screenshot.png"],
  },
};

export default function OEmbedTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
