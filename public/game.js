// ─────────────────────────────────────────────────────────────
//  game.js  –  Batalha do Fundo do Mar  v4
//  WASD = mover | SETAS = mirar + atirar em qualquer direção
// ─────────────────────────────────────────────────────────────

const canvas = document.getElementById('c'), ctx = canvas.getContext('2d');
let W, H;
function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
resize();
window.addEventListener('resize', resize);

// ═══ SPRITES ════════════════════════════════════════════════
function drawSpongebob(ctx, x, y, dir, team) {
  const f = dir > 0 ? 1 : -1;
  ctx.fillStyle = '#8B4513'; ctx.fillRect(x-9,y+8,18,8);
  ctx.fillStyle = '#eee'; ctx.fillRect(x-8,y+15,6,5); ctx.fillRect(x+2,y+15,6,5);
  ctx.fillStyle = '#111'; ctx.fillRect(x-9,y+19,7,4); ctx.fillRect(x+2,y+19,7,4);
  ctx.fillStyle = '#f0d020'; ctx.fillRect(x-10,y-10,20,20);
  ctx.fillStyle = '#c8aa10';
  [[x-6,y-6,2.5],[x+2,y-8,2],[x-3,y+1,2],[x+5,y+3,2.5],[x-7,y+3,1.5],[x+3,y-2,1.5]].forEach(([cx,cy,r])=>{ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();});
  ctx.fillStyle = '#fff'; ctx.fillRect(x-8,y+2,16,8);
  ctx.fillStyle = '#cc0000'; ctx.beginPath(); ctx.moveTo(x-1,y+2); ctx.lineTo(x+1,y+2); ctx.lineTo(x+2.5,y+8); ctx.lineTo(x,y+10); ctx.lineTo(x-2.5,y+8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f0d020'; ctx.fillRect(x-4,y-12,8,4); ctx.fillRect(x-10,y-24,20,16);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x-4,y-18,4,5,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x+4,y-18,4,5,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#2244cc'; ctx.beginPath(); ctx.arc(x-4+f,y-18,2.5,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x+4+f,y-18,2.5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x-4+f*1.5,y-18,1.2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x+4+f*1.5,y-18,1.2,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x-7,y-23); ctx.lineTo(x-5,y-22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x-3,y-23); ctx.lineTo(x-4,y-22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x+7,y-23); ctx.lineTo(x+5,y-22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x+3,y-23); ctx.lineTo(x+4,y-22); ctx.stroke();
  ctx.fillStyle = '#d4aa10'; ctx.beginPath(); ctx.arc(x,y-16,2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x,y-13,5,0,Math.PI); ctx.fill();
  ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x,y-13,5,0,Math.PI); ctx.stroke();
  ctx.strokeStyle = '#bbb';
  ctx.beginPath(); ctx.moveTo(x-2,y-13); ctx.lineTo(x-2,y-8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x+2,y-13); ctx.lineTo(x+2,y-8); ctx.stroke();
  ctx.fillStyle = '#f0d020'; ctx.beginPath(); ctx.arc(x-10,y-18,3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x+10,y-18,3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#f0d020'; ctx.fillRect(x+(f>0?-14:-10),y-8,4,12); ctx.fillRect(x+(f>0?10:6),y-8,4,12);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x+(f>0?-12:14),y+4,4,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x+(f>0?12:-14),y+4,4,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = team==='blue'?'rgba(41,182,246,0.7)':'rgba(239,83,80,0.7)'; ctx.lineWidth = 2; ctx.strokeRect(x-10,y-24,20,47);
}

function drawPatrick(ctx, x, y, dir, team) {
  const f = dir > 0 ? 1 : -1;
  ctx.fillStyle = '#7b2d8b'; ctx.fillRect(x-12,y+5,24,12);
  ctx.fillStyle = '#9c4dcc'; for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(x-9+i*6,y+11,3,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle = '#ff80a0'; ctx.beginPath(); ctx.arc(x,y,14,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#e06080'; [[x-6,y-3,2],[x+5,y+2,2.5],[x-2,y+5,1.5],[x+3,y-6,2]].forEach(([cx,cy,r])=>{ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();});
  ctx.fillStyle = '#ff80a0'; for(let i=0;i<5;i++){const a=Math.PI*2*i/5-Math.PI/2;ctx.beginPath();ctx.arc(x+Math.cos(a)*16,y+Math.sin(a)*16,5,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle = '#c04060'; ctx.fillRect(x-9,y-10,8,3); ctx.fillRect(x+1,y-10,8,3);
  ctx.fillStyle = '#ff80a0'; ctx.fillRect(x-9,y-12,4,3); ctx.fillRect(x+5,y-12,4,3);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x-5,y-5,4.5,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x+5,y-5,4.5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x-5+f*.5,y-4.5,2.2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x+5+f*.5,y-4.5,2.2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#cc3355'; ctx.beginPath(); ctx.arc(x,y+5,6,0,Math.PI); ctx.fill();
  ctx.strokeStyle = team==='blue'?'rgba(41,182,246,0.6)':'rgba(239,83,80,0.6)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x,y,20,0,Math.PI*2); ctx.stroke();
}

function drawSquidward(ctx, x, y, dir, team) {
  const f = dir > 0 ? 1 : -1;
  ctx.strokeStyle = '#5dbfbf'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  [[-7],[-3],[3],[7]].forEach(([ox])=>{ctx.beginPath();ctx.moveTo(x+ox,y+14);ctx.quadraticCurveTo(x+ox*1.8,y+22,x+ox*2,y+28);ctx.stroke();});
  ctx.fillStyle = '#5dbfbf'; ctx.beginPath(); ctx.ellipse(x,y+5,10,14,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#c8a060'; ctx.fillRect(x-9,y-2,18,16);
  ctx.fillStyle = '#5dbfbf'; ctx.beginPath(); ctx.arc(x,y-2,6,Math.PI,0); ctx.fill();
  ctx.fillStyle = '#5dbfbf'; ctx.beginPath(); ctx.ellipse(x,y-18,9,14,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#6ecece'; ctx.beginPath(); ctx.ellipse(x,y-26,10,8,0,Math.PI,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#e8d840'; ctx.beginPath(); ctx.ellipse(x-4,y-20,4,5,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x+4,y-20,4,5,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#996600'; ctx.beginPath(); ctx.arc(x-4+f*.5,y-20,2.5,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x+4+f*.5,y-20,2.5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x-4+f,y-20,1,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x+4+f,y-20,1,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#4aafaf'; ctx.beginPath(); ctx.moveTo(x-4,y-16); ctx.lineTo(x+4,y-16); ctx.quadraticCurveTo(x+5,y-10,x,y-8); ctx.quadraticCurveTo(x-5,y-10,x-4,y-16); ctx.fill();
  ctx.strokeStyle = '#336666'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x,y-5,4,Math.PI+.3,-0.3,true); ctx.stroke();
  ctx.strokeStyle = '#5dbfbf'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x-10,y-5); ctx.lineTo(x-18,y+5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x+10,y-5); ctx.lineTo(x+18,y+5); ctx.stroke();
  ctx.strokeStyle = team==='blue'?'rgba(41,182,246,0.6)':'rgba(239,83,80,0.6)'; ctx.lineWidth = 2; ctx.strokeRect(x-12,y-34,24,52);
}

function drawSandy(ctx, x, y, dir, team) {
  const f = dir > 0 ? 1 : -1;
  ctx.strokeStyle = '#b87828'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x+f*8,y+5); ctx.quadraticCurveTo(x+f*22,y,x+f*20,y-12); ctx.stroke();
  ctx.fillStyle = '#e8a840'; ctx.beginPath(); ctx.arc(x,y,11,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#e06810'; ctx.fillRect(x-9,y+2,18,10);
  ctx.fillStyle = '#e8a840'; ctx.fillRect(x-4,y-10,8,12);
  ctx.strokeStyle = 'rgba(130,210,255,0.8)'; ctx.lineWidth = 2.5;
  ctx.fillStyle = 'rgba(130,210,255,0.12)'; ctx.beginPath(); ctx.arc(x,y-8,14,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(x-5,y-14,2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#f5cc80'; ctx.beginPath(); ctx.ellipse(x,y-9,7,8,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(x-3+f*.5,y-11,2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x+3+f*.5,y-11,2,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#553300'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x,y-6,3.5,0,Math.PI); ctx.stroke();
  ctx.fillStyle = '#e8a840';
  ctx.beginPath(); ctx.moveTo(x-9,y-12); ctx.lineTo(x-14,y-22); ctx.lineTo(x-5,y-15); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x+9,y-12); ctx.lineTo(x+14,y-22); ctx.lineTo(x+5,y-15); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = team==='blue'?'rgba(41,182,246,0.6)':'rgba(239,83,80,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x,y,22,0,Math.PI*2); ctx.stroke();
}

function drawGary(ctx, x, y, dir, team) {
  const f = dir > 0 ? 1 : -1;
  ctx.fillStyle = 'rgba(200,255,200,0.3)'; ctx.beginPath(); ctx.ellipse(x-f*8,y+10,8,4,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#e080cc'; ctx.beginPath(); ctx.ellipse(x+f*4,y+8,9,6,f>0?.2:-.2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#cc8844'; ctx.beginPath(); ctx.arc(x,y,12,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#aa6622'; ctx.beginPath(); ctx.arc(x,y,9,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#cc8844'; for(let i=0;i<6;i++){const a=Math.PI*2*i/6;ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,9,a,a+.45);ctx.closePath();ctx.fill();}
  ctx.fillStyle = '#ee9944'; ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#e080cc'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x-3,y-10); ctx.lineTo(x-6,y-20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x+3,y-10); ctx.lineTo(x+6,y-20); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x-6,y-20,5,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x+6,y-20,5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ff66aa'; ctx.beginPath(); ctx.arc(x-6,y-20,3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x+6,y-20,3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x-6+f*.5,y-20,1.2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x+6+f*.5,y-20,1.2,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = team==='blue'?'rgba(41,182,246,0.6)':'rgba(239,83,80,0.6)'; ctx.lineWidth = 2; ctx.strokeRect(x-14,y-26,28,38);
}

const SPRITES = { spongebob: drawSpongebob, patrick: drawPatrick, squidward: drawSquidward, sandy: drawSandy, gary: drawGary };

// ═══ DADOS DOS PERSONAGENS ═══════════════════════════════════
const CHARS = {
  spongebob: { name:'Bob Esponja', speed:3.0, hp:300, dmg:20, bs:6.2, fr:26, bColor:'#00cfff', bR:4, r:15 },
  patrick:   { name:'Patrick',    speed:1.7, hp:500, dmg:55, bs:4.0, fr:56, bColor:'#ff66aa', bR:6, r:16 },
  squidward: { name:'Lula',       speed:2.4, hp:320, dmg:33, bs:8.8, fr:36, bColor:'#ccff66', bR:4, r:14 },
  sandy:     { name:'Sandy',      speed:3.3, hp:280, dmg:22, bs:7.2, fr:28, bColor:'#ffcc00', bR:4, r:14 },
  gary:      { name:'Gary',       speed:1.3, hp:600, dmg:28, bs:3.5, fr:44, bColor:'#aaffaa', bR:5, r:15 },
};

// ═══ ESTADO GLOBAL ════════════════════════════════════════════
let selChar = 'spongebob', gRunning = false, paused = false, frameN = 0;
let scoreB = 0, scoreR = 0, gTime = 90;
let players = [], bullets = [], effects = [], blocks = [];
let keys = {};
let tiles = [], MC = 0, MR = 0, OX = 0, OY = 0;
const T = 38, WALL = 1, BUSH = 2;

// ═══ UI ══════════════════════════════════════════════════════
document.querySelectorAll('.cc').forEach(c => {
  c.addEventListener('click', function () {
    document.querySelectorAll('.cc').forEach(x => x.classList.remove('sel'));
    this.classList.add('sel');
    selChar = this.id.replace('cc-', '');
  });
});
document.getElementById('sbtn').addEventListener('click', startGame);

// ═══ MAPA ════════════════════════════════════════════════════
function buildMap() {
  MC = Math.max(15, Math.floor((W - 20) / T));
  MR = Math.max(10, Math.floor((H - 60) / T));
  OX = Math.floor((W - MC * T) / 2);
  OY = 50;
  tiles = []; blocks = [];
  for (let r = 0; r < MR; r++) { tiles[r] = []; for (let c = 0; c < MC; c++) tiles[r][c] = 0; }
  for (let r = 0; r < MR; r++) for (let c = 0; c < MC; c++) if (r===0||r===MR-1||c===0||c===MC-1) tiles[r][c] = WALL;

  const wps = [
    [~~(MR*.3),~~(MC*.3)],[~~(MR*.3),~~(MC*.7)],
    [~~(MR*.7),~~(MC*.3)],[~~(MR*.7),~~(MC*.7)],
    [~~(MR*.5),~~(MC*.5)],[~~(MR*.5),~~(MC*.35)],[~~(MR*.5),~~(MC*.65)],
  ];
  for (const [r,c] of wps) for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++) {
    const nr=r+dr, nc=c+dc;
    if (nr>1&&nr<MR-2&&nc>3&&nc<MC-4) {
      if (Math.random()<.6) { tiles[nr][nc]=WALL; blocks.push({r:nr,c:nc,hp:3,maxHp:3}); }
      else if (Math.random()<.4) tiles[nr][nc]=BUSH;
    }
  }
  const bps = [[~~(MR*.2),~~(MC*.18)],[~~(MR*.2),~~(MC*.82)],[~~(MR*.8),~~(MC*.18)],[~~(MR*.8),~~(MC*.82)]];
  for (const [r,c] of bps) for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++) {
    const nr=r+dr, nc=c+dc;
    if (nr>0&&nr<MR-1&&nc>0&&nc<MC-1&&tiles[nr][nc]===0) tiles[nr][nc]=BUSH;
  }
}

function tileAt(px, py) { const c=~~((px-OX)/T), r=~~((py-OY)/T); if(c<0||c>=MC||r<0||r>=MR) return WALL; return tiles[r][c]; }
const isWall = (px, py) => tileAt(px, py) === WALL;

// ═══ JOGADORES ════════════════════════════════════════════════
function mkPlayer(ck, team, col, row) {
  const d = CHARS[ck];
  return {
    char:ck, team,
    x: OX+col*T+T/2, y: OY+row*T+T/2,
    hp:d.hp, mhp:d.hp, alive:true, respawnAt:0,
    speed:d.speed, dmg:d.dmg, bs:d.bs, r:d.r, fr:d.fr, ls:0,
    facing: team==='blue'?1:-1,
    aimDx:  team==='blue'?1:-1,  // direção de mira (independente do movimento)
    aimDy:  0,
    sc:col, sr:row,
  };
}
function rChar() { const k=Object.keys(CHARS); return k[~~(Math.random()*k.length)]; }

// ═══ JOGO ════════════════════════════════════════════════════
function startGame() {
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('menuBtn').style.display = 'flex';
  gRunning=true; paused=false; scoreB=0; scoreR=0;
  bullets=[]; effects=[]; frameN=0; gTime=90;
  buildMap();
  const mid = ~~(MR/2);
  players = [
    mkPlayer(selChar,'blue',2,mid-2), mkPlayer(rChar(),'blue',2,mid), mkPlayer(rChar(),'blue',2,mid+2),
    mkPlayer(rChar(),'red',MC-3,mid-2), mkPlayer(rChar(),'red',MC-3,mid), mkPlayer(rChar(),'red',MC-3,mid+2),
  ];
  clearInterval(window._tmr);
  window._tmr = setInterval(() => { if (gRunning&&!paused&&gTime>0) gTime--; }, 1000);
  requestAnimationFrame(loop);
}

function restartGame() { closePause(); startGame(); }
function quitGame() {
  closePause(); gRunning=false; clearInterval(window._tmr);
  document.getElementById('menuBtn').style.display='none';
  document.getElementById('otitle').textContent='🧽 Batalha do Fundo do Mar';
  document.getElementById('osub').textContent='WASD = mover · Setas = atirar em qualquer direção!';
  document.getElementById('sbtn').textContent='⚔️ BATALHAR!';
  document.getElementById('overlay').style.display='flex';
}
function openMenu()  { if (!gRunning) return; paused=true; document.getElementById('pmenu').style.display='flex'; }
function resumeGame(){ closePause(); }
function closePause(){ paused=false; document.getElementById('pmenu').style.display='none'; if(gRunning) requestAnimationFrame(loop); }

// ═══ FÍSICA ══════════════════════════════════════════════════
function moveP(p, dx, dy) {
  if (!p.alive) return;
  const nx=p.x+dx*p.speed, ny=p.y+dy*p.speed, rr=p.r-3;
  if (!isWall(nx+rr,p.y)&&!isWall(nx-rr,p.y)) p.x=nx;
  if (!isWall(p.x,ny+rr)&&!isWall(p.x,ny-rr)) p.y=ny;
  if (dx!==0) p.facing=dx>0?1:-1;
}

// Atirar na direção de mira (aimDx/aimDy), independente do movimento
function shootP(s) {
  if (!s.alive||frameN-s.ls<s.fr) return;
  s.ls=frameN;
  let dx=s.aimDx, dy=s.aimDy;
  if (s!==players[0]) {
    const t=players.find(p=>p.team!==s.team&&p.alive);
    if (!t) return;
    const dist=Math.hypot(t.x-s.x,t.y-s.y);
    if (dist>270) return;
    dx=(t.x-s.x)/dist; dy=(t.y-s.y)/dist;
  }
  const d=CHARS[s.char];
  bullets.push({x:s.x,y:s.y,dx:dx*s.bs,dy:dy*s.bs,team:s.team,dmg:s.dmg,color:d.bColor,r:d.bR,life:95});
}

function aiStep(p) {
  if (!p.alive) return;
  const enemies=players.filter(e=>e.team!==p.team&&e.alive);
  if (!enemies.length) return;
  const t=enemies.reduce((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)<Math.hypot(b.x-p.x,b.y-p.y)?a:b);
  const dist=Math.hypot(t.x-p.x,t.y-p.y);
  const ang=Math.atan2(t.y-p.y,t.x-p.x);
  const mv=dist>150?1:dist<80?-1:0;
  moveP(p, Math.cos(ang)*mv+(Math.random()-.5)*.2, Math.sin(ang)*mv+(Math.random()-.5)*.2);
  p.facing=t.x>p.x?1:-1;
  p.aimDx=(t.x-p.x)/dist; p.aimDy=(t.y-p.y)/dist;
  shootP(p);
}

// ═══ BLOCOS DESTRUTÍVEIS ══════════════════════════════════════
function hitBlock(bx, by) {
  const c=~~((bx-OX)/T), r=~~((by-OY)/T);
  const blk=blocks.find(b=>b.r===r&&b.c===c);
  if (blk) {
    blk.hp--; spawnChips(OX+c*T+T/2, OY+r*T+T/2);
    if (blk.hp<=0) { tiles[r][c]=0; blocks.splice(blocks.indexOf(blk),1); spawnChips(OX+c*T+T/2,OY+r*T+T/2,true); }
    return true;
  }
  return false;
}

// ═══ BALAS ════════════════════════════════════════════════════
function updBullets() {
  for (let i=bullets.length-1; i>=0; i--) {
    const b=bullets[i]; b.x+=b.dx; b.y+=b.dy; b.life--;
    if (b.life<=0) { bullets.splice(i,1); continue; }
    if (isWall(b.x,b.y)) { hitBlock(b.x,b.y); bullets.splice(i,1); continue; }
    let hit=false;
    for (const p of players) {
      if (!p.alive||p.team===b.team) continue;
      if (Math.hypot(p.x-b.x,p.y-b.y)<p.r+5) {
        p.hp-=b.dmg;
        if (p.hp<=0) { p.hp=0; p.alive=false; p.team==='red'?scoreB++:scoreR++; spawnBoom(p.x,p.y,p.team); p.respawnAt=frameN+190; }
        bullets.splice(i,1); hit=true; break;
      }
    }
  }
}

// ═══ EFEITOS ══════════════════════════════════════════════════
function spawnBoom(x, y, team) {
  for (let i=0;i<12;i++) { const a=Math.PI*2*i/12; effects.push({x,y,vx:Math.cos(a)*4,vy:Math.sin(a)*4,life:40,col:team==='blue'?'#29b6f6':team==='red'?'#ef5350':'#aaffaa',r:4}); }
}
function spawnChips(x, y, big=false) {
  const n=big?8:4;
  for (let i=0;i<n;i++) { const a=Math.random()*Math.PI*2, spd=big?3:1.5; effects.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,life:big?30:18,col:'#8899aa',r:big?3:2}); }
}
function updEffects() { for (let i=effects.length-1;i>=0;i--) { const e=effects[i]; e.x+=e.vx; e.y+=e.vy; e.vx*=.9; e.vy*=.9; e.life--; if(e.life<=0) effects.splice(i,1); } }

// ═══ RENASCIMENTO ════════════════════════════════════════════
function checkRespawns() {
  for (const p of players) if (!p.alive&&p.respawnAt>0&&frameN>=p.respawnAt) {
    p.hp=CHARS[p.char].hp; p.alive=true;
    p.x=OX+p.sc*T+T/2; p.y=OY+p.sr*T+T/2; p.respawnAt=0;
    spawnBoom(p.x,p.y,'spawn');
  }
}

// ═══ RENDER ══════════════════════════════════════════════════
function drawMap() {
  ctx.fillStyle='#071320'; ctx.fillRect(0,0,W,H);
  for (let r=0;r<MR;r++) for (let c=0;c<MC;c++) {
    const x=OX+c*T, y=OY+r*T, t=tiles[r][c];
    if (t===WALL) {
      const blk=blocks.find(b=>b.r===r&&b.c===c);
      if (blk) {
        const pct=blk.hp/blk.maxHp;
        ctx.fillStyle=pct>.66?'#2a4a7a':pct>.33?'#5a3010':'#3a1a08'; ctx.fillRect(x,y,T,T);
        ctx.fillStyle=pct>.66?'#3a6aaa':pct>.33?'#7a4418':'#5a2810'; ctx.fillRect(x+2,y+2,T-4,T-4);
        ctx.strokeStyle=`rgba(0,0,0,${.5+.5*(1-pct)})`; ctx.lineWidth=1.5;
        if (blk.hp<3) { ctx.beginPath(); ctx.moveTo(x+4,y+4); ctx.lineTo(x+18,y+22); ctx.stroke(); }
        if (blk.hp<2) { ctx.beginPath(); ctx.moveTo(x+T-6,y+6); ctx.lineTo(x+6,y+T-6); ctx.stroke(); }
        ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font='bold 9px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(blk.hp, x+T/2, y+T/2);
      } else {
        ctx.fillStyle='#0a2040'; ctx.fillRect(x,y,T,T);
        ctx.fillStyle='#1a3a6a'; ctx.fillRect(x+2,y+2,T-4,T-4);
      }
    } else if (t===BUSH) {
      ctx.fillStyle='#082a14'; ctx.fillRect(x,y,T,T);
      ctx.fillStyle='#0d4020'; ctx.fillRect(x+1,y+1,T-2,T-2);
      ctx.fillStyle='#155c2a'; ctx.fillRect(x+4,y+4,T-8,T-8);
      ctx.fillStyle='#1a7035';
      [[x+5,y+8],[x+T-5,y+6],[x+T/2,y+5],[x+6,y+T-8],[x+T-6,y+T-7]].forEach(([lx,ly])=>{ctx.beginPath();ctx.arc(lx,ly,3,0,Math.PI*2);ctx.fill();});
    } else {
      ctx.fillStyle=(r+c)%2===0?'#0d2040':'#0b1c38'; ctx.fillRect(x,y,T,T);
    }
    ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=.5; ctx.strokeRect(x,y,T,T);
  }
}

function drawAimArrow(p) {
  if (!p.alive||p!==players[0]) return;
  const len=p.r+12;
  const ex=p.x+p.aimDx*len, ey=p.y+p.aimDy*len;
  ctx.save();
  ctx.strokeStyle='rgba(255,255,100,0.7)'; ctx.lineWidth=2.5; ctx.lineCap='round';
  ctx.setLineDash([4,3]);
  ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(ex,ey); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle='rgba(255,255,100,0.9)'; ctx.beginPath(); ctx.arc(ex,ey,3,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawPlayer(p) {
  if (!p.alive) {
    if (p===players[0]&&p.respawnAt>0) {
      const left=Math.max(0,Math.ceil((p.respawnAt-frameN)/60));
      ctx.save();
      ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(W/2-90,H/2-22,180,44);
      ctx.fillStyle='#fff'; ctx.font='bold 14px Comic Sans MS'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(`💀 Renascendo em ${left}s`, W/2, H/2);
      ctx.restore();
    }
    return;
  }
  const inBush=tileAt(p.x,p.y)===BUSH, isMe=p===players[0];
  if (inBush&&!isMe) ctx.globalAlpha=0.18;
  ctx.save();
  ctx.shadowColor=p.team==='blue'?'rgba(41,182,246,0.4)':'rgba(239,83,80,0.4)'; ctx.shadowBlur=14;
  const spr=SPRITES[p.char]; if (spr) spr(ctx,p.x,p.y,p.facing,p.team);
  ctx.restore();
  // barra HP
  const bw=p.r*2.8, bh=5, bx=p.x-bw/2, by=p.y-p.r-26;
  ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(bx-1,by-1,bw+2,bh+2);
  ctx.fillStyle='#111'; ctx.fillRect(bx,by,bw,bh);
  const pct=p.hp/p.mhp;
  ctx.fillStyle=pct>.6?'#44cc44':pct>.3?'#ffaa00':'#ee3333';
  ctx.fillRect(bx,by,bw*pct,bh);
  if (inBush&&!isMe) ctx.globalAlpha=1;
  drawAimArrow(p);
}

function drawHUD() {
  const bA=players.filter(p=>p.team==='blue'&&p.alive).length;
  const rA=players.filter(p=>p.team==='red'&&p.alive).length;
  const bH=players.filter(p=>p.team==='blue').reduce((s,p)=>s+p.hp/p.mhp,0)/3;
  const rH=players.filter(p=>p.team==='red').reduce((s,p)=>s+p.hp/p.mhp,0)/3;
  document.getElementById('hb').style.width=(bH*100)+'%';
  document.getElementById('hr').style.width=(rH*100)+'%';
  document.getElementById('hbt').textContent=bA+'/3';
  document.getElementById('hrt').textContent=rA+'/3';
  document.getElementById('sc').textContent=`${scoreB} — ${scoreR}  ⏱ ${gTime}s`;
}

function checkEnd() {
  if (gTime>0) return;
  clearInterval(window._tmr); gRunning=false;
  const msg=scoreB>scoreR?'🔵 AZUL VENCEU!':scoreR>scoreB?'🔴 VERMELHO VENCEU!':'🤝 EMPATE!';
  setTimeout(()=>{
    document.getElementById('otitle').textContent=msg;
    document.getElementById('osub').textContent=`Placar final: ${scoreB} — ${scoreR}`;
    document.getElementById('sbtn').textContent='🔄 Jogar Novamente';
    document.getElementById('menuBtn').style.display='none';
    document.getElementById('overlay').style.display='flex';
  },800);
}

// ═══ LOOP PRINCIPAL ═══════════════════════════════════════════
function loop() {
  if (!gRunning||paused) return;
  frameN++;
  ctx.clearRect(0,0,W,H);
  drawMap();

  const me=players[0];
  if (me&&me.alive) {
    // WASD = movimento
    let dx=0, dy=0;
    if (keys['KeyA']) dx-=1;
    if (keys['KeyD']) dx+=1;
    if (keys['KeyW']) dy-=1;
    if (keys['KeyS']) dy+=1;
    if (dx&&dy) { dx*=.707; dy*=.707; }
    moveP(me, dx, dy);

    // SETAS = mira + disparo automático ao pressionar
    let adx=0, ady=0;
    if (keys['ArrowLeft'])  adx-=1;
    if (keys['ArrowRight']) adx+=1;
    if (keys['ArrowUp'])    ady-=1;
    if (keys['ArrowDown'])  ady+=1;
    if (adx!==0||ady!==0) {
      const len=Math.hypot(adx,ady);
      me.aimDx=adx/len; me.aimDy=ady/len;
      me.facing=adx>0?1:(adx<0?-1:me.facing);
      shootP(me);
    }
    // ESPAÇO = atira na última direção de mira
    if (keys['Space']) shootP(me);
  }

  for (let i=1;i<players.length;i++) aiStep(players[i]);
  checkRespawns();
  updBullets();
  updEffects();

  for (const p of players) drawPlayer(p);

  for (const b of bullets) {
    ctx.save(); ctx.shadowColor=b.color; ctx.shadowBlur=8;
    ctx.fillStyle=b.color; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(b.x-b.r*.3,b.y-b.r*.3,b.r*.35,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  for (const e of effects) {
    ctx.globalAlpha=e.life/40; ctx.fillStyle=e.col;
    ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
  }

  drawHUD();
  checkEnd();
  if (gRunning&&!paused) requestAnimationFrame(loop);
}

// ═══ TECLADO ══════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  keys[e.code]=true;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
  if (e.code==='Escape') { paused ? resumeGame() : openMenu(); }
});
document.addEventListener('keyup', e => { keys[e.code]=false; });

// ═══ TOUCH (mobile) ═══════════════════════════════════════════
// Lado esquerdo = joystick de movimento (WASD)
// Lado direito  = joystick de mira (Setas)
let tMove={id:null,sx:0,sy:0}, tAim={id:null,sx:0,sy:0};

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.clientX<W/2&&!tMove.id) tMove={id:t.identifier,sx:t.clientX,sy:t.clientY};
    else if (t.clientX>=W/2&&!tAim.id) tAim={id:t.identifier,sx:t.clientX,sy:t.clientY};
  }
}, {passive:false});

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier===tMove.id) {
      const dx=t.clientX-tMove.sx, dy=t.clientY-tMove.sy;
      keys['KeyA']=dx<-18; keys['KeyD']=dx>18; keys['KeyW']=dy<-18; keys['KeyS']=dy>18;
    }
    if (t.identifier===tAim.id) {
      const dx=t.clientX-tAim.sx, dy=t.clientY-tAim.sy;
      keys['ArrowLeft']=dx<-18; keys['ArrowRight']=dx>18; keys['ArrowUp']=dy<-18; keys['ArrowDown']=dy>18;
    }
  }
}, {passive:false});

canvas.addEventListener('touchend', e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier===tMove.id) { tMove.id=null; keys['KeyA']=keys['KeyD']=keys['KeyW']=keys['KeyS']=false; }
    if (t.identifier===tAim.id)  { tAim.id=null;  keys['ArrowLeft']=keys['ArrowRight']=keys['ArrowUp']=keys['ArrowDown']=false; }
  }
}, {passive:false});
