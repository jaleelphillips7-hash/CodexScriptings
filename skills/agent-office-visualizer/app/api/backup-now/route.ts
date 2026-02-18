import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { NextRequest, NextResponse } from "next/server";

const execFileAsync = promisify(execFile);
const nonceStore = new Map<string, number>();
const stateFile = "/tmp/openclaw-backup-state.json";

async function readState() {
  try { return JSON.parse(await fs.readFile(stateFile, "utf8")); } catch { return {}; }
}

async function writeState(data: unknown) {
  await fs.writeFile(stateFile, JSON.stringify(data), "utf8");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const script = process.env.BACKUP_SCRIPT_PATH || "";
  if (!script) return NextResponse.json({ ok: false, message: "BACKUP_SCRIPT_PATH not configured" }, { status: 400 });

  const command = `${script}`;

  if (body.confirm !== true) {
    const nonce = randomUUID();
    nonceStore.set(nonce, Date.now() + 2 * 60 * 1000);
    return NextResponse.json({ ok: false, requiresConfirmation: true, nonce, command });
  }

  if (!body.nonce || !nonceStore.has(body.nonce) || (nonceStore.get(body.nonce) || 0) < Date.now()) {
    return NextResponse.json({ ok: false, message: "Invalid/expired nonce", command }, { status: 400 });
  }
  nonceStore.delete(body.nonce);

  try {
    const { stdout, stderr } = await execFileAsync(script, [], { timeout: 10 * 60 * 1000 });
    const combined = `${stdout}\n${stderr}`.trim().split("\n").slice(-50).join("\n");
    const state = { lastRunAt: new Date().toISOString(), success: true, output: combined };
    await writeState(state);
    return NextResponse.json({ ok: true, command, ...state });
  } catch (error: any) {
    const out = `${error?.stdout || ""}\n${error?.stderr || error?.message || ""}`.trim().split("\n").slice(-50).join("\n");
    const state = { lastRunAt: new Date().toISOString(), success: false, output: out };
    await writeState(state);
    return NextResponse.json({ ok: false, command, ...state }, { status: 500 });
  }
}

export async function GET() {
  const state = await readState();
  return NextResponse.json({ ok: true, ...state });
}
