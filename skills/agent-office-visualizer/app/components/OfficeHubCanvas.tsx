"use client";

import { useEffect, useMemo, useRef } from "react";

type AgentState = { id: string; status: "working" | "not_working" };

type SimAgent = AgentState & { x: number; y: number; tx: number; ty: number; frame: number; tick: number };

const W = 1100;
const H = 720;

export default function OfficeHubCanvas({ agents }: { agents: AgentState[] }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  const slots = useMemo(() => {
    const desks = agents.map((_, i) => ({ x: 100 + (i % 6) * 115, y: 220 + Math.floor(i / 6) * 120 }));
    const beds = agents.map((_, i) => ({ x: 820 + (i % 2) * 130, y: 420 + Math.floor(i / 2) * 65 }));
    return { desks, beds };
  }, [agents]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sim: SimAgent[] = agents.map((a, i) => {
      const target = a.status === "working" ? slots.desks[i] : slots.beds[i];
      return { ...a, x: target.x, y: target.y + 10, tx: target.x, ty: target.y + 10, frame: 0, tick: 0 };
    });

    let raf = 0;
    const render = () => {
      drawScene(ctx, agents, slots);
      for (let i = 0; i < sim.length; i++) {
        const cur = sim[i];
        const incoming = agents[i];
        const target = incoming.status === "working" ? slots.desks[i] : slots.beds[i];
        cur.status = incoming.status;
        cur.tx = target.x;
        cur.ty = target.y + 10;

        const dx = cur.tx - cur.x;
        const dy = cur.ty - cur.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 1) {
          cur.x += (dx / dist) * 1.6;
          cur.y += (dy / dist) * 1.6;
          cur.tick++;
          if (cur.tick % 12 === 0) cur.frame = (cur.frame + 1) % 2;
        }
        drawAgent(ctx, cur);
      }
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [agents, slots]);

  return <canvas width={W} height={H} ref={ref} aria-label="agent office sim" />;
}

function drawScene(ctx: CanvasRenderingContext2D, agents: AgentState[], slots: { desks: {x:number;y:number}[]; beds:{x:number;y:number}[] }) {
  for (let y = 0; y < H; y += 20) for (let x = 0; x < W; x += 20) { ctx.fillStyle = ((x + y) / 20) % 2 === 0 ? "#0c1a33" : "#132347"; ctx.fillRect(x, y, 20, 20); }
  ctx.fillStyle = "#1b2742"; ctx.fillRect(20,20,760,150); ctx.fillRect(800,20,280,350); ctx.fillRect(20,190,760,500); ctx.fillRect(800,390,280,300);
  ctx.strokeStyle = "#3a4b70"; ctx.strokeRect(20,20,760,150); ctx.strokeRect(800,20,280,350); ctx.strokeRect(20,190,760,500); ctx.strokeRect(800,390,280,300);
  ctx.font = "14px JetBrains Mono"; ctx.fillStyle = "#dbe7ff";
  ctx.fillText("Top Rooms", 30, 40); ctx.fillText("Lounge", 810, 40); ctx.fillText("Dynamic Desk Grid", 30, 210); ctx.fillText("Sleeping Quarters", 810, 410);

  slots.desks.forEach((d, i) => {
    ctx.fillStyle = "#684f3f"; ctx.fillRect(d.x, d.y, 80, 24);
    ctx.fillStyle = "#2f66f2"; ctx.fillRect(d.x + 28, d.y - 15, 22, 12);
    ctx.fillStyle = "#94a9d7"; ctx.font = "10px JetBrains Mono"; ctx.fillText(agents[i]?.id ?? "", d.x, d.y + 40);
    ctx.fillStyle = agents[i]?.status === "working" ? "#23d18b" : "#e05d75"; ctx.fillRect(d.x + 70, d.y + 30, 8, 8);
  });

  slots.beds.forEach((b, i) => {
    ctx.fillStyle = "#586785"; ctx.fillRect(b.x, b.y, 95, 34);
    ctx.fillStyle = "#a9bad8"; ctx.fillRect(b.x + 4, b.y + 4, 24, 14);
    ctx.fillStyle = "#33425f"; ctx.fillRect(b.x + 30, b.y + 4, 60, 24);
    ctx.fillStyle = "#94a9d7"; ctx.font = "10px JetBrains Mono"; ctx.fillText(agents[i]?.id ?? "", b.x, b.y + 48);
  });
}

function drawAgent(ctx: CanvasRenderingContext2D, a: SimAgent) {
  const x = Math.round(a.x), y = Math.round(a.y), s = 2;
  const atTarget = Math.hypot(a.tx - a.x, a.ty - a.y) < 2;
  const sleeping = a.status === "not_working" && atTarget;
  const typing = a.status === "working" && atTarget;

  if (sleeping) {
    px(ctx, x + 4, y + 10, 14, 6, "#23283a", s); px(ctx, x + 4, y + 6, 4, 4, "#f7c8a7", s);
    ctx.fillStyle = "#d9e1ff"; ctx.font = "12px JetBrains Mono"; ctx.fillText("Z", x + 32, y + 8); ctx.fillText("Z", x + 38, y + 2);
    return;
  }

  px(ctx, x + 6, y, 8, 4, "#3a2c24", s); px(ctx, x + 6, y + 4, 8, 6, "#f7c8a7", s); px(ctx, x + 4, y + 10, 12, 10, "#63e6be", s);
  if (typing) {
    px(ctx, x + 2, y + 12, 2, 7, "#63e6be", s); px(ctx, x + 16, y + 12, 2, 7, "#63e6be", s);
  } else {
    const o = a.frame === 0 ? -1 : 1; px(ctx, x + 2, y + 10 + o, 2, 8, "#63e6be", s); px(ctx, x + 16, y + 12 - o, 2, 8, "#63e6be", s);
    px(ctx, x + 6, y + 20 + (a.frame ? 1 : -1), 4, 8, "#23283a", s); px(ctx, x + 10, y + 20 + (a.frame ? -1 : 1), 4, 8, "#23283a", s);
  }
}

function px(ctx: CanvasRenderingContext2D, x:number,y:number,w:number,h:number,c:string,s:number){ctx.fillStyle=c;ctx.fillRect(x*s,y*s,w*s,h*s);} 
