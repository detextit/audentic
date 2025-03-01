"use client";

import { useSessions } from "@/hooks/useSessions";
import { useEffect } from "react";
import Home from "../Home";

export default function HistoryPage() {
  const { sessions } = useSessions();

  useEffect(() => {
    if (sessions.length > 0) {
      // Use client-side navigation without full page refresh
      const sessionId = sessions[0].session_id;
      window.history.pushState({}, "", `/history/${sessionId}`);
    }
  }, [sessions]);

  return <Home />;
}
