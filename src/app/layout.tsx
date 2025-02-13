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
  title: "Audentic | No Code Voice AI Agents for Websites",
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
        url: "/dashboard.png", // You'll need to create this
        width: 1200,
        height: 630,
        alt: "Audentic Voice AI Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Audentic | No Code Voice AI Agents for Websites",
    description:
      "Create and integrate AI voice agents into your website with no code required.",
    images: ["/dashboard.png"],
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
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en" className={`${montserrat.variable} font-sans`}>
        <body>
          <main>{children}</main>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
