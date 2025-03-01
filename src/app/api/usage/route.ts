import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserAgents } from "@/db";
import { AgentDBConfig } from "@/agentBuilder/types";
import { sql } from "@vercel/postgres";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);

    // Get time period parameters
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const groupBy = searchParams.get("groupBy") || "day"; // day, week, month

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get user's agents
    const agents = await getUserAgents(userId);
    if (agents.length === 0) {
      return NextResponse.json({
        stats: [],
        overall: {
          total_sessions: 0,
          total_cost: 0,
          avg_cost_per_session: 0,
        },
        weekly_usage: [],
      });
    }

    // Get agent IDs
    const agentIds = agents.map((agent: AgentDBConfig) => agent.id);
    const agentIdsQuoted = agentIds.map((id) => `'${id}'`).join(",");

    // Build the query for overall stats
    const statsQuery = `
      SELECT 
        agent_id,
        COUNT(*) as session_count,
        SUM(total_cost) as total_cost,
        AVG(total_cost) as avg_cost_per_session,
        MIN(started_at) as first_session,
        MAX(started_at) as last_session
      FROM sessions
      WHERE agent_id IN (${agentIdsQuoted})
      ${startDate ? ` AND started_at >= $1` : ""}
      ${endDate ? ` AND started_at <= ${startDate ? "$2" : "$1"}` : ""}
      GROUP BY agent_id
    `;

    const statsParams = [];
    if (startDate) statsParams.push(startDate);
    if (endDate) statsParams.push(endDate);

    // Execute the query
    const statsResult = await sql.query(statsQuery, statsParams);

    // Map agent names to the results
    const statsWithNames = statsResult.rows.map((row) => {
      const agent = agents.find((a: AgentDBConfig) => a.id === row.agent_id);
      return {
        agent_id: row.agent_id,
        agent_name: agent ? agent.name : "Unknown Agent",
        session_count: parseInt(row.session_count),
        total_cost: parseFloat(row.total_cost || 0),
        avg_cost_per_session: parseFloat(row.avg_cost_per_session || 0),
        first_session: row.first_session,
        last_session: row.last_session,
      };
    });

    // Calculate overall stats
    const overallStats = {
      total_sessions: statsResult.rows.reduce(
        (sum, row) => sum + parseInt(row.session_count),
        0
      ),
      total_cost: statsResult.rows.reduce(
        (sum, row) => sum + parseFloat(row.total_cost || 0),
        0
      ),
      avg_cost_per_session:
        statsResult.rows.length > 0
          ? statsResult.rows.reduce(
              (sum, row) => sum + parseFloat(row.total_cost || 0),
              0
            ) /
            statsResult.rows.reduce(
              (sum, row) => sum + parseInt(row.session_count),
              0
            )
          : 0,
    };

    // Build the time grouping expression based on the groupBy parameter
    let timeGrouping;
    switch (groupBy) {
      case "week":
        timeGrouping = "DATE_TRUNC('week', started_at)";
        break;
      case "month":
        timeGrouping = "DATE_TRUNC('month', started_at)";
        break;
      case "day":
      default:
        timeGrouping = "DATE_TRUNC('day', started_at)";
        break;
    }

    // Get weekly usage data
    const weeklyQuery = `
      SELECT 
        ${timeGrouping} as time_period,
        COUNT(*) as session_count,
        SUM(total_cost) as total_cost
      FROM sessions
      WHERE agent_id IN (${agentIdsQuoted})
      ${startDate ? ` AND started_at >= $1` : ""}
      ${endDate ? ` AND started_at <= ${startDate ? "$2" : "$1"}` : ""}
      GROUP BY time_period
      ORDER BY time_period
    `;

    const weeklyResult = await sql.query(weeklyQuery, statsParams);

    // Format the weekly results
    const weeklyUsage = weeklyResult.rows.map((row) => ({
      time_period: row.time_period,
      session_count: parseInt(row.session_count),
      total_cost: parseFloat(row.total_cost || 0),
    }));

    return NextResponse.json({
      stats: statsWithNames,
      overall: overallStats,
      weekly_usage: weeklyUsage,
    });
  } catch (error) {
    console.error("Error fetching usage data:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}
