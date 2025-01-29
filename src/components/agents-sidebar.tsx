import { Plus, MoreVertical } from "lucide-react";
import { AgentConfig } from "@audentic/react";
import { Button } from "@/components/ui/button";

interface AgentsSidebarProps {
    isOpen: boolean;
    agents: AgentConfig[];
    onClose: () => void;
    onAgentClick: (agentId: string) => void;
    selectedAgentId?: string | null;
    onCreateClick: () => void;
}

export function AgentsSidebar({
    isOpen,
    agents,
    onClose,
    onAgentClick,
    selectedAgentId,
    onCreateClick,
}: AgentsSidebarProps) {
    return (
        <div
            className={`h-full bg-[hsl(var(--sidebar-background))] flex flex-col ${isOpen ? "w-[350px] border-l border-r" : "hidden"
                } border-[hsl(var(--sidebar-border))]`}
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
                            className={`bg-white rounded-lg p-4 border hover:border-gray-400 cursor-pointer transition-colors
                                ${agent.id === selectedAgentId
                                    ? "border-gray-400"
                                    : "border-gray-200"
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1" onClick={() => onAgentClick(agent.id)}>
                                    <div className="font-medium">{agent.name}</div>
                                </div>
                                <button className="p-1 hover:bg-gray-100 rounded-md">
                                    <MoreVertical className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
