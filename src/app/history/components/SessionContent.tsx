import SessionHistory from "./SessionHistory";

interface SessionContentProps {
    error?: string;
    isLoading: boolean;
    selectedSessionId?: string;
}

export default function SessionContent({
    error,
    isLoading,
    selectedSessionId,
}: SessionContentProps) {
    return (
        <div className="flex w-full w-screen overflow-hidden">
            {error ? (
                <div className="text-red-500 p-4">{error}</div>
            ) : isLoading ? (
                <div className="p-4">Loading sessions...</div>
            ) : selectedSessionId ? (
                <SessionHistory sessionId={selectedSessionId} />
            ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                    Select a session to view details
                </div>
            )}
        </div>
    );
} 