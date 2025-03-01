import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserAgents } from "@/db";
import { AgentDBConfig } from "@/agentBuilder/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(_request.url);

    // Access params after all other async operations to avoid the warning
    // This is a workaround for the Next.js App Router issue
    const { agentId } = await params;

    // Get time period parameters
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const groupBy = searchParams.get("groupBy") || "day"; // day, week, month

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify the agent belongs to the user
    const agents = await getUserAgents(userId);
    const agent = agents.find((a: AgentDBConfig) => a.id === agentId);

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found or unauthorized" },
        { status: 404 }
      );
    }

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

    // Build the query
    let query = `
      SELECT 
        ${timeGrouping} as time_period,
        COUNT(*) as session_count,
        SUM(total_cost) as total_cost,
        AVG(total_cost) as avg_cost_per_session
      FROM sessions
      WHERE agent_id = $1
    `;

    const queryParams = [agentId];
    let paramIndex = 2;

    // Filter by date range if specified
    if (startDate) {
      query += ` AND started_at >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND started_at <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }

    // Group by time period and order by time
    query += ` GROUP BY time_period ORDER BY time_period`;

    // Execute the query
    const result = await sql.query(query, queryParams);

    // Format the results
    const costData = result.rows.map((row) => ({
      time_period: row.time_period,
      session_count: parseInt(row.session_count),
      total_cost: parseFloat(row.total_cost),
      avg_cost_per_session: parseFloat(row.avg_cost_per_session),
    }));

    // Get overall stats
    const overallQuery = `
      SELECT 
        COUNT(*) as total_sessions,
        SUM(total_cost) as total_cost,
        AVG(total_cost) as avg_cost_per_session,
        MIN(started_at) as first_session,
        MAX(started_at) as last_session
      FROM sessions
      WHERE agent_id = $1
      ${startDate ? ` AND started_at >= $2` : ""}
      ${endDate ? ` AND started_at <= ${startDate ? "$3" : "$2"}` : ""}
    `;

    const overallParams = [agentId];
    if (startDate) overallParams.push(startDate);
    if (endDate) overallParams.push(endDate);

    const overallResult = await sql.query(overallQuery, overallParams);
    const overallStats = overallResult.rows[0]
      ? {
          total_sessions: parseInt(overallResult.rows[0].total_sessions),
          total_cost: parseFloat(overallResult.rows[0].total_cost || 0),
          avg_cost_per_session: parseFloat(
            overallResult.rows[0].avg_cost_per_session || 0
          ),
          first_session: overallResult.rows[0].first_session,
          last_session: overallResult.rows[0].last_session,
        }
      : {
          total_sessions: 0,
          total_cost: 0,
          avg_cost_per_session: 0,
          first_session: null,
          last_session: null,
        };

    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
      },
      cost_data: costData,
      overall: overallStats,
    });
  } catch (error) {
    console.error("Error fetching agent cost data:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent cost data" },
      { status: 500 }
    );
  }
}
