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
  title: "Audentic | Voice AI Agents for Website Interaction | No-Code",
  description:
    "Transform your website with voice AI agents that enable natural conversations and digital interactions. No coding required. Enhance user engagement today.",
  keywords:
    "audentic, elevenlabs, openai, realtime, voice AI, website voice assistant, AI agents, voice integration, conversational AI, no-code voice AI, website accessibility, customer engagement, chatbot alternative, voice user interface, website automation, AI customer service, natural language processing, voice recognition, speech synthesis, virtual assistant",
  openGraph: {
    title: "Audentic | Voice AI Agents for Website Interaction | No-Code",
    description:
      "Create intelligent voice interactions for your website. Our AI agents provide natural conversations and automated support, improving user experience instantly.",
    url: "https://www.audentic.io",
    siteName: "Audentic",
    type: "website",
    images: [
      {
        url: "https://www.audentic.io/dashboard.png",
        width: 2940,
        height: 1658,
        alt: "Audentic - Voice AI Agent Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Audentic | Voice AI Agents for Website Interaction | No-Code",
    description:
      "Enhance your website with voice AI agents. Enable natural conversations and automated support without coding. Start improving engagement today.",
    site: "@audentic_io",
    creator: "@audentic_io",
    images: ["https://www.audentic.io/cover.png"],
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
    canonical: "https://www.audentic.io",
    languages: {
      en: "https://www.audentic.io",
    },
    types: {
      "text/html": [{ url: "https://audentic.io" }],
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider afterSignOutUrl="https://www.audentic.io">
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
                  url: "https://www.audentic.io",
                  logo: "https://www.audentic.io/icon.png",
                  description:
                    "Leading provider of No-Code Voice AI Agents for Websites. We specialize in creating intelligent, conversational AI solutions that enhance website functionality and user experience. Our platform enables businesses to implement sophisticated voice interactions without technical expertise.",
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
                    "Advanced no-code platform for creating and integrating voice AI agents into websites. Our solution offers natural language processing, real-time voice recognition, and intelligent conversation management to transform website interactions. Perfect for businesses seeking to enhance customer engagement and support capabilities.",
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
