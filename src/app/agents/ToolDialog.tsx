import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  getToolSchemaFromLLM,
  getToolLogicFromLLM,
} from "@/agentBuilder/metaPrompts";
import { WandSparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTool: (tool: {
    type: string;
    name: string;
    description: string;
    parameters: object;
    logic?: string;
  }) => void;
}

const defaultParams = { type: "object", properties: {}, required: [] };

const ToolDialog: React.FC<ToolDialogProps> = ({
  open,
  onOpenChange,
  onAddTool,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parameters, setParameters] = useState(
    JSON.stringify(defaultParams, null, 2)
  );
  const [logic, setLogic] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const paramsInputRef = useRef<HTMLTextAreaElement>(null);
  const [isGeneratingSchema, setIsGeneratingSchema] = useState(false);
  const [isGeneratingLogic, setIsGeneratingLogic] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const handleAdd = () => {
    setIsSubmitting(true);
    onAddTool({
      type: "function",
      name,
      description,
      parameters: JSON.parse(parameters),
      logic,
    });
    setName("");
    setDescription("");
    setParameters(JSON.stringify(defaultParams, null, 2));
    setLogic("");
    setIsSubmitting(false);
    onOpenChange(false);
  };

  const handleGenerateSchema = async () => {
    if (!description) {
      return;
    }
    setIsGeneratingSchema(true);
    setGenerateError(null);
    try {
      const toolObj = await getToolSchemaFromLLM(description);
      setName(toolObj.name);
      setDescription(toolObj.description);
      setParameters(JSON.stringify(toolObj.parameters, null, 2));
    } catch (err: any) {
      setGenerateError(err.message || "Unknown error generating schema");
    } finally {
      setIsGeneratingSchema(false);
    }
  };

  const handleGenerateLogic = async () => {
    setIsGeneratingLogic(true);
    setGenerateError(null);
    try {
      const logicStr = await getToolLogicFromLLM(description, parameters);
      setLogic(logicStr);
    } catch (err: any) {
      setGenerateError(err.message || "Unknown error generating logic");
    } finally {
      setIsGeneratingLogic(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Tool</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs mb-1">Name</Label>
            <Input
              className="text-sm"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
              autoFocus
            />
          </div>
          <div>
            <div className="flex items-center">
              <Label className="text-xs mb-1">Description</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={handleGenerateSchema}
                      disabled={isGeneratingSchema || isGeneratingLogic}
                    >
                      <WandSparkles className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Generate schema from description</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              className="text-xs"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
            />
          </div>
          <div>
            <Label className="text-xs mb-1">Parameters (JSON Schema)</Label>
            <Textarea
              ref={paramsInputRef}
              className="font-mono text-xs h-32"
              value={parameters}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setParameters(e.target.value)
              }
            />
          </div>
          <div>
            <div className="flex items-center">
              <Label className="text-xs mb-1">Tool Logic (TypeScript)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={handleGenerateLogic}
                      disabled={isGeneratingSchema || isGeneratingLogic}
                    >
                      <WandSparkles className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Generate logic</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              className="font-mono text-xs h-32"
              value={logic}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setLogic(e.target.value)
              }
              placeholder="Enter TypeScript logic for this tool"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {generateError && (
              <span className="text-xs text-red-500">{generateError}</span>
            )}
            <Button
              onClick={handleAdd}
              disabled={isSubmitting || isGeneratingSchema || isGeneratingLogic}
              className="ml-auto"
            >
              Add Tool
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ToolDialog;
