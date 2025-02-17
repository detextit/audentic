import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Loader } from "lucide-react";
import { useEffect, useState } from "react";

interface CostData {
  usage: {
    text: {
      uncached_input: number;
      cached_input: number;
      output: number;
    };
    audio: {
      uncached_input: number;
      cached_input: number;
      output: number;
    };
  };
  costs: {
    text_uncached_input: number;
    text_cached_input: number;
    text_output: number;
    audio_uncached_input: number;
    audio_cached_input: number;
    audio_output: number;
    total: number;
  };
  isPro: boolean;
}

interface CostSummaryProps {
  sessionId: string;
}

export function CostSummary({ sessionId }: CostSummaryProps) {
  const [costData, setCostData] = useState<CostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchCostData() {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const response = await fetch(
          `${baseUrl}/api/sessions/cost?sessionId=${sessionId}`
        );
        if (!response.ok) throw new Error("Failed to fetch cost data");
        const data = await response.json();
        setCostData(data);
      } catch (error) {
        console.error("Error fetching cost data:", error);
        setError("Failed to load cost data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCostData();
  }, [sessionId]);

  if (isLoading)
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold">Session Cost</CardTitle>
            <div className="flex items-center gap-4 text-lg font-semibold">
              <Loader className="animate-spin" />
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  if (error) return <div className="text-red-500">{error}</div>;
  if (!costData) return null;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <CardTitle className="text-lg font-bold">Session Cost</CardTitle>
              {costData.isPro && (
                <sup className="text-xs font-medium text-slate-900">PRO</sup>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-lg font-semibold">
                Total: ${costData.costs.total.toFixed(4)}
              </div>
              <CollapsibleTrigger asChild>
                <button className="rounded-full hover:bg-gray-100 p-2">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token Usage</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Text Tokens</TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Uncached Input</TableCell>
                    <TableCell className="text-right">
                      {costData.usage.text.uncached_input.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Cached Input</TableCell>
                    <TableCell className="text-right">
                      {costData.usage.text.cached_input.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Output</TableCell>
                    <TableCell className="text-right">
                      {costData.usage.text.output.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Audio Tokens</TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Uncached Input</TableCell>
                    <TableCell className="text-right">
                      {costData.usage.audio.uncached_input.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Cached Input</TableCell>
                    <TableCell className="text-right">
                      {costData.usage.audio.cached_input.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Output</TableCell>
                    <TableCell className="text-right">
                      {costData.usage.audio.output.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cost Breakdown</TableHead>
                    <TableHead className="text-right">USD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      Text Processing
                    </TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Uncached Input</TableCell>
                    <TableCell className="text-right">
                      ${costData.costs.text_uncached_input.toFixed(4)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Cached Input</TableCell>
                    <TableCell className="text-right">
                      ${costData.costs.text_cached_input.toFixed(4)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Output</TableCell>
                    <TableCell className="text-right">
                      ${costData.costs.text_output.toFixed(4)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Audio Processing
                    </TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Uncached Input</TableCell>
                    <TableCell className="text-right">
                      ${costData.costs.audio_uncached_input.toFixed(4)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Cached Input</TableCell>
                    <TableCell className="text-right">
                      ${costData.costs.audio_cached_input.toFixed(4)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Output</TableCell>
                    <TableCell className="text-right">
                      ${costData.costs.audio_output.toFixed(4)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
