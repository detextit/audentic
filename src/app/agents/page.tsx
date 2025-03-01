"use client";

import { useAgents } from "@/hooks/useAgents";
import Home from "../Home";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AgentsPage() {
  const { agents } = useAgents();
  const router = useRouter();

  useEffect(() => {
    if (agents.length > 0) {
      // Use client-side navigation without full page refresh
      const agentId = agents[0].id;
      window.history.pushState({}, "", `/agents/${agentId}`);
    }
  }, [agents]);

  return <Home />;
}
