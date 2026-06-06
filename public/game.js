// game.js v6 - Isometric view
// Setas = mover e mirar | ESPACO = atirar

const canvas=document.getElementById('c'),ctx=canvas.getContext('2d');
let W,H;
function resize(){W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;}
resize();window.addEventListener('resize',resize);

// ═══ ISOMETRIC HELPERS ══════════════════════════════════════
// TW = tile width in iso, TH = tile height in iso (TH = TW/2)
// World coords (wx, wy) → screen (sx, sy)
const ISO_W=64, ISO_H=32, WALL_H=40;

function isoToScreen(wx,wy){
  // wx,wy are world tile units
  // origin at top-center of map
  return {
    x: ISO_OX + (wx - wy) * (ISO_W/2),
    y: ISO_OY + (wx + wy) * (ISO_H/2)
  };
}
// world pixel → iso screen (for players/bullets using continuous coords)
function worldToScreen(wx,wy){
  const tx=wx/ISO_W, ty=wy/ISO_W;
  return {
    x: ISO_OX + (tx - ty) * (ISO_W/2),
    y: ISO_OY + (tx + ty) * (ISO_H/2)
  };
}
// screen → world pixel (for movement, keep it simple: identity mapping scaled)
// We keep game logic in "flat" coords and just project for render
let ISO_OX=0,ISO_OY=0;

function calcIsoOrigin(){
  ISO_OX = W/2;
  ISO_OY = 80 + (H-80-MC_px_h)/2;
  if(ISO_OY < 80) ISO_OY = 80;
}

// ═══ AUDIO ══════════════════════════════════════════════════
let audioCtx=null,masterGain=null,musicGain=null;
function getAudio(){
  if(!audioCtx){
    audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    masterGain=audioCtx.createGain();masterGain.gain.value=1;masterGain.connect(audioCtx.destination);
    musicGain=audioCtx.createGain();musicGain.gain.value=1;musicGain.connect(audioCtx.destination);
  }
  return audioCtx;
}
function playShoot(charKey){
  if(!soundEnabled)return;
  try{
    const ac=getAudio();
    const o=ac.createOscillator(),g=ac.createGain(),dist=ac.createWaveShaper();
    const curve=new Float32Array(256);
    for(let i=0;i<256;i++){const x=i*2/256-1;curve[i]=x<0?-Math.pow(-x,.5):Math.pow(x,.5);}
    dist.curve=curve;
    const configs={
      spongebob:{type:'sine',freq:880,endFreq:440,dur:.12,vol:.18},
      patrick:{type:'sawtooth',freq:120,endFreq:60,dur:.22,vol:.22},
      squidward:{type:'triangle',freq:1200,endFreq:2000,dur:.08,vol:.15},
      sandy:{type:'square',freq:600,endFreq:300,dur:.1,vol:.16},
      gary:{type:'sine',freq:300,endFreq:150,dur:.25,vol:.2},
    };
    const cfg=configs[charKey]||configs.spongebob;
    o.type=cfg.type;
    o.frequency.setValueAtTime(cfg.freq,ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(cfg.endFreq,ac.currentTime+cfg.dur);
    g.gain.setValueAtTime(cfg.vol,ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+cfg.dur+.03);
    o.connect(dist);dist.connect(g);g.connect(masterGain);
    o.start();o.stop(ac.currentTime+cfg.dur+.05);
  }catch(e){}
}
function playHit(){
  if(!soundEnabled)return;
  try{
    const ac=getAudio();
    const buf=ac.createBuffer(1,ac.sampleRate*.1,ac.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(d.length*.3));
    const src=ac.createBufferSource(),g=ac.createGain();
    src.buffer=buf;g.gain.value=.25;
    src.connect(g);g.connect(masterGain);src.start();
  }catch(e){}
}
function playDie(){
  if(!soundEnabled)return;
  try{
    const ac=getAudio();
    const o=ac.createOscillator(),g=ac.createGain();
    o.type='sawtooth';
    o.frequency.setValueAtTime(400,ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(50,ac.currentTime+.4);
    g.gain.setValueAtTime(.3,ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+.45);
    o.connect(g);g.connect(masterGain);o.start();o.stop(ac.currentTime+.5);
  }catch(e){}
}
function startMusic(){
  try{
    const ac=getAudio();
    if(ac._musicStarted)return;
    ac._musicStarted=true;
    musicGain.gain.value=musicEnabled?1:0;
    const notes=[
      261,0,.15,293,0,.15,329,0,.15,261,0,.3,
      329,0,.15,392,0,.3,523,0,.45,
      392,0,.15,349,0,.15,329,0,.15,261,0,.3,
      293,0,.15,329,0,.15,261,0,.6,
      261,0,.15,293,0,.15,329,0,.15,261,0,.3,
      329,0,.15,392,0,.3,523,0,.3,659,0,.3,
      587,0,.15,523,0,.15,440,0,.15,392,0,.3,
      329,0,.15,261,0,.6,
    ];
    function playMelody(startT){
      let t=startT;
      for(let i=0;i<notes.length;i+=3){
        const freq=notes[i],gap=notes[i+1],dur=notes[i+2];
        if(freq>0){
          const o=ac.createOscillator(),g=ac.createGain(),dist=ac.createWaveShaper();
          const cv=new Float32Array(256);for(let j=0;j<256;j++){const x=j*2/256-1;cv[j]=Math.tanh(x*1.5)*.6;}
          dist.curve=cv;
          o.type='triangle';o.frequency.value=freq;
          g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.1,t+.02);
          g.gain.linearRampToValueAtTime(.08,t+dur*.6);g.gain.linearRampToValueAtTime(0,t+dur);
          o.connect(dist);dist.connect(g);g.connect(musicGain);
          o.start(t);o.stop(t+dur+.01);
        }
        t+=dur+gap+.02;
      }
      return t;
    }
    let nextT=ac.currentTime+.1;
    function mloop(){
      if(!gRunning){ac._musicStarted=false;return;}
      const end=playMelody(nextT);nextT=end;
      setTimeout(mloop,(end-ac.currentTime-1)*1000);
    }
    mloop();
  }catch(e){}
}

// ═══ SPRITES (isometric — skewed vertically, drawn smaller) ═
function drawSpongebob(ctx,x,y,dir,team,scale){
  scale=scale||1;
  const f=dir>0?1:-1;
  const s=scale;
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  // skew for iso feel
  ctx.transform(1,0,0,.75,0,0);
  // shadow on ground
  ctx.fillStyle='rgba(0,0,0,0.22)';ctx.beginPath();ctx.ellipse(0,18,12,5,0,0,Math.PI*2);ctx.fill();
  // shoes
  ctx.fillStyle='#1a1a2e';ctx.beginPath();ctx.ellipse(-5+f*-1,19,6,3,.1,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(5+f*1,19,6,3,-.1,0,Math.PI*2);ctx.fill();
  // socks
  ctx.fillStyle='#eee';ctx.fillRect(-8,13,6,6);ctx.fillRect(2,13,6,6);
  // pants
  ctx.fillStyle='#7a3b10';ctx.fillRect(-10,6,20,9);ctx.fillStyle='#5c2c0a';ctx.fillRect(-10,6,20,2);ctx.fillStyle='#a04c15';ctx.fillRect(-3,6,6,9);
  // body
  const bg=ctx.createLinearGradient(-10,-12,10,6);
  bg.addColorStop(0,'#ffe840');bg.addColorStop(.5,'#f0d020');bg.addColorStop(1,'#c8aa10');
  ctx.fillStyle=bg;ctx.fillRect(-10,-12,20,20);
  ctx.fillStyle='rgba(255,255,200,0.35)';ctx.fillRect(-8,-11,7,5);
  ctx.fillStyle='#b89810';
  [[-6,-8,2.5],[2,-10,2],[-3,-1,2],[5,1,2.5],[-7,1,1.5],[3,-4,1.5]].forEach(([cx,cy,r])=>{ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();});
  // shirt + tie
  ctx.fillStyle='#f8f8f8';ctx.fillRect(-8,0,16,8);
  ctx.fillStyle='#dd0000';ctx.beginPath();ctx.moveTo(-1.5,0);ctx.lineTo(1.5,0);ctx.lineTo(3,6);ctx.lineTo(0,8.5);ctx.lineTo(-3,6);ctx.closePath();ctx.fill();
  // neck
  ctx.fillStyle='#f0d020';ctx.fillRect(-4,-14,8,4);
  // head
  const hg=ctx.createLinearGradient(-10,-28,10,-12);
  hg.addColorStop(0,'#ffe840');hg.addColorStop(.5,'#f0d020');hg.addColorStop(1,'#c8aa10');
  ctx.fillStyle=hg;ctx.fillRect(-10,-28,20,16);
  ctx.fillStyle='rgba(255,255,200,0.3)';ctx.fillRect(-9,-27,6,4);
  // eyes
  ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(-4,-22,4.5,5.5,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(4,-22,4.5,5.5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#1a44dd';ctx.beginPath();ctx.arc(-4+f*1.2,-21.5,2.8,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(4+f*1.2,-21.5,2.8,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#000';ctx.beginPath();ctx.arc(-4+f*1.8,-21.5,1.4,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(4+f*1.8,-21.5,1.4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.8)';ctx.beginPath();ctx.arc(-5+f,-23,1,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(3+f,-23,1,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#333';ctx.lineWidth=1.2;
  [[-7,-27,-5,-26],[-3,-27,-4,-26],[7,-27,5,-26],[3,-27,4,-26]].forEach(([x1,y1,x2,y2])=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();});
  ctx.fillStyle='#c8aa10';ctx.beginPath();ctx.arc(0,-18,2.2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#eee';ctx.beginPath();ctx.arc(0,-15,5.5,0,Math.PI);ctx.fill();
  ctx.strokeStyle='#555';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,-15,5.5,0,Math.PI);ctx.stroke();
  ctx.strokeStyle='#ccc';ctx.beginPath();ctx.moveTo(-2,-15);ctx.lineTo(-2,-10);ctx.stroke();ctx.beginPath();ctx.moveTo(2,-15);ctx.lineTo(2,-10);ctx.stroke();
  // ears + arms
  ctx.fillStyle='#f0d020';ctx.beginPath();ctx.arc(-11,-21,3.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(11,-21,3.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#f0d020';ctx.fillRect(f>0?-15:-11,-10,4,13);ctx.fillRect(f>0?11:7,-10,4,13);
  ctx.fillStyle='#f8f8f8';ctx.beginPath();ctx.arc(f>0?-13:15,3,4.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(f>0?13:-15,3,4.5,0,Math.PI*2);ctx.fill();
  // team ring
  ctx.strokeStyle=team==='blue'?'rgba(41,182,246,0.85)':'rgba(239,83,80,0.85)';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.ellipse(0,20,14,6,0,0,Math.PI*2);ctx.stroke();
  ctx.restore();
}
function drawPatrick(ctx,x,y,dir,team,scale){
  scale=scale||1;const f=dir>0?1:-1;const s=scale;
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.transform(1,0,0,.75,0,0);
  ctx.fillStyle='rgba(0,0,0,0.22)';ctx.beginPath();ctx.ellipse(0,22,16,6,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#6a2580';ctx.fillRect(-13,3,26,14);ctx.fillStyle='#8830a0';ctx.fillRect(-13,3,26,3);
  ctx.fillStyle='#aa44cc';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(-10+i*5,10,2.5,0,Math.PI*2);ctx.fill();}
  const bg=ctx.createRadialGradient(-4,-6,2,0,0,15);
  bg.addColorStop(0,'#ffaacc');bg.addColorStop(.5,'#ff80a0');bg.addColorStop(1,'#cc5580');
  ctx.fillStyle=bg;ctx.beginPath();ctx.arc(0,0,15,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,220,240,0.4)';ctx.beginPath();ctx.ellipse(-5,-8,7,5,-.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#dd5580';[[-6,-5,2.2],[5,0,2.8],[-2,3,1.8],[3,-8,2.2]].forEach(([cx,cy,r])=>{ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();});
  ctx.fillStyle='#ff90b8';for(let i=0;i<5;i++){const a=Math.PI*2*i/5-Math.PI/2;ctx.beginPath();ctx.arc(Math.cos(a)*17,Math.sin(a)*17,5.5,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#bb3360';ctx.fillRect(-10,-13,8,3.5);ctx.fillRect(2,-13,8,3.5);
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-5.5,-7,5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(5.5,-7,5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#111';ctx.beginPath();ctx.arc(-5.5+f*.6,-6.5,2.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(5.5+f*.6,-6.5,2.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.8)';ctx.beginPath();ctx.arc(-6.5+f*.3,-8,1,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(4.5+f*.3,-8,1,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#cc2244';ctx.beginPath();ctx.arc(0,3.5,7,0,Math.PI);ctx.fill();
  ctx.strokeStyle=team==='blue'?'rgba(41,182,246,0.85)':'rgba(239,83,80,0.85)';ctx.lineWidth=3;
  ctx.beginPath();ctx.ellipse(0,22,18,7,0,0,Math.PI*2);ctx.stroke();
  ctx.restore();
}
function drawSquidward(ctx,x,y,dir,team,scale){
  scale=scale||1;const f=dir>0?1:-1;const s=scale;
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.transform(1,0,0,.75,0,0);
  ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(0,30,12,5,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#4aafaf';ctx.lineWidth=4;ctx.lineCap='round';
  [[-8,-1.5],[-3,-.5],[3,.5],[8,1.5]].forEach(([ox,tw])=>{ctx.beginPath();ctx.moveTo(ox,14);ctx.bezierCurveTo(ox*1.5,20,ox*1.8+tw*3,24,ox*2.2,30);ctx.stroke();});
  const bg=ctx.createLinearGradient(-11,-5,11,14);bg.addColorStop(0,'#7ed9d9');bg.addColorStop(1,'#4aafaf');
  ctx.fillStyle=bg;ctx.beginPath();ctx.ellipse(0,5,11,14,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#c8a060';ctx.fillRect(-10,-2,20,16);ctx.fillStyle='#b88840';ctx.fillRect(-10,-2,20,3);
  ctx.fillStyle='#6ecece';ctx.beginPath();ctx.arc(0,-2,6.5,Math.PI,0);ctx.fill();
  const hg=ctx.createLinearGradient(-10,-34,10,-10);hg.addColorStop(0,'#8ee0e0');hg.addColorStop(1,'#5cbfbf');
  ctx.fillStyle=hg;ctx.beginPath();ctx.ellipse(0,-18,10,15,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#70d0d0';ctx.beginPath();ctx.ellipse(0,-28,11,9,0,Math.PI,Math.PI*2);ctx.fill();
  ctx.fillStyle='#f0e040';ctx.beginPath();ctx.ellipse(-4.5,-21,4.5,5.5,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(4.5,-21,4.5,5.5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#aa8800';ctx.beginPath();ctx.arc(-4.5+f*.6,-21,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(4.5+f*.6,-21,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#000';ctx.beginPath();ctx.arc(-4.5+f*1.1,-21,1.2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(4.5+f*1.1,-21,1.2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.8)';ctx.beginPath();ctx.arc(-5.5+f*.5,-22.5,1,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(3.5+f*.5,-22.5,1,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#4aafaf';ctx.beginPath();ctx.moveTo(-4,-16);ctx.lineTo(4,-16);ctx.bezierCurveTo(6,-11,5,-8,0,-7);ctx.bezierCurveTo(-5,-8,-6,-11,-4,-16);ctx.fill();
  ctx.strokeStyle='#2a7a7a';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,-5,4.5,Math.PI+.4,-.4,true);ctx.stroke();
  ctx.strokeStyle='#5dbfbf';ctx.lineWidth=4.5;
  ctx.beginPath();ctx.moveTo(-11,-5);ctx.quadraticCurveTo(-20,0,-20,8);ctx.stroke();
  ctx.beginPath();ctx.moveTo(11,-5);ctx.quadraticCurveTo(20,0,20,8);ctx.stroke();
  ctx.strokeStyle=team==='blue'?'rgba(41,182,246,0.85)':'rgba(239,83,80,0.85)';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(0,30,14,6,0,0,Math.PI*2);ctx.stroke();
  ctx.restore();
}
function drawSandy(ctx,x,y,dir,team,scale){
  scale=scale||1;const f=dir>0?1:-1;const s=scale;
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.transform(1,0,0,.75,0,0);
  ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(0,17,13,5,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#a06818';ctx.lineWidth=6;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(f*9,4);ctx.bezierCurveTo(f*20,2,f*25,-4,f*22,-14);ctx.stroke();
  const bg=ctx.createRadialGradient(-3,-3,1,0,0,12);bg.addColorStop(0,'#f0bc50');bg.addColorStop(1,'#c88820');
  ctx.fillStyle=bg;ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#e06810';ctx.beginPath();ctx.ellipse(0,7,10,7,0,0,Math.PI);ctx.fill();
  ctx.fillStyle='#ff7820';ctx.fillRect(-9,2,18,9);ctx.fillStyle='#e8a840';ctx.fillRect(-4,-10,8,13);
  ctx.strokeStyle='rgba(140,220,255,0.9)';ctx.lineWidth=2.5;
  ctx.fillStyle='rgba(140,220,255,0.15)';ctx.beginPath();ctx.arc(0,-8,15,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#f8d890';ctx.beginPath();ctx.ellipse(0,-9,8,9,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#222';ctx.beginPath();ctx.arc(-3+f*.6,-12,2.2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(3+f*.6,-12,2.2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.8)';ctx.beginPath();ctx.arc(-4+f*.3,-13.5,1,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(2+f*.3,-13.5,1,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#553300';ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(0,-6,4,0,Math.PI);ctx.stroke();
  ctx.fillStyle='#d0a050';
  ctx.beginPath();ctx.moveTo(-10,-13);ctx.bezierCurveTo(-16,-18,-18,-25,-14,-24);ctx.lineTo(-6,-17);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(10,-13);ctx.bezierCurveTo(16,-18,18,-25,14,-24);ctx.lineTo(6,-17);ctx.closePath();ctx.fill();
  ctx.strokeStyle=team==='blue'?'rgba(41,182,246,0.85)':'rgba(239,83,80,0.85)';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(0,17,15,6,0,0,Math.PI*2);ctx.stroke();
  ctx.restore();
}
function drawGary(ctx,x,y,dir,team,scale){
  scale=scale||1;const f=dir>0?1:-1;const s=scale;
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.transform(1,0,0,.75,0,0);
  for(let i=3;i>=0;i--){ctx.fillStyle='rgba(100,220,100,'+(0.06*i)+')';ctx.beginPath();ctx.ellipse(-f*(4+i*5),11,4+i*2,2.5,0,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#e080d8';ctx.beginPath();ctx.ellipse(f*5,9,10,6,f>0?.25:-.25,0,Math.PI*2);ctx.fill();
  const sg=ctx.createRadialGradient(-3,-4,2,0,0,13);sg.addColorStop(0,'#e09850');sg.addColorStop(.5,'#cc8840');sg.addColorStop(1,'#aa6620');
  ctx.fillStyle=sg;ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#aa6620';ctx.beginPath();ctx.arc(0,0,10,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#cc8840';for(let i=0;i<6;i++){const a=Math.PI*2*i/6;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,10,a,a+.48);ctx.closePath();ctx.fill();}
  const cg=ctx.createRadialGradient(-2,-2,1,0,0,6);cg.addColorStop(0,'#ffcc60');cg.addColorStop(1,'#e09830');
  ctx.fillStyle=cg;ctx.beginPath();ctx.arc(0,0,5.5,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#e080cc';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(-3,-11);ctx.quadraticCurveTo(-5,-17,-7,-21);ctx.stroke();
  ctx.beginPath();ctx.moveTo(3,-11);ctx.quadraticCurveTo(5,-17,7,-21);ctx.stroke();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-7,-21,5.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(7,-21,5.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#cc44aa';ctx.beginPath();ctx.arc(-7,-21,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(7,-21,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#000';ctx.beginPath();ctx.arc(-7+f*.6,-21,1.3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(7+f*.6,-21,1.3,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=team==='blue'?'rgba(41,182,246,0.85)':'rgba(239,83,80,0.85)';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(0,15,16,6,0,0,Math.PI*2);ctx.stroke();
  ctx.restore();
}
const SPRITES={spongebob:drawSpongebob,patrick:drawPatrick,squidward:drawSquidward,sandy:drawSandy,gary:drawGary};

// ═══ GAME DATA ═══════════════════════════════════════════════
const CHARS={
  spongebob:{speed:4.5,hp:300,dmg:20,bs:8.5,fr:26,bColor:'#00cfff',bR:4,r:15},
  patrick:  {speed:2.8,hp:500,dmg:55,bs:6.5,fr:56,bColor:'#ff66aa',bR:6,r:16},
  squidward:{speed:3.6,hp:320,dmg:33,bs:11.5,fr:36,bColor:'#ccff44',bR:4,r:14},
  sandy:    {speed:4.8,hp:280,dmg:22,bs:10.0,fr:28,bColor:'#ffcc00',bR:4,r:14},
  gary:     {speed:2.2,hp:600,dmg:28,bs:6.0,fr:44,bColor:'#88ffaa',bR:5,r:15},
};

let selChar='spongebob',gRunning=false,paused=false,frameN=0;
let scoreB=0,scoreR=0,gTime=90;
let players=[],bullets=[],effects=[],blocks=[];
let keys={};
let soundEnabled=true,musicEnabled=true;
// flat map dimensions (world pixels)
let tiles=[],MC=0,MR=0;
// OX/OY = flat world origin (top-left)
let OX=0,OY=0;
const T=48, WALL=1, BUSH=2;
// iso projected map height in screen pixels (for centering)
let MC_px_h=0;

document.querySelectorAll('.cc').forEach(c=>{
  c.addEventListener('click',function(){document.querySelectorAll('.cc').forEach(x=>x.classList.remove('sel'));this.classList.add('sel');selChar=this.id.replace('cc-','');});
});
document.getElementById('sbtn').addEventListener('click',startGame);

// ═══ MAP ═════════════════════════════════════════════════════
function buildMap(){
  MC=Math.max(13,Math.floor((W*.7)/T));
  MR=Math.max(9,Math.floor((H*.6)/T));
  OX=0;OY=0;
  // iso projected height: (MC+MR)*ISO_H/2
  MC_px_h=(MC+MR)*(ISO_H/2)+WALL_H;
  calcIsoOrigin();
  tiles=[];blocks=[];
  for(let r=0;r<MR;r++){tiles[r]=[];for(let c=0;c<MC;c++)tiles[r][c]=0;}
  for(let r=0;r<MR;r++)for(let c=0;c<MC;c++)if(r===0||r===MR-1||c===0||c===MC-1)tiles[r][c]=WALL;
  const wps=[[~~(MR*.3),~~(MC*.3)],[~~(MR*.3),~~(MC*.7)],[~~(MR*.7),~~(MC*.3)],[~~(MR*.7),~~(MC*.7)],[~~(MR*.5),~~(MC*.5)],[~~(MR*.5),~~(MC*.35)],[~~(MR*.5),~~(MC*.65)]];
  for(const[r,c]of wps)for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
    const nr=r+dr,nc=c+dc;
    if(nr>1&&nr<MR-2&&nc>3&&nc<MC-4){
      if(Math.random()<.55){tiles[nr][nc]=WALL;blocks.push({r:nr,c:nc,hp:3,maxHp:3});}
      else if(Math.random()<.4)tiles[nr][nc]=BUSH;
    }
  }
  const bps=[[~~(MR*.2),~~(MC*.18)],[~~(MR*.2),~~(MC*.82)],[~~(MR*.8),~~(MC*.18)],[~~(MR*.8),~~(MC*.82)]];
  for(const[r,c]of bps)for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
    const nr=r+dr,nc=c+dc;if(nr>0&&nr<MR-1&&nc>0&&nc<MC-1&&tiles[nr][nc]===0)tiles[nr][nc]=BUSH;
  }
}

// tile (col,row) → tile index (integer)
function tileAt(px,py){
  const c=Math.floor(px/T),r=Math.floor(py/T);
  if(c<0||c>=MC||r<0||r>=MR)return WALL;
  return tiles[r][c];
}
const isWall=(px,py)=>tileAt(px,py)===WALL;

// world pixel → iso screen
function wp2s(wx,wy){
  const tc=wx/T, tr=wy/T;
  return {
    sx: ISO_OX + (tc-tr)*(ISO_W/2),
    sy: ISO_OY + (tc+tr)*(ISO_H/2)
  };
}

// ═══ PLAYERS ═════════════════════════════════════════════════
function mkPlayer(ck,team,col,row){
  const d=CHARS[ck];
  return{char:ck,team,
    x:(col+.5)*T, y:(row+.5)*T,
    hp:d.hp,mhp:d.hp,alive:true,respawnAt:0,
    speed:d.speed,dmg:d.dmg,bs:d.bs,r:d.r,fr:d.fr,ls:0,
    facing:team==='blue'?1:-1,aimDx:team==='blue'?1:-1,aimDy:0,
    sc:col,sr:row};
}
function rChar(){const k=Object.keys(CHARS);return k[~~(Math.random()*k.length)];}

function startGame(){
  document.getElementById('overlay').style.display='none';
  document.getElementById('menuBtn').style.display='flex';
  gRunning=true;paused=false;scoreB=0;scoreR=0;bullets=[];effects=[];frameN=0;gTime=90;
  buildMap();
  const mid=~~(MR/2);
  players=[
    mkPlayer(selChar,'blue',2,mid-2),mkPlayer(rChar(),'blue',2,mid),mkPlayer(rChar(),'blue',2,mid+2),
    mkPlayer(rChar(),'red',MC-3,mid-2),mkPlayer(rChar(),'red',MC-3,mid),mkPlayer(rChar(),'red',MC-3,mid+2),
  ];
  clearInterval(window._tmr);window._tmr=setInterval(()=>{if(gRunning&&!paused&&gTime>0)gTime--;},1000);
  startMusic();requestAnimationFrame(loop);
}
function restartGame(){closePause();startGame();}
function quitGame(){
  closePause();gRunning=false;clearInterval(window._tmr);
  document.getElementById('menuBtn').style.display='none';
  document.getElementById('otitle').textContent='🧽 Batalha do Fundo do Mar';
  document.getElementById('osub').textContent='Setas = mover e mirar · ESPAÇO = atirar!';
  document.getElementById('sbtn').textContent='⚔️ BATALHAR!';
  document.getElementById('overlay').style.display='flex';
}
function openMenu(){if(!gRunning)return;paused=true;updateAudioBtns();document.getElementById('pmenu').style.display='flex';}
function resumeGame(){closePause();}
function closePause(){paused=false;document.getElementById('pmenu').style.display='none';if(gRunning)requestAnimationFrame(loop);}
function toggleSound(){
  soundEnabled=!soundEnabled;
  if(masterGain)masterGain.gain.value=soundEnabled?1:0;
  document.getElementById('btnSound').textContent=soundEnabled?'🔊 Som: Ligado':'🔇 Som: Desligado';
}
function toggleMusic(){
  musicEnabled=!musicEnabled;
  if(musicGain)musicGain.gain.value=musicEnabled?1:0;
  if(musicEnabled&&gRunning&&audioCtx&&!audioCtx._musicStarted)startMusic();
  document.getElementById('btnMusic').textContent=musicEnabled?'🎵 Música: Ligada':'🎵 Música: Desligada';
}
function updateAudioBtns(){
  document.getElementById('btnSound').textContent=soundEnabled?'🔊 Som: Ligado':'🔇 Som: Desligado';
  document.getElementById('btnMusic').textContent=musicEnabled?'🎵 Música: Ligada':'🎵 Música: Desligada';
}

// ═══ PHYSICS ═════════════════════════════════════════════════
function moveP(p,dx,dy){
  if(!p.alive)return;
  const nx=p.x+dx*p.speed, ny=p.y+dy*p.speed, rr=p.r-3;
  if(!isWall(nx+rr,p.y)&&!isWall(nx-rr,p.y))p.x=nx;
  if(!isWall(p.x,ny+rr)&&!isWall(p.x,ny-rr))p.y=ny;
  if(dx!==0)p.facing=dx>0?1:-1;
  if(dx!==0||dy!==0){const l=Math.hypot(dx,dy);p.aimDx=dx/l;p.aimDy=dy/l;}
}

function getAiTarget(p){
  const SIGHT=280, BUSH_SIGHT=55;
  const enemies=players.filter(e=>e.team!==p.team&&e.alive);
  if(!enemies.length)return null;
  const visible=enemies.filter(e=>{
    const dist=Math.hypot(e.x-p.x,e.y-p.y);
    if(tileAt(e.x,e.y)===BUSH)return dist<BUSH_SIGHT;
    return dist<SIGHT;
  });
  if(!visible.length)return null;
  return visible.reduce((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)<Math.hypot(b.x-p.x,b.y-p.y)?a:b);
}

function shootP(s){
  if(!s.alive||frameN-s.ls<s.fr)return;
  s.ls=frameN;
  let dx=s.aimDx,dy=s.aimDy;
  if(s!==players[0]){
    const t=getAiTarget(s);if(!t)return;
    const dist=Math.hypot(t.x-s.x,t.y-s.y);
    dx=(t.x-s.x)/dist;dy=(t.y-s.y)/dist;
  }else{playShoot(s.char);}
  const d=CHARS[s.char];
  bullets.push({x:s.x,y:s.y,dx:dx*s.bs,dy:dy*s.bs,team:s.team,dmg:s.dmg,color:d.bColor,r:d.bR,life:110});
}

function aiStep(p){
  if(!p.alive)return;
  const t=getAiTarget(p);
  if(!t){
    const cx=MC*T/2,cy=MR*T/2;
    const ang=Math.atan2(cy-p.y,cx-p.x);
    moveP(p,Math.cos(ang)*.4+(Math.random()-.5)*.3,Math.sin(ang)*.4+(Math.random()-.5)*.3);
    return;
  }
  const dist=Math.hypot(t.x-p.x,t.y-p.y);
  const ang=Math.atan2(t.y-p.y,t.x-p.x);
  const mv=dist>130?1:dist<75?-1:0;
  moveP(p,Math.cos(ang)*mv+(Math.random()-.5)*.15,Math.sin(ang)*mv+(Math.random()-.5)*.15);
  p.facing=t.x>p.x?1:-1;
  p.aimDx=(t.x-p.x)/dist;p.aimDy=(t.y-p.y)/dist;
  shootP(p);
}

function hitBlock(bx,by){
  const c=Math.floor(bx/T),r=Math.floor(by/T);
  const blk=blocks.find(b=>b.r===r&&b.c===c);
  if(blk){
    blk.hp--;spawnChips(bx,by);
    if(blk.hp<=0){tiles[r][c]=0;blocks.splice(blocks.indexOf(blk),1);spawnChips(bx,by,true);}
    return true;
  }
  return false;
}

function updBullets(){
  for(let i=bullets.length-1;i>=0;i--){
    const b=bullets[i];b.x+=b.dx;b.y+=b.dy;b.life--;
    if(b.life<=0){bullets.splice(i,1);continue;}
    if(isWall(b.x,b.y)){hitBlock(b.x,b.y);bullets.splice(i,1);continue;}
    let hit=false;
    for(const p of players){
      if(!p.alive||p.team===b.team)continue;
      if(Math.hypot(p.x-b.x,p.y-b.y)<p.r+5){
        p.hp-=b.dmg;playHit();
        if(p.hp<=0){p.hp=0;p.alive=false;p.team==='red'?scoreB++:scoreR++;spawnBoom(p.x,p.y,p.team);playDie();p.respawnAt=frameN+190;}
        bullets.splice(i,1);hit=true;break;
      }
    }
  }
}

function spawnBoom(x,y,team){
  for(let i=0;i<14;i++){const a=Math.PI*2*i/14;effects.push({x,y,vx:Math.cos(a)*(3+Math.random()*2),vy:Math.sin(a)*(3+Math.random()*2),life:45,col:team==='blue'?'#29b6f6':team==='red'?'#ef5350':'#88ffaa',r:4+Math.random()*3});}
  for(let i=0;i<6;i++){const a=Math.PI*2*i/6;effects.push({x,y,vx:Math.cos(a)*6,vy:Math.sin(a)*6,life:25,col:'#fff',r:2});}
}
function spawnChips(x,y,big=false){
  const n=big?10:5;
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,spd=big?3.5:1.8;effects.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,life:big?35:20,col:big?'#88aabb':'#6688aa',r:big?3:2});}
}
function updEffects(){for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.x+=e.vx;e.y+=e.vy;e.vx*=.88;e.vy*=.88;e.life--;if(e.life<=0)effects.splice(i,1);}}
function checkRespawns(){
  for(const p of players)if(!p.alive&&p.respawnAt>0&&frameN>=p.respawnAt){
    p.hp=CHARS[p.char].hp;p.alive=true;p.x=(p.sc+.5)*T;p.y=(p.sr+.5)*T;p.respawnAt=0;spawnBoom(p.x,p.y,'spawn');
  }
}

// ═══ ISO RENDER ══════════════════════════════════════════════
// draw a diamond (iso tile top face)
function isoTile(col,row,fillTop,fillLeft,fillRight,h){
  h=h||0;
  const {sx,sy}=wp2s(col*T,row*T);
  const hw=ISO_W/2, hh=ISO_H/2;
  // top face diamond
  ctx.beginPath();
  ctx.moveTo(sx,    sy-h);
  ctx.lineTo(sx+hw, sy+hh-h);
  ctx.lineTo(sx,    sy+ISO_H-h);
  ctx.lineTo(sx-hw, sy+hh-h);
  ctx.closePath();
  ctx.fillStyle=fillTop;ctx.fill();
  if(h>0){
    // left face
    ctx.beginPath();ctx.moveTo(sx-hw,sy+hh-h);ctx.lineTo(sx,sy+ISO_H-h);ctx.lineTo(sx,sy+ISO_H);ctx.lineTo(sx-hw,sy+hh);ctx.closePath();
    ctx.fillStyle=fillLeft;ctx.fill();
    // right face
    ctx.beginPath();ctx.moveTo(sx+hw,sy+hh-h);ctx.lineTo(sx,sy+ISO_H-h);ctx.lineTo(sx,sy+ISO_H);ctx.lineTo(sx+hw,sy+hh);ctx.closePath();
    ctx.fillStyle=fillRight;ctx.fill();
  }
}

function drawMap(){
  // sky background
  const bg=ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#1a3a6a');bg.addColorStop(.5,'#0d5a8a');bg.addColorStop(1,'#0a2040');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

  // draw tiles back-to-front (painter's algorithm: r+c ascending)
  for(let sum=0;sum<MC+MR-1;sum++){
    for(let c=0;c<=sum;c++){
      const r=sum-c;
      if(r<0||r>=MR||c<0||c>=MC)continue;
      const t=tiles[r][c];
      if(t===WALL){
        const blk=blocks.find(b=>b.r===r&&b.c===c);
        if(blk){
          const pct=blk.hp/blk.maxHp;
          const topC=pct>.66?'#5a9ad8':pct>.33?'#c07040':'#803020';
          const leftC=pct>.66?'#2a5a9a':pct>.33?'#7a4020':'#501808';
          const rightC=pct>.66?'#3a70b8':pct>.33?'#9a5530':'#602818';
          isoTile(c,r,topC,leftC,rightC,WALL_H);
          // crack lines on top
          if(blk.hp<3){
            const {sx,sy}=wp2s(c*T,r*T);
            ctx.strokeStyle='rgba(0,0,0,0.5)';ctx.lineWidth=1.5;
            ctx.beginPath();ctx.moveTo(sx-10,sy-WALL_H+5);ctx.lineTo(sx+5,sy-WALL_H+14);ctx.stroke();
            ctx.beginPath();ctx.moveTo(sx+8,sy-WALL_H+3);ctx.lineTo(sx-2,sy-WALL_H+12);ctx.stroke();
          }
          if(blk.hp<2){
            const {sx,sy}=wp2s(c*T,r*T);
            ctx.strokeStyle='rgba(0,0,0,0.7)';ctx.lineWidth=2;
            ctx.beginPath();ctx.moveTo(sx-14,sy-WALL_H+8);ctx.lineTo(sx+10,sy-WALL_H+18);ctx.stroke();
          }
          // HP label
          const {sx,sy}=wp2s((c+.5)*T,(r+.5)*T);
          ctx.fillStyle='rgba(255,255,255,0.85)';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.fillText(blk.hp,sx,sy-WALL_H-8);
        } else {
          // permanent wall
          isoTile(c,r,'#2a5090','#0d2448','#1a3a7a',WALL_H);
          // highlight on top
          const {sx,sy}=wp2s(c*T,r*T);
          ctx.globalAlpha=0.12;ctx.fillStyle='#88bbff';
          ctx.beginPath();ctx.moveTo(sx,sy-WALL_H);ctx.lineTo(sx+ISO_W/2,sy+ISO_H/2-WALL_H);ctx.lineTo(sx,sy+ISO_H-WALL_H);ctx.lineTo(sx-ISO_W/2,sy+ISO_H/2-WALL_H);ctx.closePath();ctx.fill();
          ctx.globalAlpha=1;
        }
      } else if(t===BUSH){
        // ground
        isoTile(c,r,'#1a6030','#0a3818','#124828',0);
        // coral tufts on top
        const {sx,sy}=wp2s((c+.5)*T,(r+.5)*T);
        const wv=Math.sin(frameN*.04+c*2.1+r*1.3)*2;
        const cCols=['#22aa50','#18882e','#2acc60','#159040'];
        [[-10,2],[-3,-2],[5,0],[11,3],[-6,5],[3,6]].forEach(([ox,oy],i)=>{
          const h2=8+Math.sin(frameN*.05+i)*2;
          ctx.strokeStyle=cCols[i%4];ctx.lineWidth=2.5;ctx.lineCap='round';
          ctx.beginPath();ctx.moveTo(sx+ox,sy+oy);ctx.quadraticCurveTo(sx+ox+wv,sy+oy-h2/2,sx+ox-wv*.5,sy+oy-h2);ctx.stroke();
          ctx.fillStyle=cCols[i%4];ctx.beginPath();ctx.arc(sx+ox-wv*.5,sy+oy-h2,3,0,Math.PI*2);ctx.fill();
        });
      } else {
        // sand floor with slight texture
        const shade=(r+c)%2===0?'#d4a44a':'#c89838';
        isoTile(c,r,shade,'','',0);
        // pebble detail
        if((r*7+c*13)%11===0){
          const {sx,sy}=wp2s((c+.5)*T,(r+.5)*T);
          ctx.fillStyle='rgba(160,120,40,0.4)';ctx.beginPath();ctx.arc(sx,sy,2,0,Math.PI*2);ctx.fill();
        }
      }
    }
  }
}

// sort players+bullets+effects by iso depth (r+c = wx+wy)
function isoDepth(wx,wy){return wx+wy;}

function drawPlayer(p){
  if(!p.alive){
    if(p===players[0]&&p.respawnAt>0){
      const left=Math.max(0,Math.ceil((p.respawnAt-frameN)/60));
      ctx.save();ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(W/2-95,H/2-25,190,50);
      ctx.strokeStyle='rgba(245,197,24,0.5)';ctx.lineWidth=1.5;ctx.strokeRect(W/2-95,H/2-25,190,50);
      ctx.fillStyle='#fff';ctx.font='bold 15px Comic Sans MS';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('Renascendo em '+left+'s',W/2,H/2);ctx.restore();
    }
    return;
  }

  const {sx,sy}=wp2s(p.x,p.y);
  const inBush=tileAt(p.x,p.y)===BUSH;
  const isMe=p===players[0];
  const isAlly=p.team==='blue'&&!isMe;
  const bushAlpha=isMe?0.45:isAlly?0.4:0.18;
  if(inBush)ctx.globalAlpha=bushAlpha;

  // ground shadow ellipse
  ctx.save();ctx.globalAlpha=inBush?(bushAlpha*.3):.25;
  ctx.fillStyle='rgba(80,50,10,0.55)';ctx.beginPath();ctx.ellipse(sx,sy+4,p.r*.9,p.r*.35,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
  if(inBush)ctx.globalAlpha=bushAlpha;

  // glow ring under player
  ctx.save();
  ctx.globalAlpha=(inBush?bushAlpha:.7)*.5;
  ctx.strokeStyle=p.team==='blue'?'#29b6f6':'#ef5350';
  ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(sx,sy+2,p.r*.9,p.r*.35,0,0,Math.PI*2);ctx.stroke();
  ctx.restore();
  if(inBush)ctx.globalAlpha=bushAlpha;

  // draw sprite
  ctx.save();
  ctx.shadowColor=p.team==='blue'?'rgba(41,182,246,0.4)':'rgba(239,83,80,0.4)';ctx.shadowBlur=12;
  const spr=SPRITES[p.char];
  if(spr)spr(ctx,sx,sy,p.facing,p.team,0.9);
  ctx.restore();
  if(inBush)ctx.globalAlpha=bushAlpha;

  // HP bar (always screen-aligned, above player)
  const bw=p.r*3,bh=6,bx=sx-bw/2,by=sy-52;
  ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(bx-1,by-1,bw+2,bh+2);
  ctx.fillStyle='#111';ctx.fillRect(bx,by,bw,bh);
  const pct=p.hp/p.mhp;
  const hg=ctx.createLinearGradient(bx,by,bx,by+bh);
  const tc=pct>.6?['#66ee66','#33aa33']:pct>.3?['#ffcc44','#cc8800']:['#ff5544','#cc2222'];
  hg.addColorStop(0,tc[0]);hg.addColorStop(1,tc[1]);
  ctx.fillStyle=hg;ctx.fillRect(bx,by,bw*pct,bh);
  ctx.fillStyle='rgba(255,255,255,0.25)';ctx.fillRect(bx,by,bw*pct,bh*.4);
  ctx.strokeStyle='rgba(0,0,0,0.4)';ctx.lineWidth=.5;ctx.strokeRect(bx,by,bw,bh);
  ctx.globalAlpha=1;

  // aim arrow (player only)
  if(isMe&&p.alive){
    const len=p.r+18;
    const ex=sx+p.aimDx*len, ey=sy+p.aimDy*len*.5; // flatten in Y for iso
    ctx.save();ctx.strokeStyle='rgba(255,255,80,0.65)';ctx.lineWidth=2;ctx.lineCap='round';ctx.setLineDash([3,4]);
    ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='rgba(255,255,80,0.9)';ctx.beginPath();ctx.arc(ex,ey,3.5,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
}

function drawBullet(b){
  const {sx,sy}=wp2s(b.x,b.y);
  ctx.save();
  ctx.shadowColor=b.color;ctx.shadowBlur=10;
  // trail
  const tx=sx-b.dx*1.5*(ISO_W/(2*T)), ty=sy-(b.dy+b.dx)*.5*(ISO_H/(2*T))*1.5;
  ctx.globalAlpha=0.3;ctx.fillStyle=b.color;
  ctx.beginPath();ctx.ellipse(tx,ty,b.r*1.2,b.r*.6,Math.atan2(b.dy,b.dx),0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;
  ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(sx,sy,b.r,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.85)';ctx.beginPath();ctx.arc(sx-b.r*.3,sy-b.r*.3,b.r*.38,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function drawEffect(e){
  const {sx,sy}=wp2s(e.x,e.y);
  ctx.globalAlpha=e.life/45;ctx.fillStyle=e.col;
  ctx.beginPath();ctx.arc(sx,sy-e.r*.3,e.r,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;
}

function drawHUD(){
  const bA=players.filter(p=>p.team==='blue'&&p.alive).length;
  const rA=players.filter(p=>p.team==='red'&&p.alive).length;
  const bH=players.filter(p=>p.team==='blue').reduce((s,p)=>s+p.hp/p.mhp,0)/3;
  const rH=players.filter(p=>p.team==='red').reduce((s,p)=>s+p.hp/p.mhp,0)/3;
  document.getElementById('hb').style.width=(bH*100)+'%';document.getElementById('hr').style.width=(rH*100)+'%';
  document.getElementById('hbt').textContent=bA+'/3';document.getElementById('hrt').textContent=rA+'/3';
  document.getElementById('sc').textContent=scoreB+' — '+scoreR+'  ⏱ '+gTime+'s';
}

function checkEnd(){
  if(gTime>0)return;
  clearInterval(window._tmr);gRunning=false;
  const msg=scoreB>scoreR?'🔵 AZUL VENCEU!':scoreR>scoreB?'🔴 VERMELHO VENCEU!':'🤝 EMPATE!';
  setTimeout(()=>{
    document.getElementById('otitle').textContent=msg;
    document.getElementById('osub').textContent='Placar final: '+scoreB+' — '+scoreR;
    document.getElementById('sbtn').textContent='🔄 Jogar Novamente';
    document.getElementById('menuBtn').style.display='none';
    document.getElementById('overlay').style.display='flex';
  },900);
}

// ═══ MAIN LOOP ════════════════════════════════════════════════
function loop(){
  if(!gRunning||paused)return;
  frameN++;
  ctx.clearRect(0,0,W,H);

  // recalc iso origin on resize
  calcIsoOrigin();
  drawMap();

  // controls
  const me=players[0];
  if(me&&me.alive){
    let dx=0,dy=0;
    if(keys['ArrowLeft'])dx-=1;if(keys['ArrowRight'])dx+=1;
    if(keys['ArrowUp'])dy-=1;if(keys['ArrowDown'])dy+=1;
    if(dx&&dy){dx*=.707;dy*=.707;}
    moveP(me,dx,dy);
    if(keys['Space'])shootP(me);
  }
  for(let i=1;i<players.length;i++)aiStep(players[i]);
  checkRespawns();updBullets();updEffects();

  // collect all drawables and sort by iso depth for painter's algorithm
  const drawables=[];
  for(const p of players)if(p.alive)drawables.push({depth:isoDepth(p.x,p.y),type:'player',obj:p});
  for(const b of bullets)drawables.push({depth:isoDepth(b.x,b.y),type:'bullet',obj:b});
  for(const e of effects)drawables.push({depth:isoDepth(e.x,e.y),type:'effect',obj:e});
  drawables.sort((a,b)=>a.depth-b.depth);

  for(const d of drawables){
    if(d.type==='player')drawPlayer(d.obj);
    else if(d.type==='bullet')drawBullet(d.obj);
    else drawEffect(d.obj);
  }
  // dead players (respawn msg)
  for(const p of players)if(!p.alive)drawPlayer(p);

  drawHUD();checkEnd();
  if(gRunning&&!paused)requestAnimationFrame(loop);
}

// ═══ INPUT ════════════════════════════════════════════════════
document.addEventListener('keydown',e=>{
  keys[e.code]=true;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
  if(e.code==='Escape'){paused?resumeGame():openMenu();}
});
document.addEventListener('keyup',e=>{keys[e.code]=false;});

let tMove={id:null,sx:0,sy:0};
canvas.addEventListener('touchstart',e=>{
  e.preventDefault();
  for(const t of e.changedTouches){
    if(t.clientX<W*.7&&!tMove.id)tMove={id:t.identifier,sx:t.clientX,sy:t.clientY};
    else{keys['Space']=true;setTimeout(()=>keys['Space']=false,80);}
  }
},{passive:false});
canvas.addEventListener('touchmove',e=>{
  e.preventDefault();
  for(const t of e.changedTouches){
    if(t.identifier!==tMove.id)continue;
    const dx=t.clientX-tMove.sx,dy=t.clientY-tMove.sy;
    keys['ArrowLeft']=dx<-18;keys['ArrowRight']=dx>18;keys['ArrowUp']=dy<-18;keys['ArrowDown']=dy>18;
  }
},{passive:false});
canvas.addEventListener('touchend',e=>{
  e.preventDefault();
  for(const t of e.changedTouches)if(t.identifier===tMove.id){tMove.id=null;keys['ArrowLeft']=keys['ArrowRight']=keys['ArrowUp']=keys['ArrowDown']=false;}
},{passive:false});
