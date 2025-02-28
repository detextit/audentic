"use client";

import { History, Bot } from "lucide-react";
import React, { useState, useEffect } from "react";
import { NavUser } from "@/components/nav-user";
import { AgentsSidebar } from "@/components/agents-sidebar";
import { useAgents } from "@/hooks/useAgents";
import { HistorySidebar } from "@/components/history-sidebar";
import { AgentBuilder } from "@/app/agents/AgentBuilder";
import { AgentFormDialog } from "@/components/agent-form-dialog";
import SessionHistory from "@/app/history/SessionHistory";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useSessions } from "@/hooks/useSessions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Home() {
  // TODO: Setting the default state of the sidebar to collapsed
  // const [isCollapsed, setIsCollapsed] = useState(() => {
  // if (typeof window !== "undefined") {
  //   const stored = localStorage.getItem("sidebarCollapsed");
  //   return stored ? JSON.parse(stored) : false;
  // }
  // return false;
  // });

  const isCollapsed = true;

  const [sidebarOpen, setSidebarOpen] = useState("Agents");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const { agents, refreshAgents } = useAgents();
  const { sessions } = useSessions();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/agents")) {
      setSidebarOpen("Agents");
      if (agents.length > 0) {
        const urlAgentId = pathname.split("/agents/")?.[1] || null;
        if (urlAgentId && agents.some((agent) => agent.id === urlAgentId)) {
          setSelectedAgentId(urlAgentId);
        }
        // else {
        //   setSelectedAgentId(agents[0].id);
        // }
      }
    } else if (pathname.startsWith("/history")) {
      setSidebarOpen("History");
      if (sessions.length > 0) {
        const urlSessionId = pathname.split("/history/")?.[1] || null;
        if (urlSessionId) {
          setSelectedSessionId(urlSessionId);
        }
        // else {
        //   setSelectedSessionId(sessions[0]?.session_id);
        // }
      }
    }
  }, [pathname, agents, sessions]);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const handleCreateAgent = () => {
    setIsCreateDialogOpen(true);
  };

  const handleDialogClose = async () => {
    setIsCreateDialogOpen(false);
    const updatedAgents = await refreshAgents();
    if (updatedAgents && updatedAgents.length > 0) {
      setSelectedAgentId(updatedAgents[0].id);
      router.replace(`/agents/${updatedAgents[0].id}`);
    }
  };

  const handleHistoryClick = () => {
    if (sessions.length > 0) {
      router.replace(`/history/${sessions[0].session_id}`);
    } else {
      router.replace("/history");
    }
  };

  const handleAgentsClick = () => {
    if (agents.length > 0) {
      router.replace(`/agents/${agents[0].id}`);
    } else {
      router.replace("/agents");
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
              <span className="font-semibold text-4lg">Audentic</span>
            )}
          </div>

          <div className="space-y-4">
            <div
              className={`flex ${isCollapsed ? "justify-center" : "space-x-3"} 
                            cursor-pointer hover:text-[hsl(var(--sidebar-primary))] rounded-md ${
                              isCollapsed ? "p-2" : "pl-1 pr-2 py-2"
                            }
                            ${
                              sidebarOpen === "Agents"
                                ? "bg-[hsl(var(--sidebar-accent))]"
                                : ""
                            }`}
              onClick={handleAgentsClick}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Bot size={24} className="min-w-6" />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Agents</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
                              sidebarOpen === "History"
                                ? "bg-[hsl(var(--sidebar-accent))]"
                                : ""
                            }`}
              onClick={handleHistoryClick}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <History size={24} className="min-w-6" />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>History</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {!isCollapsed && <span>History</span>}
            </div>
          </div>

          <div className="mt-auto mb-4">
            <NavUser userName="" isCollapsed={isCollapsed} />
          </div>
        </div>

        {/* Add a subtle separator between main nav and inner sidebar */}
        <div className="w-px h-full bg-[hsl(var(--sidebar-border))]"></div>

        {sidebarOpen === "Agents" && (
          <AgentsSidebar onCreateClick={handleCreateAgent} />
        )}

        {sidebarOpen === "History" && <HistorySidebar />}
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-auto bg-white">
        {/* <header className="h-[72px] border-b border-[hsl(var(--sidebar-border))] px-6 flex items-center bg-white shrink-0">
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
        </header> */}
        <main className="flex-1 p-6 overflow-auto">
          {sidebarOpen === "History" && selectedSessionId ? (
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
