"use client";

import React, { useEffect, useState } from "react";
import { HistoryTranscript } from "./HistoryTranscript";
import { CostSummary } from "./CostSummary";
import { TranscriptItem } from "@audentic/react";
import { Loader } from "lucide-react";

interface SessionHistoryProps {
  sessionId?: string;
}

export default function SessionHistory({ sessionId }: SessionHistoryProps) {
  // const [events, setEvents] = useState<LoggedEvent[]>([]);
  const [transcriptItems, setTranscriptItems] = useState<TranscriptItem[]>([]);
  const [costData, setCostData] = useState(null);
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
        setCostData(data.costData);
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
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500 p-6 bg-red-50/30 rounded-lg border border-red-200 max-w-md text-center">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading session data...</p>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground p-6 bg-muted/10 rounded-lg border border-border/40 max-w-md text-center">
          <p className="font-medium">No Session Selected</p>
          <p className="text-sm mt-1">
            Please select a session from the list to view details
          </p>
        </div>
      </div>
    );
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
    <div className="h-full flex flex-col gap-6 p-6">
      <div className="flex-none">
        <CostSummary sessionId={sessionId} costData={costData} />
      </div>
      <div className="flex-1 min-h-0">
        <HistoryTranscript transcriptItems={transcriptItems} />
      </div>
    </div>
  );
}
