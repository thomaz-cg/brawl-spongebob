// game.js v5 - Batalha do Fundo do Mar
// Setas = mover e mirar | ESPACO = atirar

const canvas=document.getElementById('c'),ctx=canvas.getContext('2d');
let W,H;
function resize(){W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;}
resize();window.addEventListener('resize',resize);

// AUDIO
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
      const end=playMelody(nextT);
      nextT=end;
      setTimeout(mloop,(end-ac.currentTime-1)*1000);
    }
    mloop();
  }catch(e){}
}

// SPRITES
function drawSpongebob(ctx,x,y,dir,team){
  const f=dir>0?1:-1;
  ctx.fillStyle='rgba(0,0,0,0.25)';ctx.beginPath();ctx.ellipse(x+2,y+22,11,4,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#1a1a2e';ctx.beginPath();ctx.ellipse(x-5+(f>0?-2:2),y+21,6,3.5,.1,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(x+5+(f>0?2:-2),y+21,6,3.5,-.1,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.fillRect(x-8,y+15,6,6);ctx.fillRect(x+2,y+15,6,6);
  ctx.fillStyle='#7a3b10';ctx.fillRect(x-10,y+8,20,9);
  ctx.fillStyle='#5c2c0a';ctx.fillRect(x-10,y+8,20,2);
  ctx.fillStyle='#a04c15';ctx.fillRect(x-3,y+8,6,9);
  const bodyGrd=ctx.createLinearGradient(x-10,y-10,x+10,y+8);
  bodyGrd.addColorStop(0,'#ffe840');bodyGrd.addColorStop(.4,'#f0d020');bodyGrd.addColorStop(1,'#c8aa10');
  ctx.fillStyle=bodyGrd;ctx.fillRect(x-10,y-10,20,20);
  ctx.fillStyle='rgba(255,255,200,0.35)';ctx.fillRect(x-8,y-9,7,5);
  ctx.fillStyle='#b89810';
  [[x-6,y-6,2.5],[x+2,y-8,2],[x-3,y+1,2],[x+5,y+3,2.5],[x-7,y+3,1.5],[x+3,y-2,1.5]].forEach(([cx,cy,r])=>{ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.arc(cx+.5,cy+.5,r*.7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#b89810';});
  ctx.fillStyle='#f8f8f8';ctx.fillRect(x-8,y+2,16,8);
  ctx.fillStyle='#dd0000';ctx.beginPath();ctx.moveTo(x-1.5,y+2);ctx.lineTo(x+1.5,y+2);ctx.lineTo(x+3,y+8);ctx.lineTo(x,y+10.5);ctx.lineTo(x-3,y+8);ctx.closePath();ctx.fill();
  ctx.fillStyle='#aa0000';ctx.beginPath();ctx.moveTo(x,y+6);ctx.lineTo(x+2,y+8);ctx.lineTo(x,y+10.5);ctx.closePath();ctx.fill();
  ctx.fillStyle='#f0d020';ctx.fillRect(x-4,y-12,8,4);
  const headGrd=ctx.createLinearGradient(x-10,y-26,x+10,y-10);
  headGrd.addColorStop(0,'#ffe840');headGrd.addColorStop(.5,'#f0d020');headGrd.addColorStop(1,'#c8aa10');
  ctx.fillStyle=headGrd;ctx.fillRect(x-10,y-26,20,16);
  ctx.fillStyle='rgba(255,255,200,0.3)';ctx.fillRect(x-9,y-25,6,4);
  ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(x-4,y-20,4.5,5.5,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(x+4,y-20,4.5,5.5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(0,0,100,0.1)';ctx.beginPath();ctx.ellipse(x-4,y-19,3,4,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(x+4,y-19,3,4,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#1a44dd';ctx.beginPath();ctx.arc(x-4+f*1.2,y-19.5,2.8,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+4+f*1.2,y-19.5,2.8,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#000';ctx.beginPath();ctx.arc(x-4+f*1.8,y-19.5,1.4,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+4+f*1.8,y-19.5,1.4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.8)';ctx.beginPath();ctx.arc(x-5+f,y-21,1,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+3+f,y-21,1,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#333';ctx.lineWidth=1.2;
  [[x-7,y-25,x-5,y-24],[x-3,y-25,x-4,y-24],[x+7,y-25,x+5,y-24],[x+3,y-25,x+4,y-24]].forEach(([x1,y1,x2,y2])=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();});
  ctx.fillStyle='#c8aa10';ctx.beginPath();ctx.arc(x,y-16,2.2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#eee';ctx.beginPath();ctx.arc(x,y-13,5.5,0,Math.PI);ctx.fill();
  ctx.strokeStyle='#555';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y-13,5.5,0,Math.PI);ctx.stroke();
  ctx.strokeStyle='#ccc';ctx.beginPath();ctx.moveTo(x-2,y-13);ctx.lineTo(x-2,y-8);ctx.stroke();ctx.beginPath();ctx.moveTo(x+2,y-13);ctx.lineTo(x+2,y-8);ctx.stroke();
  ctx.fillStyle='#f0d020';ctx.beginPath();ctx.arc(x-11,y-19,3.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+11,y-19,3.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#f0d020';ctx.fillRect(x+(f>0?-15:-11),y-8,4,13);ctx.fillRect(x+(f>0?11:7),y-8,4,13);
  ctx.fillStyle='#f8f8f8';ctx.beginPath();ctx.arc(x+(f>0?-13:15),y+5,4.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+(f>0?13:-15),y+5,4.5,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=team==='blue'?'rgba(41,182,246,0.8)':'rgba(239,83,80,0.8)';ctx.lineWidth=2.5;ctx.strokeRect(x-11,y-26,22,50);
}
function drawPatrick(ctx,x,y,dir,team){
  const f=dir>0?1:-1;
  ctx.fillStyle='rgba(0,0,0,0.25)';ctx.beginPath();ctx.ellipse(x+2,y+20,14,5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#6a2580';ctx.fillRect(x-13,y+5,26,14);ctx.fillStyle='#8830a0';ctx.fillRect(x-13,y+5,26,3);
  ctx.fillStyle='#aa44cc';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(x-10+i*5,y+12,2.5,0,Math.PI*2);ctx.fill();}
  const bodyGrd=ctx.createRadialGradient(x-4,y-4,2,x,y,15);
  bodyGrd.addColorStop(0,'#ffaacc');bodyGrd.addColorStop(.5,'#ff80a0');bodyGrd.addColorStop(1,'#cc5580');
  ctx.fillStyle=bodyGrd;ctx.beginPath();ctx.arc(x,y,15,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,220,240,0.4)';ctx.beginPath();ctx.ellipse(x-5,y-6,7,5,-0.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#dd5580';[[x-6,y-3,2.2],[x+5,y+2,2.8],[x-2,y+5,1.8],[x+3,y-6,2.2]].forEach(([cx,cy,r])=>{ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();});
  ctx.fillStyle='#ff90b8';for(let i=0;i<5;i++){const a=Math.PI*2*i/5-Math.PI/2;ctx.beginPath();ctx.arc(x+Math.cos(a)*17,y+Math.sin(a)*17,5.5,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='rgba(255,160,200,0.5)';for(let i=0;i<5;i++){const a=Math.PI*2*i/5-Math.PI/2;ctx.beginPath();ctx.arc(x+Math.cos(a)*17,y+Math.sin(a)*17,3,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#bb3360';ctx.fillRect(x-10,y-11,8,3.5);ctx.fillRect(x+2,y-11,8,3.5);
  ctx.fillStyle='#ff90b8';ctx.fillRect(x-10,y-13,4,3.5);ctx.fillRect(x+6,y-13,4,3.5);
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x-5.5,y-5,5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+5.5,y-5,5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#111';ctx.beginPath();ctx.arc(x-5.5+f*.6,y-4.5,2.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+5.5+f*.6,y-4.5,2.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.8)';ctx.beginPath();ctx.arc(x-6.5+f*.3,y-6,1,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+4.5+f*.3,y-6,1,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#cc2244';ctx.beginPath();ctx.arc(x,y+5.5,7,0,Math.PI);ctx.fill();
  ctx.fillStyle='#ff88aa';ctx.beginPath();ctx.ellipse(x,y+10,4.5,3,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=team==='blue'?'rgba(41,182,246,0.7)':'rgba(239,83,80,0.7)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,22,0,Math.PI*2);ctx.stroke();
}
function drawSquidward(ctx,x,y,dir,team){
  const f=dir>0?1:-1;
  ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(x+2,y+28,10,4,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#4aafaf';ctx.lineWidth=4;ctx.lineCap='round';
  [[-8,-1.5],[-3,-.5],[3,.5],[8,1.5]].forEach(([ox,twist])=>{ctx.beginPath();ctx.moveTo(x+ox,y+14);ctx.bezierCurveTo(x+ox*1.5,y+20,x+ox*1.8+twist*3,y+24,x+ox*2.2,y+30);ctx.stroke();});
  const bodyGrd=ctx.createLinearGradient(x-11,y-5,x+11,y+14);
  bodyGrd.addColorStop(0,'#7ed9d9');bodyGrd.addColorStop(1,'#4aafaf');
  ctx.fillStyle=bodyGrd;ctx.beginPath();ctx.ellipse(x,y+5,11,14,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(200,255,255,0.25)';ctx.beginPath();ctx.ellipse(x-3,y-1,5,8,-.2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#c8a060';ctx.fillRect(x-10,y-2,20,16);ctx.fillStyle='#b88840';ctx.fillRect(x-10,y-2,20,3);
  ctx.fillStyle='#6ecece';ctx.beginPath();ctx.arc(x,y-2,6.5,Math.PI,0);ctx.fill();
  const headGrd=ctx.createLinearGradient(x-10,y-34,x+10,y-10);
  headGrd.addColorStop(0,'#8ee0e0');headGrd.addColorStop(1,'#5cbfbf');
  ctx.fillStyle=headGrd;ctx.beginPath();ctx.ellipse(x,y-18,10,15,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(200,255,255,0.3)';ctx.beginPath();ctx.ellipse(x-4,y-24,5,7,-.2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#70d0d0';ctx.beginPath();ctx.ellipse(x,y-28,11,9,0,Math.PI,Math.PI*2);ctx.fill();
  ctx.fillStyle='#f0e040';ctx.beginPath();ctx.ellipse(x-4.5,y-21,4.5,5.5,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(x+4.5,y-21,4.5,5.5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,0,0.15)';ctx.beginPath();ctx.arc(x-5.5,y-22,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+3.5,y-22,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#aa8800';ctx.beginPath();ctx.arc(x-4.5+f*.6,y-21,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+4.5+f*.6,y-21,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#000';ctx.beginPath();ctx.arc(x-4.5+f*1.1,y-21,1.2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+4.5+f*1.1,y-21,1.2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.8)';ctx.beginPath();ctx.arc(x-5.5+f*.5,y-22.5,1,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+3.5+f*.5,y-22.5,1,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#4aafaf';ctx.beginPath();ctx.moveTo(x-4,y-16);ctx.lineTo(x+4,y-16);ctx.bezierCurveTo(x+6,y-11,x+5,y-8,x,y-7);ctx.bezierCurveTo(x-5,y-8,x-6,y-11,x-4,y-16);ctx.fill();
  ctx.strokeStyle='#2a7a7a';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y-5,4.5,Math.PI+.4,-.4,true);ctx.stroke();
  ctx.strokeStyle='#5dbfbf';ctx.lineWidth=4.5;
  ctx.beginPath();ctx.moveTo(x-11,y-5);ctx.quadraticCurveTo(x-20,y,x-20,y+8);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+11,y-5);ctx.quadraticCurveTo(x+20,y,x+20,y+8);ctx.stroke();
  ctx.strokeStyle=team==='blue'?'rgba(41,182,246,0.7)':'rgba(239,83,80,0.7)';ctx.lineWidth=2;ctx.strokeRect(x-13,y-36,26,55);
}
function drawSandy(ctx,x,y,dir,team){
  const f=dir>0?1:-1;
  ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(x+2,y+15,11,4,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#a06818';ctx.lineWidth=6;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x+f*9,y+4);ctx.bezierCurveTo(x+f*20,y+2,x+f*25,y-4,x+f*22,y-14);ctx.stroke();
  ctx.strokeStyle='#c88820';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(x+f*9,y+4);ctx.bezierCurveTo(x+f*20,y+2,x+f*25,y-4,x+f*22,y-14);ctx.stroke();
  const bodyGrd=ctx.createRadialGradient(x-3,y-3,1,x,y,12);
  bodyGrd.addColorStop(0,'#f0bc50');bodyGrd.addColorStop(1,'#c88820');
  ctx.fillStyle=bodyGrd;ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,220,120,0.4)';ctx.beginPath();ctx.ellipse(x-4,y-4,6,5,-.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#dd6010';ctx.beginPath();ctx.ellipse(x,y+7,10,7,0,0,Math.PI);ctx.fill();
  ctx.fillStyle='#ff7820';ctx.fillRect(x-9,y+2,18,9);ctx.fillStyle='#dd6010';ctx.fillRect(x-9,y+2,18,2.5);
  ctx.fillStyle='#f0bc50';ctx.fillRect(x-4,y-10,8,13);
  ctx.strokeStyle='rgba(140,220,255,0.9)';ctx.lineWidth=3;
  ctx.fillStyle='rgba(140,220,255,0.15)';ctx.beginPath();ctx.arc(x,y-8,15,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.strokeStyle='rgba(200,240,255,0.6)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y-8,13,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.5)';ctx.beginPath();ctx.arc(x-7,y-16,2.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x-5,y-12,1.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#f8d890';ctx.beginPath();ctx.ellipse(x,y-9,8,9,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,230,150,0.4)';ctx.beginPath();ctx.ellipse(x-3,y-13,4,5,-.2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#222';ctx.beginPath();ctx.arc(x-3+f*.6,y-12,2.2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+3+f*.6,y-12,2.2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.8)';ctx.beginPath();ctx.arc(x-4+f*.3,y-13.5,1,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+2+f*.3,y-13.5,1,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#553300';ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(x,y-6,4,0,Math.PI);ctx.stroke();
  ctx.fillStyle='#d0a050';
  ctx.beginPath();ctx.moveTo(x-10,y-13);ctx.bezierCurveTo(x-16,y-18,x-18,y-25,x-14,y-24);ctx.lineTo(x-6,y-17);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(x+10,y-13);ctx.bezierCurveTo(x+16,y-18,x+18,y-25,x+14,y-24);ctx.lineTo(x+6,y-17);ctx.closePath();ctx.fill();
  ctx.strokeStyle=team==='blue'?'rgba(41,182,246,0.7)':'rgba(239,83,80,0.7)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,23,0,Math.PI*2);ctx.stroke();
}
function drawGary(ctx,x,y,dir,team){
  const f=dir>0?1:-1;
  for(let i=3;i>=0;i--){ctx.fillStyle='rgba(100,220,100,'+(0.06*i)+')';ctx.beginPath();ctx.ellipse(x-f*(4+i*5),y+11,4+i*2,2.5,0,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#e090d8';ctx.beginPath();ctx.ellipse(x+f*5,y+9,10,6,f>0?.25:-.25,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(230,150,220,0.4)';ctx.beginPath();ctx.ellipse(x+f*3,y+7,6,3.5,f>0?.25:-.25,0,Math.PI*2);ctx.fill();
  const shellGrd=ctx.createRadialGradient(x-3,y-4,2,x,y,13);
  shellGrd.addColorStop(0,'#e09850');shellGrd.addColorStop(.5,'#cc8840');shellGrd.addColorStop(1,'#aa6620');
  ctx.fillStyle=shellGrd;ctx.beginPath();ctx.arc(x,y,13,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,220,150,0.3)';ctx.beginPath();ctx.ellipse(x-4,y-5,7,6,-.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#aa6620';ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#cc8840';for(let i=0;i<6;i++){const a=Math.PI*2*i/6;ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,10,a,a+.48);ctx.closePath();ctx.fill();}
  const centerGrd=ctx.createRadialGradient(x-2,y-2,1,x,y,6);
  centerGrd.addColorStop(0,'#ffcc60');centerGrd.addColorStop(1,'#e09830');
  ctx.fillStyle=centerGrd;ctx.beginPath();ctx.arc(x,y,5.5,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#e080cc';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(x-3,y-11);ctx.quadraticCurveTo(x-5,y-17,x-7,y-21);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+3,y-11);ctx.quadraticCurveTo(x+5,y-17,x+7,y-21);ctx.stroke();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x-7,y-21,5.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+7,y-21,5.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(200,100,200,0.2)';ctx.beginPath();ctx.arc(x-7,y-21,4,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+7,y-21,4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#cc44aa';ctx.beginPath();ctx.arc(x-7,y-21,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+7,y-21,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#000';ctx.beginPath();ctx.arc(x-7+f*.6,y-21,1.3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+7+f*.6,y-21,1.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.8)';ctx.beginPath();ctx.arc(x-8+f*.3,y-22.5,1,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+6+f*.3,y-22.5,1,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=team==='blue'?'rgba(41,182,246,0.7)':'rgba(239,83,80,0.7)';ctx.lineWidth=2;ctx.strokeRect(x-15,y-28,30,42);
}
const SPRITES={spongebob:drawSpongebob,patrick:drawPatrick,squidward:drawSquidward,sandy:drawSandy,gary:drawGary};

const CHARS={
  spongebob:{speed:3.0,hp:300,dmg:20,bs:8.5,fr:26,bColor:'#00cfff',bR:4,r:15},
  patrick:  {speed:1.7,hp:500,dmg:55,bs:6.5,fr:56,bColor:'#ff66aa',bR:6,r:16},
  squidward:{speed:2.4,hp:320,dmg:33,bs:11.5,fr:36,bColor:'#ccff44',bR:4,r:14},
  sandy:    {speed:3.3,hp:280,dmg:22,bs:10.0,fr:28,bColor:'#ffcc00',bR:4,r:14},
  gary:     {speed:1.3,hp:600,dmg:28,bs:6.0,fr:44,bColor:'#88ffaa',bR:5,r:15},
};

let selChar='spongebob',gRunning=false,paused=false,frameN=0;
let scoreB=0,scoreR=0,gTime=90;
let players=[],bullets=[],effects=[],blocks=[],bubbles=[];
let keys={};
let soundEnabled=true,musicEnabled=true;
let tiles=[],MC=0,MR=0,OX=0,OY=0;
const T=38,WALL=1,BUSH=2;

document.querySelectorAll('.cc').forEach(c=>{
  c.addEventListener('click',function(){document.querySelectorAll('.cc').forEach(x=>x.classList.remove('sel'));this.classList.add('sel');selChar=this.id.replace('cc-','');});
});
document.getElementById('sbtn').addEventListener('click',startGame);

function buildMap(){
  MC=Math.max(15,Math.floor((W-20)/T));MR=Math.max(10,Math.floor((H-60)/T));
  OX=Math.floor((W-MC*T)/2);OY=50;tiles=[];blocks=[];bubbles=[];
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
  for(let i=0;i<20;i++)bubbles.push({x:OX+Math.random()*(MC*T),y:OY+Math.random()*(MR*T),r:2+Math.random()*5,spd:.2+Math.random()*.4,phase:Math.random()*Math.PI*2});
}
function tileAt(px,py){const c=~~((px-OX)/T),r=~~((py-OY)/T);if(c<0||c>=MC||r<0||r>=MR)return WALL;return tiles[r][c];}
const isWall=(px,py)=>tileAt(px,py)===WALL;

function mkPlayer(ck,team,col,row){
  const d=CHARS[ck];
  return{char:ck,team,x:OX+col*T+T/2,y:OY+row*T+T/2,hp:d.hp,mhp:d.hp,alive:true,respawnAt:0,
    speed:d.speed,dmg:d.dmg,bs:d.bs,r:d.r,fr:d.fr,ls:0,
    facing:team==='blue'?1:-1,aimDx:team==='blue'?1:-1,aimDy:0,sc:col,sr:row};
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
  startMusic();
  requestAnimationFrame(loop);
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
  // se ligar e a música não estiver rodando, inicia
  if(musicEnabled&&gRunning&&audioCtx&&!audioCtx._musicStarted)startMusic();
  document.getElementById('btnMusic').textContent=musicEnabled?'🎵 Música: Ligada':'🎵 Música: Desligada';
}
function updateAudioBtns(){
  document.getElementById('btnSound').textContent=soundEnabled?'🔊 Som: Ligado':'🔇 Som: Desligado';
  document.getElementById('btnMusic').textContent=musicEnabled?'🎵 Música: Ligada':'🎵 Música: Desligada';
}

function moveP(p,dx,dy){
  if(!p.alive)return;
  const nx=p.x+dx*p.speed,ny=p.y+dy*p.speed,rr=p.r-3;
  if(!isWall(nx+rr,p.y)&&!isWall(nx-rr,p.y))p.x=nx;
  if(!isWall(p.x,ny+rr)&&!isWall(p.x,ny-rr))p.y=ny;
  if(dx!==0)p.facing=dx>0?1:-1;
  if(dx!==0||dy!==0){const l=Math.hypot(dx,dy);p.aimDx=dx/l;p.aimDy=dy/l;}
}
function shootP(s){
  if(!s.alive||frameN-s.ls<s.fr)return;
  s.ls=frameN;
  let dx=s.aimDx,dy=s.aimDy;
  if(s!==players[0]){
    const enemies=players.filter(p=>p.team!==s.team&&p.alive);
    if(!enemies.length)return;
    let t;
    if(s.team==='red'&&players[0].alive){
      t=players[0];
    }else{
      t=enemies.reduce((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)<Math.hypot(b.x-s.x,b.y-s.y)?a:b);
    }
    const dist=Math.hypot(t.x-s.x,t.y-s.y);
    if(dist>300)return;
    dx=(t.x-s.x)/dist;dy=(t.y-s.y)/dist;
  }else{playShoot(s.char);}
  const d=CHARS[s.char];
  bullets.push({x:s.x,y:s.y,dx:dx*s.bs,dy:dy*s.bs,team:s.team,dmg:s.dmg,color:d.bColor,r:d.bR,life:110,char:s.char});
}
function aiStep(p){
  if(!p.alive)return;
  const enemies=players.filter(e=>e.team!==p.team&&e.alive);
  if(!enemies.length)return;
  let t;
  if(p.team==='red'&&players[0].alive){
    // bots vermelhos perseguem sempre o jogador enquanto ele estiver vivo
    t=players[0];
  }else{
    // bots azuis (aliados) e bots vermelhos quando jogador está morto
    // atacam o inimigo mais próximo deles
    t=enemies.reduce((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)<Math.hypot(b.x-p.x,b.y-p.y)?a:b);
  }
  const dist=Math.hypot(t.x-p.x,t.y-p.y);
  const ang=Math.atan2(t.y-p.y,t.x-p.x);
  const mv=dist>120?1:dist<75?-1:0;
  moveP(p,Math.cos(ang)*mv+(Math.random()-.5)*.15,Math.sin(ang)*mv+(Math.random()-.5)*.15);
  p.facing=t.x>p.x?1:-1;
  p.aimDx=(t.x-p.x)/dist;p.aimDy=(t.y-p.y)/dist;
  shootP(p);
}
function hitBlock(bx,by){
  const c=~~((bx-OX)/T),r=~~((by-OY)/T);
  const blk=blocks.find(b=>b.r===r&&b.c===c);
  if(blk){blk.hp--;spawnChips(OX+c*T+T/2,OY+r*T+T/2);if(blk.hp<=0){tiles[r][c]=0;blocks.splice(blocks.indexOf(blk),1);spawnChips(OX+c*T+T/2,OY+r*T+T/2,true);}return true;}
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
    p.hp=CHARS[p.char].hp;p.alive=true;p.x=OX+p.sc*T+T/2;p.y=OY+p.sr*T+T/2;p.respawnAt=0;spawnBoom(p.x,p.y,'spawn');
  }
}

function drawMap(){
  const bgGrd=ctx.createLinearGradient(0,OY,0,OY+MR*T);
  bgGrd.addColorStop(0,'#051828');bgGrd.addColorStop(.5,'#071e35');bgGrd.addColorStop(1,'#040e1c');
  ctx.fillStyle=bgGrd;ctx.fillRect(0,0,W,H);
  ctx.save();ctx.globalAlpha=0.04;
  for(let i=0;i<5;i++){
    const lx=OX+(MC*T*(.15+i*.18));
    ctx.fillStyle='#aaddff';ctx.beginPath();
    ctx.moveTo(lx-20,OY);ctx.lineTo(lx+20,OY);ctx.lineTo(lx+60+i*10,OY+MR*T);ctx.lineTo(lx-60-i*10,OY+MR*T);ctx.closePath();ctx.fill();
  }
  ctx.restore();
  ctx.save();ctx.globalAlpha=0.3;
  for(const b of bubbles){
    b.y-=b.spd;if(b.y<OY)b.y=OY+MR*T;
    const bx=b.x+Math.sin(frameN*.02+b.phase)*3;
    ctx.strokeStyle='rgba(150,220,255,0.6)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(bx,b.y,b.r,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='rgba(200,240,255,0.15)';ctx.beginPath();ctx.arc(bx,b.y,b.r,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
  for(let r=0;r<MR;r++)for(let c=0;c<MC;c++){
    const x=OX+c*T,y=OY+r*T,t=tiles[r][c];
    if(t===WALL){
      const blk=blocks.find(b=>b.r===r&&b.c===c);
      if(blk){
        const pct=blk.hp/blk.maxHp;
        const topCol=pct>.66?'#3a7ac0':pct>.33?'#8a4520':'#5a2010';
        const midCol=pct>.66?'#2a5a9a':pct>.33?'#6a3418':'#4a1808';
        const grd=ctx.createLinearGradient(x,y,x+T,y+T);
        grd.addColorStop(0,topCol);grd.addColorStop(1,midCol);
        ctx.fillStyle=grd;ctx.fillRect(x,y,T,T);
        ctx.fillStyle=pct>.66?'#4a8ad0':pct>.33?'#9a5530':'#6a3020';ctx.fillRect(x+2,y+2,T-4,T-6);
        ctx.fillStyle='rgba(255,255,255,0.12)';ctx.fillRect(x+2,y+2,T-4,4);
        ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(x+2,y+T-6,T-4,4);
        if(blk.hp<3){ctx.strokeStyle='rgba(0,0,0,0.5)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+5,y+5);ctx.lineTo(x+16,y+20);ctx.moveTo(x+10,y+4);ctx.lineTo(x+6,y+14);ctx.stroke();}
        if(blk.hp<2){ctx.strokeStyle='rgba(0,0,0,0.6)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+T-5,y+5);ctx.lineTo(x+5,y+T-5);ctx.moveTo(x+T-8,y+8);ctx.lineTo(x+8,y+T-10);ctx.stroke();}
        ctx.fillStyle='rgba(255,255,255,0.55)';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(blk.hp,x+T/2,y+T/2);
      }else{
        const wgrd=ctx.createLinearGradient(x,y,x+T,y+T);
        wgrd.addColorStop(0,'#1a3a6a');wgrd.addColorStop(.4,'#0d2448');wgrd.addColorStop(1,'#081830');
        ctx.fillStyle=wgrd;ctx.fillRect(x,y,T,T);
        ctx.fillStyle='#2a4a8a';ctx.fillRect(x+2,y+2,T-4,T-6);
        ctx.fillStyle='rgba(100,160,255,0.15)';ctx.fillRect(x+2,y+2,T-4,4);
        ctx.fillStyle='rgba(0,0,0,0.35)';ctx.fillRect(x+2,y+T-6,T-4,4);
        ctx.fillStyle='rgba(255,255,255,0.04)';
        [[x+5,y+6,3],[x+T-7,y+9,2],[x+8,y+T-8,2.5],[x+T-5,y+T-6,3]].forEach(([lx,ly,lr])=>{ctx.beginPath();ctx.arc(lx,ly,lr,0,Math.PI*2);ctx.fill();});
      }
    }else if(t===BUSH){
      const bgrd=ctx.createLinearGradient(x,y,x+T,y+T);
      bgrd.addColorStop(0,'#0a3520');bgrd.addColorStop(1,'#051810');
      ctx.fillStyle=bgrd;ctx.fillRect(x,y,T,T);
      ctx.fillStyle='#0e4828';ctx.fillRect(x+1,y+1,T-2,T-2);
      const coralColors=['#1a8a40','#20a048','#158838','#12703a'];
      [[x+4,y+T-5,5],[x+T/2,y+T-7,6],[x+T-5,y+T-5,5],[x+6,y+T-11,4],[x+T-7,y+T-10,4]].forEach(([lx,ly,lr],i)=>{
        ctx.fillStyle=coralColors[i%4];ctx.beginPath();ctx.arc(lx,ly,lr,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.2)';ctx.beginPath();ctx.arc(lx-lr*.3,ly-lr*.3,lr*.4,0,Math.PI*2);ctx.fill();
      });
      ctx.strokeStyle='#1a6830';ctx.lineWidth=2;
      for(let al=0;al<3;al++){
        const ax=x+5+al*12,wv=Math.sin(frameN*.04+al*2)*3;
        ctx.beginPath();ctx.moveTo(ax,y+T-2);ctx.quadraticCurveTo(ax+wv,y+T/2,ax-wv,y+4);ctx.stroke();
      }
    }else{
      const isDark=(r+c)%2===0;ctx.fillStyle=isDark?'#0c1e38':'#0a1a30';ctx.fillRect(x,y,T,T);
    }
    ctx.strokeStyle='rgba(0,0,0,0.2)';ctx.lineWidth=.5;ctx.strokeRect(x,y,T,T);
  }
  const cx=OX+Math.floor(MC/2)*T;
  ctx.strokeStyle='rgba(245,197,24,0.15)';ctx.lineWidth=1;ctx.setLineDash([6,8]);
  ctx.beginPath();ctx.moveTo(cx,OY);ctx.lineTo(cx,OY+MR*T);ctx.stroke();ctx.setLineDash([]);
}

function drawAimArrow(p){
  if(!p.alive||p!==players[0])return;
  const len=p.r+16,ex=p.x+p.aimDx*len,ey=p.y+p.aimDy*len;
  ctx.save();ctx.strokeStyle='rgba(255,255,80,0.6)';ctx.lineWidth=2;ctx.lineCap='round';ctx.setLineDash([3,4]);
  ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(ex,ey);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='rgba(255,255,80,0.85)';ctx.beginPath();ctx.arc(ex,ey,3.5,0,Math.PI*2);ctx.fill();ctx.restore();
}

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
  const inBush=tileAt(p.x,p.y)===BUSH;
  const isMe=p===players[0];
  const isAlly=p.team==='blue'&&!isMe;
  // todos ficam semi-transparentes na alga; inimigos ficam mais invisíveis que aliados/jogador
  const bushAlpha=isMe?0.45:isAlly?0.4:0.18;
  if(inBush)ctx.globalAlpha=bushAlpha;
  ctx.save();ctx.globalAlpha=inBush?(bushAlpha*.3):.2;
  ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(p.x+3,p.y+p.r+2,p.r*.85,4,0,0,Math.PI*2);ctx.fill();ctx.restore();
  if(inBush)ctx.globalAlpha=bushAlpha;
  ctx.save();
  ctx.shadowColor=p.team==='blue'?'rgba(41,182,246,0.5)':'rgba(239,83,80,0.5)';ctx.shadowBlur=16;
  const spr=SPRITES[p.char];if(spr)spr(ctx,p.x,p.y,p.facing,p.team);
  ctx.restore();
  if(inBush)ctx.globalAlpha=bushAlpha;
  const bw=p.r*3,bh=6,bx=p.x-bw/2,by=p.y-p.r-28;
  ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(bx-1,by-1,bw+2,bh+3);
  ctx.fillStyle='#1a1a1a';ctx.fillRect(bx,by,bw,bh);
  const pct=p.hp/p.mhp;
  const hgrd=ctx.createLinearGradient(bx,by,bx,by+bh);
  const tc=pct>.6?['#66ee66','#33aa33']:pct>.3?['#ffcc44','#cc8800']:['#ff5544','#cc2222'];
  hgrd.addColorStop(0,tc[0]);hgrd.addColorStop(1,tc[1]);
  ctx.fillStyle=hgrd;ctx.fillRect(bx,by,bw*pct,bh);
  ctx.fillStyle='rgba(255,255,255,0.25)';ctx.fillRect(bx,by,bw*pct,bh*.4);
  ctx.strokeStyle='rgba(0,0,0,0.5)';ctx.lineWidth=.5;ctx.strokeRect(bx,by,bw,bh);
  ctx.globalAlpha=1;
  drawAimArrow(p);
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

function loop(){
  if(!gRunning||paused)return;
  frameN++;ctx.clearRect(0,0,W,H);drawMap();
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
  for(const p of players)drawPlayer(p);
  for(const b of bullets){
    ctx.save();ctx.shadowColor=b.color;ctx.shadowBlur=10;
    ctx.globalAlpha=0.3;ctx.fillStyle=b.color;
    ctx.beginPath();ctx.ellipse(b.x-b.dx*1.5,b.y-b.dy*1.5,b.r*1.2,b.r*.7,Math.atan2(b.dy,b.dx),0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
    ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.85)';ctx.beginPath();ctx.arc(b.x-b.r*.3,b.y-b.r*.3,b.r*.38,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  for(const e of effects){
    ctx.globalAlpha=e.life/45;ctx.fillStyle=e.col;ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  }
  drawHUD();checkEnd();
  if(gRunning&&!paused)requestAnimationFrame(loop);
}

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
