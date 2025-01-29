"use client";

import React, { useEffect, useState } from "react";
import { HistoryTranscript } from "./HistoryTranscript";
import { TranscriptItem } from "@audentic/react";

interface SessionHistoryProps {
  sessionId?: string;
}

export default function SessionHistory({ sessionId }: SessionHistoryProps) {
  // const [events, setEvents] = useState<LoggedEvent[]>([]);
  const [transcriptItems, setTranscriptItems] = useState<TranscriptItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    async function fetchSessionData() {
      if (!sessionId) return;

      setIsLoading(true);
      setError(undefined);

      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const response = await fetch(`${baseUrl}/api/sessions/${sessionId}`);
        if (!response.ok) throw new Error("Failed to fetch session data");

        const data = await response.json();
        // setEvents(data.events);
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

  // return (
  //   <div className="h-full flex flex-col">
  //     <div className="grid grid-cols-2 flex-1 divide-x">
  //       <div className="flex flex-col">
  //         <HistoryTranscript transcriptItems={transcriptItems} />
  //       </div>
  //       <div className="flex flex-col">
  //         <HistoryEvents events={events} />
  //       </div>
  //     </div>
  //   </div>
  // );

  return (
    <div className="h-full flex">
      <HistoryTranscript transcriptItems={transcriptItems} />
    </div>
  );
}
