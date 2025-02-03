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
      router.replace(`/agents/${agents[0].id}`);
    }
  }, [agents, router]);

  return <Home />;
}
