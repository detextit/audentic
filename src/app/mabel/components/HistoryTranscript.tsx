import React from "react";
import ReactMarkdown from "react-markdown";
import { TranscriptItem } from "../types";

interface HistoryTranscriptProps {
  transcriptItems: TranscriptItem[];
}

export function HistoryTranscript({ transcriptItems }: HistoryTranscriptProps) {
  return (
    <div className="flex flex-col flex-1 bg-white min-h-0 rounded-xl">
      <div className="relative flex-1 min-h-0">
        <div className="overflow-auto p-4 flex flex-col gap-y-4 h-full">
          {transcriptItems.map((item) => {
            if (item.type === "MESSAGE") {
              return (
                <div
                  key={item.itemId}
                  className={`flex flex-col ${
                    item.isHidden ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-x-2 text-xs text-gray-500">
                    <span>{item.timestamp}</span>
                    <span>{item.role}</span>
                  </div>
                  <div className="prose max-w-none">
                    <ReactMarkdown>{item.title || ""}</ReactMarkdown>
                  </div>
                </div>
              );
            }

            if (item.type === "BREADCRUMB") {
              return (
                <div
                  key={item.itemId}
                  className="flex flex-col gap-y-1 text-xs text-gray-500 border-l-2 border-gray-200 pl-2"
                >
                  <div className="flex items-center gap-x-2">
                    <span>{item.timestamp}</span>
                    <span className="font-medium">{item.title}</span>
                  </div>
                  {item.data && (
                    <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-2 rounded">
                      {JSON.stringify(item.data, null, 2)}
                    </pre>
                  )}
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
} 