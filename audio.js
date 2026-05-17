// ─────────────────────────────────────────────
// AUDIO SYSTEM
// ─────────────────────────────────────────────

let ctx = null;
let masterGain = null;
let booted = false;
let unlocked = false;

// ── MUSIQUES MP3 ──
const lobbyMusic = new Audio("https://mp3tourl.com/audio/1779018232506-506dead7-8f00-4fdf-921e-79a9ee8f4563.mp3");
const questionMusic = new Audio("https://mp3tourl.com/audio/1779018276491-bcccc7a8-8f4e-4cb4-aee0-0f04f42159b4.mp3");

// configuration
[lobbyMusic, questionMusic].forEach(a => {
  a.loop = true;
  a.preload = "auto";
  a.volume = 0.45;
});

// ─────────────────────────────────────────────
// WEB AUDIO
// ─────────────────────────────────────────────

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

  if (c.state === "suspended") {
    c.resume().catch(() => {});
  }

  // petit ping silencieux iOS/Safari
  const o = c.createOscillator();
  const g = c.createGain();

  g.gain.value = 0.0001;

  o.connect(g);
  g.connect(masterGain);

  o.start();
  o.stop(c.currentTime + 0.02);

  // débloque les balises audio HTML
  lobbyMusic.play().then(() => {
    lobbyMusic.pause();
    lobbyMusic.currentTime = 0;
  }).catch(() => {});

  questionMusic.play().then(() => {
    questionMusic.pause();
    questionMusic.currentTime = 0;
  }).catch(() => {});

  unlocked = true;
}

document.addEventListener("click", unlockAudio, { capture: true });
document.addEventListener("touchstart", unlockAudio, { capture: true });
document.addEventListener("keydown", unlockAudio, { capture: true });

function boot() {
  booted = true;
  unlockAudio();
  sfx();
}

// ─────────────────────────────────────────────
// SFX CLICK
// ─────────────────────────────────────────────

function sfx() {
  const c = ensureCtx();
  if (!c) return;

  try {
    const t = c.currentTime;

    const o = c.createOscillator();
    const g = c.createGain();

    o.type = "triangle";

    o.frequency.setValueAtTime(880, t);
    o.frequency.exponentialRampToValueAtTime(440, t + 0.08);

    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

    o.connect(g);
    g.connect(masterGain);

    o.start(t);
    o.stop(t + 0.14);

  } catch(e) {}
}

// ─────────────────────────────────────────────
// LOBBY MUSIC
// ─────────────────────────────────────────────

function playLobby() {
  if (!booted) return;

  stopQues();

  if (!lobbyMusic.paused) return;

  lobbyMusic.currentTime = 0;

  lobbyMusic.play().catch(() => {});
}

function stopLobby() {
  lobbyMusic.pause();
  lobbyMusic.currentTime = 0;
}

// ─────────────────────────────────────────────
// QUESTION MUSIC
// ─────────────────────────────────────────────

function playQues() {
  if (!booted) return;

  stopLobby();

  if (!questionMusic.paused) return;

  questionMusic.currentTime = 0;

  questionMusic.play().catch(() => {});
}

function stopQues() {
  questionMusic.pause();
  questionMusic.currentTime = 0;
}

// ─────────────────────────────────────────────
// GLOBAL
// ─────────────────────────────────────────────

function stopMusic() {
  stopLobby();
  stopQues();
}

// ─────────────────────────────────────────────
// VIEWS
// ─────────────────────────────────────────────

function showView(id) {

  document.querySelectorAll(".view").forEach(v => {
    v.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");

  // lobby
  if (id.endsWith("-lobby")) {
    playLobby();
  }

  // question
  else if (id.endsWith("-question")) {
    playQues();
  }

  // résultats
  else if (id.endsWith("-results")) {
    stopMusic();

    setTimeout(() => {
      playLobby();
    }, 300);
  }
}

function g(id) {
  return document.getElementById(id);
}

// exports
window.boot = boot;
window.sfx = sfx;
window.showView = showView;
window.stopMusic = stopMusic;
