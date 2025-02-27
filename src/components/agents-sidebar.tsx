import { Plus, Bot, Search, Settings } from "lucide-react";
import { useAgents } from "@/hooks/useAgents";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AgentsSidebarProps {
  onCreateClick: () => void;
}

export function AgentsSidebar({ onCreateClick }: AgentsSidebarProps) {
  const router = useRouter();
  const { agents } = useAgents();
  const [searchQuery, setSearchQuery] = useState("");

  const handleAgentClick = (agentId: string) => {
    router.replace(`/agents/${agentId}`);
  };

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isActive = (agentId: string) =>
    window.location.pathname === `/agents/${agentId}`;

  return (
    <div
      className="h-full bg-[hsl(var(--sidebar-background))] flex flex-col w-[350px] border-r
      border-[hsl(var(--sidebar-border))]"
    >
      {/* Fixed header */}
      <div className="h-[72px] px-6 flex items-center border-b border-[hsl(var(--sidebar-border))] shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-medium">AI Agents</h2>
          </div>
          <Button onClick={onCreateClick} size="sm" className="h-9 gap-1.5">
            <Plus className="h-4 w-4" />
            Create Agent
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-2 py-3 border-[hsl(var(--sidebar-border))]">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm bg-muted/50 border-muted focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        {filteredAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Bot className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No matching agents found" : "No agents available"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 text-xs h-8"
              onClick={onCreateClick}
            >
              Create your first agent
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => handleAgentClick(agent.id)}
                className={cn(
                  "px-3 py-2.5 rounded-md cursor-pointer transition-colors",
                  isActive(agent.id)
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-[hsl(var(--sidebar-accent))]"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                      isActive(agent.id)
                        ? "bg-primary/10 text-primary"
                        : "bg-muted/50 text-muted-foreground"
                    )}
                  >
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate max-w-[220px]">
                        {agent.name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {agent.description || "No description"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
