import { NextResponse } from "next/server";
import { invokeTool } from "@/lib/gateway";

type AgentsListPayload = {
  agents?: string[];
  allowAny?: boolean;
  defaultId?: string;
};

export async function GET() {
  const result = await invokeTool<AgentsListPayload>("agents_list", {});
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: result.status === 404 ? 200 : result.status });
  }

  const agents = (result.data.agents ?? []).map((id) => ({ id }));
  return NextResponse.json({
    ok: true,
    agents,
    allowAny: Boolean(result.data.allowAny),
    defaultId: result.data.defaultId,
    source: "agents_list"
  });
}
