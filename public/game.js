// ─────────────────────────────────────────────────────────────
//  game.js  –  Batalha do Fundo do Mar  (Brawl Stars 3v3 clone)
// ─────────────────────────────────────────────────────────────

const canvas = document.getElementById("c");
const ctx    = canvas.getContext("2d");

let W, H;
function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
resize();
window.addEventListener("resize", resize);

// ── Personagens ──────────────────────────────────────────────
const CHARS = {
  spongebob: { emoji:"🧽", speed:3.2, hp:120, dmg:22, bspeed:6.0, color:"#f5e642", color2:"#c8bb15", bEmoji:"💦", fr:28 },
  patrick:   { emoji:"⭐", speed:1.8, hp:200, dmg:50, bspeed:4.2, color:"#ff9aaa", color2:"#cc6070", bEmoji:"🪨", fr:55 },
  squidward: { emoji:"🐙", speed:2.6, hp:140, dmg:32, bspeed:8.5, color:"#7ecfcf", color2:"#4aafaf", bEmoji:"🎵", fr:38 },
};

// ── Estado global ─────────────────────────────────────────────
let selectedChar = "spongebob";
let gRunning = false, frameN = 0;
let scoreB = 0, scoreR = 0, gTime = 90;
let players = [], bullets = [], effects = [];
let keys    = {};
let tiles   = [], MC = 0, MR = 0, OX = 0, OY = 0;

const T    = 36;          // tamanho do tile em px
const WALL = 1, BUSH = 2;

// ── Seleção de personagem ─────────────────────────────────────
document.querySelectorAll(".ccard").forEach(card => {
  card.addEventListener("click", function () {
    document.querySelectorAll(".ccard").forEach(c => c.classList.remove("sel"));
    this.classList.add("sel");
    selectedChar = this.id.replace("cc-", "");
  });
});

document.getElementById("sbtn").addEventListener("click", startGame);

// ── Mapa ─────────────────────────────────────────────────────
function buildMap() {
  MC = Math.max(17, Math.floor((W - 20) / T));
  MR = Math.max(11, Math.floor((H - 60) / T));
  OX = Math.floor((W - MC * T) / 2);
  OY = 50;

  tiles = [];
  for (let r = 0; r < MR; r++) {
    tiles[r] = [];
    for (let c = 0; c < MC; c++) tiles[r][c] = 0;
  }

  // Bordas
  for (let r = 0; r < MR; r++)
    for (let c = 0; c < MC; c++)
      if (r === 0 || r === MR - 1 || c === 0 || c === MC - 1) tiles[r][c] = WALL;

  // Blocos centrais
  const wps = [
    [~~(MR * .3), ~~(MC * .3)], [~~(MR * .3), ~~(MC * .7)],
    [~~(MR * .7), ~~(MC * .3)], [~~(MR * .7), ~~(MC * .7)],
    [~~(MR * .5), ~~(MC * .5)],
  ];
  for (const [r, c] of wps)
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr > 0 && nr < MR - 1 && nc > 0 && nc < MC - 1)
          tiles[nr][nc] = Math.random() < .55 ? WALL : BUSH;
      }

  // Arbustos nos cantos
  const bps = [
    [~~(MR * .15), ~~(MC * .15)], [~~(MR * .15), ~~(MC * .85)],
    [~~(MR * .85), ~~(MC * .15)], [~~(MR * .85), ~~(MC * .85)],
  ];
  for (const [r, c] of bps)
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr > 0 && nr < MR - 1 && nc > 0 && nc < MC - 1 && tiles[nr][nc] === 0)
          tiles[nr][nc] = BUSH;
      }
}

function tileAt(px, py) {
  const c = ~~((px - OX) / T), r = ~~((py - OY) / T);
  if (c < 0 || c >= MC || r < 0 || r >= MR) return WALL;
  return tiles[r][c];
}
const isWall = (px, py) => tileAt(px, py) === WALL;

// ── Criação de jogador ────────────────────────────────────────
function mkPlayer(ck, team, col, row) {
  const d = CHARS[ck];
  return {
    char: ck, team,
    x: OX + col * T + T / 2,
    y: OY + row * T + T / 2,
    hp: d.hp, mhp: d.hp, alive: true,
    speed: d.speed, dmg: d.dmg, bs: d.bspeed,
    color: d.color, color2: d.color2,
    emoji: d.emoji, be: d.bEmoji,
    fr: d.fr, ls: 0, r: 13,
    facing: team === "blue" ? 1 : -1,
  };
}
function rChar() {
  const k = Object.keys(CHARS);
  return k[~~(Math.random() * k.length)];
}

// ── Início de partida ─────────────────────────────────────────
function startGame() {
  document.getElementById("overlay").style.display = "none";
  gRunning = true;
  scoreB = 0; scoreR = 0;
  bullets = []; effects = [];
  frameN  = 0; gTime   = 90;

  buildMap();

  const mid = ~~(MR / 2);
  players = [
    mkPlayer(selectedChar, "blue", 2,      mid - 2),
    mkPlayer(rChar(),      "blue", 2,      mid),
    mkPlayer(rChar(),      "blue", 2,      mid + 2),
    mkPlayer(rChar(),      "red",  MC - 3, mid - 2),
    mkPlayer(rChar(),      "red",  MC - 3, mid),
    mkPlayer(rChar(),      "red",  MC - 3, mid + 2),
  ];

  clearInterval(window._timer);
  window._timer = setInterval(() => { if (gRunning && gTime > 0) gTime--; }, 1000);

  requestAnimationFrame(loop);
}

// ── Movimentação ──────────────────────────────────────────────
function moveP(p, dx, dy) {
  if (!p.alive) return;
  const nx = p.x + dx * p.speed, ny = p.y + dy * p.speed, r = p.r - 2;
  if (!isWall(nx + r, p.y) && !isWall(nx - r, p.y)) p.x = nx;
  if (!isWall(p.x, ny + r) && !isWall(p.x, ny - r)) p.y = ny;
  if (dx !== 0) p.facing = dx > 0 ? 1 : -1;
}

// ── Disparo ───────────────────────────────────────────────────
function shootP(s) {
  if (!s.alive || frameN - s.ls < s.fr) return;
  s.ls = frameN;

  let dx = s.facing, dy = 0;

  // IA mira no inimigo mais próximo
  if (s !== players[0]) {
    const t = players.find(p => p.team !== s.team && p.alive);
    if (!t) return;
    const dist = Math.hypot(t.x - s.x, t.y - s.y);
    if (dist > 260) return;
    dx = (t.x - s.x) / dist;
    dy = (t.y - s.y) / dist;
  }

  bullets.push({ x: s.x, y: s.y, dx: dx * s.bs, dy: dy * s.bs, team: s.team, dmg: s.dmg, emoji: s.be, life: 85 });
}

// ── IA dos bots ───────────────────────────────────────────────
function aiStep(p) {
  if (!p.alive) return;
  const enemies = players.filter(e => e.team !== p.team && e.alive);
  if (!enemies.length) return;

  const t    = enemies.reduce((a, b) => Math.hypot(a.x - p.x, a.y - p.y) < Math.hypot(b.x - p.x, b.y - p.y) ? a : b);
  const dist = Math.hypot(t.x - p.x, t.y - p.y);
  const ang  = Math.atan2(t.y - p.y, t.x - p.x);
  const mv   = dist > 140 ? 1 : dist < 75 ? -1 : 0;

  moveP(p, Math.cos(ang) * mv + (Math.random() - .5) * .25,
           Math.sin(ang) * mv + (Math.random() - .5) * .25);
  p.facing = t.x > p.x ? 1 : -1;
  shootP(p);
}

// ── Balas e colisões ──────────────────────────────────────────
function updBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.dx; b.y += b.dy; b.life--;

    if (b.life <= 0 || isWall(b.x, b.y)) { bullets.splice(i, 1); continue; }

    let hit = false;
    for (const p of players) {
      if (!p.alive || p.team === b.team) continue;
      if (Math.hypot(p.x - b.x, p.y - b.y) < p.r + 7) {
        p.hp -= b.dmg;
        if (p.hp <= 0) {
          p.hp = 0; p.alive = false;
          p.team === "red" ? scoreB++ : scoreR++;
          boom(p.x, p.y, p.team);
        }
        bullets.splice(i, 1); hit = true; break;
      }
    }
  }
}

// ── Efeito de explosão ────────────────────────────────────────
function boom(x, y, team) {
  for (let i = 0; i < 10; i++) {
    const a = Math.PI * 2 * i / 10;
    effects.push({ x, y, vx: Math.cos(a) * 3.5, vy: Math.sin(a) * 3.5, life: 35, team });
  }
}
function updEffects() {
  for (let i = effects.length - 1; i >= 0; i--) {
    const e = effects[i]; e.x += e.vx; e.y += e.vy; e.life--;
    if (e.life <= 0) effects.splice(i, 1);
  }
}

// ── Desenho do mapa ───────────────────────────────────────────
function drawMap() {
  ctx.fillStyle = "#0d2b45"; ctx.fillRect(0, 0, W, H);
  for (let r = 0; r < MR; r++)
    for (let c = 0; c < MC; c++) {
      const x = OX + c * T, y = OY + r * T, t = tiles[r][c];
      if (t === WALL) {
        ctx.fillStyle = "#1a5276"; ctx.fillRect(x, y, T, T);
        ctx.fillStyle = "#2471a3"; ctx.fillRect(x + 2, y + 2, T - 4, T - 4);
      } else if (t === BUSH) {
        ctx.fillStyle = "#0d4a2f"; ctx.fillRect(x, y, T, T);
        ctx.fillStyle = "#1a7a4a"; ctx.fillRect(x + 2, y + 2, T - 4, T - 4);
      } else {
        ctx.fillStyle = (r + c) % 2 === 0 ? "#0f3354" : "#0e2e4a";
        ctx.fillRect(x, y, T, T);
      }
      ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.strokeRect(x, y, T, T);
    }
}

// ── Desenho do jogador ────────────────────────────────────────
function drawPlayer(p) {
  if (!p.alive) return;
  const inBush = tileAt(p.x, p.y) === BUSH, isMe = p === players[0];
  if (inBush && !isMe) ctx.globalAlpha = 0.18;

  ctx.save();
  ctx.shadowColor = p.team === "blue" ? "#4fc3f7" : "#ff7043"; ctx.shadowBlur = 10;
  ctx.fillStyle   = p.color;
  ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = p.team === "blue" ? "#0288d1" : "#d32f2f"; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.shadowBlur  = 0; ctx.restore();

  ctx.font = `${p.r * 1.25}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(p.emoji, p.x, p.y);

  // Barra de HP
  const bw = p.r * 2.3, bh = 5, bx = p.x - bw / 2, by = p.y - p.r - 11;
  ctx.fillStyle = "#222"; ctx.fillRect(bx, by, bw, bh);
  const pct = p.hp / p.mhp;
  ctx.fillStyle = pct > .5 ? "#4caf50" : pct > .25 ? "#ff9800" : "#f44336";
  ctx.fillRect(bx, by, bw * pct, bh);
  ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = .5; ctx.strokeRect(bx, by, bw, bh);

  if (inBush && !isMe) ctx.globalAlpha = 1;
}

// ── HUD ───────────────────────────────────────────────────────
function drawHUD() {
  const bA = players.filter(p => p.team === "blue" && p.alive).length;
  const rA = players.filter(p => p.team === "red"  && p.alive).length;
  const bH = players.filter(p => p.team === "blue").reduce((s, p) => s + p.hp / p.mhp, 0) / 3;
  const rH = players.filter(p => p.team === "red" ).reduce((s, p) => s + p.hp / p.mhp, 0) / 3;

  document.getElementById("hb").style.width  = (bH * 100) + "%";
  document.getElementById("hr").style.width  = (rH * 100) + "%";
  document.getElementById("hbt").textContent = bA + "/3";
  document.getElementById("hrt").textContent = rA + "/3";
  document.getElementById("score").textContent = `${scoreB} - ${scoreR}  ⏱ ${gTime}s`;
}

// ── Verificação de fim de partida ─────────────────────────────
function checkEnd() {
  const bA = players.filter(p => p.team === "blue" && p.alive).length;
  const rA = players.filter(p => p.team === "red"  && p.alive).length;
  if (bA > 0 && rA > 0 && gTime > 0) return;

  clearInterval(window._timer);
  gRunning = false;

  let msg, sub, blueWon = false;
  if      (bA === 0 && rA === 0)  { msg = "🤝 EMPATE!";            sub = "Todos eliminados!"; }
  else if (bA === 0)               { msg = "🔴 VERMELHO VENCEU!";   sub = "Time azul eliminado!"; }
  else if (rA === 0)               { msg = "🔵 AZUL VENCEU!";       sub = "Time vermelho eliminado!"; blueWon = true; }
  else if (scoreB > scoreR)        { msg = "🔵 AZUL VENCEU!";       sub = `Placar: ${scoreB} - ${scoreR}`; blueWon = true; }
  else if (scoreR > scoreB)        { msg = "🔴 VERMELHO VENCEU!";   sub = `Placar: ${scoreB} - ${scoreR}`; }
  else                             { msg = "🤝 EMPATE!";            sub = `Placar: ${scoreB} - ${scoreR}`; }

  // Registra vitória do jogador no ranking (Firebase)
  if (blueWon) {
    const pName = document.getElementById("name-input").value;
    if (pName && window.firebaseDB) {
      window.firebaseDB.addWin(pName).then(() => window.firebaseDB.getTop10()).then(rows => {
        const el = document.getElementById("ranking-list");
        const medals = ["🥇","🥈","🥉"];
        el.innerHTML = rows.map((r, i) => `
          <div class="rank-row">
            <span class="rank-pos">${medals[i] ?? "#" + (i + 1)}</span>
            <span class="rank-name">${r.name}</span>
            <span class="rank-wins">${r.wins}v</span>
          </div>`).join("");
      });
    }
  }

  setTimeout(() => {
    document.getElementById("otitle").textContent = msg;
    document.getElementById("osub").textContent   = sub;
    document.getElementById("sbtn").textContent   = "🔄 Jogar Novamente";
    document.getElementById("overlay").style.display = "flex";
  }, 900);
}

// ── Loop principal ────────────────────────────────────────────
function loop() {
  if (!gRunning) return;
  frameN++;

  ctx.clearRect(0, 0, W, H);
  drawMap();

  // Controle do jogador (players[0])
  const me = players[0];
  if (me && me.alive) {
    let dx = 0, dy = 0;
    if (keys["ArrowLeft"]  || keys["KeyA"]) dx -= 1;
    if (keys["ArrowRight"] || keys["KeyD"]) dx += 1;
    if (keys["ArrowUp"]    || keys["KeyW"]) dy -= 1;
    if (keys["ArrowDown"]  || keys["KeyS"]) dy += 1;
    if (dx && dy) { dx *= .707; dy *= .707; }
    moveP(me, dx, dy);
    if (keys["Space"]) shootP(me);
  }

  // IA dos bots (jogadores 1-5)
  for (let i = 1; i < players.length; i++) aiStep(players[i]);

  updBullets();
  updEffects();

  // Render
  for (const p of players) drawPlayer(p);

  for (const b of bullets) {
    ctx.font = "13px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(b.emoji, b.x, b.y);
  }

  for (const e of effects) {
    ctx.globalAlpha = e.life / 35;
    ctx.fillStyle   = e.team === "blue" ? "#4fc3f7" : "#ff7043";
    ctx.beginPath(); ctx.arc(e.x, e.y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawHUD();
  checkEnd();
  if (gRunning) requestAnimationFrame(loop);
}

// ── Teclado ───────────────────────────────────────────────────
document.addEventListener("keydown", e => {
  keys[e.code] = true; keys[e.key] = true;
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();
});
document.addEventListener("keyup", e => { keys[e.code] = false; keys[e.key] = false; });

// ── Touch (mobile) ────────────────────────────────────────────
let tJoy = { active: false, id: null, sx: 0, sy: 0 };

canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.clientX < W / 2) {
      tJoy = { active: true, id: t.identifier, sx: t.clientX, sy: t.clientY };
    } else {
      // lado direito = atirar
      keys["Space"] = true;
      setTimeout(() => keys["Space"] = false, 80);
    }
  }
}, { passive: false });

canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier !== tJoy.id) continue;
    const dx = t.clientX - tJoy.sx, dy = t.clientY - tJoy.sy;
    keys["ArrowLeft"]  = dx < -20;
    keys["ArrowRight"] = dx > 20;
    keys["ArrowUp"]    = dy < -20;
    keys["ArrowDown"]  = dy > 20;
  }
}, { passive: false });

canvas.addEventListener("touchend", e => {
  e.preventDefault();
  tJoy.active = false;
  keys["ArrowLeft"] = keys["ArrowRight"] = keys["ArrowUp"] = keys["ArrowDown"] = false;
}, { passive: false });
