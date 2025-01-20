"use client"

import { UserButton } from "@clerk/nextjs"

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <UserButton/>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
