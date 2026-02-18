export type InvokeResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || "http://127.0.0.1:18789";
const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN;

export async function invokeTool<T>(tool: string, args: Record<string, unknown>): Promise<InvokeResult<T>> {
  if (!gatewayToken) {
    return { ok: false, status: 401, message: "Gateway auth failed" };
  }

  const res = await fetch(`${gatewayUrl}/tools/invoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${gatewayToken}`
    },
    body: JSON.stringify({ tool, action: "json", args, sessionKey: "main" }),
    cache: "no-store"
  });

  if (!res.ok) {
    if (res.status === 401) return { ok: false, status: 401, message: "Gateway auth failed" };
    if (res.status === 404) return { ok: false, status: 404, message: `${tool} blocked by tool policy` };
    return { ok: false, status: res.status, message: `Gateway error (${res.status})` };
  }

  const json = (await res.json()) as T;
  return { ok: true, data: json };
}

export function extractAgentId(sessionKey: string): string | null {
  if (!sessionKey.startsWith("agent:")) return null;
  const parts = sessionKey.split(":");
  return parts[1] || null;
}
