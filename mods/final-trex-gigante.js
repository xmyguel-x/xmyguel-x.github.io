// ===== FINAL: T-REX GIGANTE =====
// Aos 10.000 pontos surge um T-Rex gigante cuspindo fogo. Desvie das bolas de fogo
// (pule as que vêm rente ao chão, abaixe nas que vêm na altura da cabeça).
// Se sobreviver, um meteoro cai sobre ele, tudo para e aparece "CONTINUE IN CHROME".
// Enter reinicia o jogo.

const BOSS_SCORE = 10000;            // pontuação em que o chefe aparece
const S = 2.4;                     // tamanho do chefe (1 = dino normal)
const FW = 44, FH = 47;            // tamanho de um quadro do T-Rex no sprite
const W = 600, H = 150, GROUND = 140;
const BW = FW * S, BH = FH * S;
const BX = W - BW - 8;             // posição final do chefe (canto direito)
const BY = GROUND - BH;
const MX = BX + 7, MY = BY + 12 * S;   // boca do chefe (ele olha para a esquerda)
const PLAN = ["low", "high", "low", "high", "low", "double", "high", "low", "double", "high"];
const LOW_Y = 126, HIGH_Y = 101;   // altura em que a bola de fogo passa pelo dino
const CHARGE = 420;                // tempo que o chefe "carrega" o bafo (ms)
const TOP_ANGLE = 1.02;            // quanto o chefe tomba depois do meteoro (rad)
const METEOR_MS = 1900;
const FIRE = ["#fff3b0", "#ffc933", "#ff8c1a", "#e8420f", "#b81d0a"];

const sheet = new Image();
sheet.src = "./dino/sprite-1x.png";
const bc = document.createElement("canvas");
bc.width = FW; bc.height = FH;
const bx = bc.getContext("2d");

let phase, clock, pt, fightT, planIdx, nextAt, charging, pending, fires, parts;
let shake, flash, ring, bossX, tint, ang, cardA, lastStep, meteor, ac;

function reset(runner) {
  phase = "idle"; clock = 0; pt = 0; fightT = 0; planIdx = 0; nextAt = 0; charging = -1;
  pending = []; fires = []; parts = []; shake = 0; flash = 0; ring = null;
  bossX = W + 20; tint = 0; ang = 0; cardA = 0; lastStep = -1; meteor = null;
  if (runner && runner.canvas) runner.canvas.style.transform = "";
}
reset(null);

// ---------- som (sintetizado, sem arquivos) ----------
function audio() {
  try {
    if (!ac) { const A = window.AudioContext || window.webkitAudioContext; if (A) ac = new A(); }
    if (ac && ac.state === "suspended") ac.resume();
  } catch (e) {}
  return ac;
}
function tone(f0, f1, dur, type, vol) {
  const a = audio(); if (!a) return;
  try {
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = type || "square";
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(vol || 0.08, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination);
    o.start(); o.stop(t + dur + 0.02);
  } catch (e) {}
}
function noise(dur, vol, cutoff) {
  const a = audio(); if (!a) return;
  try {
    const n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    s.buffer = b; f.type = "lowpass"; f.frequency.value = cutoff || 900; g.gain.value = vol || 0.2;
    s.connect(f); f.connect(g); g.connect(a.destination); s.start();
  } catch (e) {}
}

// ---------- partículas ----------
function emit(x, y, vx, vy, life, s, c, g) {
  if (parts.length < 450) parts.push({ x: x, y: y, vx: vx, vy: vy, life: life, max: life, s: s, c: c, g: g || 0 });
}
function stepParts(dt) {
  for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.life -= dt; }
  parts = parts.filter(p => p.life > 0);
}
function drawParts(ctx) {
  for (const p of parts) {
    const a = Math.max(0, p.life / p.max), s = p.s * (0.45 + 0.55 * a);
    ctx.globalAlpha = a; ctx.fillStyle = p.c;
    ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
  }
  ctx.globalAlpha = 1;
}
function rnd(a, b) { return a + Math.random() * (b - a); }
function fireCol() { return FIRE[(Math.random() * FIRE.length) | 0]; }

function boom(x, y) {
  for (let i = 0; i < 80; i++) {
    const a = Math.random() * 6.2832, v = rnd(0.05, 0.5);
    emit(x, y, Math.cos(a) * v, Math.sin(a) * v - 0.05, rnd(500, 1200), rnd(3, 8), fireCol(), 0.0004);
  }
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * 6.2832, v = rnd(0.02, 0.18);
    emit(x, y, Math.cos(a) * v, Math.sin(a) * v - 0.08, rnd(900, 1700), rnd(7, 14), Math.random() < 0.5 ? "#555" : "#777", -0.00005);
  }
  ring = { x: x, y: y, t: 0 };
}

// ---------- bolas de fogo ----------
function launch(targetY, speed) {
  const travel = (MX - 65) / speed;
  fires.push({ x: MX, y: MY, vx: -speed, vy: (targetY - MY) / travel, r: 11, seed: Math.random() * 6 });
  for (let i = 0; i < 18; i++) {
    emit(MX, MY, -rnd(0.08, 0.3), rnd(-0.1, 0.1), rnd(250, 500), rnd(4, 9), fireCol());
  }
  noise(0.45, 0.22, 1400);
  tone(260, 90, 0.35, "sawtooth", 0.05);
}
function hitsPlayer(t, f) {
  let l, r, tp, b;
  if (t.ducking && !t.jumping) { l = t.x + 6; r = t.x + 52; tp = GROUND - 22; b = GROUND - 2; }
  else { l = t.x + 10; r = t.x + 36; tp = t.y + 6; b = t.y + 44; }
  const cx = Math.max(l, Math.min(f.x, r)), cy = Math.max(tp, Math.min(f.y, b));
  const dx = f.x - cx, dy = f.y - cy;
  return dx * dx + dy * dy < f.r * f.r;
}
function drawFire(ctx, f) {
  const fl = 0.85 + 0.15 * Math.sin(clock / 40 + f.seed);
  ctx.save();
  const g = ctx.createRadialGradient(f.x, f.y, 1, f.x, f.y, f.r * 2.4);
  g.addColorStop(0, "rgba(255,245,170,0.95)");
  g.addColorStop(0.35, "rgba(255,140,20,0.75)");
  g.addColorStop(1, "rgba(200,30,0,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 2.4 * fl, 0, 6.2832); ctx.fill();
  ctx.fillStyle = "#ffc933"; ctx.fillRect(f.x - 7, f.y - 7, 14, 14);
  ctx.fillStyle = "#ffe07a"; ctx.fillRect(f.x - 5, f.y - 5, 10, 10);
  ctx.fillStyle = "#fff7c9"; ctx.fillRect(f.x - 3, f.y - 3, 6, 6);
  ctx.restore();
}

// ---------- chefe ----------
function drawBoss(ctx, sx, bob) {
  if (!(sheet.complete && sheet.naturalWidth)) return;
  bx.globalCompositeOperation = "source-over";
  bx.clearRect(0, 0, FW, FH);
  bx.drawImage(sheet, sx, 2, FW, FH, 0, 0, FW, FH);
  if (tint > 0) {
    bx.globalCompositeOperation = "source-atop";
    bx.fillStyle = "rgba(35,12,0," + (0.72 * tint) + ")"; bx.fillRect(0, 0, FW, FH);
    bx.fillStyle = "rgba(255,90,0," + ((0.12 + 0.12 * Math.sin(clock / 70)) * tint) + ")"; bx.fillRect(0, 0, FW, FH);
    bx.globalCompositeOperation = "source-over";
  }
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(bossX + BW * 0.55, GROUND - (bob || 0));   // pivô sob o corpo
  if (ang) ctx.rotate(-ang);
  ctx.translate(-BW * 0.55, -BH);                          // canto superior esquerdo
  ctx.translate(BW, 0); ctx.scale(-1, 1);                  // espelha: olha para a esquerda
  ctx.drawImage(bc, 0, 0, FW, FH, 0, 0, BW, BH);
  ctx.restore();
}
function banner(ctx, text, color) {
  if (Math.floor(clock / 200) % 2 !== 0) return;
  ctx.save();
  ctx.font = 'bold 14px "Silkscreen", "Courier New", monospace';
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillText(text, W / 2 + 1, 25);
  ctx.fillStyle = color; ctx.fillText(text, W / 2, 24);
  ctx.restore();
}

// ---------- meteoro ----------
function meteorPos(p) {
  const e = Math.pow(p, 1.35), s = meteor.s, t = meteor.t;
  return { x: s.x + (t.x - s.x) * e, y: s.y + (t.y - s.y) * e };
}
function drawMeteor(ctx, m, p) {
  const r = 10 + 6 * p;
  ctx.save();
  const gl = ctx.createRadialGradient(m.x, m.y, 2, m.x, m.y, r * 2.8);
  gl.addColorStop(0, "rgba(255,200,90,0.85)"); gl.addColorStop(0.5, "rgba(255,90,20,0.45)"); gl.addColorStop(1, "rgba(200,30,0,0)");
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(m.x, m.y, r * 2.8, 0, 6.2832); ctx.fill();
  const rock = ctx.createRadialGradient(m.x + r * 0.3, m.y + r * 0.3, 1, m.x, m.y, r);
  rock.addColorStop(0, "#ffd7a1"); rock.addColorStop(0.35, "#b9540f"); rock.addColorStop(1, "#3a1404");
  ctx.fillStyle = rock; ctx.beginPath(); ctx.arc(m.x, m.y, r, 0, 6.2832); ctx.fill();
  ctx.fillStyle = "rgba(40,12,2,0.8)";
  ctx.fillRect(m.x - r * 0.5, m.y - r * 0.3, 4, 4); ctx.fillRect(m.x + r * 0.1, m.y + r * 0.35, 5, 3); ctx.fillRect(m.x - r * 0.1, m.y - r * 0.7, 3, 3);
  ctx.restore();
}

// ---------- cartela final ----------
function chromeLogo(ctx, cx, cy, r) {
  const T = Math.PI / 180;
  const seg = (c, a0, a1) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0 * T, a1 * T); ctx.closePath(); ctx.fill(); };
  seg("#ea4335", 210, 330); seg("#fbbc04", 330, 450); seg("#34a853", 90, 210);
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx, cy, r * 0.52, 0, 6.2832); ctx.fill();
  ctx.fillStyle = "#4285f4"; ctx.beginPath(); ctx.arc(cx, cy, r * 0.4, 0, 6.2832); ctx.fill();
}
function drawCard(ctx, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = "#0b0b10"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
  chromeLogo(ctx, 110, 64, 26);
  ctx.fillStyle = "#fff";
  ctx.font = 'bold 26px "Silkscreen", "Courier New", monospace';
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText("CONTINUE IN CHROME", 150, 64);
  ctx.fillStyle = "#8a8f9c";
  ctx.font = '11px "IBM Plex Mono", "Courier New", monospace';
  ctx.fillText("Enter para jogar de novo", 152, 98);
  ctx.restore();
}

function drawCardN(ctx, a, night) {
  ctx.save();
  if (night) ctx.filter = "invert(1)";
  drawCard(ctx, a);
  ctx.restore();
}

function setPhase(p) { phase = p; pt = 0; dino.log("fase: " + p); }

// ---------- laço principal ----------
dino.on("init", ({ runner }) => reset(runner));
dino.on("restart", ({ runner }) => reset(runner));
dino.on("gameOver", ({ runner }) => { if (runner && runner.canvas) runner.canvas.style.transform = ""; });

dino.on("frame", ({ ctx, game, runner, deltaTime }) => {
  if (phase === "dead" || phase === "final") return;
  const dt = Math.min(deltaTime || 16.7, 50);

  if (phase === "idle") {
    if (game.score < BOSS_SCORE) return;
    setPhase("intro");
    tone(70, 35, 1.2, "sawtooth", 0.12); noise(0.9, 0.25, 300);
  }
  clock += dt; pt += dt;

  // durante o final só o fogo (e o meteoro) ameaçam: some com cactos e pterodáctilos
  let n = 0;
  while (game.obstacles.length && n++ < 8) game.removeFirstObstacle();
  if (phase === "intro" || phase === "fight" || phase === "calm" || phase === "meteor") {
    if (game.speed > 8) game.setSpeed(8);
  } else if (phase === "impact") {
    game.setSpeed(Math.max(0, game.speed - dt * 0.012));
  } else {
    game.setSpeed(0);
  }

  let bossFrame = 848, bob = 0;

  if (phase === "intro") {
    const p = Math.min(pt / 2400, 1);
    bossX = (W + 20) + (BX - (W + 20)) * (1 - Math.pow(1 - p, 3));
    const step = Math.floor(pt / 200);
    bossFrame = step % 2 ? 936 : 980;
    bob = p < 1 ? (step % 2 ? 3 : 0) : 0;
    if (step !== lastStep) { lastStep = step; if (p < 1) { shake = Math.max(shake, 2.5); noise(0.12, 0.18, 220); } }
    if (p >= 1) { bossX = BX; setPhase("fight"); nextAt = 700; shake = 6; tone(110, 55, 0.8, "sawtooth", 0.12); noise(0.6, 0.25, 500); }
  } else if (phase === "fight") {
    fightT += dt;
    if (charging < 0 && planIdx < PLAN.length && fightT >= nextAt) {
      charging = 0; tone(300, 120, CHARGE / 1000, "sawtooth", 0.05);
    }
    if (charging >= 0) {
      charging += dt;
      shake = Math.max(shake, 1);
      const k = Math.min(charging / CHARGE, 1);
      for (let i = 0; i < 2; i++) emit(MX - rnd(0, 14), MY + rnd(-6, 6), rnd(0.01, 0.05), rnd(-0.03, 0.03), rnd(150, 300), rnd(3, 6), fireCol());
      if (charging >= CHARGE) {
        const kind = PLAN[planIdx], sp = 0.36 + planIdx * 0.007;
        if (kind === "low") launch(LOW_Y, sp);
        else if (kind === "high") launch(HIGH_Y, sp);
        else { launch(LOW_Y, sp); pending.push({ at: fightT + 300, y: HIGH_Y, sp: sp }); }
        planIdx++; charging = -1;
        nextAt = fightT + Math.max(1150, 1750 - planIdx * 55);
      }
    }
    for (const q of pending) if (fightT >= q.at) { launch(q.y, q.sp); q.done = true; }
    pending = pending.filter(q => !q.done);
    if (planIdx >= PLAN.length && charging < 0 && pending.length === 0 && fires.length === 0) setPhase("calm");
  } else if (phase === "calm") {
    if (pt > 900) {
      meteor = { s: { x: BX - 190, y: -60 }, t: { x: BX + 34, y: BY + 20 } };
      setPhase("meteor");
      tone(1300, 160, METEOR_MS / 1000, "sawtooth", 0.05);
    }
  } else if (phase === "meteor") {
    const p = Math.min(pt / METEOR_MS, 1), m = meteorPos(p);
    for (let i = 0; i < 3; i++) {
      emit(m.x + rnd(-4, 4), m.y + rnd(-4, 4), -(meteor.t.x - meteor.s.x) / METEOR_MS * rnd(0.1, 0.4) + rnd(-0.02, 0.02),
        -(meteor.t.y - meteor.s.y) / METEOR_MS * rnd(0.1, 0.4) + rnd(-0.02, 0.02), rnd(250, 600), rnd(3, 8), fireCol());
    }
    if (p >= 1) {
      boom(meteor.t.x, meteor.t.y);
      flash = 1; shake = 14; tint = 0.01;
      tone(90, 25, 1.3, "sawtooth", 0.2); noise(1.3, 0.45, 700);
      setPhase("impact");
    }
  } else if (phase === "impact") {
    bossFrame = 1068;                       // olho de "X": o chefe parou
    tint = Math.min(1, pt / 600);
    if (Math.random() < 0.5) emit(bossX + rnd(10, 90), BY + rnd(5, 45), rnd(-0.02, 0.02), -rnd(0.03, 0.08), rnd(600, 1100), rnd(5, 9), Math.random() < 0.6 ? "#555" : fireCol());
    if (pt > 1100) setPhase("topple");
  } else if (phase === "topple") {
    bossFrame = 1068; tint = 1;
    const p = Math.min(pt / 1300, 1);
    ang = TOP_ANGLE * p * p;
    if (p >= 1) {
      shake = 8; noise(0.6, 0.4, 300); tone(60, 30, 0.45, "sine", 0.3);
      for (let i = 0; i < 24; i++) emit(bossX - 20 + rnd(-20, 40), GROUND - 4, rnd(-0.2, 0.2), -rnd(0.02, 0.12), rnd(500, 900), rnd(6, 12), "#8a7f72", 0.0002);
      setPhase("lie");
    }
  } else if (phase === "lie") {
    bossFrame = 1068; tint = 1; ang = TOP_ANGLE;
    if (Math.random() < 0.4) emit(bossX - 10 + rnd(0, 110), GROUND - rnd(10, 50), rnd(-0.01, 0.01), -rnd(0.02, 0.06), rnd(600, 1000), rnd(4, 8), Math.random() < 0.5 ? "#555" : fireCol());
    if (pt > 900) setPhase("card");
  } else if (phase === "card") {
    bossFrame = 1068; tint = 1; ang = TOP_ANGLE;
    cardA = Math.min(1, pt / 900);
  }

  // bolas de fogo: movimento, rastro e colisão com o dino
  if (phase === "fight") {
    const t = game.trex;
    for (const f of fires) {
      f.x += f.vx * dt; f.y += f.vy * dt;
      for (let i = 0; i < 2; i++) emit(f.x + rnd(4, 12), f.y + rnd(-6, 6), rnd(0.02, 0.06), -rnd(0.02, 0.07), rnd(260, 460), rnd(4, 8), fireCol());
      if (game.playing && !game.crashed && hitsPlayer(t, f)) {
        phase = "dead"; dino.log("fase: dead (queimado)");
        if (runner.canvas) runner.canvas.style.transform = "";
        runner.gameOver();
        return;
      }
    }
    fires = fires.filter(f => f.x > -30 && f.y < H + 20);
  }

  // efeitos globais
  stepParts(dt);
  shake = Math.max(0, shake - dt * 0.01);
  flash = Math.max(0, flash - dt / 650);
  if (ring) { ring.t += dt; if (ring.t > 520) ring = null; }
  const cv = runner.canvas;
  if (cv) {
    if (shake > 0.2) cv.style.transform = "translate(" + ((Math.random() * 2 - 1) * shake).toFixed(1) + "px," + ((Math.random() * 2 - 1) * shake).toFixed(1) + "px)";
    else if (cv.style.transform) cv.style.transform = "";
  }

  // desenho (por cima do jogo). No modo noite o jogo inverte as cores com CSS:
  // o chefe fica como o dino (inverte junto); fogo, meteoro e cartela se compensam.
  const night = !!runner.inverted;
  drawBoss(ctx, bossFrame, bob);
  ctx.save();
  if (night) ctx.filter = "invert(1)";
  if (phase === "fight" && charging >= 0) {
    const k = Math.min(charging / CHARGE, 1), r = 4 + 12 * k;
    ctx.save(); ctx.globalAlpha = 0.5 + 0.4 * k;
    const g = ctx.createRadialGradient(MX, MY, 1, MX, MY, r * 1.8);
    g.addColorStop(0, "rgba(255,240,160,1)"); g.addColorStop(0.5, "rgba(255,120,20,0.7)"); g.addColorStop(1, "rgba(200,30,0,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(MX, MY, r * 1.8, 0, 6.2832); ctx.fill(); ctx.restore();
  }
  if (phase === "meteor") drawMeteor(ctx, meteorPos(Math.min(pt / METEOR_MS, 1)), Math.min(pt / METEOR_MS, 1));
  for (const f of fires) drawFire(ctx, f);
  drawParts(ctx);
  if (ring) {
    const k = ring.t / 520;
    ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = "#fff3b0"; ctx.lineWidth = 5 * (1 - k) + 1;
    ctx.beginPath(); ctx.arc(ring.x, ring.y, 10 + 150 * k, 0, 6.2832); ctx.stroke(); ctx.restore();
  }
  if (flash > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, flash); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  if (phase === "intro" && pt < 2400) banner(ctx, "!! T-REX GIGANTE !!", "#ff3b1f");
  if (phase === "meteor" && pt < 1300) banner(ctx, "!! METEORO !!", "#ff9a1f");
  ctx.restore();
  if (phase === "card") {
    drawCardN(ctx, cardA, night);
    if (cardA >= 1) {
      phase = "final"; dino.log("fase: final");
      if (cv) cv.style.transform = "";
      runner.gameOver();                    // deixa o jogo no estado "terminou": Enter reinicia
      drawCardN(ctx, 1, !!runner.inverted); // e cobre o painel padrão com a cartela
    }
  }
});
