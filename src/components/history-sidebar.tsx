import { FileClock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import React from "react";
import { useAgents } from "@/hooks/useAgents";

export interface Session {
  session_id: string;
  agent_id: string;
  started_at: string;
  ended_at?: string;
  agent_name?: string;
}

interface HistorySidebarProps {
  isOpen: boolean;
  sessions: Session[];
  onSessionClick?: (sessionId: string) => void;
}

export const HistorySidebar = React.memo(function HistorySidebar({
  isOpen,
  sessions,
  onSessionClick,
}: HistorySidebarProps) {
  const router = useRouter();
  const { agents } = useAgents();

  const handleSessionClick = (sessionId: string) => {
    router.push(`/history/${sessionId}`);
    onSessionClick?.(sessionId);
  };

  const sessionsWithAgentNames = sessions.map((session) => ({
    ...session,
    agent_name: agents.find((agent) => agent.id === session.agent_id)?.name,
  }));

  return (
    <div
      className={`h-full bg-[hsl(var(--sidebar-background))] ${
        isOpen ? "w-[350px] border-l border-r" : "hidden"
      } border-[hsl(var(--sidebar-border))]`}
    >
      <div className="h-[72px] px-6 flex items-center border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center justify-between w-full">
          <h2 className="text-xl font-semibold">History</h2>
        </div>
      </div>
      <div className="p-4">
        <ul className="space-y-2">
          {sessionsWithAgentNames.map((session) => (
            <li
              key={session.session_id}
              onClick={() => handleSessionClick(session.session_id)}
              className={`p-2 hover:bg-[hsl(var(--sidebar-accent))] rounded-md cursor-pointer transition-colors ${
                window.location.pathname === `/history/${session.session_id}`
                  ? "bg-[hsl(var(--sidebar-accent))]"
                  : ""
              }`}
            >
              <Label className="flex items-start gap-3 cursor-pointer">
                <FileClock className="h-4 w-4 mt-1 text-[hsl(var(--sidebar-foreground))]" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate max-w-[250px]">
                    Agent:
                    {session.agent_name}
                  </span>
                  <span className="text-xs text-[hsl(var(--sidebar-foreground))] opacity-60">
                    {new Date(session.started_at).toLocaleString()}
                  </span>
                </div>
              </Label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});
