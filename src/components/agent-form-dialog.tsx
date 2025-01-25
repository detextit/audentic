import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AgentConfig } from "@audentic/react";
import { AgentForm } from "@/components/agent-form";

interface AgentFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedAgent: AgentConfig | null;
    onClose: () => void;
}

export function AgentFormDialog({
    open,
    onOpenChange,
    selectedAgent,
    onClose
}: AgentFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {selectedAgent ? "Edit Agent" : "Create New Agent"}
                    </DialogTitle>
                </DialogHeader>
                <AgentForm
                    agent={selectedAgent ?? undefined}
                    onClose={onClose}
                />
            </DialogContent>
        </Dialog>
    );
} 