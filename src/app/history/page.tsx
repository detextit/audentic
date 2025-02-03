"use client";

import { useSessions } from "@/hooks/useSessions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Home from "../Home";

export default function HistoryPage() {
  const { sessions } = useSessions();
  const router = useRouter();

  useEffect(() => {
    if (sessions.length > 0) {
      router.replace(`/history/${sessions[0].session_id}`);
    }
  }, [sessions, router]);

  return <Home />;
}
