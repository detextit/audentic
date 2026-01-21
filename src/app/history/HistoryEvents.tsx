import React from "react";
import { LoggedEvent } from "@audentic/react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HistoryEventsProps {
  events: LoggedEvent[];
}

export function HistoryEvents({ events }: HistoryEventsProps) {
  const [expandedEvents, setExpandedEvents] = React.useState<Set<string>>(
    new Set()
  );

  const hasEventError = (eventData: LoggedEvent["eventData"]) => {
    const response =
      eventData && typeof eventData === "object"
        ? (eventData as Record<string, unknown>).response
        : null;
    if (!response || typeof response !== "object") {
      return false;
    }
    const statusDetails = (response as Record<string, unknown>).status_details;
    if (!statusDetails || typeof statusDetails !== "object") {
      return false;
    }
    return (statusDetails as Record<string, unknown>).error != null;
  };

  const getDirectionArrow = (direction: string) => {
    if (direction === "client") return { symbol: "▲", color: "#7f5af0" };
    if (direction === "server") return { symbol: "▼", color: "#2cb67d" };
    return { symbol: "•", color: "#555" };
  };

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 border-b bg-white">
        <h2 className="font-semibold text-sm">Logs</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-4">
          {events.map((log) => {
            const arrowInfo = getDirectionArrow(log.direction);
            const isError =
              log.eventName.toLowerCase().includes("error") ||
              hasEventError(log.eventData);

            return (
              <div
                key={log.id}
                className="hover:bg-gray-50"
              >
                <div
                  className="px-6 py-2 flex items-center justify-between cursor-pointer"
                  onClick={() => toggleEventExpansion(log.id)}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <span style={{ color: arrowInfo.color }} className="mr-2">
                      {arrowInfo.symbol}
                    </span>
                    <span className={`text-xs truncate ${isError ? "text-red-600" : "text-gray-800"}`}>
                      {log.eventName}
                    </span>
                  </div>
                  <div className="text-gray-500 text-xs ml-2 shrink-0">
                    {log.timestamp}
                  </div>
                </div>

                {log.eventData && expandedEvents.has(log.id) && (
                  <div className="px-6 pb-2">
                    <pre className="text-xs bg-gray-50 p-3 rounded-md overflow-x-auto">
                      {JSON.stringify(log.eventData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
