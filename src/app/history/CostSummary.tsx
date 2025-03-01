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
import { ChevronDown, ChevronUp, Loader, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CostData } from "@/types/cost";

interface CostSummaryProps {
  sessionId: string;
  costData?: CostData | null;
}

export function CostSummary({
  sessionId,
  costData: initialCostData,
}: CostSummaryProps) {
  const [costData, setCostData] = useState<CostData | null>(
    initialCostData || null
  );
  const [isLoading, setIsLoading] = useState(!initialCostData);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // If costData is provided via props, use it
    if (initialCostData) {
      setCostData(initialCostData);
      setIsLoading(false);
      return;
    }

    // Otherwise fetch it
    async function fetchCostData() {
      if (!sessionId) {
        console.log("No sessionId provided to CostSummary");
        setIsLoading(false);
        return;
      }

      console.log("Fetching cost data for session:", sessionId);
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const response = await fetch(`${baseUrl}/api/sessions/${sessionId}`);

        if (!response.ok) {
          console.error(
            "Session API response not OK:",
            response.status,
            response.statusText
          );
          throw new Error("Failed to fetch cost data");
        }

        const data = await response.json();
        console.log("Cost data received:", data.costData);
        setCostData(data.costData);
      } catch (error) {
        console.error("Error fetching cost data:", error);
        setError("Failed to load cost data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCostData();
  }, [sessionId, initialCostData]);

  if (isLoading)
    return (
      <Card className="border border-border/40 shadow-sm">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">
              Session Cost
            </CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Loading...</span>
            </div>
          </div>
        </CardHeader>
      </Card>
    );

  if (error)
    return (
      <Card className="border border-border/40 shadow-sm bg-red-50/30">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">
              Session Cost
            </CardTitle>
            <div className="text-sm text-red-500">{error}</div>
          </div>
        </CardHeader>
      </Card>
    );

  if (!costData) {
    return (
      <Card className="border border-border/40 shadow-sm">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                <DollarSign className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-medium">
                Session Cost
              </CardTitle>
            </div>
            <div className="text-sm text-muted-foreground">
              No cost data available
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border border-border/40 shadow-sm overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader
          className={cn(
            "p-4 pb-3",
            isOpen ? "border-b border-border/40 bg-muted/10" : ""
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                <DollarSign className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-medium">
                  Session Cost
                </CardTitle>
                {costData.isPro && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm font-medium">
                      PRO
                    </span>
                    <span>model pricing</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium">
                <span className="text-muted-foreground mr-1">Total:</span>
                <span className="text-primary">
                  ${costData.costs.total.toFixed(4)}
                </span>
              </div>
              <CollapsibleTrigger asChild>
                <button className="rounded-full h-7 w-7 flex items-center justify-center hover:bg-muted/50 transition-colors">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="p-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Token Usage
                </h3>
                <div className="border border-border/40 rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/10">
                      <TableRow>
                        <TableHead className="text-xs font-medium">
                          Category
                        </TableHead>
                        <TableHead className="text-right text-xs font-medium">
                          Count
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="bg-muted/5">
                        <TableCell className="text-xs font-medium py-2">
                          Text Tokens
                        </TableCell>
                        <TableCell className="text-right" />
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6 text-xs py-1.5">
                          Uncached Input
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {costData.usage.text.uncached_input.toLocaleString()}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6 text-xs py-1.5">
                          Cached Input
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {costData.usage.text.cached_input.toLocaleString()}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6 text-xs py-1.5">
                          Output
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {costData.usage.text.output.toLocaleString()}
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/5">
                        <TableCell className="text-xs font-medium py-2">
                          Audio Tokens
                        </TableCell>
                        <TableCell className="text-right" />
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6 text-xs py-1.5">
                          Uncached Input
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {costData.usage.audio.uncached_input.toLocaleString()}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6 text-xs py-1.5">
                          Cached Input
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {costData.usage.audio.cached_input.toLocaleString()}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6 text-xs py-1.5">
                          Output
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {costData.usage.audio.output.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Cost Breakdown
                </h3>
                <div className="border border-border/40 rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/10">
                      <TableRow>
                        <TableHead className="text-xs font-medium">
                          Category
                        </TableHead>
                        <TableHead className="text-right text-xs font-medium">
                          USD
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="bg-muted/5">
                        <TableCell className="text-xs font-medium py-2">
                          Text Processing
                        </TableCell>
                        <TableCell className="text-right" />
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6 text-xs py-1.5">
                          Uncached Input
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          ${costData.costs.text_uncached_input.toFixed(4)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6 text-xs py-1.5">
                          Cached Input
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          ${costData.costs.text_cached_input.toFixed(4)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6 text-xs py-1.5">
                          Output
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          ${costData.costs.text_output.toFixed(4)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/5">
                        <TableCell className="text-xs font-medium py-2">
                          Audio Processing
                        </TableCell>
                        <TableCell className="text-right" />
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6 text-xs py-1.5">
                          Uncached Input
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          ${costData.costs.audio_uncached_input.toFixed(4)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6 text-xs py-1.5">
                          Cached Input
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          ${costData.costs.audio_cached_input.toFixed(4)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6 text-xs py-1.5">
                          Output
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          ${costData.costs.audio_output.toFixed(4)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-primary/5 border-t border-border/40">
                        <TableCell className="text-xs font-medium py-2">
                          Total Cost
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium text-primary">
                          ${costData.costs.total.toFixed(4)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
