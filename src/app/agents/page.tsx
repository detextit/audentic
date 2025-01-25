"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAgents } from "@/hooks/useAgents";
import { AgentConfig } from "@audentic/react";
import React, { useState } from "react";
import { navItems } from "@/components/app-sidebar";
import { usePathname } from "next/navigation";
import { AgentForm } from "@/components/agent-form";
import Link from "next/link";

export default function AgentsPage() {
  const pathname = usePathname();
  const { agents, loading } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
  const [showForm, setShowForm] = useState(false);
  const activeItem =
    navItems.find((item) => pathname.startsWith(item.url)) || navItems[0];

  return (
    <>
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
