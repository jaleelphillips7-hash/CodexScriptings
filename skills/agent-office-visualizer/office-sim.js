(() => {
  const canvas = document.getElementById("office");
  const ctx = canvas.getContext("2d");
  const statusBar = document.getElementById("statusBar");
  const nameGrid = document.getElementById("nameGrid");

  const W = canvas.width;
  const H = canvas.height;
  const TILE = 20;
  const NAMES_KEY = "agent-office-visualizer:names";

  const PALETTE = {
    floorA: "#0c1a33",
    floorB: "#132347",
    wall: "#2f3c56",
    roomFill: "#1c2840",
    hallway: "#17233a",
    desk: "#684f3f",
    deskTop: "#816655",
    chair: "#46536b",
    monitor: "#2f66f2",
    screenGlow: "#6ea2ff",
    white: "#e8efff",
    cabinet: "#d0d8e7",
    fridge: "#f1f4ff",
    couch: "#5c4c88",
    bean: "#8d5cb8",
    ping: "#5da37a",
    table: "#4d6f86",
    plant: "#2f8d57",
    tree: "#2f9a5d",
    trunk: "#68543d",
    red: "#e05d75",
    green: "#23d18b",
    black: "#0e1017",
    skin: "#f7c8a7",
    pants: "#23283a"
  };

  const deskItems = {
    researcher: "globe",
    writer: "books",
    developer: "coffee",
    designer: "palette",
    video: "camera",
    motion: "waveform",
    qa: "shield",
    scout: "fire"
  };

  const agents = [
    { name: "Honor", role: "researcher", color: "#4fb3ff" },
    { name: "Ares", role: "writer", color: "#f5c74e" },
    { name: "Oracle", role: "developer", color: "#63e6be" },
    { name: "Magia", role: "designer", color: "#d89cff" },
    { name: "Nova", role: "video", color: "#ff8e6e" },
    { name: "Agent 6", role: "motion", color: "#7ec8ff" },
    { name: "Agent 7", role: "qa", color: "#9eff7a" },
    { name: "Agent 8", role: "scout", color: "#ff6e8c" }
  ];

  const cubicles = createCubicleGrid();
  const idleSpots = [
    { x: 165, y: 95 },
    { x: 925, y: 120 },
    { x: 930, y: 300 },
    { x: 885, y: 500 },
    { x: 220, y: 575 },
    { x: 520, y: 565 },
    { x: 760, y: 220 },
    { x: 710, y: 620 },
    { x: 365, y: 120 }
  ];

  loadSavedNames();

  agents.forEach((agent, i) => {
    const cubicle = cubicles[i];
    Object.assign(agent, {
      id: i,
      x: cubicle.deskX,
      y: cubicle.deskY + 35,
      vx: 0,
      vy: 0,
      speed: 1.4,
      frame: 0,
      frameTick: 0,
      seatOffset: { x: 16, y: 21 },
      cubicle,
      mood: Math.random() < 0.55 ? "working" : "idle",
      target: null,
      wanderTimer: 0
    });
    setAgentTarget(agent);
  });

  renderNameEditor();

  function createCubicleGrid() {
    const list = [];
    const startX = 120;
    const startY = 200;
    const spacingX = 155;
    const spacingY = 185;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        const x = startX + col * spacingX;
        const y = startY + row * spacingY;
        list.push({
          x,
          y,
          w: 130,
          h: 145,
          deskX: x + 18,
          deskY: y + 16
        });
      }
    }

    return list;
  }

  function loadSavedNames() {
    try {
      const raw = localStorage.getItem(NAMES_KEY);
      if (!raw) return;
      const names = JSON.parse(raw);
      if (!Array.isArray(names)) return;
      names.forEach((name, i) => {
        if (typeof name === "string" && name.trim()) {
          agents[i].name = name.trim().slice(0, 18);
        }
      });
    } catch {
      // noop
    }
  }

  function saveNames() {
    const names = agents.map((agent) => agent.name);
    localStorage.setItem(NAMES_KEY, JSON.stringify(names));
  }

  function renderNameEditor() {
    if (!nameGrid) return;
    nameGrid.innerHTML = "";

    agents.forEach((agent, i) => {
      const label = document.createElement("label");
      label.innerHTML = `${agent.role}<input type="text" value="${escapeHtml(agent.name)}" maxlength="18" data-agent-index="${i}" aria-label="Agent name ${agent.role}">`;
      nameGrid.appendChild(label);
    });

    nameGrid.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", (event) => {
        const target = event.currentTarget;
        const index = Number(target.dataset.agentIndex);
        const value = target.value.trim().slice(0, 18);
        agents[index].name = value || `Agent ${index + 1}`;
        refreshStatusBadges();
        saveNames();
      });
    });
  }

  function escapeHtml(input) {
    return String(input)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function setAgentTarget(agent) {
    if (agent.mood === "working") {
      agent.target = {
        x: agent.cubicle.deskX + agent.seatOffset.x,
        y: agent.cubicle.deskY + agent.seatOffset.y,
        type: "desk"
      };
    } else {
      const spot = idleSpots[Math.floor(Math.random() * idleSpots.length)];
      agent.target = { x: spot.x, y: spot.y, type: "wander" };
      agent.wanderTimer = 180 + Math.floor(Math.random() * 200);
    }
  }

  function drawScene() {
    drawFloor();
    drawTopRooms();
    drawCubicles();
    drawLounge();
    drawPlants();

    const sorted = [...agents].sort((a, b) => a.y - b.y);
    sorted.forEach(drawAgent);
  }

  function drawFloor() {
    for (let y = 0; y < H; y += TILE) {
      for (let x = 0; x < W; x += TILE) {
        ctx.fillStyle = ((x / TILE + y / TILE) % 2 === 0) ? PALETTE.floorA : PALETTE.floorB;
        ctx.fillRect(x, y, TILE, TILE);
      }
    }

    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fillRect(0, 170, 780, 20);
    ctx.fillRect(0, 370, 780, 20);
    ctx.fillRect(790, 0, 310, H);
  }

  function drawRoom(x, y, w, h, label) {
    ctx.fillStyle = PALETTE.roomFill;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = PALETTE.wall;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "#bfd1ff";
    ctx.font = "14px JetBrains Mono, monospace";
    ctx.fillText(label, x + 10, y + 18);
  }

  function drawTopRooms() {
    drawRoom(20, 20, 245, 140, "Conference");
    drawRoom(280, 20, 245, 140, "Boss Office");
    drawRoom(540, 20, 245, 140, "Kitchen");

    ctx.fillStyle = "#55759d";
    ctx.beginPath();
    ctx.arc(145, 95, 38, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      ctx.fillStyle = PALETTE.chair;
      ctx.fillRect(145 + Math.cos(angle) * 48 - 8, 95 + Math.sin(angle) * 48 - 8, 16, 16);
    }

    ctx.fillStyle = PALETTE.desk;
    ctx.fillRect(310, 52, 112, 44);
    ctx.fillStyle = PALETTE.deskTop;
    ctx.fillRect(310, 52, 112, 10);
    ctx.fillStyle = PALETTE.couch;
    ctx.fillRect(440, 52, 60, 28);
    ctx.fillStyle = "#7d8cab";
    ctx.fillRect(440, 84, 60, 8);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = "#4a628d";
      ctx.fillRect(300 + i * 28, 115, 22, 35);
    }

    ctx.fillStyle = PALETTE.cabinet;
    ctx.fillRect(560, 50, 62, 24);
    ctx.fillRect(628, 50, 62, 24);
    ctx.fillStyle = PALETTE.fridge;
    ctx.fillRect(700, 50, 58, 90);
    ctx.fillStyle = "#a7b6d1";
    ctx.fillRect(702, 90, 54, 2);
    ctx.fillStyle = "#2a2f3f";
    ctx.fillRect(572, 86, 32, 48);
    ctx.fillStyle = "#2f66f2";
    ctx.fillRect(576, 92, 24, 8);
  }

  function drawCubicles() {
    cubicles.forEach((cubicle, i) => {
      ctx.strokeStyle = "#3a4b70";
      ctx.strokeRect(cubicle.x, cubicle.y, cubicle.w, cubicle.h);

      ctx.fillStyle = PALETTE.desk;
      ctx.fillRect(cubicle.deskX, cubicle.deskY, 90, 26);
      ctx.fillStyle = PALETTE.deskTop;
      ctx.fillRect(cubicle.deskX, cubicle.deskY, 90, 8);
      ctx.fillStyle = PALETTE.monitor;
      ctx.fillRect(cubicle.deskX + 38, cubicle.deskY - 18, 28, 16);
      ctx.fillStyle = PALETTE.screenGlow;
      ctx.fillRect(cubicle.deskX + 41, cubicle.deskY - 15, 22, 10);
      ctx.fillStyle = PALETTE.chair;
      ctx.fillRect(cubicle.deskX + 28, cubicle.deskY + 30, 26, 16);

      drawDeskItem(deskItems[agents[i].role], cubicle.deskX + 8, cubicle.deskY - 14);

      ctx.fillStyle = "#94a9d7";
      ctx.font = "11px JetBrains Mono, monospace";
      ctx.fillText(agents[i].name, cubicle.x + 6, cubicle.y + cubicle.h - 9);
      ctx.fillStyle = agents[i].mood === "working" ? PALETTE.green : PALETTE.red;
      ctx.fillRect(cubicle.x + cubicle.w - 16, cubicle.y + cubicle.h - 16, 9, 9);
    });
  }

  function drawDeskItem(item, x, y) {
    switch (item) {
      case "globe":
        ctx.fillStyle = "#3c89c9";
        ctx.fillRect(x + 2, y + 2, 10, 10);
        ctx.fillStyle = "#77d17d";
        ctx.fillRect(x + 5, y + 5, 4, 3);
        break;
      case "books":
        ctx.fillStyle = "#dca06b";
        ctx.fillRect(x, y + 7, 12, 3);
        ctx.fillStyle = "#87b5ff";
        ctx.fillRect(x + 1, y + 3, 10, 3);
        break;
      case "coffee":
        ctx.fillStyle = "#f4f4ff";
        ctx.fillRect(x + 3, y + 3, 7, 8);
        ctx.fillStyle = "#684f3f";
        ctx.fillRect(x + 4, y + 4, 5, 3);
        break;
      case "palette":
        ctx.fillStyle = "#f4c69e";
        ctx.fillRect(x + 2, y + 2, 10, 10);
        ctx.fillStyle = "#7ec8ff";
        ctx.fillRect(x + 4, y + 4, 2, 2);
        ctx.fillStyle = "#ff8e6e";
        ctx.fillRect(x + 8, y + 5, 2, 2);
        break;
      case "camera":
        ctx.fillStyle = "#2b3143";
        ctx.fillRect(x + 1, y + 4, 12, 8);
        ctx.fillStyle = "#7aa9ff";
        ctx.fillRect(x + 5, y + 6, 4, 4);
        break;
      case "waveform":
        ctx.fillStyle = "#7ec8ff";
        [2, 5, 8, 11].forEach((ox, n) => ctx.fillRect(x + ox, y + 8 - (n % 2) * 4, 2, 6));
        break;
      case "shield":
        ctx.fillStyle = "#7ea1ff";
        ctx.fillRect(x + 3, y + 2, 8, 10);
        ctx.fillStyle = "#4f6ed1";
        ctx.fillRect(x + 5, y + 4, 4, 6);
        break;
      case "fire":
        ctx.fillStyle = "#ffb14f";
        ctx.fillRect(x + 4, y + 2, 6, 8);
        ctx.fillStyle = "#ff6e4f";
        ctx.fillRect(x + 5, y + 4, 4, 5);
        break;
      default:
        break;
    }
  }

  function drawLounge() {
    drawRoom(800, 20, 280, 660, "Lounge");

    ctx.fillStyle = PALETTE.couch;
    ctx.fillRect(830, 70, 120, 34);
    ctx.fillRect(830, 110, 40, 22);

    ctx.fillStyle = PALETTE.table;
    ctx.fillRect(975, 84, 60, 24);

    ctx.fillStyle = "#9cc8f2";
    ctx.fillRect(1010, 145, 28, 52);
    ctx.fillStyle = "#6fb0e8";
    ctx.fillRect(1007, 136, 34, 12);

    ctx.fillStyle = PALETTE.bean;
    ctx.fillRect(834, 190, 38, 24);
    ctx.fillRect(882, 198, 42, 24);

    ctx.fillStyle = PALETTE.ping;
    ctx.fillRect(825, 270, 210, 80);
    ctx.fillStyle = PALETTE.white;
    ctx.fillRect(930, 270, 2, 80);
    ctx.fillRect(825, 309, 210, 2);

    ctx.fillStyle = "#e7efff";
    ctx.fillRect(825, 385, 210, 110);
    ctx.fillStyle = "#8ca0c4";
    ctx.fillRect(828, 388, 204, 104);
  }

  function drawPlants() {
    const shrubs = [
      [45, 182], [335, 182], [635, 182], [740, 420], [78, 620], [735, 620], [1040, 540]
    ];
    shrubs.forEach(([x, y]) => {
      ctx.fillStyle = PALETTE.trunk;
      ctx.fillRect(x + 8, y + 12, 8, 12);
      ctx.fillStyle = PALETTE.plant;
      ctx.fillRect(x, y, 24, 16);
      ctx.fillRect(x + 4, y - 8, 16, 10);
    });

    ctx.fillStyle = PALETTE.trunk;
    ctx.fillRect(745, 70, 10, 20);
    ctx.fillStyle = PALETTE.tree;
    ctx.fillRect(733, 52, 34, 22);
  }

  function drawAgent(agent) {
    const spriteX = Math.round(agent.x);
    const spriteY = Math.round(agent.y);
    const scale = 2;

    ctx.save();
    ctx.translate(spriteX, spriteY);

    const walking = agent.mood === "idle" || distance(agent, agent.target) > 2;
    const frame = walking ? agent.frame : 0;

    drawRect(6, 0, 8, 4, "#3a2c24", scale);
    drawRect(6, 4, 8, 6, PALETTE.skin, scale);
    drawRect(4, 10, 12, 10, agent.color, scale);

    if (walking) {
      const armOffset = frame === 0 ? -1 : 1;
      drawRect(2, 10 + armOffset, 2, 8, agent.color, scale);
      drawRect(16, 12 - armOffset, 2, 8, agent.color, scale);
      const legOffset = frame === 0 ? 1 : -1;
      drawRect(6, 20 + legOffset, 4, 8, PALETTE.pants, scale);
      drawRect(10, 20 - legOffset, 4, 8, PALETTE.pants, scale);
    } else {
      drawRect(2, 12, 2, 7, agent.color, scale);
      drawRect(16, 12, 2, 7, agent.color, scale);
      drawRect(6, 20, 4, 8, PALETTE.pants, scale);
      drawRect(10, 20, 4, 8, PALETTE.pants, scale);
      drawRect(5, 13, 10, 2, "#d9e1ff", scale);
    }

    drawRect(8, 6, 1, 1, PALETTE.black, scale);
    drawRect(11, 6, 1, 1, PALETTE.black, scale);

    ctx.restore();
  }

  function drawRect(x, y, w, h, color, scale) {
    ctx.fillStyle = color;
    ctx.fillRect(x * scale, y * scale, w * scale, h * scale);
  }

  function updateAgents() {
    agents.forEach((agent) => {
      const target = agent.target;
      if (!target) return;

      const dx = target.x - agent.x;
      const dy = target.y - agent.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 1.5) {
        agent.vx = (dx / dist) * agent.speed;
        agent.vy = (dy / dist) * agent.speed;
        agent.x += agent.vx;
        agent.y += agent.vy;

        agent.frameTick += 1;
        if (agent.frameTick > 14) {
          agent.frame = (agent.frame + 1) % 2;
          agent.frameTick = 0;
        }
      } else {
        agent.vx = 0;
        agent.vy = 0;
        if (agent.mood === "idle") {
          agent.wanderTimer -= 1;
          if (agent.wanderTimer <= 0) setAgentTarget(agent);
        }
      }
    });
  }

  function distance(a, b) {
    if (!b) return 0;
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function refreshStatusBadges() {
    statusBar.innerHTML = "";
    agents.forEach((agent) => {
      const badge = document.createElement("div");
      badge.className = "badge";
      badge.innerHTML = `
        <span class="dot" style="background:${agent.color}"></span>
        <strong>${agent.name}</strong>
        <span class="dot" style="background:${agent.mood === "working" ? PALETTE.green : PALETTE.red}"></span>
        <span class="state">${agent.mood === "working" ? "Working" : "Idle"}</span>
      `;
      statusBar.appendChild(badge);
    });
  }

  async function pollEmployeeStatus() {
    try {
      const res = await fetch("/api/employee-status", { cache: "no-store" });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const payload = await res.json();
      applyStatusPayload(payload);
    } catch {
      const n = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < n; i++) {
        const randomAgent = agents[Math.floor(Math.random() * agents.length)];
        randomAgent.mood = Math.random() < 0.6 ? "working" : "idle";
        setAgentTarget(randomAgent);
      }
      refreshStatusBadges();
    }
  }

  function applyStatusPayload(payload) {
    const rows = Array.isArray(payload) ? payload : payload?.employees;
    if (!Array.isArray(rows)) return;

    rows.forEach((row) => {
      const target = agents.find((a) => a.name.toLowerCase() === String(row.name || "").toLowerCase());
      if (!target) return;
      const next = row.status === "working" ? "working" : "idle";
      if (next !== target.mood) {
        target.mood = next;
        setAgentTarget(target);
      }
    });

    refreshStatusBadges();
  }

  function tick() {
    updateAgents();
    drawScene();
    requestAnimationFrame(tick);
  }

  refreshStatusBadges();
  setInterval(pollEmployeeStatus, 5000);
  pollEmployeeStatus();
  tick();
})();
