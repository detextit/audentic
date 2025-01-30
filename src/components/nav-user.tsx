"use client";

import { UserButton, useClerk } from "@clerk/nextjs";

interface NavUserProps {
  userName: string;
}

export function NavUser({ userName }: NavUserProps) {
  const { openUserProfile } = useClerk();

  return (
    <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-[hsl(var(--sidebar-accent))] cursor-pointer">
      <UserButton />
      <span
        onClick={() => openUserProfile()}
        className="text-sm font-medium truncate"
      >
        {userName}
      </span>
    </div>
  );
}
