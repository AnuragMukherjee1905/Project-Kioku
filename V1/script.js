// ---------------- STATE ----------------
const STATE = {
  level: 1,
  score: 0,
  lives: 3,
  best: Number(localStorage.getItem("nf_best")) || 0,
  sequence: [],
  userInput: [],
  phase: "idle",
  inputLocked: false,
  streak: 0,
  maxStreak: 0,
  totalCorrect: 0,
  totalAttempts: 0,
  reactionTimes: [],
  lastClickTime: 0,
  mode: "classic" 
};

function applyModeTheme() {
  const root = document.documentElement;
  
  if (STATE.mode === "speed") {
    // Electric Purple Theme
    root.style.setProperty('--accent', '#bc4dff');
    root.style.setProperty('--glow', '0 0 20px rgba(188, 77, 255, 0.4)');
  } else if (STATE.mode === "hardcore") {
    // Danger Red Theme
    root.style.setProperty('--accent', '#ff4d4d');
    root.style.setProperty('--glow', '0 0 20px rgba(255, 77, 77, 0.4)');
  } else {
    // Default Emerald
    root.style.setProperty('--accent', '#00f5c4');
    root.style.setProperty('--glow', '0 0 20px rgba(0, 245, 196, 0.3)');
  }
}

// ---------------- GRID GENERATION ----------------
function createGrid() {
  const grid = document.getElementById("gameGrid");
  grid.innerHTML = "";
  
  // Determine size based on level
  let size = 4; // 2x2
  if (STATE.level > 4) size = 9; // 3x3
  if (STATE.level > 8) size = 16; // 4x4
  
  grid.className = `grid size-${size}`;

  for (let i = 0; i < size; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.idx = i;
    // Add click listener directly to handle visuals better
    cell.addEventListener('click', () => onCellClick(i, cell));
    grid.appendChild(cell);
  }
}

// ---------------- MODE UI ----------------
function injectModeUI() {
  const startScreen = document.getElementById("start-screen");
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.gap = "10px";
  wrapper.style.marginTop = "20px";
  wrapper.style.justifyContent = "center";

  const modes = ["classic", "speed", "hardcore"];
  modes.forEach(mode => {
    const btn = document.createElement("button");
    btn.textContent = mode.toUpperCase();
    btn.className = mode === STATE.mode ? "btn btn-outline btn-primary" : "btn btn-outline";
    btn.onclick = () => {
      STATE.mode = mode;
      wrapper.querySelectorAll("button").forEach(b => b.classList.remove("btn-primary"));
      btn.classList.add("btn-primary");
    };
    wrapper.appendChild(btn);
  });
  startScreen.appendChild(wrapper);
}

window.addEventListener("DOMContentLoaded", injectModeUI);

// ---------------- CONFIG ----------------
function getSpeed() {
  let base = 600 - STATE.level * 30;
  if (STATE.mode === "speed") base -= 200;
  return Math.max(base, 150);
}

// ---------------- INIT ----------------
function startGame() {
  applyModeTheme();
  Object.assign(STATE, {
    level: 1,
    score: 0,
    lives: STATE.mode === "hardcore" ? 1 : 3,
    sequence: [],
    userInput: [],
    streak: 0,
    maxStreak: 0,
    totalCorrect: 0,
    totalAttempts: 0,
    reactionTimes: []
  });

  switchScreen("game");
  createGrid();
  updateHUD();
  setTimeout(nextRound, 500);
}

function quitGame() {
  switchScreen("start");
}

// ---------------- ROUND ----------------
function nextRound() {
  STATE.userInput = [];
  STATE.totalAttempts++;
  
  // Update grid if we hit a milestone level
  if (STATE.level === 5 || STATE.level === 9) {
    createGrid();
  }

  const next = generatePatternStep();
  STATE.sequence.push(next);

  updateSeqDots();
  updateProgressBar(0);
  playSequence();
}

function generatePatternStep() {
  const cells = document.querySelectorAll(".cell");
  const gridSize = cells.length;

  if (STATE.sequence.length >= 2 && Math.random() < 0.3) {
    return STATE.sequence[STATE.sequence.length - 2];
  }

  let n;
  const last = STATE.sequence[STATE.sequence.length - 1];
  do {
    n = Math.floor(Math.random() * gridSize);
  } while (n === last && gridSize > 1);

  return n;
}

// ---------------- PLAY SEQUENCE ----------------
function playSequence() {
  STATE.phase = "watch";
  STATE.inputLocked = true;
  setPhase("watch");

  let i = 0;
  function flashNext() {
    if (i >= STATE.sequence.length) {
      beginRecall();
      return;
    }

    const idx = STATE.sequence[i];
    const cell = document.querySelector(`[data-idx="${idx}"]`);
    if (cell) {
      cell.classList.add("lit");
      setTimeout(() => {
        cell.classList.remove("lit");
        i++;
        setTimeout(flashNext, getSpeed());
      }, 300);
    }
  }
  flashNext();
}

function beginRecall() {
  STATE.phase = "recall";
  STATE.inputLocked = false;
  STATE.lastClickTime = Date.now();
  setPhase("recall");
}

// ---------------- INPUT ----------------
function onCellClick(idx, cellEl) {
  if (STATE.phase !== "recall" || STATE.inputLocked) return;

  const step = STATE.userInput.length;
  const expected = STATE.sequence[step];
  STATE.userInput.push(idx);

  // Reaction logic
  const now = Date.now();
  STATE.reactionTimes.push(now - STATE.lastClickTime);
  STATE.lastClickTime = now;

  if (idx !== expected) {
    cellEl.classList.add("wrong");
    return onFail();
  }

  // Correct tap
  cellEl.classList.add("correct");
  setTimeout(() => cellEl.classList.remove("correct"), 200);
  STATE.totalCorrect++;
  
  updateProgressBar((STATE.userInput.length / STATE.sequence.length) * 100);

  if (STATE.userInput.length === STATE.sequence.length) {
    onSuccess();
  }
}

// ---------------- SUCCESS ----------------
function onSuccess() {
  STATE.inputLocked = true;
  STATE.streak++;
  STATE.maxStreak = Math.max(STATE.maxStreak, STATE.streak);

  const avgReaction = STATE.reactionTimes.reduce((a, b) => a + b, 0) / STATE.reactionTimes.length;
  const speedBonus = Math.max(100 - avgReaction / 10, 10);
  STATE.score += Math.floor(speedBonus + (STATE.streak * 5));

  if (STATE.score > STATE.best) {
    STATE.best = STATE.score;
    localStorage.setItem("nf_best", STATE.best);
  }

  setPhase("result-ok");
  setTimeout(() => {
    STATE.level++;
    updateHUD();
    nextRound();
  }, 800);
}

// ---------------- FAIL ----------------
function onFail() {
  STATE.inputLocked = true;
  STATE.lives--;
  STATE.streak = 0;
  
  // 1. Trigger the red flash overlay
  const overlay = document.getElementById("flashOverlay");
  if (overlay) {
    overlay.classList.add("active");
    setTimeout(() => overlay.classList.remove("active"), 400);
  }

  setPhase("result-fail");

  // 2. Wait a moment so the user sees the red error, then reset all cells
  setTimeout(() => {
    const cells = document.querySelectorAll(".cell");
    cells.forEach(cell => {
      cell.classList.remove("wrong", "correct", "lit");
    });

    if (STATE.lives <= 0) {
      gameOver();
    } else {
      updateHUD();
      nextRound();
    }
  }, 800); // 800ms delay gives visual feedback before clearing
}

// ---------------- GAME OVER ----------------
function gameOver() {
  STATE.phase = "over";
  const avgReaction = STATE.reactionTimes.reduce((a, b) => a + b, 0) / (STATE.reactionTimes.length || 1);
  const accuracy = (STATE.totalCorrect / (STATE.totalCorrect + (3 - STATE.lives))) * 100;

  document.getElementById("goScore").textContent = STATE.score;
  document.getElementById("goBreakdown").innerHTML = `
    <div class="score-row"><span>Accuracy</span><span>${accuracy.toFixed(1)}%</span></div>
    <div class="score-row"><span>Avg Reaction</span><span>${avgReaction.toFixed(0)} ms</span></div>
    <div class="score-row"><span>Max Streak</span><span>${STATE.maxStreak}</span></div>
    <div class="score-row"><span>Mode</span><span>${STATE.mode.toUpperCase()}</span></div>
  `;
  switchScreen("gameover");
}

// ---------------- UI HELPERS ----------------
function switchScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(name + "-screen").classList.add("active");
}

function updateHUD() {
  document.getElementById("scoreDisplay").textContent = STATE.score;
  document.getElementById("levelDisplay").textContent = STATE.level;
  document.getElementById("bestDisplay").textContent = STATE.best;
  document.getElementById("livesDisplay").textContent = "❤️".repeat(STATE.lives);
  document.getElementById("seqLenDisplay").textContent = STATE.sequence.length;
  document.getElementById("phaseDisplay").textContent = STATE.phase.toUpperCase();
}

function updateProgressBar(pct) {
  document.getElementById("progressBar").style.width = pct + "%";
}

function updateSeqDots() {
  const container = document.getElementById("sequenceDots");
  container.innerHTML = "";
  for (let i = 0; i < STATE.sequence.length; i++) {
    const dot = document.createElement("div");
    dot.className = "seq-dot";
    dot.textContent = i + 1;
    container.appendChild(dot);
  }
}

function setPhase(p) {
  const el = document.getElementById("phaseDisplay");
  el.className = "phase-indicator " + p;
  el.textContent = p.replace("result-", "").toUpperCase();
}