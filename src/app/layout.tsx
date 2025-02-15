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
  title: "Audentic | AI Voice Agents for Websites",
  description:
    "Transform your website with intelligent AI voice agents that revolutionize user interaction. Create natural, engaging conversations, streamline form filling, and provide comprehensive 24/7 customer support - all without any coding knowledge. Our advanced voice AI technology enhances website accessibility, improves user engagement, and delivers personalized experiences. Try Audentic today and join the future of web interaction.",
  keywords:
    "audentic, elevenlabs, openai realtime, voice AI, website voice assistant, AI agents, voice integration, conversational AI, no-code voice AI, website accessibility, customer engagement, chatbot alternative, voice user interface, website automation, AI customer service, natural language processing, voice recognition, speech synthesis, virtual assistant",
  openGraph: {
    title: "Audentic | AI Voice Agents for Websites",
    description:
      "Transform your website with cutting-edge AI voice agents. Enable natural, human-like conversations and comprehensive 24/7 customer support without any coding requirements. Our intelligent voice assistants enhance user experience, improve accessibility, and streamline customer interactions. Start your free trial today and experience the power of voice AI.",
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
    title: "Audentic | AI Voice Agents for Websites",
    description:
      "Transform your website with sophisticated AI voice agents. Create natural conversations, automate customer support, and enhance user engagement without coding. Our platform offers seamless integration, advanced voice recognition, and intelligent conversation management. Get started with Audentic today for a more interactive web presence.",
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
                    "Advanced no-code platform for creating and integrating AI voice agents into websites. Our solution offers natural language processing, real-time voice recognition, and intelligent conversation management to transform website interactions. Perfect for businesses seeking to enhance customer engagement and support capabilities.",
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
