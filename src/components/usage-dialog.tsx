"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChartIcon as ChartColumn,
  DollarSign,
  Clock,
  Calendar,
  BarChartIcon,
  Info,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

import {
  Area,
  AreaChart,
  BarChart,
  LineChart,
  PieChart,
  Pie,
  Cell,
  Label,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Bar,
  Line,
  Tooltip as RechartsTooltip,
} from "recharts";
import { createLogger } from "@/utils/logger";

const logger = createLogger("Usage Dialog");

// Types for API responses
interface AgentCostData {
  time_period: string;
  session_count: number;
  total_cost: number;
  avg_cost_per_session: number;
}

interface AgentCostResponse {
  agent: {
    id: string;
    name: string;
  };
  cost_data: AgentCostData[];
  overall: {
    total_sessions: number;
    total_cost: number;
    avg_cost_per_session: number;
    first_session: string | null;
    last_session: string | null;
  };
}

interface AgentStats {
  agent_id: string;
  agent_name: string;
  session_count: number;
  total_cost: number;
  avg_cost_per_session: number;
  first_session: string;
  last_session: string;
}

interface WeeklyUsage {
  time_period: string;
  session_count: number;
  total_cost: number;
}

interface UsageResponse {
  stats: AgentStats[];
  overall: {
    total_sessions: number;
    total_cost: number;
    avg_cost_per_session: number;
  };
  weekly_usage: WeeklyUsage[];
}

interface UsageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Custom styles for charts
const chartStyles = `
  :root {
    --color-Total\\ Cost: hsl(215, 90%, 50%);
    --color-Avg\\ Cost\\/Session: hsl(280, 90%, 50%);
    --color-Sessions: hsl(160, 90%, 45%);
  }
`;

// Custom tooltip component for the pie chart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border p-2 rounded-md shadow-md">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-sm">${Number(payload[0].value).toFixed(4)}</p>
      </div>
    );
  }
  return null;
};

// Custom tooltip component for line and bar charts
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border p-2 rounded-md shadow-md">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div
            key={`item-${index}`}
            className="flex items-center gap-2 text-sm"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.name}: </span>
            <span className="font-medium">
              {entry.name.includes("Cost")
                ? `$${Number(entry.value).toFixed(4)}`
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function UsageDialog({ open, onOpenChange }: UsageDialogProps) {
  // State for usage data
  const [usageData, setUsageData] = useState<UsageResponse | null>(null);
  // State for selected agent cost data
  const [agentCostData, setAgentCostData] = useState<AgentCostResponse | null>(
    null
  );
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>("month");
  const [groupBy, setGroupBy] = useState<string>("day");
  const [isLoading, setIsLoading] = useState(true);
  const [isAgentLoading, setIsAgentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Calculate date ranges based on selected time range
  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (timeRange) {
      case "week":
        startDate = format(subDays(now, 7), "yyyy-MM-dd");
        endDate = format(now, "yyyy-MM-dd");
        break;
      case "month":
        startDate = format(startOfMonth(now), "yyyy-MM-dd");
        endDate = format(endOfMonth(now), "yyyy-MM-dd");
        break;
      case "3months":
        startDate = format(subDays(now, 90), "yyyy-MM-dd");
        endDate = format(now, "yyyy-MM-dd");
        break;
      default:
        startDate = format(subDays(now, 30), "yyyy-MM-dd");
        endDate = format(now, "yyyy-MM-dd");
    }

    return { startDate, endDate };
  };

  // Fetch usage data
  const fetchUsageData = async () => {
    try {
      setIsLoading(true);
      const { startDate, endDate } = getDateRange();

      const url = `/api/usage?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch usage data");
      }

      const data = await response.json();
      setUsageData(data);

      // If we have agents and no agent is selected, select the first one
      if (data.stats.length > 0 && !selectedAgent) {
        setSelectedAgent(data.stats[0].agent_id);
      }
    } catch (error) {
      logger.error("Failed to fetch usage data:", error);
      setError("Could not load usage data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch agent cost data
  const fetchAgentCostData = async () => {
    if (!selectedAgent) return;

    try {
      setIsAgentLoading(true);
      const { startDate, endDate } = getDateRange();

      const url = `/api/agents/${selectedAgent}/cost?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch agent cost data");
      }

      const data = await response.json();
      setAgentCostData(data);
    } catch (error) {
      logger.error("Failed to fetch agent cost data:", error);
      setError("Could not load agent cost data. Please try again later.");
    } finally {
      setIsAgentLoading(false);
    }
  };

  // Fetch data when dialog opens or parameters change
  useEffect(() => {
    if (open) {
      fetchUsageData();
    }
  }, [open, timeRange, groupBy]);

  // Fetch agent cost data when selected agent changes
  useEffect(() => {
    if (open && selectedAgent) {
      fetchAgentCostData();
    }
  }, [open, selectedAgent, timeRange, groupBy]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy");
  };

  // Format time period for display
  const formatTimePeriod = (timePeriod: string) => {
    if (!timePeriod) return "N/A";
    const date = new Date(timePeriod);

    switch (groupBy) {
      case "week":
        return `Week of ${format(date, "MMM d")}`;
      case "month":
        return format(date, "MMMM yyyy");
      case "day":
      default:
        return format(date, "MMM d");
    }
  };

  // Format chart data for recharts
  const formatChartData = (data: WeeklyUsage[] | AgentCostData[]) => {
    if (!data || data.length === 0) return [];

    return data.map((item) => ({
      date: formatTimePeriod(item.time_period),
      "Total Cost": Number.parseFloat((item.total_cost || 0).toFixed(4)),
      Sessions: item.session_count,
      ...("avg_cost_per_session" in item
        ? {
            "Avg Cost/Session": Number.parseFloat(
              (item.avg_cost_per_session || 0).toFixed(4)
            ),
          }
        : {}),
    }));
  };

  // Format agent stats for pie chart
  const formatAgentStatsForPieChart = (stats: AgentStats[]) => {
    if (!stats || stats.length === 0) return [];

    const colorHues = [215, 280, 160, 30, 340, 190, 60, 310];

    return stats.map((agent, index) => ({
      name: agent.agent_name,
      value: Number.parseFloat(agent.total_cost.toFixed(4)),
      fill: `hsl(${colorHues[index % colorHues.length]}, 90%, 50%)`,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <style dangerouslySetInnerHTML={{ __html: chartStyles }} />
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-xl flex items-center gap-2">
            <ChartColumn className="h-5 w-5 text-primary" />
            Usage Analytics
          </DialogTitle>
          <DialogDescription>
            View your usage statistics and costs across different time periods
            and agents.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Time Range
              </label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last 7 days</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                  <SelectItem value="3months">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Group By</label>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Group by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {activeTab === "agent" && usageData && usageData.stats.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-1 block">Agent</label>
              <Select
                value={selectedAgent || ""}
                onValueChange={(value) => setSelectedAgent(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {usageData.stats.map((agent) => (
                    <SelectItem key={agent.agent_id} value={agent.agent_id}>
                      {agent.agent_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setError(null);
                fetchUsageData();
              }}
            >
              Try Again
            </Button>
          </div>
        ) : usageData ? (
          <Tabs
            defaultValue="overview"
            className="w-full"
            onValueChange={(value) => setActiveTab(value)}
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="agent" disabled={!selectedAgent}>
                Agent Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-sm border border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Sessions
                        </p>
                        <p className="text-2xl font-bold mt-1">
                          {usageData.overall.total_sessions}
                        </p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Cost
                        </p>
                        <p className="text-2xl font-bold mt-1">
                          ${usageData.overall.total_cost.toFixed(4)}
                        </p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Avg Cost/Session
                        </p>
                        <p className="text-2xl font-bold mt-1">
                          ${usageData.overall.avg_cost_per_session.toFixed(4)}
                        </p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <BarChartIcon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost Over Time Chart */}
                <Card className="shadow-sm border border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      Cost Over Time
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-[200px] text-xs">
                              Shows your total cost over the selected time
                              period
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {usageData.weekly_usage.length > 0 ? (
                      <div className="w-full h-64 mt-4">
                        <ResponsiveContainer width="99%" height="100%">
                          <AreaChart
                            data={formatChartData(usageData.weekly_usage)}
                            margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              className="stroke-border/50"
                            />
                            <XAxis
                              dataKey="date"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => `$${value}`}
                            />
                            <RechartsTooltip content={<CustomChartTooltip />} />
                            <Area
                              type="monotone"
                              dataKey="Total Cost"
                              name="Total Cost"
                              stroke="var(--color-Total Cost)"
                              fill="var(--color-Total Cost)"
                              fillOpacity={0.3}
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-40 flex items-center justify-center text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Agent Distribution Chart */}
                <Card className="shadow-sm border border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      Agent Distribution
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-[200px] text-xs">
                              Shows cost distribution across different agents
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {usageData.stats.length > 0 ? (
                      <div className="w-full h-64 mt-4">
                        <ResponsiveContainer width="99%" height="100%">
                          <PieChart>
                            <RechartsTooltip content={<CustomPieTooltip />} />
                            <Pie
                              data={formatAgentStatsForPieChart(
                                usageData.stats
                              )}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={4}
                              strokeWidth={1}
                              stroke="#ffffff"
                            >
                              {usageData.stats.map((agent, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={`hsl(${
                                    [215, 280, 160, 30, 340, 190, 60, 310][
                                      index % 8
                                    ]
                                  }, 90%, 50%)`}
                                />
                              ))}
                              <Label
                                content={({ viewBox }) => {
                                  if (
                                    viewBox &&
                                    "cx" in viewBox &&
                                    "cy" in viewBox
                                  ) {
                                    return (
                                      <text
                                        x={viewBox.cx}
                                        y={viewBox.cy}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                      >
                                        <tspan
                                          x={viewBox.cx}
                                          y={viewBox.cy}
                                          className="fill-foreground text-xl font-bold"
                                        >
                                          $
                                          {usageData.overall.total_cost.toFixed(
                                            2
                                          )}
                                        </tspan>
                                        <tspan
                                          x={viewBox.cx}
                                          y={(viewBox.cy || 0) + 20}
                                          className="fill-muted-foreground text-xs"
                                        >
                                          Total Cost
                                        </tspan>
                                      </text>
                                    );
                                  }
                                  return null;
                                }}
                              />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-40 flex items-center justify-center text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Agents Table */}
              <Card className="shadow-sm border border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Agents</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead className="text-right">Sessions</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                        <TableHead className="text-right">
                          Avg Cost/Session
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usageData.stats.length > 0 ? (
                        usageData.stats.map((agent) => (
                          <TableRow
                            key={agent.agent_id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => {
                              setSelectedAgent(agent.agent_id);
                              setActiveTab("agent");
                            }}
                          >
                            <TableCell className="font-medium">
                              {agent.agent_name}
                            </TableCell>
                            <TableCell className="text-right">
                              {agent.session_count}
                            </TableCell>
                            <TableCell className="text-right">
                              ${agent.total_cost.toFixed(4)}
                            </TableCell>
                            <TableCell className="text-right">
                              ${agent.avg_cost_per_session.toFixed(4)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            <span className="text-muted-foreground">
                              No agents data available
                            </span>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agent" className="space-y-6">
              {isAgentLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : agentCostData ? (
                <>
                  {/* Agent Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="shadow-sm border border-border">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Total Sessions
                            </p>
                            <p className="text-2xl font-bold mt-1">
                              {agentCostData.overall.total_sessions}
                            </p>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm border border-border">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Total Cost
                            </p>
                            <p className="text-2xl font-bold mt-1">
                              ${agentCostData.overall.total_cost.toFixed(4)}
                            </p>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm border border-border">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Avg Cost/Session
                            </p>
                            <p className="text-2xl font-bold mt-1">
                              $
                              {agentCostData.overall.avg_cost_per_session.toFixed(
                                4
                              )}
                            </p>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <BarChartIcon className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Date Range Info */}
                  <div className="text-sm text-muted-foreground flex items-center gap-2 px-1 bg-muted/30 p-2 rounded-md">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>
                      First session:{" "}
                      <span className="font-medium">
                        {agentCostData.overall.first_session
                          ? formatDate(agentCostData.overall.first_session)
                          : "N/A"}
                      </span>
                      {" • "}
                      Last session:{" "}
                      <span className="font-medium">
                        {agentCostData.overall.last_session
                          ? formatDate(agentCostData.overall.last_session)
                          : "N/A"}
                      </span>
                    </span>
                  </div>

                  {/* Agent Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Cost Chart */}
                    <Card className="shadow-sm border border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          Cost Metrics
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-[200px] text-xs">
                                  Shows total cost and average cost per session
                                  over time
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {agentCostData.cost_data.length > 0 ? (
                          <div className="w-full h-64 mt-4">
                            <ResponsiveContainer width="99%" height="100%">
                              <LineChart
                                data={formatChartData(agentCostData.cost_data)}
                                margin={{
                                  top: 10,
                                  right: 30,
                                  left: 0,
                                  bottom: 5,
                                }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  className="stroke-border/50"
                                />
                                <XAxis
                                  dataKey="date"
                                  fontSize={12}
                                  tickLine={false}
                                  axisLine={false}
                                />
                                <YAxis
                                  fontSize={12}
                                  tickLine={false}
                                  axisLine={false}
                                  tickFormatter={(value) => `$${value}`}
                                />
                                <RechartsTooltip
                                  content={<CustomChartTooltip />}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="Total Cost"
                                  name="Total Cost"
                                  stroke="var(--color-Total Cost)"
                                  strokeWidth={2.5}
                                  dot={{
                                    r: 4,
                                    fill: "var(--color-Total Cost)",
                                    strokeWidth: 1,
                                    stroke: "#fff",
                                  }}
                                  activeDot={{
                                    r: 6,
                                    fill: "var(--color-Total Cost)",
                                    stroke: "#fff",
                                    strokeWidth: 2,
                                  }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="Avg Cost/Session"
                                  name="Avg Cost/Session"
                                  stroke="var(--color-Avg Cost/Session)"
                                  strokeWidth={2.5}
                                  dot={{
                                    r: 4,
                                    fill: "var(--color-Avg Cost/Session)",
                                    strokeWidth: 1,
                                    stroke: "#fff",
                                  }}
                                  activeDot={{
                                    r: 6,
                                    fill: "var(--color-Avg Cost/Session)",
                                    stroke: "#fff",
                                    strokeWidth: 2,
                                  }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="h-40 flex items-center justify-center text-muted-foreground">
                            No data available
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Sessions Chart */}
                    <Card className="shadow-sm border border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          Sessions
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-[200px] text-xs">
                                  Shows number of sessions over the selected
                                  time period
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {agentCostData.cost_data.length > 0 ? (
                          <div className="w-full h-64 mt-4">
                            <ResponsiveContainer width="99%" height="100%">
                              <BarChart
                                data={formatChartData(agentCostData.cost_data)}
                                margin={{
                                  top: 10,
                                  right: 30,
                                  left: 0,
                                  bottom: 5,
                                }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  className="stroke-border/50"
                                />
                                <XAxis
                                  dataKey="date"
                                  fontSize={12}
                                  tickLine={false}
                                  axisLine={false}
                                />
                                <YAxis
                                  fontSize={12}
                                  tickLine={false}
                                  axisLine={false}
                                />
                                <RechartsTooltip
                                  content={<CustomChartTooltip />}
                                />
                                <Bar
                                  dataKey="Sessions"
                                  name="Sessions"
                                  fill="var(--color-Sessions)"
                                  radius={[4, 4, 0, 0]}
                                  barSize={30}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="h-40 flex items-center justify-center text-muted-foreground">
                            No data available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detailed Data Table */}
                  <Card className="shadow-sm border border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Detailed Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time Period</TableHead>
                            <TableHead className="text-right">
                              Sessions
                            </TableHead>
                            <TableHead className="text-right">
                              Total Cost
                            </TableHead>
                            <TableHead className="text-right">
                              Avg Cost/Session
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {agentCostData.cost_data.length > 0 ? (
                            agentCostData.cost_data.map((period, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {formatTimePeriod(period.time_period)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {period.session_count}
                                </TableCell>
                                <TableCell className="text-right">
                                  ${period.total_cost.toFixed(4)}
                                </TableCell>
                                <TableCell className="text-right">
                                  ${period.avg_cost_per_session.toFixed(4)}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="text-center py-4"
                              >
                                <span className="text-muted-foreground">
                                  No detailed data available
                                </span>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No agent data available
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No usage data available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
