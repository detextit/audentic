"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { HistoryTranscript } from "./HistoryTranscript";
import { CostSummary } from "./CostSummary";
import { TranscriptItem } from "@audentic/react";
import { Loader } from "lucide-react";
import { CostData } from "@/types/cost";
import { createLogger } from "@/utils/logger";

const logger = createLogger("Session History");

interface SessionHistoryProps {
  sessionId?: string;
}

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Cache for session data
const sessionCache: Record<
  string,
  {
    transcriptItems: TranscriptItem[];
    costData: CostData | null;
    timestamp: number;
  }
> = {};
const CACHE_TTL = 300000; // 5 minutes cache TTL (increased from 1 minute)

const SessionHistory = React.memo(function SessionHistory({
  sessionId,
}: SessionHistoryProps) {
  const [transcriptItems, setTranscriptItems] = useState<TranscriptItem[]>([]);
  const [costData, setCostData] = useState<CostData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // The actual fetch function
  const doFetchSessionData = useCallback(
    async (sessionId: string, forceRefresh = false) => {
      if (!sessionId || fetchInProgress.current) return;

      fetchInProgress.current = true;

      // Check cache first
      const now = Date.now();
      const cachedData = sessionCache[sessionId];
      if (
        !forceRefresh &&
        cachedData &&
        now - cachedData.timestamp < CACHE_TTL
      ) {
        if (isMounted.current) {
          setTranscriptItems(cachedData.transcriptItems);
          setCostData(cachedData.costData);
          setIsLoading(false);
        }
        fetchInProgress.current = false;
        return;
      }

      if (isMounted.current) {
        setIsLoading(true);
        setError(undefined);
      }

      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const response = await fetch(`${baseUrl}/api/sessions/${sessionId}`);
        if (!response.ok) throw new Error("Failed to fetch session data");

        const data = await response.json();

        // Update cache
        sessionCache[sessionId] = {
          transcriptItems: data.transcriptItems,
          costData: data.costData,
          timestamp: now,
        };

        if (isMounted.current) {
          setTranscriptItems(data.transcriptItems);
          setCostData(data.costData);
        }
      } catch (error) {
        logger.error("Error fetching session data:", error);
        if (isMounted.current) {
          setError("Failed to load session data");
        }
      } finally {
        fetchInProgress.current = false;
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  // Debounced version to prevent multiple rapid calls
  const fetchSessionData = useCallback(debounce(doFetchSessionData, 300), [
    doFetchSessionData,
  ]);

  useEffect(() => {
    if (sessionId) {
      fetchSessionData(sessionId);
    }
  }, [sessionId, fetchSessionData]);

  // Memoize the error component
  const errorComponent = useMemo(() => {
    if (!error) return null;
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500 p-6 bg-red-50/30 rounded-lg border border-red-200 max-w-md text-center">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }, [error]);

  // Memoize the loading component
  const loadingComponent = useMemo(() => {
    if (!isLoading) return null;
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading session data...</p>
        </div>
      </div>
    );
  }, [isLoading]);

  // Memoize the empty state component
  const emptyStateComponent = useMemo(() => {
    if (sessionId) return null;
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
  }, [sessionId]);

  if (error) return errorComponent;
  if (isLoading) return loadingComponent;
  if (!sessionId) return emptyStateComponent;

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
});

export default SessionHistory;
