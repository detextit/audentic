import { useState } from "react";
import { AgentConfig } from "@audentic/react";
import { CreateAgentInput } from "@/agentBuilder/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAgents } from "@/hooks/useAgents";

interface AgentFormProps {
  agent?: AgentConfig;
  onClose: () => void;
}

export function AgentForm({ agent, onClose }: AgentFormProps) {
  const { createAgent, updateAgent } = useAgents();
  const [formData, setFormData] = useState<CreateAgentInput>({
    name: agent?.name ?? "",
    description: agent?.description ?? "",
    instructions: agent?.instructions ?? "",
    initiateConversation: agent?.initiateConversation ?? false,
    tools: agent?.tools ?? [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Submitting form data:", formData); // Debug log
      if (agent) {
        await updateAgent(agent.id, formData);
      } else {
        await createAgent(formData);
      }
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
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
