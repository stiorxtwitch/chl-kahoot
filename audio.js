// ── AUDIO (fixed) ──
// Bug original : cloneNode(), élément hors DOM, lecture parfois bloquée.
// Fix : un seul élément click qu'on reset, et "unlock" de tous les sons
// au premier geste utilisateur (requis par iOS/Safari/Chrome autoplay policy).

const aLobby = document.getElementById('a-lobby');
const aQues  = document.getElementById('a-questions');
const aClick = document.getElementById('a-click');

let audioUnlocked = false;
let booted = false;

// Au premier clic n'importe où, on "débloque" tous les <audio> en les
// jouant brièvement puis pausant. Sans ça, .play() futur peut être bloqué.
function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  [aLobby, aQues, aClick].forEach(a => {
    if (!a) return;
    a.muted = true;
    const p = a.play();
    if (p && p.then) {
      p.then(() => { a.pause(); a.currentTime = 0; a.muted = false; })
       .catch(() => { a.muted = false; });
    } else {
      a.pause(); a.muted = false;
    }
  });
}
document.addEventListener('click', unlockAudio, { once: false, capture: true });
document.addEventListener('touchstart', unlockAudio, { once: false, capture: true });

function boot() { booted = true; unlockAudio(); sfx(); }

function sfx() {
  if (!aClick) return;
  try {
    aClick.pause();
    aClick.currentTime = 0;
    aClick.volume = 0.55;
    const p = aClick.play();
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}

function playLobby() {
  if (!booted) return;
  try { aQues.pause(); aQues.currentTime = 0; } catch(e){}
  if (aLobby.paused) {
    const p = aLobby.play();
    if (p && p.catch) p.catch(err => console.warn('Lobby audio bloqué:', err));
  }
}
function playQues() {
  if (!booted) return;
  try { aLobby.pause(); aLobby.currentTime = 0; } catch(e){}
  if (aQues.paused) {
    const p = aQues.play();
    if (p && p.catch) p.catch(err => console.warn('Questions audio bloqué:', err));
  }
}
function stopMusic() {
  try { aLobby.pause(); aLobby.currentTime = 0; } catch(e){}
  try { aQues.pause();  aQues.currentTime  = 0; } catch(e){}
}

// ── VIEWS ──
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id.endsWith('-lobby')) playLobby();
  else if (id.endsWith('-question')) playQues();
  else if (id.endsWith('-results')) {
    stopMusic();
    if (booted) setTimeout(() => { const p = aLobby.play(); if (p&&p.catch) p.catch(()=>{}); }, 400);
  }
}

function g(id) { return document.getElementById(id); }

window.boot = boot;
window.sfx = sfx;
window.showView = showView;
window.__audio = { aLobby, aQues, aClick };
