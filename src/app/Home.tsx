"use client";

import { History, PanelLeftClose, PanelLeft, Bot } from "lucide-react";
import React, { useState, useEffect } from "react";
import { NavUser } from "@/components/nav-user";
import { AgentsSidebar } from "@/components/agents-sidebar";
import { useAgents } from "@/hooks/useAgents";
import { HistorySidebar, Session } from "@/components/history-sidebar";
import { useUser } from "@clerk/nextjs";
import { AgentBuilder } from "@/app/agents/AgentBuilder";
import { AgentFormDialog } from "@/components/agent-form-dialog";
import SessionHistory from "@/app/history/SessionHistory";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
export default function Home() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAgentsSidebarOpen, setIsAgentsSidebarOpen] = useState(false);
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const { agents, refreshAgents } = useAgents();
  const [sessions, setSessions] = useState<Session[]>([]);
  const { user } = useUser();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function fetchSessions() {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const response = await fetch(`${baseUrl}/api/sessions`);
        if (!response.ok) throw new Error("Failed to fetch sessions");
        const data = await response.json();
        setSessions(data);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      }
    }

    fetchSessions();
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/agents")) {
      setIsAgentsSidebarOpen(true);
      setIsHistorySidebarOpen(false);

      if (agents.length > 0) {
        const urlAgentId = pathname.split("/agents/")?.[1] || null;
        if (urlAgentId && agents.some((agent) => agent.id === urlAgentId)) {
          setSelectedAgentId(urlAgentId);
        } else {
          setSelectedAgentId(agents[0].id);
          router.push(`/agents/${agents[0].id}`);
        }
      }
    } else if (pathname.startsWith("/history")) {
      setIsHistorySidebarOpen(true);
      setIsAgentsSidebarOpen(false);

      if (sessions.length > 0) {
        const urlSessionId = pathname.split("/history/")?.[1] || null;
        if (urlSessionId) {
          setSelectedSessionId(urlSessionId);
        } else {
          setSelectedSessionId(sessions[0]?.session_id);
          router.push(`/history/${sessions[0]?.session_id}`);
        }
      }
    }
  }, [pathname, agents, sessions]);

  const handleCreateAgent = () => {
    setIsCreateDialogOpen(true);
  };

  const handleAgentClick = (agentId: string) => {
    if (agentId !== selectedAgentId) {
      setSelectedAgentId(agentId);
      router.replace(`/agents/${agentId}`);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    router.replace(`/history/${sessionId}`);
  };

  const handleDialogClose = async () => {
    setIsCreateDialogOpen(false);
    const updatedAgents = await refreshAgents();
    if (updatedAgents && updatedAgents.length > 0) {
      setSelectedAgentId(updatedAgents[0].id);
      router.push(`/agents/${updatedAgents[0].id}`);
    }
  };

  const handleHistoryClick = () => {
    if (sessions.length > 0) {
      router.push(`/history/${sessions[0].session_id}`);
    } else {
      router.push("/history");
    }
  };

  const handleAgentsClick = () => {
    if (agents.length > 0) {
      router.push(`/agents/${agents[0].id}`);
    } else {
      router.push("/agents");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex">
        <div
          className={`bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] transition-all duration-300 ${
            isCollapsed ? "w-16" : "w-57"
          } p-4 flex flex-col h-screen`}
        >
          <div
            className={`flex items-center ${
              isCollapsed ? "justify-center" : "space-x-3"
            } mb-8 cursor-pointer hover:opacity-80`}
            onClick={() => router.push("/")}
          >
            <div className="rounded p-1">
              <Image
                src="/icon.png"
                alt="⋀⋃"
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </div>
            {!isCollapsed && (
              <span className="font-semibold text-4lg">AUDENTIC</span>
            )}
          </div>

          <div className="space-y-4">
            <div
              className={`flex ${isCollapsed ? "justify-center" : "space-x-3"} 
                            cursor-pointer hover:text-[hsl(var(--sidebar-primary))] rounded-md ${
                              isCollapsed ? "p-2" : "pl-1 pr-2 py-2"
                            }
                            ${
                              isAgentsSidebarOpen
                                ? "bg-[hsl(var(--sidebar-accent))]"
                                : ""
                            }`}
              onClick={handleAgentsClick}
            >
              <Bot size={24} className="min-w-6" />
              {!isCollapsed && <span>Agents</span>}
            </div>
            <div
              className={`flex items-center ${
                isCollapsed ? "justify-center px-2" : "space-x-3"
              } 
                            cursor-pointer hover:text-[hsl(var(--sidebar-primary))] rounded-md ${
                              isCollapsed ? "p-2" : "pl-1 pr-2 py-2"
                            }
                            ${
                              isHistorySidebarOpen
                                ? "bg-[hsl(var(--sidebar-accent))]"
                                : ""
                            }`}
              onClick={handleHistoryClick}
            >
              <History size={24} className="min-w-6" />
              {!isCollapsed && <span>History</span>}
            </div>
          </div>

          <div className="mt-auto mb-4">
            <NavUser userName={user?.fullName || user?.username || ""} />
          </div>
        </div>

        <AgentsSidebar
          isOpen={isAgentsSidebarOpen}
          agents={agents}
          onAgentClick={handleAgentClick}
          selectedAgentId={selectedAgentId}
          onCreateClick={handleCreateAgent}
        />

        <HistorySidebar
          isOpen={isHistorySidebarOpen}
          sessions={sessions}
          onSessionClick={handleSessionClick}
        />
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-auto bg-white">
        <header className="h-[72px] border-b border-[hsl(var(--sidebar-border))] px-6 flex items-center bg-white shrink-0">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-[hsl(var(--sidebar-foreground))] hover:text-[hsl(var(--sidebar-primary))]"
          >
            {isCollapsed ? (
              <PanelLeft size={20} />
            ) : (
              <PanelLeftClose size={20} />
            )}
          </button>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {isHistorySidebarOpen && selectedSessionId ? (
            <SessionHistory sessionId={selectedSessionId} />
          ) : (
            selectedAgentId && <AgentBuilder agentId={selectedAgentId} />
          )}
        </main>
      </div>

      <AgentFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        selectedAgent={null}
        onClose={handleDialogClose}
      />
    </div>
  );
}
