"use client";

import * as React from "react";
import {
  Bot,
  BookOpen,
  Command,
  PlusCircle,
  Terminal,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAgents } from "@/hooks/useAgents";
import { AgentForm } from "@/components/agent-form";
import { AgentConfig } from "@voiceact/mabel/types";

import { NavUser } from "@/components/nav-user";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// This is sample data
const navItems = [
  {
    title: "Agents",
    url: "/agents",
    icon: Bot,
  },
  {
    title: "History",
    url: "/history",
    icon: BookOpen,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { setOpen } = useSidebar();
  const { agents, loading } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
  const [showForm, setShowForm] = useState(false);

  const activeItem =
    navItems.find((item) => pathname.startsWith(item.url)) || navItems[0];

  return (
    <>
      <Sidebar
        collapsible="icon"
        className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
        {...props}
      >
        {/* First sidebar with main navigation */}
        <Sidebar
          collapsible="none"
          className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r"
        >
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  asChild
                  className="md:h-8 md:p-0"
                  tooltip={{ children: "VoiceAct", hidden: false }}
                >
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
          <SidebarContent>
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
                        className="px-2.5 md:px-2"
                      >
                        <Link href={item.url}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
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

        {/* Second sidebar with context-specific content */}
        <Sidebar collapsible="none" className="hidden flex-1 md:flex">
          <SidebarHeader className="gap-3.5 border-b p-4">
            <div className="flex w-full items-center justify-between">
              <div className="text-base font-medium text-foreground">
                {activeItem.title}
              </div>
              {activeItem.url === "/agents" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedAgent(null);
                    setShowForm(true);
                  }}
                >
                  <Plus className="size-2" /> Create
                </Button>
              )}
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup className="px-0">
              <SidebarGroupContent>
                <SidebarMenu>
                  {loading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Loading agents...
                    </div>
                  ) : agents.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No agents created yet
                    </div>
                  ) : (
                    agents.map((agent) => (
                      <SidebarMenuItem key={agent.id}>
                        <SidebarMenuButton
                          tooltip={{
                            children: agent.instructions,
                            hidden: false,
                          }}
                          asChild
                          className="px-2.5 md:px-2"
                        >
                          <Link href={`/agents/${agent.id}`}>
                            <Bot className="h-4 w-4" />
                            {agent.name}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </Sidebar>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedAgent ? "Edit Agent" : "Create New Agent"}
            </DialogTitle>
          </DialogHeader>
          <AgentForm
            agent={selectedAgent ?? undefined}
            onClose={() => {
              setShowForm(false);
              setSelectedAgent(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
