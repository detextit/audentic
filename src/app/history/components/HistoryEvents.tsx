import React from "react";
import { LoggedEvent } from "@voiceact/mabel";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HistoryEventsProps {
  events: LoggedEvent[];
}

export function HistoryEvents({ events }: HistoryEventsProps) {
  const [expandedEvents, setExpandedEvents] = React.useState<Set<number>>(
    new Set()
  );

  const getDirectionArrow = (direction: string) => {
    if (direction === "client") return { symbol: "▲", color: "#7f5af0" };
    if (direction === "server") return { symbol: "▼", color: "#2cb67d" };
    return { symbol: "•", color: "#555" };
  };

  const toggleEventExpansion = (eventId: number) => {
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
    <div className="w-1/2 rounded-xl transition-all flex flex-col bg-white h-screen">
      <div className="font-semibold px-6 py-4 sticky top-0 z-10 text-base border-b bg-white">
        Logs
      </div>
      <ScrollArea className="flex-1">
        <div className="p-6">
          {events.map((log) => {
            const arrowInfo = getDirectionArrow(log.direction);
            const isError =
              log.eventName.toLowerCase().includes("error") ||
              log.eventData?.response?.status_details?.error != null;

            return (
              <div
                key={log.id}
                className="border-t border-gray-200 py-2 px-6 font-mono"
              >
                <div
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleEventExpansion(log.id)}
                >
                  <div className="flex items-center flex-1">
                    <span
                      style={{ color: arrowInfo.color }}
                      className="ml-1 mr-2"
                    >
                      {arrowInfo.symbol}
                    </span>
                    <span
                      className={
                        "flex-1 text-xs " +
                        (isError ? "text-red-600" : "text-gray-800")
                      }
                    >
                      {log.eventName}
                    </span>
                  </div>
                  <div className="text-gray-500 ml-1 text-xs whitespace-nowrap">
                    {log.timestamp}
                  </div>
                </div>

                {log.eventData && expandedEvents.has(log.id) && (
                  <div className="text-gray-800 text-left">
                    <pre className="border-l-2 ml-1 border-gray-200 whitespace-pre-wrap break-words font-mono text-xs mb-2 mt-2 pl-2">
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
