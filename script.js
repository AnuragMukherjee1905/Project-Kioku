// ============================================================
// SECTION 1 — BACKEND CONFIG
// Change this URL if you deploy the backend somewhere else.
// ============================================================
const API_BASE = "http://localhost:5000/api";

// ---- Auth helpers ----

/** Save the JWT to localStorage after login/register */
function saveToken(token) {
  localStorage.setItem("nf_token", token);
}

/** Get the JWT — returns null if not logged in */
function getToken() {
  return localStorage.getItem("nf_token");
}

/** Remove the token (logout) */
function clearToken() {
  localStorage.removeItem("nf_token");
  localStorage.removeItem("nf_user");
}

/** Save basic user info so we don't need to re-fetch constantly */
function saveUser(user) {
  localStorage.setItem("nf_user", JSON.stringify(user));
}

/** Get the cached user object */
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("nf_user")) || null;
  } catch {
    return null;
  }
}

/** Build the Authorization header for protected API calls */
function authHeader() {
  return { Authorization: `Bearer ${getToken()}` };
}

// ============================================================
// SECTION 2 — API FUNCTIONS
// All async, all use fetch + async/await.
// ============================================================

/**
 * Register a new account.
 * Returns { token, user } on success, throws on failure.
 */
async function apiRegister(username, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Registration failed");
  return data;
}

/**
 * Log in with email + password.
 * Returns { token, user } on success, throws on failure.
 */
async function apiLogin(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  return data;
}

/**
 * Verify the stored token and get the current user.
 * Used on page load to auto-login if a token exists.
 */
async function apiGetMe() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { "Content-Type": "application/json", ...authHeader() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Token invalid");
  return data; // { user: {...} }
}

/**
 * Fetch the top 20 players from the leaderboard.
 */
async function apiGetLeaderboard() {
  const res = await fetch(`${API_BASE}/users/leaderboard`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Could not fetch leaderboard");
  return data; // { leaderboard: [...] }
}

/**
 * Fetch the logged-in player's full profile + stats.
 */
async function apiGetProfile() {
  const res = await fetch(`${API_BASE}/users/profile`, {
    headers: { "Content-Type": "application/json", ...authHeader() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Could not fetch profile");
  return data; // { profile: {...} }
}

/**
 * Save a completed game session.
 * Returns { isNewBest, globalRank, updatedStats } on success.
 */
async function apiSaveSession(sessionData) {
  const res = await fetch(`${API_BASE}/sessions/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(sessionData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Could not save session");
  return data;
}

/**
 * Fetch the last 10 sessions for the logged-in player.
 */
async function apiGetHistory() {
  const res = await fetch(`${API_BASE}/sessions/history`, {
    headers: { "Content-Type": "application/json", ...authHeader() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Could not fetch history");
  return data; // { sessions: [...] }
}

// ============================================================
// SECTION 3 — AUTH MODAL UI
// ============================================================

/** Show the auth modal */
function showAuthModal() {
  document.getElementById("authBackdrop").classList.remove("hidden");
}

/** Hide the auth modal */
function hideAuthModal() {
  document.getElementById("authBackdrop").classList.add("hidden");
}

/** Switch between Login / Signup tabs inside the modal */
function switchAuthTab(tab) {
  const loginForm  = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const tabLogin   = document.getElementById("tabLogin");
  const tabSignup  = document.getElementById("tabSignup");
  clearAuthAlert();

  if (tab === "login") {
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
    tabLogin.classList.add("active");
    tabSignup.classList.remove("active");
  } else {
    loginForm.classList.add("hidden");
    signupForm.classList.remove("hidden");
    tabLogin.classList.remove("active");
    tabSignup.classList.add("active");
  }
}

/** Show an error or success message inside the auth modal */
function showAuthAlert(message, type = "error") {
  const el = document.getElementById("authAlert");
  el.textContent = message;
  el.className = `modal-alert ${type}`;
}

function clearAuthAlert() {
  const el = document.getElementById("authAlert");
  el.className = "modal-alert";
  el.textContent = "";
}

/** Set loading state on a button (disables it and shows spinner) */
function setButtonLoading(btnId, textId, spinnerId, loading) {
  const btn     = document.getElementById(btnId);
  const text    = document.getElementById(textId);
  const spinner = document.getElementById(spinnerId);
  btn.disabled = loading;
  loading ? spinner.classList.remove("hidden") : spinner.classList.add("hidden");
}

// ---- Handle Login ----
async function handleLogin() {
  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    showAuthAlert("Please enter your email and password.");
    return;
  }

  setButtonLoading("loginBtn", "loginBtnText", "loginSpinner", true);
  clearAuthAlert();

  try {
    const data = await apiLogin(email, password);
    saveToken(data.token);
    saveUser(data.user);
    onLoginSuccess(data.user);
  } catch (err) {
    showAuthAlert(err.message);
  } finally {
    setButtonLoading("loginBtn", "loginBtnText", "loginSpinner", false);
  }
}

// ---- Handle Signup ----
async function handleSignup() {
  const username = document.getElementById("signupUsername").value.trim();
  const email    = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;

  if (!username || !email || !password) {
    showAuthAlert("All fields are required.");
    return;
  }

  setButtonLoading("signupBtn", "signupBtnText", "signupSpinner", true);
  clearAuthAlert();

  try {
    const data = await apiRegister(username, email, password);
    saveToken(data.token);
    saveUser(data.user);
    onLoginSuccess(data.user);
  } catch (err) {
    showAuthAlert(err.message);
  } finally {
    setButtonLoading("signupBtn", "signupBtnText", "signupSpinner", false);
  }
}

/** Called once authentication succeeds (login or signup) */
function onLoginSuccess(user) {
  hideAuthModal();
  showNavBar(user.username);
  // Sync the backend best score with the local STATE
  STATE.best = Math.max(STATE.best, user.bestScore || 0);
  updateHUD();
}

/** Allow playing without an account */
function playAsGuest() {
  hideAuthModal();
  // navBar stays hidden — no account features available
}

/** Log out */
function handleLogout() {
  clearToken();
  hideNavBar();
  showAuthModal();
}

// ============================================================
// SECTION 4 — NAV BAR
// ============================================================

function showNavBar(username) {
  document.getElementById("navBar").style.display = "flex";
  document.getElementById("navUsername").textContent = username;
}

function hideNavBar() {
  document.getElementById("navBar").style.display = "none";
}

// ============================================================
// SECTION 5 — SCREEN NAVIGATION (extended)
// ============================================================

/** Navigate to any named screen, fetching data as needed */
function showScreen(name) {
  switchScreen(name);
  if (name === "leaderboard") loadLeaderboard();
  if (name === "profile")     loadProfile();
}

// ============================================================
// SECTION 6 — LEADERBOARD SCREEN
// ============================================================

async function loadLeaderboard() {
  const loading = document.getElementById("lbLoading");
  const table   = document.getElementById("lbTable");
  const body    = document.getElementById("lbBody");

  loading.style.display = "flex";
  table.style.display   = "none";
  body.innerHTML        = "";

  try {
    const data = await apiGetLeaderboard();
    const me   = getUser();

    data.leaderboard.forEach((player) => {
      const tr = document.createElement("tr");

      // Rank cell with gold/silver/bronze colouring
      const rankClass = player.rank === 1 ? "gold" : player.rank === 2 ? "silver" : player.rank === 3 ? "bronze" : "";
      const isMeClass = me && player.username === me.username ? "me" : "";

      tr.innerHTML = `
        <td><span class="lb-rank ${rankClass}">${player.rank}</span></td>
        <td><span class="lb-username ${isMeClass}">${player.username}${isMeClass ? " ★" : ""}</span></td>
        <td><span class="lb-score">${player.bestScore.toLocaleString()}</span></td>
        <td><span class="lb-level">${player.highestLevel}</span></td>
      `;
      body.appendChild(tr);
    });

    loading.style.display = "none";
    table.style.display   = "table";
  } catch (err) {
    loading.innerHTML = `<span style="color:var(--accent2)">Failed to load: ${err.message}</span>`;
  }
}

// ============================================================
// SECTION 7 — PROFILE SCREEN
// ============================================================

async function loadProfile() {
  const profileLoading = document.getElementById("profileLoading");
  const profileCard    = document.getElementById("profileCard");
  const historyWrap    = document.getElementById("historyWrap");

  profileLoading.style.display = "flex";
  profileCard.style.display    = "none";
  historyWrap.innerHTML        = `<div class="spinner-small"></div>`;

  try {
    // Fetch profile and history in parallel
    const [profileData, historyData] = await Promise.all([
      apiGetProfile(),
      apiGetHistory(),
    ]);

    const p = profileData.profile;

    // Avatar = first letter of username
    document.getElementById("profileAvatar").textContent = p.username[0].toUpperCase();
    document.getElementById("profileName").textContent   = p.username;
    document.getElementById("profileSince").textContent  =
      "MEMBER SINCE " + new Date(p.memberSince).toLocaleDateString("en-US", { year: "numeric", month: "short" }).toUpperCase();

    document.getElementById("profileStats").innerHTML = `
      <div class="profile-stat-row"><span>Best Score</span>       <span>${p.bestScore.toLocaleString()}</span></div>
      <div class="profile-stat-row"><span>Highest Level</span>    <span>${p.highestLevel}</span></div>
      <div class="profile-stat-row"><span>Games Played</span>     <span>${p.gamesPlayed}</span></div>
      <div class="profile-stat-row"><span>Avg Reaction</span>     <span>${p.avgReactionTime} ms</span></div>
      <div class="profile-stat-row"><span>Accuracy</span>         <span>${p.accuracy}%</span></div>
    `;

    profileLoading.style.display = "none";
    profileCard.style.display    = "block";

    // ---- Session History ----
    const sessions = historyData.sessions;
    if (!sessions.length) {
      historyWrap.innerHTML = `<div style="color:var(--muted);font-size:0.75rem;text-align:center;padding:20px">No sessions yet. Play a game!</div>`;
      return;
    }

    historyWrap.innerHTML = sessions.map((s) => `
      <div class="history-session">
        <div class="hs-left">
          <div class="hs-score">${s.score.toLocaleString()}</div>
          <div class="hs-meta">LVL ${s.levelReached} · ${s.mode?.toUpperCase() || "CLASSIC"} · ${s.accuracy?.toFixed(1)}% ACC</div>
        </div>
        <div class="hs-right">
          <div>${s.averageReactionTime} ms</div>
          <div class="hs-date">${new Date(s.playedAt).toLocaleDateString()}</div>
        </div>
      </div>
    `).join("");

  } catch (err) {
    profileLoading.innerHTML = `<span style="color:var(--accent2)">Failed to load: ${err.message}</span>`;
  }
}

// ============================================================
// SECTION 8 — AUTO-LOGIN ON PAGE LOAD
// ============================================================

async function tryAutoLogin() {
  const token = getToken();
  if (!token) {
    showAuthModal(); // No token → show modal
    return;
  }

  try {
    const data = await apiGetMe();
    saveUser(data.user); // Refresh cached user data
    onLoginSuccess(data.user);
  } catch {
    // Token is expired or invalid
    clearToken();
    showAuthModal();
  }
}

// ============================================================
// SECTION 9 — SUBMIT SESSION AFTER GAME OVER
// ============================================================

/** Called from gameOver() — submits results if logged in */
async function submitSession(score, levelReached, accuracy, avgReaction, sessionDuration) {
  if (!getToken()) return; // Guest mode — skip

  try {
    const result = await apiSaveSession({
      score,
      levelReached,
      averageReactionTime: Math.round(avgReaction),
      accuracy: parseFloat(accuracy.toFixed(1)),
      sessionDuration: Math.round(sessionDuration),
      mode: STATE.mode,
    });

    // Show backend result card
    const card = document.getElementById("backendResult");
    card.style.display = "block";
    card.innerHTML = `
      ${result.isNewBest ? '<div class="new-best-badge">★ NEW PERSONAL BEST ★</div>' : ""}
      <div class="result-row"><span>Global Rank</span><span>#${result.globalRank}</span></div>
      <div class="result-row"><span>Best Score</span><span>${result.updatedStats.bestScore.toLocaleString()}</span></div>
      <div class="result-row"><span>Games Played</span><span>${result.updatedStats.gamesPlayed}</span></div>
      <div class="result-row"><span>Avg Accuracy</span><span>${result.updatedStats.accuracy}%</span></div>
    `;

    // Update local best in case it improved
    STATE.best = result.updatedStats.bestScore;
    const cached = getUser();
    if (cached) {
      cached.bestScore = result.updatedStats.bestScore;
      saveUser(cached);
    }
  } catch (err) {
    console.warn("Session save failed:", err.message);
    // Non-critical — game still works, just won't update leaderboard
  }
}

// ============================================================
// SECTION 10 — ORIGINAL GAME CODE (100% preserved)
// ============================================================

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
  mode: "classic",
  gameStartTime: 0, // Tracks session duration
};

function applyModeTheme() {
  const root = document.documentElement;
  if (STATE.mode === "speed") {
    root.style.setProperty('--accent', '#bc4dff');
    root.style.setProperty('--glow', '0 0 20px rgba(188, 77, 255, 0.4)');
  } else if (STATE.mode === "hardcore") {
    root.style.setProperty('--accent', '#ff4d4d');
    root.style.setProperty('--glow', '0 0 20px rgba(255, 77, 77, 0.4)');
  } else {
    root.style.setProperty('--accent', '#00f5c4');
    root.style.setProperty('--glow', '0 0 20px rgba(0, 245, 196, 0.3)');
  }
}

// ---------------- GRID GENERATION ----------------
function createGrid() {
  const grid = document.getElementById("gameGrid");
  grid.innerHTML = "";
  let size = 4;
  if (STATE.level > 4) size = 9;
  if (STATE.level > 8) size = 16;
  grid.className = `grid size-${size}`;
  for (let i = 0; i < size; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.idx = i;
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

window.addEventListener("DOMContentLoaded", () => {
  injectModeUI();
  tryAutoLogin(); // ← New: attempt silent login on page load
});

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
    reactionTimes: [],
    gameStartTime: Date.now(), // ← Record when the session started
  });
  // Hide backend result card from a previous game
  document.getElementById("backendResult").style.display = "none";

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
  if (STATE.level === 5 || STATE.level === 9) createGrid();
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
  do { n = Math.floor(Math.random() * gridSize); }
  while (n === last && gridSize > 1);
  return n;
}

// ---------------- PLAY SEQUENCE ----------------
function playSequence() {
  STATE.phase = "watch";
  STATE.inputLocked = true;
  setPhase("watch");
  let i = 0;
  function flashNext() {
    if (i >= STATE.sequence.length) { beginRecall(); return; }
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
  const step     = STATE.userInput.length;
  const expected = STATE.sequence[step];
  STATE.userInput.push(idx);
  const now = Date.now();
  STATE.reactionTimes.push(now - STATE.lastClickTime);
  STATE.lastClickTime = now;
  if (idx !== expected) {
    cellEl.classList.add("wrong");
    return onFail();
  }
  cellEl.classList.add("correct");
  setTimeout(() => cellEl.classList.remove("correct"), 200);
  STATE.totalCorrect++;
  updateProgressBar((STATE.userInput.length / STATE.sequence.length) * 100);
  if (STATE.userInput.length === STATE.sequence.length) onSuccess();
}

// ---------------- SUCCESS ----------------
function onSuccess() {
  STATE.inputLocked = true;
  STATE.streak++;
  STATE.maxStreak = Math.max(STATE.maxStreak, STATE.streak);
  const avgReaction = STATE.reactionTimes.reduce((a, b) => a + b, 0) / STATE.reactionTimes.length;
  const speedBonus  = Math.max(100 - avgReaction / 10, 10);
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
  const overlay = document.getElementById("flashOverlay");
  if (overlay) {
    overlay.classList.add("active");
    setTimeout(() => overlay.classList.remove("active"), 400);
  }
  setPhase("result-fail");
  setTimeout(() => {
    document.querySelectorAll(".cell").forEach(cell => {
      cell.classList.remove("wrong", "correct", "lit");
    });
    if (STATE.lives <= 0) gameOver();
    else { updateHUD(); nextRound(); }
  }, 800);
}

// ---------------- GAME OVER ----------------
function gameOver() {
  STATE.phase = "over";

  const avgReaction = STATE.reactionTimes.reduce((a, b) => a + b, 0) / (STATE.reactionTimes.length || 1);
  const accuracy    = (STATE.totalCorrect / (STATE.totalCorrect + (3 - STATE.lives))) * 100;
  const duration    = (Date.now() - STATE.gameStartTime) / 1000; // seconds

  document.getElementById("goScore").textContent = STATE.score;
  document.getElementById("goBreakdown").innerHTML = `
    <div class="score-row"><span>Accuracy</span>     <span>${accuracy.toFixed(1)}%</span></div>
    <div class="score-row"><span>Avg Reaction</span> <span>${avgReaction.toFixed(0)} ms</span></div>
    <div class="score-row"><span>Max Streak</span>   <span>${STATE.maxStreak}</span></div>
    <div class="score-row"><span>Mode</span>         <span>${STATE.mode.toUpperCase()}</span></div>
  `;

  switchScreen("gameover");

  // ← Submit to backend (non-blocking — won't interrupt the UI)
  submitSession(STATE.score, STATE.level, accuracy, avgReaction, duration);
}

// ---------------- UI HELPERS ----------------
function switchScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(name + "-screen").classList.add("active");
}

function showStart() { switchScreen("start"); }

function updateHUD() {
  document.getElementById("scoreDisplay").textContent  = STATE.score;
  document.getElementById("levelDisplay").textContent  = STATE.level;
  document.getElementById("bestDisplay").textContent   = STATE.best;
  document.getElementById("livesDisplay").textContent  = "❤️".repeat(STATE.lives);
  document.getElementById("seqLenDisplay").textContent = STATE.sequence.length;
  document.getElementById("phaseDisplay").textContent  = STATE.phase.toUpperCase();
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
