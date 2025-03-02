"use client";

import { History, Bot, Clock } from "lucide-react";
import React, {
  useState,
  useEffect,
  useCallback,
  lazy,
  Suspense,
  useMemo,
} from "react";
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
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Lazy load heavy components
const LazyAgentBuilder = lazy(() =>
  import("@/app/agents/AgentBuilder").then((mod) => ({
    default: mod.AgentBuilder,
  }))
);
const LazySessionHistory = lazy(() => import("@/app/history/SessionHistory"));

// Preload the lazy components based on priority
if (typeof window !== "undefined") {
  // Get the current path to determine what to preload first
  const path = window.location.pathname;
  const isAgentsPath = path.startsWith("/agents") || path === "/";

  // Immediately preload both components to ensure they're available
  // This prevents issues with components not being ready when needed
  import("@/app/agents/AgentBuilder");
  import("@/app/history/SessionHistory");
}

// Loading fallback with skeleton UI for better perceived performance
const LoadingFallback = () => (
  <div className="w-full max-w-5xl mx-auto">
    <div className="flex items-center justify-between mb-8">
      <div>
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-32 bg-muted animate-pulse rounded mt-1" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 w-24 bg-muted animate-pulse rounded" />
      </div>
    </div>

    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-6">
          <div className="h-6 w-32 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-full bg-muted animate-pulse rounded opacity-50 mt-1" />
          <div className="h-[100px] w-full bg-muted animate-pulse rounded mt-4" />
        </div>
      ))}
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
  const { agents, refreshAgents, loading: agentsLoading } = useAgents();
  const { sessions, loading: sessionsLoading } = useSessions();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const router = useRouter();
  const pathname = usePathname();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [priorityLoading, setPriorityLoading] = useState(true);

  // Determine if we're currently loading the active tab's data
  const isActiveTabLoading = useMemo(() => {
    // Only consider loading state for initial render, not for subsequent data fetches
    // This prevents the skeleton from showing indefinitely
    if (!isInitialLoad) return false;
    return sidebarOpen === "Agents" ? agentsLoading : sessionsLoading;
  }, [sidebarOpen, agentsLoading, sessionsLoading, isInitialLoad]);

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

  // Set initial state based on URL and prioritize loading
  useEffect(() => {
    // Determine which tab is active based on the URL
    const isAgentsTab = pathname.startsWith("/agents") || pathname === "/";
    setSidebarOpen(isAgentsTab ? "Agents" : "History");

    // Set a shorter timeout for the priority loading state
    const priorityTimer = setTimeout(() => {
      setPriorityLoading(false);
    }, 500);

    // Set a shorter timeout for the overall initial loading state
    const initialLoadTimer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 1000);

    if (isAgentsTab) {
      if (agents.length > 0) {
        const urlAgentId = pathname.split("/agents/")?.[1] || null;
        if (urlAgentId && agents.some((agent) => agent.id === urlAgentId)) {
          setSelectedAgentId(urlAgentId);
        } else if (agents[0]?.id && pathname === "/") {
          // Auto-select first agent if on home page
          setSelectedAgentId(agents[0].id);
          updateUrl(`/agents/${agents[0].id}`);
        }
      }
    } else if (pathname.startsWith("/history")) {
      if (sessions.length > 0) {
        const urlSessionId = pathname.split("/history/")?.[1] || null;
        if (
          urlSessionId &&
          sessions.some((session) => session.session_id === urlSessionId)
        ) {
          setSelectedSessionId(urlSessionId);
        } else if (sessions[0]?.session_id) {
          // Auto-select first session if none is specified in URL
          setSelectedSessionId(sessions[0].session_id);
          updateUrl(`/history/${sessions[0].session_id}`);
        }
      }
    }

    return () => {
      clearTimeout(priorityTimer);
      clearTimeout(initialLoadTimer);
    };
  }, [pathname, agents, sessions, updateUrl]);

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
      // If there's already a selected session and it exists in the sessions list, keep it selected
      if (
        selectedSessionId &&
        sessions.some((session) => session.session_id === selectedSessionId)
      ) {
        updateUrl(`/history/${selectedSessionId}`);
      } else {
        // Otherwise select the first session
        setSelectedSessionId(sessions[0].session_id);
        updateUrl(`/history/${sessions[0].session_id}`);
      }
    } else {
      // Clear selection if no sessions
      setSelectedSessionId(undefined);
      updateUrl("/history");
    }
  }, [sessions, updateUrl, selectedSessionId]);

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

        {/* Only load the sidebar that's currently active during priority loading */}
        {sidebarOpen === "Agents" ? (
          <AgentsSidebar
            onCreateClick={handleCreateAgent}
            onSelectAgent={handleSelectAgent}
          />
        ) : (
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
            {isInitialLoad ? (
              <LoadingFallback />
            ) : sidebarOpen === "History" ? (
              selectedSessionId ? (
                <LazySessionHistory sessionId={selectedSessionId} />
              ) : sessions.length > 0 ? (
                // If no session is selected but sessions exist, show the first one
                <LazySessionHistory sessionId={sessions[0].session_id} />
              ) : (
                // Fallback if no sessions exist
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <Clock className="h-16 w-16 text-muted-foreground/40 mb-4" />
                  <h2 className="text-xl font-medium mb-2">
                    No Session History
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Your conversation history will appear here
                  </p>
                </div>
              )
            ) : selectedAgentId ? (
              <LazyAgentBuilder agentId={selectedAgentId} />
            ) : agents.length > 0 ? (
              // If no agent is selected but agents exist, show the first one
              <LazyAgentBuilder agentId={agents[0].id} />
            ) : (
              // Fallback if no agents exist
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Bot className="h-16 w-16 text-muted-foreground/40 mb-4" />
                <h2 className="text-xl font-medium mb-2">
                  No Agents Available
                </h2>
                <p className="text-muted-foreground mb-6">
                  Create your first agent to get started
                </p>
                <Button onClick={handleCreateAgent}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Agent
                </Button>
              </div>
            )}
          </Suspense>
        </main>
      </div>

      {/* Only show dialog when needed */}
      {isCreateDialogOpen && (
        <AgentFormDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          selectedAgent={null}
          onClose={handleDialogClose}
        />
      )}
    </div>
  );
});

export default Home;
