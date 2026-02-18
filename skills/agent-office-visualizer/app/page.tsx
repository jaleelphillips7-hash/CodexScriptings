"use client";

import { useEffect, useMemo, useState } from "react";
import OfficeHubCanvas from "./components/OfficeHubCanvas";

type Agent = { id: string };
type Status = { id: string; status: "working" | "not_working" };

export default function Page() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [status, setStatus] = useState<Status[]>([]);
  const [banner, setBanner] = useState<string>("");
  const [errors, setErrors] = useState<any>({ totalLast24h: 0, window15m: 0, last10: [] });
  const [backupState, setBackupState] = useState<any>({});
  const [nonce, setNonce] = useState<string | null>(null);

  async function loadAgents() {
    const r = await fetch("/api/agents", { cache: "no-store" });
    const j = await r.json();
    if (!j.ok) { setBanner(j.message); setAgents([]); return; }
    setAgents(j.agents);
  }

  async function loadStatus() {
    const r = await fetch("/api/agent-status", { cache: "no-store" });
    const j = await r.json();
    if (!j.ok) { setBanner(j.message); setStatus([]); return; }
    setStatus(j.agents);
  }

  async function loadErrors() { const j = await (await fetch("/api/errors", { cache: "no-store" })).json(); setErrors(j); }
  async function loadBackupState() { const j = await (await fetch("/api/backup-now", { cache: "no-store" })).json(); setBackupState(j); }

  useEffect(() => {
    loadAgents(); loadStatus(); loadErrors(); loadBackupState();
    const t = setInterval(() => { loadAgents(); loadStatus(); loadErrors(); }, 5000);
    return () => clearInterval(t);
  }, []);

  const renderAgents: Status[] = useMemo(() => {
    const byId = new Map(status.map((s) => [s.id, s.status]));
    return agents.map((a) => ({ id: a.id, status: byId.get(a.id) ?? "not_working" }));
  }, [agents, status]);

  async function backup(confirm = false) {
    const body: any = confirm ? { confirm: true, nonce } : {};
    const r = await fetch("/api/backup-now", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json();
    if (j.requiresConfirmation) { setNonce(j.nonce); setBackupState(j); return; }
    setBackupState(j);
  }

  return (
    <main className="main">
      <section className="card canvasWrap">
        {banner && <div className="banner warn">{banner.includes("blocked") ? "Tool policy blocked" : banner.includes("auth") ? "Gateway auth failed" : banner}</div>}
        <OfficeHubCanvas agents={renderAgents} />
        <div>
          {renderAgents.map((a) => (
            <span className="badge" key={a.id}><span className="dot" style={{ background: a.status === "working" ? "#23d18b" : "#e05d75" }} />{a.id} {a.status}</span>
          ))}
        </div>
      </section>

      <aside className="widgets">
        <div className="card"><h3>Agent List</h3>{agents.length === 0 ? <p className="small">No agents returned.</p> : agents.map((a) => <div key={a.id}>{a.id}</div>)}</div>
        <div className="card"><h3>Error Radar</h3><div>Last 24h: {errors.totalLast24h}</div><div>Last 15m: {errors.window15m}</div><pre>{(errors.last10 || []).map((e:any)=>`${e.timestamp} ${e.message}`).join("\n")}</pre></div>
        <div className="card"><h3>Backup Now</h3><button onClick={() => backup(false)}>Prepare backup</button>{nonce && <button onClick={() => backup(true)} style={{ marginLeft: 8 }}>Confirm backup</button>}<div className="small">Last run: {backupState.lastRunAt || "n/a"}</div><div className="small">Result: {String(backupState.success ?? "n/a")}</div><pre>{backupState.output || ""}</pre></div>
        <div className="card"><h3>Approvals / Pending</h3><div className="small">Pending approvals integration point (connect your approvals source).</div></div>
        <div className="card"><h3>Usage Summary</h3><div>Total agents: {agents.length}</div><div>Working: {renderAgents.filter((a) => a.status === "working").length}</div><div>Not working: {renderAgents.filter((a) => a.status === "not_working").length}</div></div>
      </aside>
    </main>
  );
}
