import { FileClock, Clock, Search, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useCallback, useMemo } from "react";
import { useAgents } from "@/hooks/useAgents";
import { useSessions } from "@/hooks/useSessions";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface Session {
  session_id: string;
  agent_id: string;
  started_at: string;
  ended_at?: string;
  agent_name?: string;
}

interface HistorySidebarProps {
  onSelectSession: (sessionId: string) => void;
}

export const HistorySidebar = React.memo(function HistorySidebar({
  onSelectSession,
}: HistorySidebarProps) {
  const { sessions } = useSessions();
  const router = useRouter();
  const { agents } = useAgents();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSessionClick = useCallback(
    (sessionId: string) => {
      onSelectSession(sessionId);
    },
    [onSelectSession]
  );

  const sessionsWithAgentNames = useMemo(
    () =>
      sessions.map((session: Session) => ({
        ...session,
        agent_name:
          agents.find((agent) => agent.id === session.agent_id)?.name ||
          "Unnamed Agent",
      })),
    [sessions, agents]
  );

  const filteredSessions = useMemo(
    () =>
      sessionsWithAgentNames.filter((session) =>
        session.agent_name?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [sessionsWithAgentNames, searchQuery]
  );

  // Group sessions by date
  const groupedSessions = useMemo(
    () =>
      filteredSessions.reduce((groups, session) => {
        const date = new Date(session.started_at).toLocaleDateString();
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(session);
        return groups;
      }, {} as Record<string, Session[]>),
    [filteredSessions]
  );

  // Sort dates in descending order (newest first)
  const sortedDates = useMemo(
    () =>
      Object.keys(groupedSessions).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
      ),
    [groupedSessions]
  );

  const isActive = useCallback(
    (sessionId: string) => window.location.pathname === `/history/${sessionId}`,
    []
  );

  return (
    <div
      className="h-full bg-[hsl(var(--sidebar-background))] flex flex-col w-[350px] border-r
      border-[hsl(var(--sidebar-border))]"
    >
      <div className="h-[72px] px-6 flex items-center border-b border-[hsl(var(--sidebar-border))] shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-medium">History</h2>
          </div>
        </div>
      </div>

      <div className="px-2 py-3 border-[hsl(var(--sidebar-border))]">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm bg-muted/50 border-muted focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <FileClock className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "No matching sessions found"
                : "No sessions available"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((date) => (
              <div key={date} className="px-2">
                <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{date}</span>
                </div>
                <ul className="mt-1 space-y-1">
                  {groupedSessions[date].map((session) => (
                    <li
                      key={session.session_id}
                      onClick={() => handleSessionClick(session.session_id)}
                      className={cn(
                        "px-3 py-2 rounded-md cursor-pointer transition-colors",
                        isActive(session.session_id)
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-[hsl(var(--sidebar-accent))]"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex items-center justify-center w-7 h-7 rounded-full shrink-0 mt-0.5",
                            isActive(session.session_id)
                              ? "bg-primary/10 text-primary"
                              : "bg-muted/50 text-muted-foreground"
                          )}
                        >
                          <FileClock className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate max-w-[250px]">
                            {session.agent_name}
                          </span>
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {new Date(session.started_at).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
