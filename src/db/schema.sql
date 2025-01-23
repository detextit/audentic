CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    instructions TEXT NOT NULL,
    first_message TEXT,
    tools JSONB DEFAULT '[]',
    tool_logic JSONB DEFAULT '{}',
    downstream_agents JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 