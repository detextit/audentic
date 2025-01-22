"use client"

import * as React from "react"
import { Bot, Terminal, FileClock } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { NavUser } from "@/components/nav-user"
import { Button } from "@/components/ui/button"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import AgentsPage from "@/app/agents/page"
import SessionsPage from "@/app/history/page"

// This is sample data
const navItems = [
  {
    title: "Agents",
    url: "/agents",
    icon: Bot,
    size: 5,
  },
  {
    title: "History",
    url: "/history",
    icon: FileClock,
    size: 5,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const [selectedItem, setSelectedItem] = React.useState<string>("Agents")

  return (
    <div className="flex h-screen">
      <Sidebar
        collapsible="none"
        className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r flex-shrink-0"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0" tooltip={{ children: "VoiceAct", hidden: false }}>
                <Link href="/">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Terminal className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">VoiceAct</span>
                    <span className="truncate text-xs">Agent Builder</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="flex-1">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      asChild
                      isActive={pathname.startsWith(item.url)}
                      size="lg"
                      className="md:h-8 md:p-0 flex aspect-square size-8 items-center justify-center rounded-lg"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedItem(item.title)
                          window.history.pushState({}, '', item.url)
                        }}
                      >
                        <item.icon className="size-5 min-w-5 min-h-5" />
                      </Button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>
      <div>
        {selectedItem === "History" && <SessionsPage />}
        {selectedItem === "Agents" && <AgentsPage />}
      </div>
    </div>
  )
}
