import type React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Code,
  Share2,
  FilePenLineIcon as Signature,
  Bot,
  Heart,
} from "lucide-react";

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
    <Card className="bg-white shadow-sm border rounded-xl">
      <CardContent className="p-6">
        <div className="rounded-full bg-slate-100 w-12 h-12 flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-slate-600">{description}</p>
      </CardContent>
    </Card>
  );
}

export function FeatureSection() {
  return (
    <section className="border-t bg-slate-50 py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything you need to build voice agents
        </h2>

        <div className="max-w-6xl mx-auto">
          {/* First row - 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <FeatureCard
              icon={<Code className="h-6 w-6" />}
              title="No Code Required"
              description="Build your voice agents in minutes with our intuitive interface. We handle all the technical complexities for you."
            />
            <FeatureCard
              icon={<Share2 className="h-6 w-6" />}
              title="Easy Integration"
              description="Embed using our React component or choose from our add-ons for popular website builders."
            />
            <FeatureCard
              icon={<Signature className="h-6 w-6" />}
              title="Built For You"
              description="Import your documents in any format to ensure your agents have comprehensive knowledge of your business."
            />
          </div>

          {/* Second row - 2 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:w-2/3 mx-auto">
            <FeatureCard
              icon={<Bot className="h-6 w-6" />}
              title="Truly Agentic"
              description="Empower your agents with browser actions to enhance customer experience and automate interactions."
            />
            <FeatureCard
              icon={<Heart className="h-6 w-6" />}
              title="Emotionally Intelligent"
              description="Create agents that understand customer emotions and embody your brand's values for truly human-centric interactions."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
