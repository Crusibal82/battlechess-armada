const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = __dirname;
const DATA_DIR = process.env.BATTLECHESS_DATA_DIR || path.join(ROOT, "data");
const MAX_LOBBIES = 25;
const COLORS = ["blue", "red"];
const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const MAX_CHAT_MESSAGES = 80;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 8;
const AUTH_TOKEN_SECRET = process.env.BATTLECHESS_AUTH_SECRET || "battlechess-armada-dev-secret";
const ADMIN_USERS = new Set(
  String(process.env.BATTLECHESS_ADMIN_USERS || "BCAadminCrusibal")
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean),
);
const BUG_REPORTS_FILE = path.join(DATA_DIR, "bug-reports.jsonl");
const loginAttempts = new Map();

const lobbies = Array.from({ length: MAX_LOBBIES }, (_, index) => ({
  id: String(index + 1).padStart(2, "0"),
  name: `Lobby ${index + 1}`,
  players: { blue: null, red: null },
  gameState: null,
  gameVersion: 0,
  gameUpdatedBy: null,
  chat: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
}));

fs.mkdirSync(DATA_DIR, { recursive: true });
const authSessions = new Map();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...securityHeaders(),
  });
  res.end(body);
}

function securityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
    "X-Frame-Options": "SAMEORIGIN",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
  };
}

function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
}

function loginAttemptKey(req, username) {
  return `${clientIp(req)}:${String(username || "").toLowerCase()}`;
}

function isLoginLimited(req, username) {
  const key = loginAttemptKey(req, username);
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record || now > record.resetAt) return false;
  return record.count >= MAX_LOGIN_ATTEMPTS;
}

function recordLoginFailure(req, username) {
  const key = loginAttemptKey(req, username);
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record || now > record.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }
  record.count += 1;
}

function clearLoginFailures(req, username) {
  loginAttempts.delete(loginAttemptKey(req, username));
}

function publicUser(user) {
  return { id: user.id, username: user.username, isAdmin: isAdminUser(user) };
}

function isAdminUser(userOrSession) {
  return ADMIN_USERS.has(String(userOrSession?.username || "").toLowerCase());
}

function base64Url(input) {
  return Buffer.from(input).toString("base64url");
}

function signTokenPayload(payload) {
  return crypto.createHmac("sha256", AUTH_TOKEN_SECRET).update(payload).digest("base64url");
}

function createAuthToken(user) {
  const payload = base64Url(JSON.stringify({
    userId: user.id,
    username: user.username,
    createdAt: Date.now(),
  }));
  return `${payload}.${signTokenPayload(payload)}`;
}

function verifyAuthToken(token) {
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) return null;
  const expected = signTokenPayload(payload);
  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!session.userId || !session.username || !session.createdAt) return null;
    if (Date.now() - session.createdAt > SESSION_TIMEOUT_MS) return null;
    return {
      userId: session.userId,
      username: session.username,
      createdAt: session.createdAt,
      lastSeenAt: Date.now(),
    };
  } catch {
    return null;
  }
}

function authFromRequest(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  let session = authSessions.get(token);
  if (!session) {
    session = verifyAuthToken(token);
    if (session) authSessions.set(token, session);
  }
  if (!session) return null;
  session.lastSeenAt = Date.now();
  const user = { id: session.userId, username: session.username };
  return { token, session, user };
}

function requireAuth(req, res) {
  const auth = authFromRequest(req);
  if (!auth) {
    sendJson(res, 401, { error: "Login required." });
    return null;
  }
  return auth;
}

function requireAdmin(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return null;
  if (!isAdminUser(auth.user)) {
    sendJson(res, 403, { error: "Admin access required." });
    return null;
  }
  return auth;
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) req.destroy();
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function appendBugReport(report) {
  fs.appendFileSync(BUG_REPORTS_FILE, `${JSON.stringify(report)}\n`, "utf8");
}

function readBugReports() {
  try {
    return fs
      .readFileSync(BUG_REPORTS_FILE, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .slice(-200)
      .reverse();
  } catch {
    return [];
  }
}

function publicLobby(lobby) {
  return {
    id: lobby.id,
    name: lobby.name,
    players: {
      blue: lobby.players.blue ? { name: lobby.players.blue.name } : null,
      red: lobby.players.red ? { name: lobby.players.red.name } : null,
    },
    hostColor: lobbyHostColor(lobby),
    openSeats: COLORS.filter((color) => !lobby.players[color]),
    activeGame: Boolean(lobby.gameState && !lobby.gameState.gameOver),
    updatedAt: lobby.updatedAt,
  };
}

function lobbyHostColor(lobby) {
  return COLORS
    .filter((color) => lobby.players[color])
    .sort((a, b) => lobby.players[a].joinedAt - lobby.players[b].joinedAt)[0] || null;
}

function adminLobby(lobby) {
  return {
    ...publicLobby(lobby),
    gameVersion: lobby.gameVersion,
    gameUpdatedBy: lobby.gameUpdatedBy,
    phase: lobby.gameState?.phase || null,
    active: lobby.gameState?.active || null,
    turn: lobby.gameState?.turn || null,
    gameOver: Boolean(lobby.gameState?.gameOver),
    winner: lobby.gameState?.winner || null,
  };
}

function findLobby(id) {
  return lobbies.find((lobby) => lobby.id === id);
}

function removePlayerFromLobby(token, requestedLobbyId = null) {
  const session = authSessions.get(token);
  const lobbyIds = requestedLobbyId ? [requestedLobbyId] : [session?.lobbyId, ...lobbies.map((lobby) => lobby.id)];
  for (const lobbyId of lobbyIds.filter(Boolean)) {
    const lobby = findLobby(lobbyId);
    if (!lobby) continue;
    for (const color of COLORS) {
      if (lobby.players[color]?.token === token) {
        lobby.players[color] = null;
      }
    }
    lobby.updatedAt = Date.now();
    resetLobbyGameIfEmpty(lobby);
  }
  if (session) {
    delete session.lobbyId;
    delete session.color;
  }
}

function resetLobbyGameIfEmpty(lobby) {
  if (lobby.players.blue || lobby.players.red) return;
  lobby.gameState = null;
  lobby.gameVersion = 0;
  lobby.gameUpdatedBy = null;
  lobby.chat = [];
}

function cleanupStaleSessions() {
  const now = Date.now();
  for (const [token, session] of authSessions.entries()) {
    if (now - (session.lastSeenAt || session.createdAt || 0) > SESSION_TIMEOUT_MS) {
      removePlayerFromLobby(token);
      authSessions.delete(token);
    }
  }

  for (const lobby of lobbies) {
    for (const color of COLORS) {
      const player = lobby.players[color];
      if (player && !authSessions.has(player.token)) {
        lobby.players[color] = null;
        lobby.updatedAt = now;
      }
    }
    resetLobbyGameIfEmpty(lobby);
  }
}

async function handleApi(req, res, url) {
  cleanupStaleSessions();
  if (req.method === "POST" && url.pathname === "/api/auth/register") {
    return sendJson(res, 410, { error: "Account creation is no longer required. Enter a username to join." });
  }

  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    let payload;
    try {
      payload = await readJson(req);
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON." });
    }
    const username = String(payload.username || "").trim();
    if (isLoginLimited(req, username)) return sendJson(res, 429, { error: "Too many login attempts. Try again later." });
    if (!/^[A-Za-z0-9_-]{3,32}$/.test(username)) {
      recordLoginFailure(req, username);
      return sendJson(res, 400, { error: "Username must be 3-32 letters, numbers, underscores, or hyphens." });
    }
    clearLoginFailures(req, username);
    const user = { id: crypto.randomBytes(12).toString("hex"), username };
    const token = createAuthToken(user);
    authSessions.set(token, { userId: user.id, username: user.username, createdAt: Date.now(), lastSeenAt: Date.now() });
    return sendJson(res, 200, { token, user: publicUser(user) });
  }

  if (req.method === "POST" && url.pathname === "/api/auth/logout") {
    const auth = authFromRequest(req);
    if (auth) {
      removePlayerFromLobby(auth.token);
      authSessions.delete(auth.token);
    }
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "GET" && url.pathname === "/api/auth/me") {
    const auth = requireAuth(req, res);
    if (!auth) return;
    return sendJson(res, 200, { user: publicUser(auth.user), session: auth.session });
  }

  if (req.method === "GET" && url.pathname === "/api/lobbies") {
    const auth = requireAuth(req, res);
    if (!auth) return;
    return sendJson(res, 200, { lobbies: lobbies.map(publicLobby) });
  }

  if (req.method === "GET" && url.pathname === "/api/admin/lobbies") {
    const auth = requireAdmin(req, res);
    if (!auth) return;
    return sendJson(res, 200, { lobbies: lobbies.map(adminLobby) });
  }

  if (req.method === "GET" && url.pathname === "/api/admin/bug-reports") {
    const auth = requireAdmin(req, res);
    if (!auth) return;
    return sendJson(res, 200, { reports: readBugReports() });
  }

  if (req.method === "POST" && url.pathname === "/api/bug-reports") {
    const auth = requireAuth(req, res);
    if (!auth) return;
    let payload;
    try {
      payload = await readJson(req);
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON." });
    }
    const lobbyId = String(payload.lobbyId || "").trim();
    const lobby = lobbyId ? findLobby(lobbyId) : null;
    const title = String(payload.title || "").trim().slice(0, 120);
    const details = String(payload.details || "").trim().slice(0, 3000);
    if (!lobby) return sendJson(res, 400, { error: "A valid lobby is required." });
    if (!details) return sendJson(res, 400, { error: "Bug details are required." });
    const report = {
      id: crypto.randomBytes(8).toString("hex"),
      lobbyId: lobby.id,
      lobbyName: lobby.name,
      title: title || "Bug report",
      details,
      reporter: auth.user.username,
      reporterId: auth.user.id,
      createdAt: Date.now(),
      gameVersion: lobby.gameVersion,
      phase: lobby.gameState?.phase || null,
      active: lobby.gameState?.active || null,
      turn: lobby.gameState?.turn || null,
    };
    appendBugReport(report);
    return sendJson(res, 201, { report });
  }

  const joinMatch = url.pathname.match(/^\/api\/lobbies\/(\d{2})\/join$/);
  if (req.method === "POST" && joinMatch) {
    const auth = requireAuth(req, res);
    if (!auth) return;
    const lobby = findLobby(joinMatch[1]);
    if (!lobby) return sendJson(res, 404, { error: "Lobby not found." });

    let payload;
    try {
      payload = await readJson(req);
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON." });
    }

    const color = String(payload.color || "").toLowerCase();
    if (!COLORS.includes(color)) return sendJson(res, 400, { error: "Color must be blue or red." });
    if (lobby.players[color]) return sendJson(res, 409, { error: `${color} is already seated.` });
    if (auth.session.lobbyId) return sendJson(res, 409, { error: "Leave your current lobby before joining another." });

    const player = { name: auth.user.username, userId: auth.user.id, color, token: auth.token, joinedAt: Date.now() };
    lobby.players[color] = player;
    lobby.updatedAt = Date.now();
    auth.session.lobbyId = lobby.id;
    auth.session.color = color;

    return sendJson(res, 200, { token: auth.token, lobby: publicLobby(lobby), color, name: auth.user.username });
  }

  const leaveMatch = url.pathname.match(/^\/api\/lobbies\/(\d{2})\/leave$/);
  if (req.method === "POST" && leaveMatch) {
    const auth = requireAuth(req, res);
    if (!auth) return;
    removePlayerFromLobby(auth.token, leaveMatch[1]);
    return sendJson(res, 200, { ok: true });
  }

  const stateMatch = url.pathname.match(/^\/api\/lobbies\/(\d{2})\/state$/);
  if (req.method === "GET" && stateMatch) {
    const auth = requireAuth(req, res);
    if (!auth) return;
    const lobby = findLobby(stateMatch[1]);
    if (!lobby) return sendJson(res, 404, { error: "Lobby not found." });
    if (!lobby.players.blue && !lobby.players.red) return sendJson(res, 404, { error: "Lobby is empty." });
    if (auth.session.lobbyId !== lobby.id && !isAdminUser(auth.user)) return sendJson(res, 403, { error: "You are not seated in this lobby." });
    return sendJson(res, 200, {
      state: lobby.gameState,
      version: lobby.gameVersion,
      updatedBy: lobby.gameUpdatedBy,
      hostColor: lobbyHostColor(lobby),
      players: {
        blue: lobby.players.blue ? { name: lobby.players.blue.name } : null,
        red: lobby.players.red ? { name: lobby.players.red.name } : null,
      },
    });
  }

  if (req.method === "PUT" && stateMatch) {
    const auth = requireAuth(req, res);
    if (!auth) return;
    const lobby = findLobby(stateMatch[1]);
    if (!lobby) return sendJson(res, 404, { error: "Lobby not found." });
    if (auth.session.lobbyId !== lobby.id || !auth.session.color) return sendJson(res, 403, { error: "You are not seated in this lobby." });

    let payload;
    try {
      payload = await readJson(req);
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON." });
    }
    if (!payload || typeof payload.state !== "object") return sendJson(res, 400, { error: "Game state is required." });

    lobby.gameState = payload.state;
    lobby.gameVersion += 1;
    lobby.gameUpdatedBy = auth.session.color;
    lobby.updatedAt = Date.now();
    return sendJson(res, 200, { ok: true, version: lobby.gameVersion, updatedBy: lobby.gameUpdatedBy });
  }

  const chatMatch = url.pathname.match(/^\/api\/lobbies\/(\d{2})\/chat$/);
  if (req.method === "GET" && chatMatch) {
    const auth = requireAuth(req, res);
    if (!auth) return;
    const lobby = findLobby(chatMatch[1]);
    if (!lobby) return sendJson(res, 404, { error: "Lobby not found." });
    if (auth.session.lobbyId !== lobby.id && !isAdminUser(auth.user)) return sendJson(res, 403, { error: "You are not seated in this lobby." });
    return sendJson(res, 200, { messages: lobby.chat });
  }

  if (req.method === "POST" && chatMatch) {
    const auth = requireAuth(req, res);
    if (!auth) return;
    const lobby = findLobby(chatMatch[1]);
    if (!lobby) return sendJson(res, 404, { error: "Lobby not found." });
    const adminUser = isAdminUser(auth.user);
    if ((auth.session.lobbyId !== lobby.id || !auth.session.color) && !adminUser) return sendJson(res, 403, { error: "You are not seated in this lobby." });

    let payload;
    try {
      payload = await readJson(req);
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON." });
    }

    const text = String(payload.text || "").trim().slice(0, 300);
    if (!text) return sendJson(res, 400, { error: "Message is required." });
    const message = {
      id: crypto.randomBytes(8).toString("hex"),
      color: adminUser && auth.session.lobbyId !== lobby.id ? "admin" : auth.session.color,
      name: adminUser && auth.session.lobbyId !== lobby.id ? `${auth.user.username} (GameMaster)` : auth.user.username,
      text,
      createdAt: Date.now(),
    };
    lobby.chat.push(message);
    if (lobby.chat.length > MAX_CHAT_MESSAGES) lobby.chat = lobby.chat.slice(-MAX_CHAT_MESSAGES);
    lobby.updatedAt = Date.now();
    return sendJson(res, 201, { message });
  }

  const lobbyMatch = url.pathname.match(/^\/api\/lobbies\/(\d{2})$/);
  if (req.method === "GET" && lobbyMatch) {
    const auth = requireAuth(req, res);
    if (!auth) return;
    const lobby = findLobby(lobbyMatch[1]);
    if (!lobby) return sendJson(res, 404, { error: "Lobby not found." });
    return sendJson(res, 200, { lobby: publicLobby(lobby) });
  }

  return sendJson(res, 404, { error: "API route not found." });
}

function serveFile(req, res, url) {
  const requestedPath = url.pathname === "/" ? "/login.html" : url.pathname;
  const firstSegment = requestedPath.split("/").filter(Boolean)[0] || "";
  if (["data", ".git", "node_modules"].includes(firstSegment) || requestedPath.endsWith(".toml") || requestedPath.endsWith(".service") || requestedPath.endsWith(".conf")) {
    res.writeHead(404, securityHeaders());
    res.end("Not found");
    return;
  }
  const resolved = path.resolve(ROOT, `.${decodeURIComponent(requestedPath)}`);
  if (!resolved.startsWith(ROOT)) {
    res.writeHead(403, securityHeaders());
    res.end("Forbidden");
    return;
  }

  fs.readFile(resolved, (error, data) => {
    if (error) {
      res.writeHead(404, securityHeaders());
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(resolved)] || "application/octet-stream",
      "Cache-Control": "no-store",
      ...securityHeaders(),
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === "GET" && url.pathname === "/healthz") {
    return sendJson(res, 200, { ok: true });
  }
  if (url.pathname.startsWith("/api/")) {
    handleApi(req, res, url).catch((error) => {
      console.error(error);
      sendJson(res, 500, { error: "Server error." });
    });
    return;
  }
  serveFile(req, res, url);
});

server.listen(PORT, HOST, () => {
  console.log(`Battlechess Armada multiplayer server running at http://${HOST}:${PORT}`);
});

setInterval(cleanupStaleSessions, 60 * 1000);
