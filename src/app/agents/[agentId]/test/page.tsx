'use client';

import { use } from "react";
import { TestAgent } from "../../TestAgent";

export default function TestAgentPage({
    params,
}: {
    params: Promise<{ agentId: string }>;
}): JSX.Element {
    const resolvedParams = use(params);
    return <TestAgent agentId={resolvedParams.agentId} agentName={resolvedParams.agentId} />;
} 