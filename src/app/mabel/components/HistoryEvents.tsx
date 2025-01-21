import React from "react";
import { LoggedEvent } from "../types";

interface HistoryEventsProps {
  events: LoggedEvent[];
}

export function HistoryEvents({ events }: HistoryEventsProps) {
  const getDirectionArrow = (direction: string) => {
    if (direction === "client") return { symbol: "▲", color: "#7f5af0" };
    if (direction === "server") return { symbol: "▼", color: "#2cb67d" };
    return { symbol: "•", color: "#555" };
  };

  return (
    <div className="w-1/2 overflow-auto rounded-xl flex flex-col bg-white">
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-2">
          {events.map((log) => {
            const arrowInfo = getDirectionArrow(log.direction);
            const isError = log.eventName.toLowerCase().includes("error");

            return (
              <div key={log.id} className="text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <span style={{ color: arrowInfo.color }} className="ml-1 mr-2">
                      {arrowInfo.symbol}
                    </span>
                    <span
                      className={
                        "flex-1 text-sm " +
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

                {log.eventData && (
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
      </div>
    </div>
  );
} 