import { promises as fs } from "node:fs";
import { NextResponse } from "next/server";

const ERRORS_PATH = process.env.ERROR_LOG_PATH || "/data/.openclaw/ERRORS_DETECTED.md";

function parseTimestamp(line: string): string | null {
  const iso = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/)?.[1];
  if (iso) return iso;
  const simple = line.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/)?.[1];
  if (!simple) return null;
  return new Date(simple.replace(" ", "T") + "Z").toISOString();
}

export async function GET() {
  try {
    const text = await fs.readFile(ERRORS_PATH, "utf8");
    const lines = text.split("\n").filter(Boolean);
    const items = lines.map((line) => ({ timestamp: parseTimestamp(line) || new Date(0).toISOString(), message: line }));
    const now = Date.now();
    const in24h = items.filter((e) => now - new Date(e.timestamp).getTime() <= 24 * 60 * 60 * 1000);
    const in15m = items.filter((e) => now - new Date(e.timestamp).getTime() <= 15 * 60 * 1000);

    return NextResponse.json({
      ok: true,
      source: ERRORS_PATH,
      totalLast24h: in24h.length,
      window15m: in15m.length,
      last10: items.slice(-10).reverse()
    });
  } catch {
    return NextResponse.json({ ok: true, source: ERRORS_PATH, totalLast24h: 0, window15m: 0, last10: [] });
  }
}
