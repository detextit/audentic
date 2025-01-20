import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";


// Agent configs
import { allAgentSets, defaultAgentSetKey } from "@/app/api/session/agentConfigs";
import { AgentConfig, SessionStatus } from "@/app/types";

// Context providers & hooks
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { useEvent } from "@/app/contexts/EventContext";
import { useHandleServerEvent } from "../hooks/useHandleServerEvent";

// Utilities
import { createRealtimeConnection } from "../lib/realtimeConnection";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff } from "lucide-react";
interface SessionControlsProps {
  agentId?: string;
}

function SessionControls({ agentId=defaultAgentSetKey }: SessionControlsProps) {

  const { logClientEvent, logServerEvent } = useEvent();

  const selectedAgentConfigSet = allAgentSets[agentId];
  const [selectedAgentName, setSelectedAgentName] = useState<string>(selectedAgentConfigSet[0].name);
 
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const [sessionStatus, setSessionStatus] =
    useState<SessionStatus>("DISCONNECTED");

  const sendClientEvent = (eventObj: any, eventNameSuffix = "") => {
    if (dcRef.current && dcRef.current.readyState === "open") {
      logClientEvent(eventObj, eventNameSuffix);
      dcRef.current.send(JSON.stringify(eventObj));
    } else {
      logClientEvent(
        { attemptedEvent: eventObj.type },
        "error.data_channel_not_open"
      );
      console.error(
        "Failed to send message - no data channel available",
        eventObj
      );
    }
  };

  const handleServerEventRef = useHandleServerEvent({
    setSessionStatus,
    selectedAgentName,
    selectedAgentConfigSet,
    sendClientEvent,
    setSelectedAgentName,
  });
  

  useEffect(() => {
    if (selectedAgentName && sessionStatus === "DISCONNECTED") {
      connectToRealtime();
    }
  }, [selectedAgentName]);

  useEffect(() => {
    if (
      sessionStatus === "CONNECTED" &&
      selectedAgentConfigSet &&
      selectedAgentName
    ) {
      const currentAgent = selectedAgentConfigSet.find(
        (a) => a.name === selectedAgentName
      );
      updateSession(true);
    }
  }, [selectedAgentConfigSet, selectedAgentName, sessionStatus]);

  const fetchEphemeralKey = async (): Promise<string | null> => {
    logClientEvent({ url: "/session" }, "fetch_session_token_request");
    const tokenResponse = await fetch("/api/session");
    const data = await tokenResponse.json();
    logServerEvent(data, "fetch_session_token_response");

    if (!data.client_secret?.value) {
      logClientEvent(data, "error.no_ephemeral_key");
      console.error("No ephemeral key provided by the server");
      setSessionStatus("DISCONNECTED");
      return null;
    }

    return data.client_secret.value;
  };

  const connectToRealtime = async () => {
    if (sessionStatus !== "DISCONNECTED") return;
    setSessionStatus("CONNECTING");

    try {
      const EPHEMERAL_KEY = await fetchEphemeralKey();
      if (!EPHEMERAL_KEY) {
        return;
      }

      if (!audioElementRef.current) {
        audioElementRef.current = document.createElement("audio");
      }
      audioElementRef.current.autoplay = true;

      const { pc, dc } = await createRealtimeConnection(
        EPHEMERAL_KEY,
        audioElementRef
      );
      pcRef.current = pc;
      dcRef.current = dc;

      dc.addEventListener("open", () => {
        logClientEvent({}, "data_channel.open");
      });
      dc.addEventListener("close", () => {
        logClientEvent({}, "data_channel.close");
      });
      dc.addEventListener("error", (err: any) => {
        logClientEvent({ error: err }, "data_channel.error");
      });
      dc.addEventListener("message", (e: MessageEvent) => {
        handleServerEventRef.current(JSON.parse(e.data));
      });

    } catch (err) {
      console.error("Error connecting to realtime:", err);
      setSessionStatus("DISCONNECTED");
    }
  };

  const disconnectFromRealtime = () => {
    if (pcRef.current) {
      pcRef.current.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });

      pcRef.current.close();
      pcRef.current = null;
    }
    setSessionStatus("DISCONNECTED");

    logClientEvent({}, "disconnected");
  };


  const updateSession = (shouldTriggerResponse: boolean = false) => {
    // sendClientEvent(
    //   { type: "input_audio_buffer.clear" },
    //   "clear audio buffer on session update"
    // );

    const currentAgent = selectedAgentConfigSet?.find(
      (a) => a.name === selectedAgentName
    );

    const turnDetection = {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
          create_response: true,
        };

    const instructions = currentAgent?.instructions || "";
    const tools = currentAgent?.tools || [];

    const sessionUpdateEvent = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions,
        voice: "coral",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: { model: "whisper-1" },
        turn_detection: turnDetection,
        tools,
      },
    };

    sendClientEvent(sessionUpdateEvent);

    if (shouldTriggerResponse) {
      sendClientEvent(
        { type: "response.create" },
        "(trigger response after simulated user text message)"
      );
    }
  };

  const onToggleConnection = () => {
    if (sessionStatus === "CONNECTED" || sessionStatus === "CONNECTING") {
      disconnectFromRealtime();
      setSessionStatus("DISCONNECTED");
    } else {
      connectToRealtime();
    }
  };

  const isConnected = sessionStatus === "CONNECTED";
  const isConnecting = sessionStatus === "CONNECTING";

  return (
    <div className="fixed right-8 bottom-8">
      {/* Pulsing background effect when not active */}
      {!isConnected && !isConnecting && (
        <div className="absolute inset-4 rounded-2xl bg-black/10 blur-sm animate-[pulse_2s_ease-in-out_infinite]" />
      )}
      
      {/* Main floating card */}
      <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 min-w-[240px] border border-gray-100">
        {/* Card header */}
        <div className="mb-3 text-sm font-medium text-gray-600">
          {isConnected ? "Listening..." : "Need help?"}
        </div>

        {/* Control button */}
        <div className="flex justify-center">
          {isConnected ? (
            <Button 
              onClick={onToggleConnection}
              variant="outline" 
              className="rounded-full px-6 py-2 border border-gray-200 hover:bg-gray-50/80 w-full"
            >
              <PhoneOff className="mr-2 h-4 w-4 text-red-500" />
              <span>End call</span>
            </Button>
          ) : (
            <Button
              onClick={onToggleConnection}
              className={`rounded-full px-6 py-2 w-full ${
                isConnecting 
                  ? "bg-gray-100 text-gray-600" 
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              <Phone className="mr-2 h-4 w-4" />
              <span>{isConnecting ? "Connecting..." : "Call Agent"}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SessionControls;
