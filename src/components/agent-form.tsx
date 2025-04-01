import { useState } from "react";
import { AgentDBConfig } from "@/types/agent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAgents } from "@/hooks/useAgents";
import { createLogger } from "@/utils/logger";

const logger = createLogger("Agent Form");

interface AgentFormProps {
  agent?: AgentDBConfig;
  onClose: () => void;
}

export function AgentForm({ agent, onClose }: AgentFormProps) {
  const { createAgent, updateAgent } = useAgents();
  const date = new Date();
  const [formData, setFormData] = useState<AgentDBConfig>({
    id: agent?.id ?? "",
    userId: agent?.userId ?? "",
    createdAt: agent?.createdAt ?? date,
    updatedAt: agent?.updatedAt ?? date,
    name: agent?.name ?? "",
    description: agent?.description ?? "",
    instructions: agent?.instructions ?? "",
    initiateConversation: agent?.initiateConversation ?? true,
    tools: agent?.tools ?? [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      logger.info("Submitting form data:", formData); // Debug log
      let newAgent;
      if (agent) {
        newAgent = await updateAgent(agent.id, formData);
      } else {
        newAgent = await createAgent(formData);
        // Navigate to the newly created agent
        if (newAgent && newAgent.id) {
          window.history.pushState({}, "", `/agents/${newAgent.id}`);
          // Force a reload of the current page to ensure the agent builder refreshes
          window.location.href = `/agents/${newAgent.id}`;
        }
      }
      onClose();
    } catch (error) {
      logger.error("Form submission error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <Input
          placeholder="Agent Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">{agent ? "Update" : "Create"}</Button>
      </div>
    </form>
  );
}
