"use client";

import React, { useEffect, useState } from "react";
// Remove this import since we'll use the types from @voiceact/mabel
// import { LoggedEvent, TranscriptItem } from "../../../../mabel/types";
import { HistoryEvents } from "./HistoryEvents";
import { HistoryTranscript } from "./HistoryTranscript";
import { TranscriptItem, LoggedEvent } from "@voiceact/mabel";

interface SessionHistoryProps {
  sessionId?: string;
}

export default function SessionHistory({ sessionId }: SessionHistoryProps) {
  const [events, setEvents] = useState<LoggedEvent[]>([]);
  const [transcriptItems, setTranscriptItems] = useState<TranscriptItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    async function fetchSessionData() {
      if (!sessionId) return;

      setIsLoading(true);
      setError(undefined);

      try {
        const response = await fetch(`/api/sessions/${sessionId}`);
        if (!response.ok) throw new Error("Failed to fetch session data");

        const data = await response.json();
        setEvents(data.events);
        setTranscriptItems(data.transcriptItems);
      } catch (error) {
        console.error("Error fetching session data:", error);
        setError("Failed to load session data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSessionData();
  }, [sessionId]);

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (isLoading) {
    return <div className="p-4">Loading session data...</div>;
  }

  return (
    <div className="grid grid-cols-2 h-full divide-x w-full">
      <div className="h-full w-full overflow-hidden">
        <HistoryTranscript transcriptItems={transcriptItems} />
      </div>
      <div className="h-full w-full overflow-hidden">
        <HistoryEvents events={events} />
      </div>
    </div>
  );
}
