"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Sparkles, Mail, Calendar, Zap } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";

interface PlanFeature {
  name: string;
  included?: boolean;
}

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionDialog({
  open,
  onOpenChange,
}: SubscriptionDialogProps) {
  const { user } = useUser();

  const freeFeatures: PlanFeature[] = [
    { name: "3 voice agents", included: true },
    { name: "10$ credit per month", included: true },
    { name: "Basic analytics", included: true },
    { name: "Community support", included: true },
    { name: "Shared compute engine", included: true },
    { name: "Custom agent branding", included: false },
    { name: "Custom integrations", included: false },
  ];

  const customFeatures: PlanFeature[] = [
    { name: "Unlimted voice agents", included: true },
    { name: "Custom credit per month", included: true },
    { name: "Advanced analytics", included: true },
    { name: "Priority support", included: true },
    { name: "Premium compute engine", included: true },
    { name: "Custom agent branding", included: true },
    { name: "Custom integrations", included: true },
  ];

  const handleContactUs = () => {
    window.location.href =
      "mailto:info@audentic.io?subject=Subscription Inquiry";
  };

  const handleScheduleDemo = () => {
    window.open("https://calendly.com/audentic-info", "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Plans & Pricing
          </DialogTitle>
          <DialogDescription>
            Start with our free plan or contact us for a custom solution
            tailored to your needs.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Free Plan Card */}
          <Card className="border border-border relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0">
              <Badge className="bg-primary text-primary-foreground text-xs font-medium py-1 px-3 rounded-bl-lg">
                Current Plan
              </Badge>
            </div>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <p className="text-sm text-muted-foreground">
                Basic features for personal use
              </p>
              <div className="mt-2">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-muted-foreground ml-1">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 flex-grow">
              <p className="text-sm font-medium mb-2">Features include:</p>
              <ul className="space-y-2">
                {freeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <span className="h-4 w-4 block rounded-full border border-muted-foreground/30" />
                      )}
                    </span>
                    <span
                      className={
                        feature.included ? "" : "text-muted-foreground"
                      }
                    >
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button className="w-full" variant="outline" disabled={true}>
                <Zap className="mr-2 h-4 w-4" />
                Current Plan
              </Button>
            </CardFooter>
          </Card>

          {/* Custom Solution Card */}
          <Card className="border border-primary shadow-md relative overflow-hidden flex flex-col">
            <CardHeader>
              <CardTitle>Custom Solution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tailored to your specific requirements
              </p>
              <div className="mt-2">
                <span className="text-xl font-medium">Custom pricing</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 flex-grow">
              <p className="text-sm font-medium mb-2">Features include:</p>
              <ul className="space-y-2">
                {customFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </span>
                    <span>{feature.name}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button
                className="w-full"
                variant="default"
                onClick={handleContactUs}
              >
                <Mail className="mr-2 h-4 w-4" />
                Contact Us
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={handleScheduleDemo}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Demo
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="text-center text-sm text-muted-foreground mt-4">
          Have questions?{" "}
          <a
            href="mailto:info@audentic.io"
            className="text-primary hover:underline"
          >
            Email our team
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
