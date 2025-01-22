import { useAgents } from "@/hooks/useAgents";

export function AgentsList() {
  const { agents, loading, error, createAgent, updateAgent, deleteAgent } =
    useAgents();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {agents.map((agent) => (
        <div key={agent.id}>
          <h3>{agent.name}</h3>
          <p>{agent.instructions}</p>
          <button onClick={() => updateAgent(agent.id, { name: "New Name" })}>
            Edit
          </button>
          <button onClick={() => deleteAgent(agent.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
