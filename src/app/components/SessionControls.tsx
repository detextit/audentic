import React from "react";
import { SessionStatus } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff } from "lucide-react";
interface SessionControlsProps {
  sessionStatus: SessionStatus;
  onToggleConnection: () => void;
}

function SessionControls({
  sessionStatus,
  onToggleConnection,
}: SessionControlsProps) {
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
