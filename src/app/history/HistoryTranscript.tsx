import React from "react";
import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TranscriptItem } from "@audentic/react";
import { Power, Wrench, CheckCircle2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface HistoryTranscriptProps {
  transcriptItems: TranscriptItem[];
}

export function HistoryTranscript({ transcriptItems }: HistoryTranscriptProps) {
  const [copied, setCopied] = useState(false);

  const formatTranscriptForCopy = () => {
    return transcriptItems
      .map((item) => {
        let content = "";

        if (item.role === "user" || item.role === "assistant") {
          content = item.content.type === "text" ? item.content.text : "";
        } else if (item.role === "system") {
          if (item.content.type === "session") {
            content = `Session started at ${item.content.started_at}`;
          } else if (item.content.type === "session_end") {
            content = `Session ended at ${item.content.ended_at}${
              item.content.reason ? ` (${item.content.reason})` : ""
            }`;
          }
        } else if (item.role === "tool") {
          if (item.content.type === "function_call") {
            content = `Function: ${
              item.content.name
            }\nArguments: ${JSON.stringify(item.content.arguments, null, 2)}`;
          } else if (item.content.type === "function_call_output") {
            content = `Output: ${item.content.output}`;
          }
        }

        return `[${item.timestamp}] ${item.role}: ${content}`;
      })
      .join("\n\n");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatTranscriptForCopy());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 border-b bg-white flex items-center justify-between">
        <h2 className="font-semibold text-sm">Transcript</h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={handleCopy}
        >
          {copied ? (
            <div className="flex items-center gap-1">
              <Check size={14} className="text-green-600" />
              <span className="text-xs text-green-600">Copied!</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Copy size={14} className="text-gray-500" />
              <span className="text-xs">Copy transcript</span>
            </div>
          )}
        </Button>
      </div>
      <ScrollArea className="flex-1 px-6">
        <div className="py-4 space-y-4">
          {transcriptItems.map((item) => {
            if (item.role === "user" || item.role === "assistant") {
              return (
                <div
                  key={item.itemId}
                  className={`${item.role === "user" ? "bg-gray-50" : ""}`}
                >
                  <div className="flex items-center gap-x-2 text-xs text-gray-500 mb-1">
                    <span>{item.timestamp}</span>
                    <span>{item.role}</span>
                  </div>
                  {item.content.type === "text" && (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{item.content.text || ""}</ReactMarkdown>
                    </div>
                  )}
                </div>
              );
            } else if (item.role === "system") {
              return (
                <SystemMessage
                  key={item.itemId}
                  timestamp={item.timestamp}
                  content={item.content}
                />
              );
            } else if (item.role === "tool") {
              return (
                <ToolMessage
                  key={item.itemId}
                  timestamp={item.timestamp}
                  content={item.content}
                />
              );
            }
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

function MessageWrapper({
  timestamp,
  role,
  children,
}: {
  timestamp: string;
  role: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-x-2 text-xs text-gray-500 mb-1">
        <span>{timestamp}</span>
        <span>{role}</span>
      </div>
      {children}
    </div>
  );
}

function SystemMessage({
  timestamp,
  content,
}: {
  timestamp: string;
  content: any;
}) {
  const isSessionStart = content.type === "session";

  return (
    <MessageWrapper timestamp={timestamp} role="system">
      <Card
        className={cn(
          "flex items-center gap-2 py-2 px-3",
          isSessionStart ? "bg-green-50" : "bg-red-50"
        )}
      >
        <Power
          size={16}
          className={cn(
            "shrink-0",
            isSessionStart ? "text-green-600" : "text-red-600"
          )}
        />
        <div className="flex-1 min-w-0 text-sm">
          <span className="break-words">
            {isSessionStart ? (
              <span className="text-green-700">
                Session started at {content.started_at}
              </span>
            ) : (
              <span className="text-red-700">
                Session ended at {content.ended_at}
                {content.reason && (
                  <span className="text-red-600/80"> ({content.reason})</span>
                )}
              </span>
            )}
          </span>
        </div>
      </Card>
    </MessageWrapper>
  );
}

function ToolMessage({
  timestamp,
  content,
}: {
  timestamp: string;
  content: any;
}) {
  const [copied, setCopied] = useState(false);
  const isFunctionCall = content.type === "function_call";

  const handleCopy = async () => {
    const dataToCopy = isFunctionCall
      ? { name: content.name, arguments: content.arguments }
      : JSON.parse(content.output);

    await navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatValue = (value: any): string => {
    if (typeof value === "string") {
      // Check if the value is a JSON string and try to parse it
      try {
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return value;
      }
    }
    return JSON.stringify(value, null, 2);
  };

  const renderKeyValuePairs = (data: Record<string, any>) => {
    return Object.entries(data).map(([key, value]) => (
      <div key={key} className="flex flex-col space-y-1 py-1">
        <div className="text-xs font-medium text-gray-500">
          {key.replace(/_/g, " ")}
        </div>
        <div className="text-xs text-gray-700 font-mono bg-gray-50 rounded p-1.5">
          {formatValue(value)}
        </div>
      </div>
    ));
  };

  return (
    <MessageWrapper timestamp={timestamp} role="tool">
      <Card className="overflow-hidden border-l-2 border-l-blue-400">
        <div className="bg-blue-50/50 px-3 py-2 flex items-center gap-2">
          {isFunctionCall ? (
            <Wrench size={14} className="text-blue-600 shrink-0" />
          ) : (
            <CheckCircle2 size={14} className="text-green-600 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium">
              {isFunctionCall ? (
                <span className="text-blue-700">{content.name}</span>
              ) : (
                <span className="text-green-700">Result</span>
              )}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleCopy}
          >
            {copied ? (
              <Check size={14} className="text-green-600" />
            ) : (
              <Copy size={14} className="text-gray-500" />
            )}
          </Button>
        </div>

        {isFunctionCall && content.arguments && (
          <div className="px-3 py-2 bg-white border-t divide-y divide-gray-100">
            {renderKeyValuePairs(content.arguments)}
          </div>
        )}

        {content.type === "function_call_output" && (
          <div className="px-3 py-2 bg-white border-t">
            <div className="space-y-2">
              {renderKeyValuePairs(JSON.parse(content.output))}
            </div>
          </div>
        )}
      </Card>
    </MessageWrapper>
  );
}
