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
import { useAgents } from "@/hooks/useAgents";
import { AgentConfig } from "@audentic/react";
import React, { useState } from "react";
import { AgentForm } from "@/components/agent-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AgentsPage({ setSelectedAgent, selectedAgent }: { setSelectedAgent: (agent: AgentConfig | null) => void, selectedAgent: AgentConfig | null }) {

    const { agents, loading } = useAgents();
    const [showForm, setShowForm] = useState(false);

    return (
        <>
            <Sidebar collapsible="none" className="hidden flex-1 md:flex">
                <SidebarHeader className="gap-3.5 border-b p-4">
                    <div className="flex w-full items-center justify-between">
                        <div className="text-base font-medium text-foreground">
                            Agents
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => {
                                setSelectedAgent(null);
                                setShowForm(true);
                            }}
                        >
                            <Plus className="size-2" /> Create
                        </Button>

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
                                                onClick={() => {
                                                    setSelectedAgent(agent);
                                                    setShowForm(false);
                                                }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Bot className="h-4 w-4" />
                                                    {agent.name}
                                                </div>
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
                            "Create New Agent"
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


