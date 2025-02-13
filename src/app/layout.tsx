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
    "Build and deploy AI voice agents on your website in minutes. Enhance customer support, improve accessibility, and boost engagement with natural voice interactions - no coding required.",
  keywords:
    "voice AI platform, website voice assistant, conversational AI, no-code AI, voice chatbot, AI customer service, website accessibility, voice user interface, virtual assistant, voice integration, AI automation, customer engagement",
  alternates: {
    canonical: "https://audentic.io",
  },
  authors: [{ name: "Audentic" }],
  creator: "Audentic",
  publisher: "Audentic",
  openGraph: {
    title: "Audentic | No Code Voice AI Agents for Websites",
    description:
      "Build and deploy AI voice agents on your website in minutes. Enhance customer support, improve accessibility, and boost engagement with natural voice interactions.",
    url: "https://audentic.io",
    siteName: "Audentic",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/dashboard.png",
        width: 1200,
        height: 630,
        alt: "Audentic Voice AI Platform Dashboard",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Audentic | Create Voice AI Agents for Your Website",
    description:
      "Build and deploy AI voice agents on your website in minutes. No coding required.",
    creator: "@audentic",
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
      notranslate: false,
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
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Audentic",
                url: "https://audentic.io",
                logo: "https://audentic.io/logo.png",
                description: "No Code Voice AI Agents for Websites",
                sameAs: ["https://twitter.com/audentic"],
              }),
            }}
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
