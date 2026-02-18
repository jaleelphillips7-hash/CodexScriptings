import { NextResponse } from "next/server";
import { extractAgentId, invokeTool } from "@/lib/gateway";
import type { AgentState } from "@/lib/types";

const WINDOW_MINUTES = 2;

type AgentsPayload = { agents?: string[] };
type SessionsPayload = { sessions?: Array<{ sessionKey: string }> };

export async function GET() {
  const agentsRes = await invokeTool<AgentsPayload>("agents_list", {});
  if (!agentsRes.ok) {
    return NextResponse.json({ ok: false, message: agentsRes.message }, { status: agentsRes.status === 404 ? 200 : agentsRes.status });
  }

  const ids = agentsRes.data.agents ?? [];

  const sessionsRes = await invokeTool<SessionsPayload>("sessions_list", { activeMinutes: WINDOW_MINUTES, messageLimit: 0 });
  if (!sessionsRes.ok) {
    return NextResponse.json({ ok: false, message: sessionsRes.message }, { status: sessionsRes.status === 404 ? 200 : sessionsRes.status });
  }

  const working = new Set<string>();
  for (const s of sessionsRes.data.sessions ?? []) {
    const id = extractAgentId(s.sessionKey);
    if (id) working.add(id);
  }

  const agents: AgentState[] = ids.map((id) => ({ id, status: working.has(id) ? "working" : "not_working" }));

  return NextResponse.json({
    ok: true,
    polledAt: new Date().toISOString(),
    windowMinutes: WINDOW_MINUTES,
    agents
  });
}
