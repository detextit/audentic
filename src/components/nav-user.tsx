"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { UserResource } from "@clerk/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ChartColumn,
  ChevronsUpDown,
  LogOut,
  Sparkles,
  UserCog,
  ArrowUpRight,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { UsageDialog } from "@/components/usage-dialog";
import { SubscriptionDialog } from "@/components/subscription-dialog";
import { Badge } from "@/components/ui/badge";

interface NavUserProps {
  userName: string;
  isCollapsed: boolean;
}

interface UserSubscription {
  status: "active" | "inactive" | "trialing" | "past_due" | "canceled";
  plan: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

const getDisplayName = (user: UserResource | null | undefined): string => {
  if (!user) return "Audentic.User";
  if (user.username) {
    return user.username.length > 10
      ? user.username.slice(0, 10) + "..."
      : user.username;
  }

  if (user.fullName) {
    const [firstName, ...lastNames] = user.fullName.split(" ");
    if (firstName.length > 12) {
      return (
        firstName[0].toUpperCase() +
        "." +
        (lastNames[0] ? lastNames[0][0].toUpperCase() : "")
      );
    }
    if ((firstName + " " + lastNames.join(" ")).length > 13) {
      return firstName + "." + lastNames.map((n) => n[0]).join("");
    }

    return user.fullName;
  }

  if (user.primaryEmailAddress?.emailAddress) {
    const email = user.primaryEmailAddress.emailAddress.split("@")[0];
    return email.length > 13 ? email.slice(0, 10) + "..." : email;
  }

  return "Audentic.user";
};

export function NavUser({ userName, isCollapsed }: NavUserProps) {
  const { signOut, openUserProfile } = useClerk();
  const { user } = useUser();
  const isMobile = useIsMobile();
  const [showUsageDialog, setShowUsageDialog] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  const displayName = userName || getDisplayName(user);
  const email = user?.primaryEmailAddress?.emailAddress || "user@example.com";
  const avatarUrl = user?.imageUrl;

  useEffect(() => {
    fetchUserSubscription();
  }, []);

  const fetchUserSubscription = async () => {
    setIsLoadingSubscription(true);
    try {
      const response = await fetch("/api/stripe/subscription");
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

  // Get initials for avatar fallback
  const getInitials = () => {
    if (!user) return "AU";
    if (user.fullName) {
      const names = user.fullName.split(" ");
      return names.length > 1
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : names[0].slice(0, 2).toUpperCase();
    }
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return "AU";
  };

  const handleOpenUsage = () => {
    setIsDropdownOpen(false);
    setTimeout(() => {
      setShowUsageDialog(true);
    }, 100);
  };

  const handleOpenSubscription = () => {
    setIsDropdownOpen(false);
    setTimeout(() => {
      setShowSubscriptionDialog(true);
    }, 100);
  };

  const handleSignOut = () => {
    setIsDropdownOpen(false);
    signOut();
  };

  const handleOpenUserProfile = () => {
    setIsDropdownOpen(false);
    openUserProfile();
  };

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          {isCollapsed ? (
            <Avatar className="h-8 w-8 rounded-md cursor-pointer">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
          ) : (
            <Button variant="ghost">
              <Avatar className="h-8 w-8 rounded-md">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          side={isMobile ? "bottom" : "right"}
          align="end"
          sideOffset={4}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="rounded-lg">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="truncate text-xs">{email}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={handleOpenSubscription}
              className="flex justify-between items-center"
            >
              <div className="flex items-center">
                <Sparkles className="mr-2 h-4 w-4" />
                <span>
                  {!isLoadingSubscription && subscription ? (
                    <span className="flex items-center">
                      <span className="mr-2">
                        Plan:{" "}
                        {subscription.plan.charAt(0).toUpperCase() +
                          subscription.plan.slice(1)}
                      </span>
                      {subscription.plan === "free" && (
                        <Badge
                          variant="outline"
                          className="bg-primary/10 text-primary border-0 text-xs"
                        >
                          Upgrade
                        </Badge>
                      )}
                    </span>
                  ) : (
                    "Subscription"
                  )}
                </span>
              </div>
              {!isLoadingSubscription &&
                subscription &&
                subscription.plan !== "free" && (
                  <Badge
                    variant="outline"
                    className="bg-muted text-muted-foreground border-0 text-xs"
                  >
                    Manage
                  </Badge>
                )}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleOpenUserProfile}>
              <UserCog className="mr-2" />
              Account
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleOpenUsage}>
              <ChartColumn className="mr-2" />
              Usage
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <UsageDialog open={showUsageDialog} onOpenChange={setShowUsageDialog} />

      <SubscriptionDialog
        open={showSubscriptionDialog}
        onOpenChange={setShowSubscriptionDialog}
      />
    </>
  );
}
