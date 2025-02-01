"use client";

import { UserButton, useClerk, useUser } from "@clerk/nextjs";

interface NavUserProps {
  userName: string;
}

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
        {userName || user?.primaryEmailAddress?.emailAddress || "My Account"}
      </span>
    </div>
  );
}
