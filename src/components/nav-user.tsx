"use client";

import { UserButton, useClerk, useUser } from "@clerk/nextjs";
import { UserResource } from "@clerk/types";
interface NavUserProps {
  userName: string;
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

export function NavUser({ userName }: NavUserProps) {
  const { openUserProfile } = useClerk();
  const { user } = useUser();

  return (
    <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-[hsl(var(--sidebar-accent))] cursor-pointer">
      <UserButton />
      <span
        onClick={() => openUserProfile()}
        className="text-sm font-medium truncate"
      >
        {userName || getDisplayName(user)}
      </span>
    </div>
  );
}
