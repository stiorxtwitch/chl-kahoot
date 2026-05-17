// ── AUDIO 100% synthétisé (Web Audio API) ──
// Plus besoin de fichiers .mp3 : tout est généré dans le navigateur.
// Débloqué au premier clic/touch (autoplay policy iOS/Safari/Chrome).

let ctx = null;
let masterGain = null;
let booted = false;
let unlocked = false;

// Boucles musicales
let lobbyNodes = null;
let quesNodes = null;

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.8;
  masterGain.connect(ctx.destination);
  return ctx;
}

function unlockAudio() {
  if (unlocked) return;
  const c = ensureCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  // petit "silent ping" pour débloquer iOS
  const o = c.createOscillator();
  const g = c.createGain();
  g.gain.value = 0.0001;
  o.connect(g); g.connect(masterGain);
  o.start(); o.stop(c.currentTime + 0.02);
  unlocked = true;
}
document.addEventListener('click', unlockAudio, { capture: true });
document.addEventListener('touchstart', unlockAudio, { capture: true });
document.addEventListener('keydown', unlockAudio, { capture: true });

function boot() { booted = true; unlockAudio(); sfx(); }

// ── SFX : clic court ──
function sfx() {
  const c = ensureCtx(); if (!c) return;
  try {
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(880, t);
    o.frequency.exponentialRampToValueAtTime(440, t + 0.08);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g); g.connect(masterGain);
    o.start(t); o.stop(t + 0.14);
  } catch(e) {}
}

// ── LOBBY : accord doux en boucle ──
function playLobby() {
  if (!booted) return;
  stopQues();
  if (lobbyNodes) return;
  const c = ensureCtx(); if (!c) return;
  const g = c.createGain();
  g.gain.value = 0;
  g.gain.linearRampToValueAtTime(0.18, c.currentTime + 0.8);
  g.connect(masterGain);
  // Accord Am9 chill
  const freqs = [220, 261.63, 329.63, 493.88];
  const oscs = freqs.map((f, i) => {
    const o = c.createOscillator();
    o.type = i === 0 ? 'sine' : 'triangle';
    o.frequency.value = f;
    // LFO léger pour vie
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    lfo.frequency.value = 0.15 + i*0.07;
    lfoGain.gain.value = 1.5;
    lfo.connect(lfoGain); lfoGain.connect(o.frequency);
    lfo.start();
    o.connect(g); o.start();
    return { o, lfo };
  });
  lobbyNodes = { g, oscs };
}
function stopLobby() {
  if (!lobbyNodes) return;
  const c = ctx; if (!c) { lobbyNodes = null; return; }
  const { g, oscs } = lobbyNodes;
  const t = c.currentTime;
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(g.gain.value, t);
  g.gain.linearRampToValueAtTime(0, t + 0.4);
  setTimeout(() => {
    oscs.forEach(({o,lfo}) => { try{o.stop();}catch(e){} try{lfo.stop();}catch(e){} });
    try { g.disconnect(); } catch(e) {}
  }, 500);
  lobbyNodes = null;
}

// ── QUESTIONS : pulsation tendue ──
function playQues() {
  if (!booted) return;
  stopLobby();
  if (quesNodes) return;
  const c = ensureCtx(); if (!c) return;
  const g = c.createGain();
  g.gain.value = 0;
  g.gain.linearRampToValueAtTime(0.14, c.currentTime + 0.5);
  g.connect(masterGain);
  // Basse pulsée
  const bass = c.createOscillator();
  bass.type = 'sawtooth';
  bass.frequency.value = 110;
  const bassGain = c.createGain();
  bassGain.gain.value = 0.4;
  bass.connect(bassGain); bassGain.connect(g); bass.start();
  // LFO pulsation
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.type = 'square';
  lfo.frequency.value = 2; // 120 BPM tick
  lfoGain.gain.value = 0.35;
  lfo.connect(lfoGain); lfoGain.connect(bassGain.gain);
  lfo.start();
  // Pad aigu
  const pad = c.createOscillator();
  pad.type = 'triangle';
  pad.frequency.value = 329.63;
  const padGain = c.createGain();
  padGain.gain.value = 0.2;
  pad.connect(padGain); padGain.connect(g); pad.start();
  quesNodes = { g, nodes: [bass, lfo, pad] };
}
function stopQues() {
  if (!quesNodes) return;
  const c = ctx; if (!c) { quesNodes = null; return; }
  const { g, nodes } = quesNodes;
  const t = c.currentTime;
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(g.gain.value, t);
  g.gain.linearRampToValueAtTime(0, t + 0.3);
  setTimeout(() => {
    nodes.forEach(n => { try { n.stop(); } catch(e) {} });
    try { g.disconnect(); } catch(e) {}
  }, 400);
  quesNodes = null;
}
function stopMusic() { stopLobby(); stopQues(); }

// ── VIEWS ──
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id.endsWith('-lobby')) playLobby();
  else if (id.endsWith('-question')) playQues();
  else if (id.endsWith('-results')) { stopMusic(); setTimeout(playLobby, 300); }
}

function g(id) { return document.getElementById(id); }

window.boot = boot;
window.sfx = sfx;
window.showView = showView;
