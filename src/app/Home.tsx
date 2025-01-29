"use client";

import { History, PanelLeftClose, PanelLeft, Bot } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { NavUser } from '@/components/nav-user';
import { AgentsSidebar } from '@/components/agents-sidebar';
import { useAgents } from '@/hooks/useAgents';
import { HistorySidebar } from '@/components/history-sidebar';
import { useUser } from "@clerk/nextjs";
import { AgentBuilder } from '@/app/agents/AgentBuilder';
import { AgentFormDialog } from "@/components/agent-form-dialog";
import SessionHistory from "@/app/history/SessionHistory";
import { useRouter, usePathname } from 'next/navigation';

interface Session {
    session_id: string;
    agent_id: string;
    started_at: string;
    ended_at: string | null;
}

export default function Home() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isAgentsSidebarOpen, setIsAgentsSidebarOpen] = useState(true);
    const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const { agents, refreshAgents } = useAgents();
    const [sessions, setSessions] = useState<Session[]>([]);
    const { user } = useUser();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState<string>();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        async function fetchSessions() {
            try {
                const response = await fetch("/api/sessions");
                if (!response.ok) throw new Error("Failed to fetch sessions");
                const data = await response.json();
                setSessions(data);
            } catch (error) {
                console.error("Error fetching sessions:", error);
            }
        }

        fetchSessions();
    }, []);

    useEffect(() => {
        if (agents.length > 0) {
            if (pathname === '/' || pathname.startsWith('/agents')) {
                const urlAgentId = pathname.startsWith('/agents/')
                    ? pathname.split('/agents/')[1]
                    : null;

                if (urlAgentId && agents.some(agent => agent.id === urlAgentId)) {
                    setSelectedAgentId(urlAgentId);
                } else {
                    setSelectedAgentId(agents[0].id);
                    router.push(`/agents/${agents[0].id}`);
                }
            }
        }
    }, [agents, pathname]);

    useEffect(() => {
        if (pathname.startsWith('/history/')) {
            const urlSessionId = pathname.split('/history/')[1];
            if (urlSessionId) {
                setIsHistorySidebarOpen(true);
                setIsAgentsSidebarOpen(false);
                setSelectedSessionId(urlSessionId);
            }
        }
    }, [pathname]);

    const handleCreateAgent = () => {
        setIsCreateDialogOpen(true);
    };

    const handleAgentClick = (agentId: string) => {
        setSelectedAgentId(agentId);
        router.push(`/agents/${agentId}`);
    };

    const handleDialogClose = async () => {
        setIsCreateDialogOpen(false);
        const updatedAgents = await refreshAgents();
        if (updatedAgents && updatedAgents.length > 0) {
            setSelectedAgentId(updatedAgents[0].id);
            router.push(`/agents/${updatedAgents[0].id}`);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <div className="flex">
                <div
                    className={`bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-57'
                        } p-4 flex flex-col h-screen`}
                >
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} mb-8`}>
                        <div className="rounded p-1">
                            <img src="/icon.png" alt="Logo" className="w-6 h-6" />
                        </div>
                        {!isCollapsed && (
                            <span className="font-semibold text-4lg">AUDENTIC</span>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div
                            className={`flex ${isCollapsed ? 'justify-center' : 'space-x-3'} 
                            cursor-pointer hover:text-[hsl(var(--sidebar-primary))] rounded-md ${isCollapsed ? 'p-2' : 'pl-1 pr-2 py-2'}
                            ${isAgentsSidebarOpen ? 'bg-[hsl(var(--sidebar-accent))]' : ''}`}
                            onClick={() => {
                                setIsAgentsSidebarOpen(true);
                                setIsHistorySidebarOpen(false);
                            }}
                        >
                            <Bot size={24} className="min-w-6" />
                            {!isCollapsed && <span>Agents</span>}
                        </div>
                        <div
                            className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3'} 
                            cursor-pointer hover:text-[hsl(var(--sidebar-primary))] rounded-md ${isCollapsed ? 'p-2' : 'pl-1 pr-2 py-2'}
                            ${isHistorySidebarOpen ? 'bg-[hsl(var(--sidebar-accent))]' : ''}`}
                            onClick={() => {
                                setIsHistorySidebarOpen(true);
                                setIsAgentsSidebarOpen(false);
                            }}
                        >
                            <History size={24} className="min-w-6" />
                            {!isCollapsed && <span>History</span>}
                        </div>
                    </div>

                    <div className="mt-auto mb-4">
                        <NavUser userName={user?.fullName || user?.username || ''} />
                    </div>
                </div>

                <AgentsSidebar
                    isOpen={isAgentsSidebarOpen}
                    onClose={() => setIsAgentsSidebarOpen(false)}
                    agents={agents}
                    onAgentClick={handleAgentClick}
                    selectedAgentId={selectedAgentId}
                    onCreateClick={handleCreateAgent}
                />

                <HistorySidebar
                    isOpen={isHistorySidebarOpen}
                    sessions={sessions}
                    onSessionClick={(sessionId) => {
                        console.log('Session clicked:', sessionId);
                        setSelectedSessionId(sessionId);
                    }}
                />
            </div>

            <div className="flex-1 flex flex-col h-screen overflow-auto bg-white">
                <header className="h-[72px] border-b border-[hsl(var(--sidebar-border))] px-6 flex items-center bg-white shrink-0">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="text-[hsl(var(--sidebar-foreground))] hover:text-[hsl(var(--sidebar-primary))]"
                    >
                        {isCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
                    </button>
                </header>
                <main className="flex-1 p-6 overflow-auto">
                    {isHistorySidebarOpen && selectedSessionId ? (
                        <SessionHistory sessionId={selectedSessionId} />
                    ) : (
                        selectedAgentId && <AgentBuilder agentId={selectedAgentId} />
                    )}
                </main>
            </div>

            <AgentFormDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                selectedAgent={null}
                onClose={handleDialogClose}
            />
        </div>
    );
}
