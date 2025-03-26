"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BellRing } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { createLogger } from "@/utils/logger";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UserBudget } from "@/types/budget";

const logger = createLogger("Budget Warning");

interface BudgetWarningProps {
  threshold?: number;
  criticalThreshold?: number;
}

export function BudgetWarning({
  threshold = 3.0,
  criticalThreshold = 1.0,
}: BudgetWarningProps) {
  const { user } = useUser();
  const [userBudget, setUserBudget] = useState<UserBudget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserBudget();
    }
  }, [user]);

  const fetchUserBudget = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/subscription/budget");
      if (!response.ok) {
        throw new Error("Failed to fetch budget");
      }
      const data = await response.json();
      setUserBudget(data.budget);
    } catch (error) {
      logger.error("Error fetching budget:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !userBudget) {
    return null;
  }

  if (userBudget.planType === "byok") {
    return null;
  }

  const remainingBudget = userBudget.totalBudget - userBudget.usedAmount;

  const isBelowThreshold = remainingBudget <= threshold;
  const isCritical = remainingBudget <= criticalThreshold;

  if (!isBelowThreshold) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full p-0 h-8 w-8 ${
            isCritical
              ? "text-red-500 hover:text-red-600 hover:bg-red-50"
              : "text-amber-500 hover:text-amber-600 hover:bg-amber-50"
          }`}
        >
          <BellRing className="h-5 w-5" />
          {isCritical && (
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" side="right">
        <div className={`p-4 ${isCritical ? "bg-red-50" : "bg-amber-50"}`}>
          <div className="flex items-start justify-between">
            <div>
              <h4
                className={`font-medium text-sm ${
                  isCritical ? "text-red-800" : "text-amber-800"
                }`}
              >
                {isCritical ? "Critical Balance" : "Low Balance"}
              </h4>
              <p
                className={`text-sm mt-1 ${
                  isCritical ? "text-red-700" : "text-amber-700"
                }`}
              >
                You have ${remainingBudget.toFixed(2)} remaining in your
                account.
              </p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
