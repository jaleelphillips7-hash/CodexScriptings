export type AgentRow = { id: string };
export type AgentStatus = "working" | "not_working";
export type AgentState = { id: string; status: AgentStatus };

export type ErrorItem = { timestamp: string; message: string };
