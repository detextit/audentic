"use client";

import { useEffect, useState } from 'react';
import SessionHistory from '../mabel/components/SessionHistory';

interface Session {
  session_id: string;
  agent_id: string;
  started_at: string;
  ended_at: string | null;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    async function fetchSessions() {
      try {
        const response = await fetch('/api/sessions');
        if (!response.ok) throw new Error('Failed to fetch sessions');
        const data = await response.json();
        setSessions(data);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setError('Failed to load sessions');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSessions();
  }, []);

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (isLoading) {
    return <div className="p-4">Loading sessions...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Session History</h1>
      
      <div className="grid grid-cols-4 gap-4">
        {/* Sessions list */}
        <div className="col-span-1 border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Sessions</h2>
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.session_id}
                className={`p-2 rounded cursor-pointer ${
                  selectedSessionId === session.session_id
                    ? 'bg-gray-100'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedSessionId(session.session_id)}
              >
                <div className="text-sm font-medium">
                  Agent: {session.agent_id}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(session.started_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Session details */}
        <div className="col-span-3 border rounded-lg p-4">
          {selectedSessionId ? (
            <SessionHistory sessionId={selectedSessionId} />
          ) : (
            <div className="text-center text-gray-500">
              Select a session to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}