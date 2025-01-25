"use client";

import { useEffect, useState } from "react";
import { FileClock } from "lucide-react";
import SessionHistory from "./components/SessionHistory";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Label } from "@/components/ui/label";
import SessionContent from "./components/SessionContent";

interface Session {
  session_id: string;
  agent_id: string;
  started_at: string;
  ended_at: string | null;
}

interface SessionsPageProps {
  setSelectedSessionId: (sessionId: string) => void;
  selectedSessionId?: string;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  error?: string | null;
  setError: (error: string | null) => void;
}

export default function SessionsPage({ setSelectedSessionId, selectedSessionId, isLoading, setIsLoading, error, setError }: SessionsPageProps) {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const response = await fetch("/api/sessions");
        if (!response.ok) throw new Error("Failed to fetch sessions");
        const data = await response.json();
        setSessions(data);
      } catch (error) {
        console.error("Error fetching sessions:", error);
        setError("Failed to load sessions");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSessions();
  }, []);

  return (
    <Sidebar collapsible="none" className=" flex h-screen w-full overflow-hidden h-screen w-64 border-r flex-shrink-0">
      <SidebarHeader className="gap-3.5 border-b p-3">
        <div className="flex w-full items-center justify-between">
          <div className="text-base font-medium text-foreground">
            Sessions
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {sessions.map((session) => (
                <SidebarMenuItem key={session.session_id}>
                  <SidebarMenuButton
                    tooltip={{
                      children: new Date(session.started_at).toLocaleString(),
                      hidden: false,
                    }}
                    asChild
                    isActive={selectedSessionId === session.session_id}
                    className="px-2.5 md:px-2"
                    onClick={() => setSelectedSessionId(session.session_id)}
                  >
                    <Label>
                      <FileClock className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="text-sm">Agent: {session.agent_id}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(session.started_at).toLocaleString()}
                        </span>
                      </div>
                    </Label>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>


  );
}
