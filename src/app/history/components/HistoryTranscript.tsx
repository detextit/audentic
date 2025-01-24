import React from "react";
import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TranscriptItem } from "@voiceact/mabel";

interface HistoryTranscriptProps {
  transcriptItems: TranscriptItem[];
}

export function HistoryTranscript({ transcriptItems }: HistoryTranscriptProps) {
  return (
    <div className="w-full rounded-xl transition-all flex flex-col bg-white h-full">
      <div className="font-semibold px-6 py-4 sticky top-0 z-10 text-base border-b bg-white">
        Transcript
      </div>
      <ScrollArea className="flex-1">
        <div className="p-6">
          {transcriptItems.map((item) => {
            if (item.type === "MESSAGE") {
              return (
                <div
                  key={item.itemId}
                  className={`py-2 ${item.isHidden ? "opacity-50" : ""}`}
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
