import { useRef, useState } from "react";
import { SessionStatus, TranscriptItem } from "../types";

// Context providers & hooks
import {
  TranscriptProvider,
  useTranscript,
} from "../contexts/TranscriptContext";
import { EventProvider, useEvent } from "../contexts/EventContext";
import { useHandleServerEvent } from "../hooks/useHandleServerEvent";

// Utilities
import { Button } from "./ui/button";
import { Phone, PhoneOff } from "lucide-react";

interface SessionControlsProps {
  agentId?: string;
}

function SessionControlsCore({ agentId = "voiceAct" }: SessionControlsProps) {
  const {
    logClientEvent,
    logServerEvent,
    setSessionId: setEventSessionId,
  } = useEvent();
  const { transcriptItems, setSessionId: setTranscriptSessionId } =
    useTranscript();
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const [sessionStatus, setSessionStatus] =
    useState<SessionStatus>("DISCONNECTED");
  const [toolLogic, setToolLogic] = useState<
    Record<
      string,
      (
        args: any,
        transcriptLogsFiltered: TranscriptItem[]
      ) => Promise<any> | any
    >
  >({});
  const [sessionId, setSessionId] = useState<string>("");

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

  const connectToRealtime = async () => {
    if (sessionStatus !== "DISCONNECTED") return;
    setSessionStatus("CONNECTING");

    try {
      logClientEvent({ url: "/token" }, "fetch_session_token_request");
      const tokenResponse = await fetch("/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": agentId, // Add API key to headers
        },
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error(
          "Token response not OK:",
          tokenResponse.status,
          errorText
        );
        setSessionStatus("DISCONNECTED");
        return;
      }

      const data = await tokenResponse.json();
      logServerEvent(data, "fetch_session_token_response");

      if (!data || !data.client_secret?.value) {
        logClientEvent(data, "error.no_ephemeral_key");
        console.error("No ephemeral key provided by the server");
        setSessionStatus("DISCONNECTED");
        return;
      }

      const createSessionResponse = await fetch("/api/sessions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId: data.session_id, agentId }),
      });

      if (!createSessionResponse.ok) {
        throw new Error("Failed to create session");
      }

      setSessionId(data.session_id);
      setEventSessionId(data.session_id);
      setTranscriptSessionId(data.session_id);

      const EPHEMERAL_KEY = data.client_secret.value;

      // Create audio element
      if (!audioElementRef.current) {
        audioElementRef.current = document.createElement("audio");
      }
      audioElementRef.current.autoplay = true;

      // Create peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      pc.ontrack = (e) => {
        if (audioElementRef.current) {
          audioElementRef.current.srcObject = e.streams[0];
        }
      };

      const ms = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      pc.addTrack(ms.getTracks()[0]);

      // Create data channel
      const dc = pc.createDataChannel(data.eventChannel);
      dcRef.current = dc;

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to server
      const sdpResponse = await fetch(`${data.url}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      // Receive answer
      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);

      // Set tool logic
      if (data.tool_logic) {
        setToolLogic(data.tool_logic);
      }

      // Listen for data channel events
      dc.addEventListener("open", () => {
        logClientEvent({}, "data_channel.open");
        if (data.initiate_conversation) {
          sendClientEvent(
            { type: "response.create" },
            "(trigger response after simulated user text message)"
          );
        }
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

  const disconnectFromRealtime = async () => {
    if (sessionId) {
      // End session via API with final transcript
      try {
        await fetch("/api/sessions/end", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            transcriptItems, // Send current transcript items
          }),
        });
      } catch (error) {
        console.error("Error ending session:", error);
      }

      setSessionId("");
      setEventSessionId("");
      setTranscriptSessionId("");
    }

    if (pcRef.current) {
      pcRef.current.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });

      pcRef.current.close();
      pcRef.current = null;
    }
    setToolLogic({});
    setSessionStatus("DISCONNECTED");

    logClientEvent({}, "disconnected");
  };

  const onToggleConnection = () => {
    if (sessionStatus === "CONNECTED" || sessionStatus === "CONNECTING") {
      disconnectFromRealtime();
    } else {
      connectToRealtime();
    }
  };

  const handleServerEventRef = useHandleServerEvent({
    setSessionStatus,
    sendClientEvent,
    disconnectFromRealtime,
    toolLogic,
  });
  const isConnected = sessionStatus === "CONNECTED";
  const isConnecting = sessionStatus === "CONNECTING";

  return (
    <div>
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
              variant="default"
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

function SessionControls(props: SessionControlsProps) {
  return (
    <TranscriptProvider>
      <EventProvider>
        <SessionControlsCore {...props} />
      </EventProvider>
    </TranscriptProvider>
  );
}

export { SessionControls };
