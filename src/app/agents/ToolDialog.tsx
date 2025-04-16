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
  existingToolNames: string[];
}

const defaultParams = { type: "object", properties: {}, required: [] };

const ToolDialog: React.FC<ToolDialogProps> = ({
  open,
  onOpenChange,
  onAddTool,
  existingToolNames,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parameters, setParameters] = useState(
    JSON.stringify(defaultParams, null, 2)
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [paramsError, setParamsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const paramsInputRef = useRef<HTMLTextAreaElement>(null);
  const [logic, setLogic] = useState("");
  const [descriptionError, setDescriptionError] = useState<string | null>(null);

  const validate = () => {
    let valid = true;
    if (!name) {
      setNameError("Name is required");
      valid = false;
    } else if (existingToolNames.includes(name)) {
      setNameError("Name must be unique");
      valid = false;
    } else {
      setNameError(null);
    }
    if (!description) {
      setDescriptionError("Description is required");
      valid = false;
    } else {
      setDescriptionError(null);
    }
    try {
      const parsed = JSON.parse(parameters);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        typeof parsed.type !== "string" ||
        typeof parsed.properties !== "object"
      ) {
        setParamsError(
          "Parameters must include 'type' and 'properties' fields"
        );
        valid = false;
      } else {
        setParamsError(null);
      }
    } catch {
      setParamsError("Parameters must be valid JSON");
      valid = false;
    }
    return valid;
  };

  const handleAdd = () => {
    if (!validate()) return;
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

  // For future: LLM-based tool generation
  const handleGenerateWithAI = () => {
    // TODO: Integrate LLM tool schema/logic generation
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
              className={`text-sm ${
                nameError ? "border-red-500 focus-visible:ring-red-500" : ""
              }`}
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
              autoFocus
            />
            {nameError && (
              <span className="text-xs text-red-500">{nameError}</span>
            )}
          </div>
          <div>
            <Label className="text-xs mb-1">Description</Label>
            <Textarea
              className={`text-xs ${
                descriptionError
                  ? "border-red-500 focus-visible:ring-red-500"
                  : ""
              }`}
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
            />
            {descriptionError && (
              <span className="text-xs text-red-500">{descriptionError}</span>
            )}
          </div>
          <div>
            <Label className="text-xs mb-1">Parameters (JSON Schema)</Label>
            <Textarea
              ref={paramsInputRef}
              className={`font-mono text-xs h-32 ${
                paramsError ? "border-red-500 focus-visible:ring-red-500" : ""
              }`}
              value={parameters}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setParameters(e.target.value)
              }
            />
            {paramsError && (
              <span className="text-xs text-red-500">{paramsError}</span>
            )}
          </div>
          <div>
            <Label className="text-xs mb-1">Tool Logic (TypeScript)</Label>
            <Textarea
              className="font-mono text-xs h-32"
              value={logic}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setLogic(e.target.value)
              }
              placeholder="Enter TypeScript logic for this tool"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              type="button"
              onClick={handleGenerateWithAI}
              disabled
            >
              Generate with AI (coming soon)
            </Button>
            <Button
              onClick={handleAdd}
              disabled={isSubmitting}
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
