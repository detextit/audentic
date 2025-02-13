import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Audentic",
  description:
    "Create, test, and integrate AI voice agents into your web applications. Enable natural voice interactions, smart forms, and customer support with no code required.",
  keywords:
    "voice AI, website voice assistant, AI agents, voice integration, conversational AI, no-code voice AI, website accessibility, customer engagement",
  openGraph: {
    title: "Audentic | No Code Voice AI Agents for Websites",
    description:
      "Create and integrate AI voice agents into your website with no code required. Enable natural conversations, smart forms, and enhanced customer support.",
    url: "https://audentic.io",
    siteName: "Audentic",
    type: "website",
    images: [
      {
        url: "https://audentic.io/icon.png",
        width: 16,
        height: 16,
        alt: "Audentic Voice AI Platform",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "lIr3-vVrCTgSE3Maioh0xU-TkH5ck2q5vCUcz-dyNGo",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider afterSignOutUrl="https://audentic.io">
      <html
        lang="en"
        className={`${montserrat.variable} font-sans suppressHydrationWarning`}
      >
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Audentic",
                url: "https://audentic.io",
                logo: "https://audentic.io/icon.png",
                description: "No Code Voice AI Agents for Websites",
                sameAs: [
                  "https://twitter.com/audentic",
                  // Add other social media URLs
                ],
              }),
            }}
          />
          <link
            rel="icon"
            type="image/x-icon"
            href="https://audentic.io/favicon.ico"
          />
        </head>
        <body>
          <main>{children}</main>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
