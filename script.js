const scene = document.body;
const bgc   = document.getElementById('bgc');
const ctx   = bgc.getContext('2d');

function resize() {
  bgc.width  = window.innerWidth;
  bgc.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// ─── Som de estouro suave (Web Audio API) ───────────────────
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playPop() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const now = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.exponentialRampToValueAtTime(200, now + 0.18);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);

  gain.gain.setValueAtTime(0.28, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.22);

  const bufferSize = audioCtx.sampleRate * 0.12;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 600;
  noiseFilter.Q.value = 0.8;

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.12, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(audioCtx.destination);
  noise.start(now);
}

// ─── Estrelas ───────────────────────────────────────────────
const stars = Array.from({ length: 200 }, () => ({
  x:  Math.random(),
  y:  Math.random(),
  r:  Math.random() * 1.3 + 0.2,
  a:  Math.random(),
  da: (Math.random() * 0.005 + 0.002) * (Math.random() < 0.5 ? 1 : -1)
}));

const shoots = [];

function spawnShoot() {
  shoots.push({
    x:    Math.random() * bgc.width  * 0.7,
    y:    Math.random() * bgc.height * 0.4,
    vx:   5 + Math.random() * 4,
    vy:   2 + Math.random() * 3,
    life: 0,
    max:  45
  });
}
setInterval(spawnShoot, 2200);

function drawBg() {
  const W = bgc.width, H = bgc.height;
  ctx.clearRect(0, 0, W, H);

  stars.forEach(s => {
    s.a = Math.max(0.08, Math.min(1, s.a + s.da));
    if (s.a <= 0.08 || s.a >= 1) s.da *= -1;
    ctx.beginPath();
    ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${s.a})`;
    ctx.fill();
  });

  for (let i = shoots.length - 1; i >= 0; i--) {
    const s = shoots[i];
    s.x += s.vx; s.y += s.vy; s.life++;
    const a = s.life < 8 ? s.life / 8 : Math.max(0, 1 - (s.life - 8) / (s.max - 8));
    const g = ctx.createLinearGradient(s.x - s.vx * 7, s.y - s.vy * 7, s.x, s.y);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, `rgba(255,255,255,${a})`);
    ctx.beginPath();
    ctx.moveTo(s.x - s.vx * 7, s.y - s.vy * 7);
    ctx.lineTo(s.x, s.y);
    ctx.strokeStyle = g;
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    if (s.life >= s.max) shoots.splice(i, 1);
  }
}

// ─── Helpers ────────────────────────────────────────────────
function lighten(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(255, b + 60)})`;
}

function heartPath(sz, color, gid) {
  return `<svg width="${sz}" height="${sz}" viewBox="0 0 100 95" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="hg${gid}" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stop-color="${lighten(color)}"/>
        <stop offset="100%" stop-color="${color}"/>
      </radialGradient>
    </defs>
    <path d="M50 85 C50 85 5 55 5 28 C5 13 16 4 28 4 C37 4 45 10 50 17 C55 10 63 4 72 4 C84 4 95 13 95 28 C95 55 50 85 50 85 Z"
      fill="url(#hg${gid})" stroke="${color}" stroke-width="1.5"/>
    <path d="M25 22 Q30 14 38 18" stroke="rgba(255,255,255,0.5)" stroke-width="3" fill="none" stroke-linecap="round"/>
  </svg>`;
}

// ─── Personalize aqui ───────────────────────────────────────
const BALLOON_SPAWN_INTERVAL = 500; // ms entre spawns de balões

let currentTheme = "purple";

const THEMES = {
  purple: {
    bg: "radial-gradient(ellipse at center, #0d1b3e 0%, #050d1f 60%, #020710 100%)",
    colors: [
      '#cc44aa',
      '#aa22dd',
      '#dd2288',
      '#8822cc',
      '#ff44bb',
      '#7733ff',
      '#ee1177'
    ]
  },

  orangeBlue: {
    bg: "radial-gradient(ellipse at center, #ffb347 0%, #ff7b00 50%, #4a2200 100%)",
    colors: [
      '#4fc3ff',
      '#00aaff',
      '#6ec6ff',
      '#0099ff',
      '#00d4ff',
      '#3f8cff',
      '#72bfff'
    ]
  }
};

let COLORS = [...THEMES.purple.colors];

function toggleTheme() {

  currentTheme =
    currentTheme === "purple"
      ? "orangeBlue"
      : "purple";

  COLORS = [...THEMES[currentTheme].colors];

  hiddenBg.style.background =
    THEMES[currentTheme].bg;

  hiddenBg.style.opacity = "1";
  activeBg.style.opacity = "0";

  [activeBg, hiddenBg] = [hiddenBg, activeBg];

  localStorage.setItem("theme", currentTheme);

  updateButtonHover();
}

const FRASES = [
  "Te Amo", "Meu amor", "Eres preciosa", "Me encantas",
  "Você é meu lugar favorito.", "Para sempre", "Você é meu melhor sorriso.",
  "Meu amor", "Forever", "Te quiero",
  "Eu escolheria você todos os dias.",
  "Seu sorriso é meu ponto fraco",
  "Amo cada detalhe seu",
  "Infinitamente seu."
];

// ✏️ FOTOS — apenas o nome do arquivo.
// Coloque as imagens na MESMA PASTA que o index.html
const FOTOS = [
  "file:///C:/Users/m1334/OneDrive/Desktop/She%F0%9F%A9%B5/IMG-20260506-WA0000%20-%20Copia.jpg",
  "file:///C:/Users/m1334/OneDrive/Desktop/She%F0%9F%A9%B5/IMG-20260515-WA0042.jpg",
  "file:///C:/Users/m1334/OneDrive/Desktop/She%F0%9F%A9%B5/IMG-20260517-WA0060.jpg",
   "file:///C:/Users/m1334/OneDrive/Desktop/She%F0%9F%A9%B5/IMG-20260609-WA0014%20-%20Copia%20(2).jpg",
   "file:///C:/Users/m1334/OneDrive/Desktop/She%F0%9F%A9%B5/IMG-20260609-WA0028%20-%20Copia.jpg",
   "file:///C:/Users/m1334/OneDrive/Desktop/She%F0%9F%A9%B5/IMG-20260609-WA0061.jpg",
];

// ─── Balões ─────────────────────────────────────────────────
const balloons = [];
let bid = 0;

function spawnBalloon() {
  const W  = window.innerWidth;
  const H  = window.innerHeight;
  const sz = 54 + Math.floor(Math.random() * 38);
  const x  = Math.random() * (W - sz);
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const id    = 'b' + (bid++);

  const el = document.createElement('div');
  el.className    = 'balloon';
  el.style.left   = x + 'px';
  el.style.top    = (H + 20) + 'px';
  el.style.width  = sz + 'px';
  el.style.height = sz + 'px';
  el.innerHTML    = heartPath(sz, color, id);
  scene.appendChild(el);

  const obj = {
    el, x, y: H + 20,
    vx: (Math.random() - 0.5) * 0.4,
    vy: -(1.5 + Math.random() * 0.7),
    sz, color,
    wobble:     Math.random() * Math.PI * 2,
    wobbleFreq: 0.02 + Math.random() * 0.015,
    alive: true
  };
  balloons.push(obj);
  el.addEventListener('click', () => { if (obj.alive) popBalloon(obj); });
}

function popBalloon(obj) {
  obj.alive = false;
  playPop();

  const cx = obj.x + obj.sz / 2;
  const cy = obj.y + obj.sz / 2;

  // Anel de explosão
  const ring = document.createElement('div');
  ring.className = 'pop-ring';
  ring.style.cssText = `width:${obj.sz}px;height:${obj.sz}px;left:${cx - obj.sz/2}px;top:${cy - obj.sz/2}px;border:3px solid ${obj.color};`;
  scene.appendChild(ring);
  setTimeout(() => ring.remove(), 420);

  // Partículas
  const count = 6 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    const angle   = (Math.PI * 2 / count) * i + Math.random() * 0.5;
    const dist    = 60 + Math.random() * 80;
    const dur     = 2800 + Math.random() * 1800; // 2.8s a 4.6s na tela
    const isPhoto = Math.random() < 0.35;

    const p = document.createElement('div');

    if (isPhoto) {
      // ── Foto real ──
      p.className        = 'pfoto';
      p.style.width      = '48px';
      p.style.height     = '48px';
      p.style.overflow   = 'hidden';
      p.style.padding    = '0';

      const img           = document.createElement('img');
      img.src             = FOTOS[Math.floor(Math.random() * FOTOS.length)];
      img.style.width     = '100%';
      img.style.height    = '100%';
      img.style.objectFit = 'cover';
      img.style.display   = 'block';
      p.appendChild(img);

    } else {
      // ── Frase ──
      p.className        = 'particle';
      p.textContent      = FRASES[Math.floor(Math.random() * FRASES.length)];
      p.style.fontSize   = (11 + Math.floor(Math.random() * 10)) + 'px';
      p.style.color      = obj.color;
      p.style.textShadow = `0 0 8px ${obj.color}`;
    }

    p.style.left              = cx + 'px';
    p.style.top               = cy + 'px';
    p.style.animationDuration = dur + 'ms';
    scene.appendChild(p);

    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    let start = null;
    (function animP(ts) {
      if (!start) start = ts;
      const prog = Math.min(1, (ts - start) / dur);
      const ease = 1 - Math.pow(1 - prog, 2);
      p.style.transform = `translate(${tx * ease}px,${ty * ease - 30 * prog}px)`;
      if (prog < 1) requestAnimationFrame(animP);
      else p.remove();
    })(performance.now());
  }

  obj.el.remove();
  const idx = balloons.indexOf(obj);
  if (idx > -1) balloons.splice(idx, 1);
}

function updateBalloons() {
  for (let i = balloons.length - 1; i >= 0; i--) {
    const o = balloons[i];
    o.wobble += o.wobbleFreq;
    o.x += o.vx + Math.sin(o.wobble) * 0.3;
    o.y += o.vy;
    o.el.style.left = o.x + 'px';
    o.el.style.top  = o.y + 'px';
    if (o.y < -o.sz - 10) {
      o.el.remove();
      balloons.splice(i, 1);
    }
  }
}

// Spawn inicial espalhado pela tela
for (let i = 0; i < 6; i++) {
  setTimeout(() => {
    spawnBalloon();
    const last = balloons[balloons.length - 1];
    if (last) {
      last.y = Math.random() * window.innerHeight * 0.8;
      last.el.style.top = last.y + 'px';
    }
  }, i * 250);
}
let balloonInterval = setInterval(spawnBalloon, 1100);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearInterval(balloonInterval);
  } else {
    balloonInterval = setInterval(spawnBalloon, 1400);
  }
});

window.addEventListener("beforeunload", () => {
  clearInterval(balloonInterval);
});

// ─── Loop principal ─────────────────────────────────────────
function loop() {
  drawBg();
  updateBalloons();
  requestAnimationFrame(loop);
}
loop();


const themeBtn = document.createElement("button");

themeBtn.innerHTML = "🎨";

themeBtn.style.position = "fixed";
themeBtn.style.top = "20px";
themeBtn.style.right = "20px";
themeBtn.style.zIndex = "9999";

themeBtn.style.width = "55px";
themeBtn.style.height = "55px";

themeBtn.style.border = "none";
themeBtn.style.borderRadius = "50%";

themeBtn.style.cursor = "pointer";
themeBtn.style.fontSize = "24px";

themeBtn.style.color = "white";

themeBtn.style.background =
  "rgba(255,255,255,.12)";

themeBtn.style.backdropFilter =
  "blur(12px)";

themeBtn.style.boxShadow =
  "0 0 15px rgba(255,255,255,.15)";

themeBtn.style.transition =
  "all .45s ease";

themeBtn.addEventListener("click", toggleTheme);

document.body.appendChild(themeBtn);

function updateButtonHover() {

  themeBtn.onmouseenter = () => {

    if (currentTheme === "purple") {

      themeBtn.style.background =
        "linear-gradient(135deg,#cc44aa,#7733ff)";

      themeBtn.style.boxShadow =
        "0 0 25px #aa22dd";

    } else {

      themeBtn.style.background =
        "linear-gradient(135deg,#00d4ff,#3f8cff)";

      themeBtn.style.boxShadow =
        "0 0 25px #00aaff";
    }

    themeBtn.style.transform =
      "scale(1.12) rotate(15deg)";
  };

  themeBtn.onmouseleave = () => {

    themeBtn.style.background =
      "rgba(255,255,255,.12)";

    themeBtn.style.boxShadow =
      "0 0 15px rgba(255,255,255,.15)";

    themeBtn.style.transform =
      "scale(1) rotate(0deg)";
  };
}

const bg1 = document.createElement("div");
const bg2 = document.createElement("div");

bg1.className = "bg-theme";
bg2.className = "bg-theme top";

bg1.style.background = THEMES.purple.bg;
bg2.style.background = THEMES.purple.bg;

document.body.prepend(bg1);
document.body.prepend(bg2);

let activeBg = bg2;
let hiddenBg = bg1;