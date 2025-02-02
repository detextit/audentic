import { Plus } from "lucide-react";
import { useAgents } from "@/hooks/useAgents";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface AgentsSidebarProps {
  onCreateClick: () => void;
}

export function AgentsSidebar({ onCreateClick }: AgentsSidebarProps) {
  const router = useRouter();
  const { agents } = useAgents();

  const handleAgentClick = (agentId: string) => {
    router.replace(`/agents/${agentId}`);
  };

  return (
    <div
      className={`h-full bg-[hsl(var(--sidebar-background))] flex flex-col w-[350px] border-l border-r 
      border-[hsl(var(--sidebar-border))]`}
    >
      {/* Fixed header */}
      <div className="h-[72px] px-6 flex items-center border-b border-[hsl(var(--sidebar-border))] shrink-0">
        <div className="flex items-center justify-between w-full">
          <h2 className="text-xl font-semibold">AI Agents</h2>
          <Button onClick={onCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => handleAgentClick(agent.id)}
              className={`bg-white rounded-lg p-4 border hover:border-gray-400 cursor-pointer transition-colors
                                ${
                                  window.location.pathname ===
                                  `/agents/${agent.id}`
                                    ? "border-gray-400"
                                    : "border-gray-200"
                                }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium">{agent.name}</div>
                </div>
                {/* <button
                  className="p-1 hover:bg-gray-100 rounded-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </button> */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
