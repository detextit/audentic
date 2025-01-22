"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AgentsList } from "@/app/agents/components/AgentsList";

export default function AgentsPage() {
    return (
        <div className="flex h-screen w-full overflow-hidden">
            <AgentsList />
            <div className="flex-1 w-full overflow-hidden">
                <div className="h-full flex items-center justify-center text-gray-500">
                    Select an agent to view details
                </div>
            </div>
        </div>
    );
} 