"use client";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SessionControls } from "@audentic/react";
import AgentsPage from "./agents/page";
import React, { useEffect, useState } from "react";
import SessionsPage from "./history/page";
import SessionContent from "./history/components/SessionContent";
import { AgentConfig } from "@audentic/react";
import { AgentFormDialog } from "@/components/agent-form-dialog";
import AgentBuilder from "./agents/[id]/page";

function App() {
  const [selectedItem, setSelectedItem] = useState<string>("Agents");
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>();
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAgent) {
      setSelectedAgentId(selectedAgent.id);
    }
  }, [selectedAgent]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <div className="flex h-screen">
        <AppSidebar setSelectedItem={setSelectedItem} />
        {selectedItem === "History" && <SessionsPage setSelectedSessionId={setSelectedSessionId} selectedSessionId={selectedSessionId} isLoading={isLoading} setIsLoading={setIsLoading} error={error} setError={setError} />}
        {selectedItem === "Agents" && <AgentsPage setSelectedAgent={setSelectedAgent} selectedAgent={selectedAgent} />}

        <main className="flex h-screen">
          {selectedSessionId && selectedItem === "History" && (
            <SessionContent
              error={error || undefined}
              isLoading={isLoading}
              selectedSessionId={selectedSessionId}
            />
          )}

          {selectedAgentId && selectedItem === "Agents" && (
            <AgentBuilder agentId={selectedAgentId} />
          )}
        </main>
      </div>
      <div className="fixed right-8 bottom-8">
        <SessionControls />
      </div>

    </SidebarProvider >
  );
}

export default App;
