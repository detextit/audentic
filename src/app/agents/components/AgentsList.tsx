"use client";

import { Plus, Bot } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";

// Sample agents data - in real app this would come from your backend
const sampleAgents = [
    {
        id: "1",
        name: "Customer Support Agent",
        description: "Handles customer inquiries and support tickets",
    },
    {
        id: "2",
        name: "Sales Assistant",
        description: "Helps with product recommendations and sales",
    },
];

export function AgentsList() {
    const [agents] = useState(sampleAgents);
    const [selectedAgentId, setSelectedAgentId] = useState<string>();

    return (
        <Sidebar collapsible="none" className="h-screen w-64 border-r flex-shrink-0">
            <SidebarHeader className="gap-3.5 border-b p-3">
                <div className="flex w-full items-center justify-between">
                    <div className="text-base font-medium text-foreground">
                        Agents
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => {
                            // TODO: handle create new agent
                            console.log("Create new agent");
                        }}
                    >
                        <Plus className="size-2" /> Create
                    </Button>
                </div>
            </SidebarHeader>
            <SidebarContent className="flex-1">
                <SidebarGroup className="px-0">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {agents.map((agent) => (
                                <SidebarMenuItem key={agent.id}>
                                    <SidebarMenuButton
                                        tooltip={{
                                            children: agent.description,
                                            hidden: false,
                                        }}
                                        asChild
                                        isActive={selectedAgentId === agent.id}
                                        className="px-2.5 md:px-2"
                                        onClick={() => setSelectedAgentId(agent.id)}
                                    >
                                        <Label>
                                            <Bot className="h-4 w-4" />
                                            {agent.name}
                                        </Label>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
} 