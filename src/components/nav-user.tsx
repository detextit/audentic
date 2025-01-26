"use client"

import { UserButton } from "@clerk/nextjs"

interface NavUserProps {
  userName: string;
}

export function NavUser({ userName }: NavUserProps) {
  return (
    <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-[hsl(var(--sidebar-accent))] cursor-pointer">
      <UserButton />
      <span className="text-sm font-medium truncate">{userName}</span>
    </div>
  );
}
