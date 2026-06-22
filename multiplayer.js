const lobbyListEl = document.querySelector("#lobbyList");
const roomSummaryEl = document.querySelector("#roomSummary");
const playerBadge = document.querySelector("#playerBadge");
const refreshButton = document.querySelector("#refreshButton");
const logoutButton = document.querySelector("#logoutButton");
const joinBlueButton = document.querySelector("#joinBlueButton");
const joinRedButton = document.querySelector("#joinRedButton");
const leaveButton = document.querySelector("#leaveButton");
const enterGameLink = document.querySelector("#enterGameLink");
const statusLine = document.querySelector("#statusLine");

let lobbies = [];
let selectedLobbyId = null;
let auth = loadAuth();
let serverSession = null;

function loadAuth() {
  try {
    return JSON.parse(localStorage.getItem("battlechess-auth") || "null");
  } catch {
    return null;
  }
}

function saveAuth(nextAuth) {
  auth = nextAuth;
  if (auth) localStorage.setItem("battlechess-auth", JSON.stringify(auth));
  else localStorage.removeItem("battlechess-auth");
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth?.token || ""}`,
      ...(options.headers || {}),
    },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Request failed.");
  return payload;
}

async function requireLogin() {
  if (!auth?.token) {
    window.location.href = "/login.html";
    return false;
  }
  try {
    const payload = await api("/api/auth/me");
    serverSession = payload.session;
    playerBadge.textContent = payload.user.username;
    return true;
  } catch {
    saveAuth(null);
    window.location.href = "/login.html";
    return false;
  }
}

async function refreshLobbies() {
  if (!(await requireLogin())) return;
  const payload = await api("/api/lobbies");
  lobbies = payload.lobbies;
  if (!selectedLobbyId) selectedLobbyId = serverSession?.lobbyId || lobbies[0]?.id || null;
  render();
}

function render() {
  lobbyListEl.innerHTML = lobbies.map(renderLobbyCard).join("");
  lobbyListEl.querySelectorAll("[data-select-lobby]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedLobbyId = button.dataset.selectLobby;
      render();
    });
  });
  lobbyListEl.querySelectorAll("[data-leave-lobby]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      leave(button.dataset.leaveLobby).catch(showError);
    });
  });
  renderSelectedLobby();
}

function renderLobbyCard(lobby) {
  const inThisLobby = serverSession?.lobbyId === lobby.id;
  return `
    <div class="lobby-card ${lobby.id === selectedLobbyId ? "selected" : ""}">
      <button class="lobby-select" type="button" data-select-lobby="${lobby.id}">
        <strong>${lobby.name}</strong>
        ${renderSeat("blue", lobby.players.blue)}
        ${renderSeat("red", lobby.players.red)}
      </button>
      ${inThisLobby ? `<button class="leave-inline" type="button" data-leave-lobby="${lobby.id}">Leave Lobby</button>` : ""}
    </div>
  `;
}

function renderSeat(color, player) {
  return `
    <div class="seat-row">
      <span class="seat-color ${color}">${color}</span>
      <span class="${player ? "" : "empty-seat"}">${player ? escapeHtml(player.name) : "Open"}</span>
    </div>
  `;
}

function renderSelectedLobby() {
  const lobby = lobbies.find((candidate) => candidate.id === selectedLobbyId);
  if (!lobby) {
    roomSummaryEl.textContent = "No lobby selected.";
    joinBlueButton.disabled = true;
    joinRedButton.disabled = true;
    leaveButton.disabled = true;
    enterGameLink.hidden = true;
    return;
  }

  roomSummaryEl.className = "ship-card";
  roomSummaryEl.innerHTML = `
    <strong>${lobby.name}</strong>
    ${renderSeat("blue", lobby.players.blue)}
    ${renderSeat("red", lobby.players.red)}
  `;

  const seatedSomewhere = Boolean(serverSession?.lobbyId);
  const inThisLobby = serverSession?.lobbyId === lobby.id;
  joinBlueButton.disabled = seatedSomewhere || Boolean(lobby.players.blue);
  joinRedButton.disabled = seatedSomewhere || Boolean(lobby.players.red);
  leaveButton.disabled = !inThisLobby;

  if (inThisLobby) {
    enterGameLink.hidden = false;
    enterGameLink.href = `/index.html?lobby=${encodeURIComponent(serverSession.lobbyId)}&color=${encodeURIComponent(serverSession.color)}`;
    statusLine.textContent = `You are seated as ${serverSession.color.toUpperCase()} in ${lobby.name}.`;
  } else {
    enterGameLink.hidden = true;
    statusLine.textContent = "Choose a lobby, pick a fleet color, and wait for your opponent.";
  }
}

async function join(color) {
  if (!selectedLobbyId) return;
  await api(`/api/lobbies/${selectedLobbyId}/join`, {
    method: "POST",
    body: JSON.stringify({ color }),
  });
  await refreshLobbies();
}

async function leave(lobbyId = serverSession?.lobbyId) {
  if (!lobbyId) return;
  await api(`/api/lobbies/${lobbyId}/leave`, { method: "POST", body: "{}" });
  serverSession = { ...serverSession };
  delete serverSession.lobbyId;
  delete serverSession.color;
  await refreshLobbies();
}

async function logout() {
  try {
    await api("/api/auth/logout", { method: "POST", body: "{}" });
  } finally {
    saveAuth(null);
    window.location.href = "/login.html";
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

refreshButton.addEventListener("click", () => refreshLobbies().catch(showError));
logoutButton.addEventListener("click", () => logout().catch(showError));
joinBlueButton.addEventListener("click", () => join("blue").catch(showError));
joinRedButton.addEventListener("click", () => join("red").catch(showError));
leaveButton.addEventListener("click", () => leave().catch(showError));

function showError(error) {
  statusLine.textContent = error.message;
}

refreshLobbies().catch(showError);
setInterval(() => refreshLobbies().catch(() => {}), 3000);
