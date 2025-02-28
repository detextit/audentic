"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Loader, Mail, Calendar } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface PlanFeature {
  name: string;
  included: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number | null;
  interval: "month" | "year";
  features: PlanFeature[];
  popular?: boolean;
  isContact?: boolean;
}

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserSubscription {
  status: "active" | "inactive" | "trialing" | "past_due" | "canceled";
  plan: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Basic features for personal use",
    price: 0,
    interval: "month",
    features: [
      { name: "1 voice agent", included: true },
      { name: "5,000 tokens per day", included: true },
      { name: "Basic analytics", included: true },
      { name: "Community support", included: true },
      { name: "Custom agent branding", included: false },
      { name: "Advanced analytics", included: false },
      { name: "Priority support", included: false },
    ],
  },
  {
    id: "hobby",
    name: "Hobby",
    description: "Essential features for professionals",
    price: 39,
    interval: "month",
    popular: true,
    features: [
      { name: "Up to 5 voice agents", included: true },
      { name: "25,000 tokens per day", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Email support", included: true },
      { name: "Custom agent branding", included: true },
      { name: "API access", included: true },
      { name: "Dedicated account manager", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom solutions for large organizations",
    price: null,
    interval: "month",
    isContact: true,
    features: [
      { name: "Unlimited voice agents", included: true },
      { name: "Unlimited tokens", included: true },
      { name: "Advanced analytics", included: true },
      { name: "24/7 phone support", included: true },
      { name: "Custom agent branding", included: true },
      { name: "API access", included: true },
      { name: "Dedicated account manager", included: true },
      { name: "Custom integrations", included: true },
      { name: "SLA guarantees", included: true },
    ],
  },
];

export function SubscriptionDialog({
  open,
  onOpenChange,
}: SubscriptionDialogProps) {
  const { user } = useUser();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">(
    "month"
  );
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  useEffect(() => {
    if (open) {
      fetchUserSubscription();
    }
  }, [open]);

  const fetchUserSubscription = async () => {
    setIsLoadingSubscription(true);
    try {
      const response = await fetch("/api/subscription");
      if (!response.ok) {
        throw new Error("Failed to fetch subscription");
      }
      const data = await response.json();
      setSubscription(data.subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      // Default to free plan if there's an error
      setSubscription({
        status: "active",
        plan: "free",
        currentPeriodEnd: new Date().toISOString(),
        cancelAtPeriodEnd: false,
      });
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (planId === subscription?.plan) {
      return; // Already on this plan
    }

    setSelectedPlan(planId);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingInterval }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleContactSales = () => {
    window.location.href =
      "mailto:info@audentic.io?subject=Enterprise Plan Inquiry";
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
            Subscription Plans
          </DialogTitle>
          <DialogDescription>
            Choose the plan that best fits your needs. All paid plans include a
            14-day free trial.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {!isLoadingSubscription && subscription && (
          <div className="bg-muted/30 p-3 rounded-md mb-4">
            <div className="text-sm">
              <span className="font-medium">Current plan: </span>
              <Badge variant="outline" className="ml-1 capitalize">
                {subscription.plan}
              </Badge>
              {subscription.status === "active" &&
                subscription.plan !== "free" && (
                  <span className="ml-2">
                    Renews on{" "}
                    {new Date(
                      subscription.currentPeriodEnd
                    ).toLocaleDateString()}
                  </span>
                )}
              {subscription.status === "trialing" && (
                <Badge
                  variant="outline"
                  className="ml-2 bg-primary/10 text-primary border-0"
                >
                  Trial
                </Badge>
              )}
              {subscription.cancelAtPeriodEnd && (
                <Badge
                  variant="outline"
                  className="ml-2 bg-destructive/10 text-destructive border-0"
                >
                  Cancels at period end
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-center mb-6">
          <div className="bg-muted/30 p-1 rounded-lg inline-flex items-center">
            <Button
              variant={billingInterval === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setBillingInterval("month")}
              className="rounded-md"
            >
              Monthly
            </Button>
            <Button
              variant={billingInterval === "year" ? "default" : "ghost"}
              size="sm"
              onClick={() => setBillingInterval("year")}
              className="rounded-md"
            >
              Yearly
              <Badge
                variant="outline"
                className="ml-2 bg-primary/10 text-primary border-0"
              >
                Save 20%
              </Badge>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subscriptionPlans.map((plan) => (
            <Card
              key={plan.id}
              className={`border ${
                plan.popular ? "border-primary shadow-md" : "border-border"
              } relative overflow-hidden flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0">
                  <div className="bg-primary text-primary-foreground text-xs font-medium py-1 px-3 rounded-bl-lg">
                    Popular
                  </div>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <div className="mt-2">
                  {plan.price !== null ? (
                    <>
                      <span className="text-3xl font-bold">
                        $
                        {billingInterval === "year"
                          ? (plan.price * 0.8 * 12).toFixed(2)
                          : plan.price.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        /{billingInterval}
                      </span>
                    </>
                  ) : (
                    <span className="text-xl font-medium">Custom pricing</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 flex-grow">
                <p className="text-sm font-medium mb-2">Features include:</p>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
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
                {plan.isContact ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleScheduleDemo}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Call
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    disabled={isLoading || plan.id === subscription?.plan}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {isLoading && selectedPlan === plan.id ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : plan.id === subscription?.plan ? (
                      "Current Plan"
                    ) : subscription?.plan === "free" && plan.price ? (
                      "Upgrade"
                    ) : (
                      "Subscribe"
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground mt-4">
          Need something else?{" "}
          <a
            href="mailto:info@audentic.io"
            className="text-primary hover:underline"
          >
            Contact us
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
