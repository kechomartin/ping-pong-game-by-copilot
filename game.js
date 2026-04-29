const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

// ── State ──────────────────────────────────────────────
let gameRunning = false;
let vsAI = false;
let aiDifficulty = 'medium';
let scoreLimit = 7;
let animId = null;
let particles = [];
let screenFlash = 0;
let flashColor = '#fff';
let rallyCount = 0;
let bestRally = 0;
let paused = false;

const W = canvas.width, H = canvas.height;
const PW = 12, PH = 90, BR = 10;

const P1_COLOR = '#00ffe1';
const P2_COLOR = '#ff4d6d';
const BALL_COLOR = '#ffffff';
const NET_COLOR = 'rgba(255,255,255,0.08)';

// ── Audio (Web Audio API) ───────────────────────────────
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep(freq, dur, type='square', vol=0.15) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.8, audioCtx.currentTime + dur);
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  osc.start(); osc.stop(audioCtx.currentTime + dur);
}

function soundHit() { playBeep(480 + Math.random()*80, 0.06, 'square', 0.2); }
function soundWall() { playBeep(280, 0.05, 'sine', 0.15); }
function soundScore() { playBeep(200, 0.3, 'sawtooth', 0.25); setTimeout(()=>playBeep(150,0.3,'sawtooth',0.2),200); }
function soundWin() {
  [523, 659, 784, 1047].forEach((f,i) => setTimeout(()=>playBeep(f,0.3,'square',0.2),i*150));
}

// ── Game Objects ────────────────────────────────────────
function makePlayer(x, color) {
  return { x, y: H/2 - PH/2, width: PW, height: PH, color, dy: 0, speed: 6, score: 0 };
}

let player1, player2, ball;

function initObjects() {
  player1 = makePlayer(10, P1_COLOR);
  player2 = makePlayer(W - PW - 10, P2_COLOR);
  ball = {
    x: W/2, y: H/2, radius: BR,
    speed: 6, dx: 0, dy: 0
  };
}

function resetBall(direction) {
  ball.x = W/2; ball.y = H/2;
  ball.speed = 6;
  const dir = direction ?? (Math.random() > 0.5 ? 1 : -1);
  const angle = (Math.random() * 0.6 - 0.3);
  ball.dx = dir * ball.speed * Math.cos(angle);
  ball.dy = ball.speed * Math.sin(angle);
  rallyCount = 0;
}

// ── Particles ───────────────────────────────────────────
function spawnParticles(x, y, color, count=12) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 4;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.03 + Math.random() * 0.04,
      size: 2 + Math.random() * 4,
      color
    });
  }
}

function updateParticles() {
  particles = particles.filter(p => p.life > 0.01);
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.95; p.vy *= 0.95;
    p.vy += 0.1;
    p.life -= p.decay;
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    const r = Math.max(0, p.size * p.life);
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── AI ──────────────────────────────────────────────────
const AI_SETTINGS = {
  easy:   { react: 0.03, err: 60, speed: 4.5 },
  medium: { react: 0.06, err: 30, speed: 5.5 },
  hard:   { react: 0.09, err: 12, speed: 6.5 },
  insane: { react: 0.14, err: 3,  speed: 8.0 }
};

function updateAI() {
  const s = AI_SETTINGS[aiDifficulty];
  player2.speed = s.speed;
  const target = ball.y + (Math.random() - 0.5) * s.err;
  const center = player2.y + PH / 2;
  const diff = target - center;
  if (Math.abs(diff) > 4) {
    player2.dy = Math.sign(diff) * player2.speed * s.react * 16;
  } else {
    player2.dy = 0;
  }
}

// ── Update ───────────────────────────────────────────────
function update() {
  if (!gameRunning || paused) return;

  // Move paddles
  player1.y += player1.dy;
  player2.y += player2.dy;
  player1.y = Math.max(0, Math.min(H - PH, player1.y));
  player2.y = Math.max(0, Math.min(H - PH, player2.y));

  // AI
  if (vsAI) updateAI();

  // Ball
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Wall bounce
  if (ball.y - BR < 0) { ball.dy = Math.abs(ball.dy); spawnParticles(ball.x, 0, '#fff', 5); soundWall(); }
  if (ball.y + BR > H) { ball.dy = -Math.abs(ball.dy); spawnParticles(ball.x, H, '#fff', 5); soundWall(); }

  // Paddle collision
  for (const [paddle, dir] of [[player1, 1], [player2, -1]]) {
    if (
      ball.x - BR < paddle.x + paddle.width &&
      ball.x + BR > paddle.x &&
      ball.y + BR > paddle.y &&
      ball.y - BR < paddle.y + PH
    ) {
      const hit = (ball.y - (paddle.y + PH/2)) / (PH/2);
      const angle = hit * (Math.PI / 3.5);
      ball.dx = dir * ball.speed * Math.cos(angle);
      ball.dy = ball.speed * Math.sin(angle);
      ball.speed = Math.min(ball.speed + 0.25, 18);
      ball.x = dir === 1 ? paddle.x + PW + BR + 1 : paddle.x - BR - 1;
      spawnParticles(ball.x, ball.y, paddle.color, 10);
      soundHit();
      rallyCount++;
      if (rallyCount > bestRally) bestRally = rallyCount;
      updateInfoBar();
    }
  }

  // Scoring
  if (ball.x - BR < 0) {
    player2.score++;
    spawnParticles(10, H/2, P2_COLOR, 30);
    screenFlash = 8; flashColor = P2_COLOR;
    soundScore();
    checkWin(2);
    if (gameRunning) setTimeout(() => resetBall(1), 700);
  }
  if (ball.x + BR > W) {
    player1.score++;
    spawnParticles(W - 10, H/2, P1_COLOR, 30);
    screenFlash = 8; flashColor = P1_COLOR;
    soundScore();
    checkWin(1);
    if (gameRunning) setTimeout(() => resetBall(-1), 700);
  }
}

function checkWin(who) {
  if (scoreLimit === 99) return;
  const score = who === 1 ? player1.score : player2.score;
  if (score >= scoreLimit) {
    gameRunning = false;
    soundWin();
    const name = vsAI && who === 2 ? 'AI' : `Player ${who}`;
    showWinScreen(name, who);
  }
}

function showWinScreen(name, who) {
  const overlay = document.getElementById('overlay');
  const color = who === 1 ? P1_COLOR : P2_COLOR;
  overlay.innerHTML = `
    <h2 style="color:${color}" class="win-label">${name.toUpperCase()}</h2>
    <p style="letter-spacing:4px;margin-bottom:6px">WINS THE MATCH</p>
    <p style="color:var(--muted);font-size:0.65rem;letter-spacing:2px;margin-bottom:20px">
      ${player1.score} — ${player2.score}
    </p>
    <button class="btn" onclick="startGame()" style="border-color:${color};color:${color};font-size:0.85rem;padding:12px 32px">▶ PLAY AGAIN</button>
  `;
  overlay.style.display = 'flex';
}

// ── Draw ─────────────────────────────────────────────────
function drawGlowRect(x, y, w, h, color) {
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 3);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawGlowCircle(x, y, r, color) {
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawBallTrail() {
  // Small inner glow ring
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BR + 5, 0, Math.PI * 2);
  ctx.stroke();
}

function render() {
  // Background
  ctx.fillStyle = '#07080f';
  ctx.fillRect(0, 0, W, H);

  // Screen flash
  if (screenFlash > 0) {
    ctx.fillStyle = flashColor;
    ctx.globalAlpha = screenFlash * 0.025;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    screenFlash--;
  }

  // Net
  for (let i = 8; i < H; i += 28) {
    ctx.fillStyle = NET_COLOR;
    ctx.fillRect(W/2 - 2, i, 4, 16);
  }

  // Center circle
  ctx.strokeStyle = NET_COLOR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(W/2, H/2, 60, 0, Math.PI * 2);
  ctx.stroke();

  // Paddles
  drawGlowRect(player1.x, player1.y, PW, PH, P1_COLOR);
  drawGlowRect(player2.x, player2.y, PW, PH, P2_COLOR);

  // Ball trail ring
  if (gameRunning) drawBallTrail();

  // Ball
  drawGlowCircle(ball.x, ball.y, BR, BALL_COLOR);

  // Particles
  drawParticles();

  // Scores — big, glowing
  ctx.font = "bold 56px 'Orbitron', monospace";
  ctx.textAlign = 'center';
  ctx.shadowColor = P1_COLOR; ctx.shadowBlur = 20;
  ctx.fillStyle = P1_COLOR;
  ctx.fillText(player1.score, W/4, 72);
  ctx.shadowColor = P2_COLOR;
  ctx.fillStyle = P2_COLOR;
  ctx.fillText(player2.score, 3*W/4, 72);
  ctx.shadowBlur = 0;

  // Ball speed indicator (subtle)
  if (gameRunning) {
    const spd = Math.round(ball.speed * 10) / 10;
    document.getElementById('speed-info').textContent = `Speed: ${spd.toFixed(1)}`;
  }
}

// ── Info Bar ─────────────────────────────────────────────
function updateInfoBar() {
  document.getElementById('rally-info').textContent = `Rally: ${rallyCount}`;
  document.getElementById('best-rally').textContent = `Best: ${bestRally}`;
}

// ── Game Loop ────────────────────────────────────────────
function loop() {
  update();
  updateParticles();
  render();
  animId = requestAnimationFrame(loop);
}

// ── Start / Reset ─────────────────────────────────────────
function startGame() {
  const overlay = document.getElementById('overlay');
  overlay.style.display = 'none';
  initObjects();
  resetBall();
  gameRunning = true;
  if (!animId) loop();
  updateLabels();
  updateInfoBar();
  document.getElementById('status-msg').textContent = vsAI ? `vs AI (${aiDifficulty})` : '2 Player Mode';
}

function updateLabels() {
  document.getElementById('p1-label').textContent = 'Player 1';
  document.getElementById('p2-label').textContent = vsAI ? 'AI' : 'Player 2';
}

// ── Controls ──────────────────────────────────────────────
const keys = {};
document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (['ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault();

  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
    paused = !paused;
    document.getElementById('status-msg').textContent = paused ? '⏸ PAUSED' : (vsAI ? `vs AI (${aiDifficulty})` : '2 Player Mode');
  }
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

function handleKeys() {
  if (keys['w'] || keys['W']) player1.dy = -player1.speed;
  else if (keys['s'] || keys['S']) player1.dy = player1.speed;
  else player1.dy = 0;

  if (!vsAI) {
    if (keys['ArrowUp']) player2.dy = -player2.speed;
    else if (keys['ArrowDown']) player2.dy = player2.speed;
    else player2.dy = 0;
  }
}

// Hook key handling into update
const _update = update;
function update() {
  handleKeys();
  _update();
}
// (Redefine cleanly)
window.update = function() {
  handleKeys();
  if (!gameRunning || paused) return;
  player1.y += player1.dy;
  player2.y += player2.dy;
  player1.y = Math.max(0, Math.min(H - PH, player1.y));
  player2.y = Math.max(0, Math.min(H - PH, player2.y));
  if (vsAI) updateAI();
  ball.x += ball.dx; ball.y += ball.dy;
  if (ball.y - BR < 0) { ball.dy = Math.abs(ball.dy); spawnParticles(ball.x, 0, '#fff', 5); soundWall(); }
  if (ball.y + BR > H) { ball.dy = -Math.abs(ball.dy); spawnParticles(ball.x, H, '#fff', 5); soundWall(); }
  for (const [paddle, dir] of [[player1, 1], [player2, -1]]) {
    if (ball.x - BR < paddle.x + paddle.width && ball.x + BR > paddle.x &&
        ball.y + BR > paddle.y && ball.y - BR < paddle.y + PH) {
      const hit = (ball.y - (paddle.y + PH/2)) / (PH/2);
      const angle = hit * (Math.PI / 3.5);
      ball.dx = dir * ball.speed * Math.cos(angle);
      ball.dy = ball.speed * Math.sin(angle);
      ball.speed = Math.min(ball.speed + 0.25, 18);
      ball.x = dir === 1 ? paddle.x + PW + BR + 1 : paddle.x - BR - 1;
      spawnParticles(ball.x, ball.y, paddle.color, 10);
      soundHit();
      rallyCount++;
      if (rallyCount > bestRally) bestRally = rallyCount;
      updateInfoBar();
    }
  }
  if (ball.x - BR < 0) {
    player2.score++;
    spawnParticles(10, H/2, P2_COLOR, 30); screenFlash = 8; flashColor = P2_COLOR;
    soundScore(); checkWin(2);
    if (gameRunning) setTimeout(() => resetBall(1), 700);
  }
  if (ball.x + BR > W) {
    player1.score++;
    spawnParticles(W-10, H/2, P1_COLOR, 30); screenFlash = 8; flashColor = P1_COLOR;
    soundScore(); checkWin(1);
    if (gameRunning) setTimeout(() => resetBall(-1), 700);
  }
};

function loop() {
  handleKeys();
  window.update();
  updateParticles();
  render();
  animId = requestAnimationFrame(loop);
}

// ── UI Buttons ───────────────────────────────────────────
document.getElementById('btn-2p').onclick = () => {
  vsAI = false;
  document.getElementById('diff-select').style.display = 'none';
  document.getElementById('btn-2p').classList.add('active');
  document.getElementById('btn-ai').classList.remove('active');
};
document.getElementById('btn-ai').onclick = () => {
  vsAI = true;
  document.getElementById('diff-select').style.display = '';
  document.getElementById('btn-ai').classList.add('active');
  document.getElementById('btn-2p').classList.remove('active');
};
document.getElementById('diff-select').onchange = e => { aiDifficulty = e.target.value; };
document.getElementById('score-limit').onchange = e => { scoreLimit = parseInt(e.target.value); };
document.getElementById('btn-reset').onclick = () => {
  gameRunning = false;
  particles = [];
  const overlay = document.getElementById('overlay');
  overlay.innerHTML = `
    <h2 style="color:var(--accent)" class="win-label">PING·PONG</h2>
    <p>Ready to play?</p>
    <button class="btn" onclick="startGame()" style="font-size:0.85rem;padding:12px 32px;border-color:var(--accent);color:var(--accent)">▶ START GAME</button>
    <p class="sub">P to pause &nbsp;|&nbsp; 2P: W/S · Arrow Up/Down</p>
  `;
  overlay.style.display = 'flex';
};

// ── Init render (show something before start) ────────────
initObjects();
loop();
window.startGame = startGame;