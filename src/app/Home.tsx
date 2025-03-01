"use client";

import { History, Bot } from "lucide-react";
import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { NavUser } from "@/components/nav-user";
import { AgentsSidebar } from "@/components/agents-sidebar";
import { useAgents } from "@/hooks/useAgents";
import { HistorySidebar } from "@/components/history-sidebar";
import { AgentFormDialog } from "@/components/agent-form-dialog";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useSessions } from "@/hooks/useSessions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Lazy load heavy components
const LazyAgentBuilder = lazy(() =>
  import("@/app/agents/AgentBuilder").then((mod) => ({
    default: mod.AgentBuilder,
  }))
);
const LazySessionHistory = lazy(() => import("@/app/history/SessionHistory"));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="flex flex-col items-center gap-3 text-muted-foreground">
      <div className="h-6 w-6 animate-spin border-2 border-current border-t-transparent rounded-full" />
      <p className="text-sm">Loading...</p>
    </div>
  </div>
);

const Home = React.memo(function Home() {
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

  // Update URL without full page refresh
  const updateUrl = useCallback((url: string) => {
    window.history.pushState({}, "", url);
  }, []);

  // Handle agent selection
  const handleSelectAgent = useCallback(
    (agentId: string) => {
      setSelectedAgentId(agentId);
      setSidebarOpen("Agents");
      updateUrl(`/agents/${agentId}`);
    },
    [updateUrl]
  );

  // Handle session selection
  const handleSelectSession = useCallback(
    (sessionId: string) => {
      setSelectedSessionId(sessionId);
      setSidebarOpen("History");
      updateUrl(`/history/${sessionId}`);
    },
    [updateUrl]
  );

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

  const handleDialogClose = useCallback(async () => {
    setIsCreateDialogOpen(false);
    // Call refreshAgents but don't expect a return value
    await refreshAgents(true);
    // Use the agents from state instead
    if (agents && agents.length > 0) {
      handleSelectAgent(agents[0].id);
    }
  }, [agents, refreshAgents, handleSelectAgent]);

  const handleHistoryClick = useCallback(() => {
    setSidebarOpen("History");
    if (sessions.length > 0) {
      setSelectedSessionId(sessions[0].session_id);
      updateUrl(`/history/${sessions[0].session_id}`);
    } else {
      updateUrl("/history");
    }
  }, [sessions, updateUrl]);

  const handleAgentsClick = useCallback(() => {
    setSidebarOpen("Agents");
    if (agents.length > 0) {
      setSelectedAgentId(agents[0].id);
      updateUrl(`/agents/${agents[0].id}`);
    } else {
      updateUrl("/agents");
    }
  }, [agents, updateUrl]);

  // Listen for popstate events (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith("/agents/")) {
        const agentId = path.split("/agents/")[1];
        handleSelectAgent(agentId);
      } else if (path.startsWith("/history/")) {
        const sessionId = path.split("/history/")[1];
        handleSelectSession(sessionId);
      } else if (path === "/agents") {
        handleAgentsClick();
      } else if (path === "/history") {
        handleHistoryClick();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [handleSelectAgent, handleSelectSession, handleAgentsClick, handleHistoryClick]);

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
            onClick={() => {
              updateUrl("/");
              router.push("/");
            }}
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
          <AgentsSidebar
            onCreateClick={handleCreateAgent}
            onSelectAgent={handleSelectAgent}
          />
        )}

        {sidebarOpen === "History" && (
          <HistorySidebar onSelectSession={handleSelectSession} />
        )}
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
          <Suspense fallback={<LoadingFallback />}>
            {sidebarOpen === "History" && selectedSessionId ? (
              <LazySessionHistory sessionId={selectedSessionId} />
            ) : (
              selectedAgentId && <LazyAgentBuilder agentId={selectedAgentId} />
            )}
          </Suspense>
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
});

export default Home;
