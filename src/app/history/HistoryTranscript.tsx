import React from "react";
import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TranscriptItem } from "@audentic/react";
import {
  Power,
  Wrench,
  CheckCircle2,
  Copy,
  Check,
  MessageSquare,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/card";
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
    <Card className="flex flex-col h-full border border-border/40 shadow-sm overflow-hidden">
      <CardHeader className="px-4 py-3 border-b bg-muted/10 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary">
            <MessageSquare className="h-3.5 w-3.5" />
          </div>
          <h2 className="font-medium text-sm">Transcript</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 hover:bg-muted/50 transition-colors"
          onClick={handleCopy}
        >
          {copied ? (
            <div className="flex items-center gap-1.5">
              <Check size={14} className="text-green-600" />
              <span className="text-xs text-green-600">Copied</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Copy size={14} className="text-muted-foreground" />
              <span className="text-xs">Copy transcript</span>
            </div>
          )}
        </Button>
      </CardHeader>
      <ScrollArea className="flex-1">
        <div className="py-4 space-y-4 px-4">
          {transcriptItems.map((item) => {
            if (item.role === "user" || item.role === "assistant") {
              return (
                <div
                  key={item.itemId}
                  className={cn(
                    "rounded-lg p-3",
                    item.role === "user"
                      ? "bg-muted/20 border border-border/40"
                      : "bg-primary/5 border border-primary/20"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full",
                        item.role === "user"
                          ? "bg-muted/30 text-muted-foreground"
                          : "bg-primary/10 text-primary"
                      )}
                    >
                      {item.role === "user" ? (
                        <MessageSquare className="h-3 w-3" />
                      ) : (
                        <Bot className="h-3 w-3" />
                      )}
                    </div>
                    <div className="flex items-center gap-x-2">
                      <span className="text-xs font-medium capitalize">
                        {item.role}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.timestamp}
                      </span>
                    </div>
                  </div>
                  {item.content.type === "text" && (
                    <div className="prose prose-sm max-w-none pl-8 text-sm">
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
    </Card>
  );
}

function MessageWrapper({
  timestamp,
  role,
  icon: Icon,
  iconColor,
  children,
}: {
  timestamp: string;
  role: string;
  icon: React.ElementType;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`flex items-center justify-center w-6 h-6 rounded-full ${iconColor}`}
        >
          <Icon className="h-3 w-3" />
        </div>
        <div className="flex items-center gap-x-2">
          <span className="text-xs font-medium capitalize">{role}</span>
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        </div>
      </div>
      <div className="pl-8">{children}</div>
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
    <MessageWrapper
      timestamp={timestamp}
      role="system"
      icon={Power}
      iconColor={
        isSessionStart
          ? "bg-green-100 text-green-600"
          : "bg-red-100 text-red-600"
      }
    >
      <Card
        className={cn(
          "flex items-center gap-2 py-2 px-3 border",
          isSessionStart
            ? "bg-green-50/50 border-green-100"
            : "bg-red-50/50 border-red-100"
        )}
      >
        <div className="flex-1 min-w-0 text-xs">
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
        <div className="text-xs font-medium text-muted-foreground">
          {key.replace(/_/g, " ")}
        </div>
        <div className="text-xs text-foreground font-mono bg-muted/20 rounded p-1.5 overflow-x-auto">
          {formatValue(value)}
        </div>
      </div>
    ));
  };

  return (
    <MessageWrapper
      timestamp={timestamp}
      role="tool"
      icon={isFunctionCall ? Wrench : CheckCircle2}
      iconColor={
        isFunctionCall
          ? "bg-blue-100 text-blue-600"
          : "bg-green-100 text-green-600"
      }
    >
      <Card className="overflow-hidden border border-border/40">
        <div
          className={cn(
            "px-3 py-2 flex items-center justify-between",
            isFunctionCall ? "bg-blue-50/50" : "bg-green-50/50"
          )}
        >
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
            className="h-6 w-6 p-0 rounded-full hover:bg-white/50"
            onClick={handleCopy}
          >
            {copied ? (
              <Check size={12} className="text-green-600" />
            ) : (
              <Copy size={12} className="text-muted-foreground" />
            )}
          </Button>
        </div>

        {isFunctionCall && content.arguments && (
          <div className="px-3 py-2 bg-white border-t divide-y divide-border/30">
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
