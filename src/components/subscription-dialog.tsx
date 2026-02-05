"use client";

import {
  Dialog,
  DialogContent,
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
import { Check, Sparkles, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createLogger } from "@/utils/logger";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
const logger = createLogger("Subscription Dialog");
interface PlanFeature {
  name: string;
  included?: boolean;
}

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SubscriptionDialog = React.memo(function SubscriptionDialog({
  open,
  onOpenChange,
}: SubscriptionDialogProps) {
  const [userBudget, setUserBudget] = useState<any>(null);
  const [isLoadingBudget, setIsLoadingBudget] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoize feature lists to prevent recreating on each render
  const freeFeatures = useMemo<PlanFeature[]>(
    () => [
      { name: "Unlimited voice agents", included: true },
      { name: "Monthly credit", included: true },
      { name: "Basic analytics", included: true },
      { name: "Community support", included: true },
      { name: "Custom branding", included: false },
      { name: "Custom integrations", included: false },
    ],
    []
  );

  const byokFeatures = useMemo<PlanFeature[]>(
    () => [
      { name: "Unlimited voice agents", included: true },
      { name: "Use your OpenAI credit", included: true },
      { name: "Basic analytics", included: true },
      { name: "Community support", included: true },
      { name: "Custom branding", included: false },
      { name: "Custom integrations", included: false },
    ],
    []
  );

  // Fetch user budget
  const fetchUserBudget = async () => {
    try {
      setIsLoadingBudget(true);
      const response = await fetch("/api/subscription/budget");
      if (!response.ok) {
        throw new Error("Failed to fetch budget");
      }
      const data = await response.json();
      setUserBudget(data.budget);
    } catch (error) {
      logger.error("Error fetching budget:", error);
      setUserBudget(null);
    } finally {
      setIsLoadingBudget(false);
    }
  };

  // Handle API key verification
  const verifyAndSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/subscription/api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save API key");
      }

      toast({
        title: "API Key Saved",
        description: "Your OpenAI API key has been saved successfully",
      });

      // Refresh user budget to show updated plan
      fetchUserBudget();
      setApiKey("");
    } catch (error: any) {
      logger.error("Error saving API key:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save API key",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle API key removal
  const removeApiKey = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/subscription/api-key", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove API key");
      }

      toast({
        title: "API Key Removed",
        description: "Your OpenAI API key has been removed",
      });

      // Refresh user budget to show updated plan
      fetchUserBudget();
    } catch (error: any) {
      logger.error("Error removing API key:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove API key",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Effect to fetch budget when dialog opens
  useEffect(() => {
    if (open) {
      fetchUserBudget();
      setApiKey("");
    }
  }, [open]);

  // Memoize feature list rendering
  const renderFeatureList = useCallback((features: PlanFeature[]) => {
    return features.map((feature, index) => (
      <li key={index} className="flex items-start gap-2 text-sm">
        <span className="mt-0.5">
          {feature.included ? (
            <Check className="h-4 w-4 text-primary" />
          ) : (
            <span className="h-4 w-4 block rounded-full border border-muted-foreground/30" />
          )}
        </span>
        <span className={feature.included ? "" : "text-muted-foreground"}>
          {feature.name}
        </span>
      </li>
    ));
  }, []);

  // Mask the API key to show only first 2 and last 4 characters
  const maskApiKey = (key: string) => {
    if (!key) return "";
    if (key.length <= 6) return key; // Don't mask if too short
    return `${key.substring(0, 2)}••••••••••${key.substring(key.length - 4)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1100px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Plans & Pricing
          </DialogTitle>
        </DialogHeader>

        {/* Budget Summary */}
        {!isLoadingBudget && userBudget && (
          <div className="mb-6 p-4 bg-muted/30 rounded-lg">
            <div className="flex flex-wrap justify-between items-center">
              <div>
                <h3 className="text-sm font-medium">Available Credits</h3>
                <p className="text-2xl font-bold text-primary">
                  ${(userBudget.totalBudget - userBudget.usedAmount).toFixed(2)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Current Usage</h3>
                <p className="text-2xl font-bold">
                  ${userBudget.usedAmount.toFixed(2)}
                </p>
              </div>
              {userBudget.planType === "free" && (
                <div>
                  <h3 className="text-sm font-medium">Next Refresh</h3>
                  <p className="text-lg">
                    {new Date(userBudget.nextRefreshDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Free Plan Card */}
          <Card className="border border-border relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0">
              {userBudget?.planType === "free" && (
                <Badge className="bg-primary text-primary-foreground text-xs font-medium py-1 px-3 rounded-bl-lg">
                  Current Plan
                </Badge>
              )}
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
              <ul className="space-y-2">{renderFeatureList(freeFeatures)}</ul>
            </CardContent>
          </Card>

          {/* BYOK Plan Card */}
          <Card className="border border-border relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0">
              {userBudget?.planType === "byok" && (
                <Badge className="bg-primary text-primary-foreground text-xs font-medium py-1 px-3 rounded-bl-lg">
                  Current Plan
                </Badge>
              )}
            </div>
            <CardHeader>
              <CardTitle>BYOK</CardTitle>
              <p className="text-sm text-muted-foreground">
                Bring Your Own Key (OpenAI)
              </p>
              <div className="mt-2">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-muted-foreground ml-1">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 flex-grow">
              <p className="text-sm font-medium mb-2">Features include:</p>
              <ul className="space-y-2">{renderFeatureList(byokFeatures)}</ul>
            </CardContent>
            <CardFooter className="mt-auto flex flex-col gap-2">
              {userBudget?.planType === "byok" ? (
                <>
                  <Label className="w-full text-center h-6">
                    {maskApiKey(userBudget.openaiApiKey)}
                  </Label>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={removeApiKey}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Removing..." : "Remove API Key"}
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    className="w-full"
                    placeholder="Enter your OpenAI API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    type="password"
                  />
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={verifyAndSaveApiKey}
                    disabled={isSubmitting || !apiKey.trim()}
                  >
                    <Key className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Verifying..." : "Add API Key"}
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>

        </div>
      </DialogContent>
    </Dialog>
  );
});
