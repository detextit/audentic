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
  title: "Audentic | AI Voice Agents for Websites | No-Code Voice Integration",
  description:
    "Transform your website with AI voice agents. Create natural conversations, smart forms, and 24/7 customer support - no coding required. Try Audentic today.",
  keywords:
    "voice AI, website voice assistant, AI agents, voice integration, conversational AI, no-code voice AI, website accessibility, customer engagement, chatbot alternative, voice user interface, website automation, AI customer service",
  openGraph: {
    title: "Audentic | AI Voice Agents for Websites | No-Code Platform",
    description:
      "Transform your website with AI voice agents. Enable natural conversations and 24/7 customer support without coding. Start your free trial today.",
    url: "https://audentic.io",
    siteName: "Audentic",
    type: "website",
    images: [
      {
        url: "https://audentic.io/dashboard.png",
        width: 2940,
        height: 1658,
        alt: "Audentic - AI Voice Agents Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Audentic | AI Voice Agents for Websites | No-Code Platform",
    description:
      "Transform your website with AI voice agents. Create natural conversations and 24/7 customer support without coding. Get started with Audentic today.",
    site: "@audentic_io",
    creator: "@audentic_io",
    images: ["https://audentic.io/cover.png"],
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
  alternates: {
    canonical: "https://audentic.io",
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
              __html: JSON.stringify([
                {
                  "@context": "https://schema.org",
                  "@type": "Organization",
                  name: "Audentic",
                  url: "https://audentic.io",
                  logo: "https://audentic.io/icon.png",
                  description: "No Code Voice AI Agents for Websites",
                  sameAs: [
                    "https://x.com/audentic_io",
                    // Add other social media URLs
                  ],
                },
                {
                  "@context": "https://schema.org",
                  "@type": "SoftwareApplication",
                  name: "Audentic",
                  applicationCategory: "Voice AI Platform",
                  description:
                    "No-code platform for creating and integrating AI voice agents into websites",
                  offers: {
                    "@type": "Offer",
                    availability: "https://schema.org/InStock",
                  },
                  category: "Voice AI Software",
                  operatingSystem: "Web-based",
                },
              ]),
            }}
          />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        </head>
        <body>
          <main>{children}</main>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
