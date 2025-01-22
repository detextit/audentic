"use client";

import React, {
  createContext,
  useContext,
  useState,
  FC,
  PropsWithChildren,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { LoggedEvent } from "../types";

type EventContextValue = {
  loggedEvents: LoggedEvent[];
  logClientEvent: (
    eventObj: Record<string, any>,
    eventNameSuffix?: string
  ) => void;
  logServerEvent: (
    eventObj: Record<string, any>,
    eventNameSuffix?: string
  ) => void;
  toggleExpand: (id: number | string) => void;
  setSessionId: (id: string) => void;
};

export const EventContext = createContext<EventContextValue | undefined>(
  undefined
);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [loggedEvents, setLoggedEvents] = useState<LoggedEvent[]>([]);
  const [sessionId, setSessionId] = useState<string>("");

  function addLoggedEvent(
    direction: "client" | "server",
    eventName: string,
    eventData: Record<string, any>
  ) {
    const id = eventData.event_id || uuidv4();
    const newEvent: LoggedEvent = {
      id,
      direction,
      eventName,
      eventData,
      timestamp: new Date().toLocaleTimeString(),
      expanded: false,
    };

    if (sessionId) {
      // Log to database via API - omit UI-specific fields
      fetch("/api/events/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: {
            id: newEvent.id,
            direction: newEvent.direction,
            eventName: newEvent.eventName,
            eventData: newEvent.eventData,
          },
          sessionId,
        }),
      }).catch((error) => {
        console.error("Error logging event:", error);
      });
    }

    setLoggedEvents((prev) => [...prev, newEvent]);
  }

  const logClientEvent: EventContextValue["logClientEvent"] = (
    eventObj,
    eventNameSuffix = ""
  ) => {
    const name = `${eventObj.type || ""} ${eventNameSuffix || ""}`.trim();
    addLoggedEvent("client", name, eventObj);
  };

  const logServerEvent: EventContextValue["logServerEvent"] = (
    eventObj,
    eventNameSuffix = ""
  ) => {
    const name = `${eventObj.type || ""} ${eventNameSuffix || ""}`.trim();
    addLoggedEvent("server", name, eventObj);
  };

  const toggleExpand: EventContextValue["toggleExpand"] = (id) => {
    setLoggedEvents((prev) =>
      prev.map((log) => {
        if (log.id === id) {
          return { ...log, expanded: !log.expanded };
        }
        return log;
      })
    );
  };

  return (
    <EventContext.Provider
      value={{
        loggedEvents,
        logClientEvent,
        logServerEvent,
        toggleExpand,
        setSessionId,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEvent must be used within an EventProvider");
  }
  return context;
}
