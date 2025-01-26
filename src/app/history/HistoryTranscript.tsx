import React from "react";
import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TranscriptItem } from "@audentic/react";

interface HistoryTranscriptProps {
  transcriptItems: TranscriptItem[];
}

export function HistoryTranscript({ transcriptItems }: HistoryTranscriptProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 border-b bg-white">
        <h2 className="font-semibold text-sm">Transcript</h2>
      </div>
      <ScrollArea className="flex-1 px-6">
        <div className="py-4 space-y-4">
          {transcriptItems.map((item) => {
            if (item.type === "MESSAGE") {
              return (
                <div
                  key={item.itemId}
                  className={`${item.isHidden ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center gap-x-2 text-xs text-gray-500 mb-1">
                    <span>{item.timestamp}</span>
                    <span>{item.role}</span>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{item.title || ""}</ReactMarkdown>
                  </div>
                </div>
              );
            }

            if (item.type === "BREADCRUMB") {
              return (
                <div
                  key={item.itemId}
                  className="py-2 text-xs text-gray-500 border-l-2 border-gray-200 pl-2"
                >
                  <div className="flex items-center gap-x-2">
                    <span>{item.timestamp}</span>
                    <span className="font-medium">{item.title}</span>
                  </div>
                  {item.data && (
                    <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-2 rounded mt-1">
                      {JSON.stringify(item.data, null, 2)}
                    </pre>
                  )}
                </div>
              );
            }

            return null;
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
