"use client";

import { Button } from "@/components/ui/button";
import {
  Mail,
  ClipboardCheck,
  Navigation,
  HeadphonesIcon,
  Users,
  GraduationCap,
  FileSignature,
} from "lucide-react";
import { SessionControl } from "@audentic/react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqData } from "@/data/faq";
import ReactMarkdown from "react-markdown";
import { FeatureSection } from "@/components/feature-card-section";
import React from "react";

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    if (isSignedIn) {
      router.push("/agents");
    } else {
      router.push("/sign-in");
    }
  };

  // Add useEffect to log when script loads
  React.useEffect(() => {
    console.log("Checking for embed.js script...");
    const scriptElement = document.querySelector('script[src="/embed.js"]');
    console.log("Script element found:", scriptElement);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <header className="top-0 border-b bg-slate-50/70">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image
              src="/icon.png"
              alt="⋀⋃"
              width={24}
              height={24}
              className="w-6 h-6"
            />
            <span className="font-semibold text-lg">Audentic</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() =>
                window.open("https://audentic.mintlify.app", "_blank")
              }
            >
              Docs
            </Button>
            <Button onClick={handleGetStarted}>Get Started</Button>
          </div>
        </div>
      </header>
      <main>
        <div className="bg-gradient-to-b from-slate-100 to-slate-200">
          <section className="container mx-auto px-6 py-6">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="lg:w-1/2 space-y-6">
                <h1 className="text-5xl font-bold tracking-tight">
                  Enable voice for your website
                </h1>
                <p className="text-xl text-muted-foreground">
                  Create, test, and integrate voice AI agents into your web
                  applications.
                </p>
                <div className="flex gap-4">
                  <Button
                    size="lg"
                    className="font-semibold"
                    onClick={handleGetStarted}
                  >
                    Start Building
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() =>
                      (window.location.href =
                        "https://www.audentic.io/agents/94e2f732-6ef4-4089-a5bc-2bebdbc7818e/form")
                    }
                  >
                    Try it out!
                  </Button>
                </div>
              </div>
              <div className="lg:w-2/3">
                <div className="rounded-lg border bg-card p-6 shadow-lg">
                  <Image
                    src="/dashboard.png"
                    alt="Dashboard Preview"
                    className="rounded-md"
                    width={800}
                    height={500}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Features Section */}
        <FeatureSection />

        {/* Markets & Use Cases Section */}
        <section className="bg-slate-50/70">
          <div className="container mx-auto px-6 py-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">
                Revolutionize how users interact with your website
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16 max-w-7xl mx-auto">
              <div className="relative pl-16">
                <div className="absolute left-0 top-1 w-12 h-12 flex items-center justify-center rounded-full bg-primary/10">
                  <ClipboardCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Smart Forms</h3>
                <p className="text-muted-foreground">
                  Transform data collection into natural conversations. Perfect
                  for surveys, questionnaires, and feedback collection.
                </p>
              </div>

              <div className="relative pl-16">
                <div className="absolute left-0 top-1 w-12 h-12 flex items-center justify-center rounded-full bg-primary/10">
                  <FileSignature className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Document Assistance
                </h3>
                <p className="text-muted-foreground">
                  Simplify complex documents requiring e-signatures. From tax
                  forms to mortgages, make understanding and completing legal
                  documents effortless.
                </p>
              </div>

              <div className="relative pl-16">
                <div className="absolute left-0 top-1 w-12 h-12 flex items-center justify-center rounded-full bg-primary/10">
                  <Navigation className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Website Navigation
                </h3>
                <p className="text-muted-foreground">
                  Enable users to understand and navigate your website with
                  voice. Help users get to know your business and products
                  better.
                </p>
              </div>

              <div className="relative pl-16">
                <div className="absolute left-0 top-1 w-12 h-12 flex items-center justify-center rounded-full bg-primary/10">
                  <HeadphonesIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Customer Support</h3>
                <p className="text-muted-foreground">
                  Enable customer inquiries and support right from your website.
                  Agents can troubleshoot issues, provide solutions, and assist
                  with tasks.
                </p>
              </div>

              <div className="relative pl-16">
                <div className="absolute left-0 top-1 w-12 h-12 flex items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Digital Twins</h3>
                <p className="text-muted-foreground">
                  Allow visitors to get to know you through your digital twin.
                  Enhance your personal websites, blogs, and professional
                  profiles.
                </p>
              </div>

              <div className="relative pl-16">
                <div className="absolute left-0 top-1 w-12 h-12 flex items-center justify-center rounded-full bg-primary/10">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Education</h3>
                <p className="text-muted-foreground">
                  Provide personalized learning experiences and explanations.
                  From complex documents to new workflow onboarding, make
                  learning more engaging.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Hidden SEO content - visible to search engines but not users */}
        <div className="sr-only">
          <h2>About Audentic Voice AI Agents</h2>
          <p>
            Audentic provides cutting-edge voice AI agent technology that
            transforms how users interact with websites. Our platform enables
            businesses to create intelligent, conversational agents that
            understand natural language and can perform complex tasks like form
            filling, document assistance, and customer support.
          </p>
          <h3>Advanced Voice AI Technology</h3>
          <p>
            Built on state-of-the-art end to end speech technology,
            Audentic&apos;s voice agents deliver human-like interactions while
            maintaining high accuracy and reliability. Our agents can understand
            context, remember conversation history, and adapt their responses
            based on user needs.
          </p>
          <h3>Seamless Integration</h3>
          <p>
            Whether you&apos;re using React, popular website builders, or custom
            solutions, Audentic&apos;s voice agents can be integrated into your
            website with minimal effort. Our platform handles the complex
            technical aspects, allowing you to focus on creating engaging voice
            experiences for your users.
          </p>
          a
        </div>

        <div className="container mx-auto px-6 py-24">
          <h2 className="text-4xl font-bold text-center mb-6">
            Frequently Asked Questions
          </h2>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqData.map((item, index) => (
                <AccordionItem key={index} value={`item-${index + 1}`}>
                  <AccordionTrigger className="text-xl font-semibold">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          ul: ({ ...props }) => (
                            <ul
                              className="list-disc pl-4 space-y-2 mt-2"
                              {...props}
                            />
                          ),
                          li: ({ ...props }) => (
                            <li className="text-muted-foreground" {...props} />
                          ),
                          code: ({
                            children,
                            ...props
                          }: React.HTMLProps<HTMLElement>) => (
                            <div className="relative">
                              <button
                                className="absolute right-0 top-0 p-1 text-gray-500 hover:text-gray-700"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    children as string
                                  );
                                  alert("Code copied to clipboard!");
                                }}
                              >
                                <ClipboardCheck className="h-4 w-4" />
                              </button>
                              <code
                                className="bg-slate-100 text-gray-800 rounded px-1 py-0.5"
                                {...props}
                              >
                                {children}
                              </code>
                            </div>
                          ),
                          pre: ({
                            children,
                            ...props
                          }: React.HTMLProps<HTMLPreElement>) => (
                            <pre
                              className="bg-slate-100 rounded p-4 overflow-x-auto my-4"
                              {...props}
                            >
                              {children}
                            </pre>
                          ),
                        }}
                      >
                        {item.answer}
                      </ReactMarkdown>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* CTA Section */}
        <section className="border-t bg-slate-900 text-white">
          <div className="container mx-auto px-6 py-16 text-center items-center justify-center">
            <div className="flex flex-row items-left space-x-10">
              <div className="text-sm text-gray-400">© 2025 Audentic</div>
              <div className="text-sm text-gray-400 flex flex-row items-center space-x-2">
                <Mail className="h-4 w-4" />
                <div>info@audentic.io</div>
              </div>
            </div>
          </div>
        </section>
      </main>
      {/* Add SessionControl with fixed positioning */}
      <motion.div>
        <div className="rounded-lg animate-pulse-subtle">
          <SessionControl
            agentId="25b9a905-b2f4-49d9-97e9-4c6891214d57"
            widgetConfiguration={{
              showBackgroundCard: true,
              title: "Need Help?",
              backgroundColor: "#FFFFFF",
              textColor: "#666666",
              width: "200",
              height: "110",
              buttonText: "Voice Chat",
              primaryColor: "#000000",
              buttonTextColor: "#FFFFFF",
              borderRadius: "12",
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
