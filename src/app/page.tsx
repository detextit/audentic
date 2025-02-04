"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Bot, Clipboard, Share2, Mail } from "lucide-react";
import { SessionControl } from "@audentic/react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <header className="border-b">
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
            <Button onClick={handleGetStarted}>Get Started</Button>
          </div>
        </div>
      </header>

      <main>
        <div className="bg-slate-100">
          <section className="container mx-auto px-6 py-10">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="lg:w-1/2 space-y-6">
                <h1 className="text-5xl font-bold tracking-tight">
                  Enable voice for your website
                </h1>
                <p className="text-xl text-muted-foreground">
                  Create, test, and integrate AI voice agents into your web
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
              <div className="lg:w-1/2">
                <div className="rounded-lg border bg-card p-4 shadow-lg">
                  <Image
                    src="/dashboard.png"
                    alt="Dashboard Preview"
                    className="rounded-md"
                    width={500}
                    height={400}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Features Section */}
        <section className="border-t bg-slate-50/50 py-8">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">
              Everything You Need to Build Voice Agents
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Bot className="h-8 w-8" />}
                title="Voice Builder"
                description="Create voice agents using our intuitive voice based agent. No keyboard required."
              />
              <FeatureCard
                icon={<Share2 className="h-8 w-8" />}
                title="Easy Integration"
                description="Drop our React component into your app and get started in minutes."
              />
              <FeatureCard
                icon={<Clipboard className="h-8 w-8" />}
                title="Default tools"
                description="Agents can access and share knowledge through clipboard interactions."
              />
            </div>
          </div>
        </section>

        {/* Markets & Use Cases Section */}
        <section className="container mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Transform Your Customer's Experience
            </h2>
            <p className="text-muted-foreground">
              Revolutionizing how users interact with web applications across
              industries
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Smart Forms</CardTitle>
                <CardDescription>
                  Transform form filling into voice conversations. Perfect for
                  applications, surveys, and data collection processes.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Document Navigation</CardTitle>
                <CardDescription>
                  Enable users to navigate and interact with documentations,
                  manuals, and web resources through voice.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Browser Use</CardTitle>
                <CardDescription>
                  Make your websites agentic with voice and enable the AI
                  experience your customers want.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

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
      <div className="fixed bottom-4 right-4 z-50">
        <SessionControl agentId={process.env.AUDENTIC_PR_AGENT || ""} />
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-none shadow-md">
      <CardContent className="pt-6">
        <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4 text-primary">
          {icon}
        </div>
        <h3 className="font-semibold text-xl mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
