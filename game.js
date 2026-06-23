const BOARD_SIZE = 12;
const FILES = "ABCDEFGHIJKL".split("");

const PIECES = {
  king: {
    symbol: "♔",
    title: "King Flagship",
    movement: "any",
    moveRange: 2,
    targeting: "any",
    targetRange: 2,
    hp: 5,
  },
  queen: {
    symbol: "♕",
    title: "Queen Dreadnought",
    movement: "any",
    moveRange: 4,
    targeting: "any",
    targetRange: 4,
    hp: 4,
  },
  bishop: {
    symbol: "♗",
    title: "Bishop Frigate",
    movement: "diagonal",
    moveRange: 4,
    targeting: "diagonal",
    targetRange: 4,
    hp: 3,
  },
  knight: {
    symbol: "♘",
    title: "Knight Submarine",
    movement: "knight",
    moveRange: 1,
    targeting: "knight",
    targetRange: 1,
    hp: 3,
  },
  rook: {
    symbol: "♖",
    title: "Rook Destroyer",
    movement: "orthogonal",
    moveRange: 4,
    targeting: "orthogonal",
    targetRange: 4,
    hp: 2,
  },
  pawn: {
    symbol: "♙",
    title: "Pawn Corvette",
    movement: "pawnMove",
    moveRange: 2,
    targeting: "pawnAttack",
    targetRange: 2,
    hp: 1,
  },
};

const STARTING_LAYOUT = {
  blue: [
    ["rook", 0, 0],
    ["knight", 1, 0],
    ["bishop", 2, 0],
    ["queen", 3, 0],
    ["king", 4, 0],
    ["bishop", 5, 0],
    ["knight", 6, 0],
    ["rook", 7, 0],
    ["pawn", 0, 1],
    ["pawn", 1, 1],
    ["pawn", 2, 1],
    ["pawn", 3, 1],
    ["pawn", 4, 1],
    ["pawn", 5, 1],
    ["pawn", 6, 1],
    ["pawn", 7, 1],
  ],
  red: [
    ["rook", 11, 11],
    ["knight", 10, 11],
    ["bishop", 9, 11],
    ["queen", 8, 11],
    ["king", 7, 11],
    ["bishop", 6, 11],
    ["knight", 5, 11],
    ["rook", 4, 11],
    ["pawn", 11, 10],
    ["pawn", 10, 10],
    ["pawn", 9, 10],
    ["pawn", 8, 10],
    ["pawn", 7, 10],
    ["pawn", 6, 10],
    ["pawn", 5, 10],
    ["pawn", 4, 10],
  ],
};

const CARD_LIBRARY = [
  { id: "forward-probe", name: "Forward Probe", phase: "Movement Phase", text: "+2 movement, then scan 3 tiles forward and forward-diagonal to reveal enemy ships or mines; +1 movement next turn.", type: "forwardProbe" },
  { id: "coordinated-volley", name: "Coordinated Volley", phase: "Targeting Phase", text: "Fire once with +1 damage per nearby friendly ship within support range (max +2).", type: "coordinatedVolley" },
  { id: "blockade-drift", name: "Blockade Drift", phase: "Movement Phase", text: "+2 movement in any direction, ignoring the ship's normal movement pattern for this move.", type: "blockadeDrift" },
  { id: "sacrificial-mark", name: "Sacrificial Mark", phase: "Instant", text: "Mark a friendly ship within 2 tiles for 2 of your turns; if destroyed by enemy fire, its attacker takes 2 damage.", type: "sacrificialMark" },
  { id: "promotion-burst", name: "Promotion Burst", phase: "Targeting Phase", text: "Only from the opponent's backline: fire one 1-damage burst in each direction.", type: "promotionBurst" },
  { id: "iron-advance", name: "Iron Advance", phase: "Movement Phase", text: "+3 straight-line movement, may pass friendly ships, then immediately ends the Movement Phase.", type: "ironAdvance" },
  { id: "line-breaker-salvo", name: "Line Breaker Salvo", phase: "Targeting Phase", text: "Fire twice in same row or column; must target different tiles; +1 dmg if both hit.", type: "lineBreaker" },
  { id: "hull-lockdown", name: "Hull Lockdown", phase: "Movement Phase", text: "Ignore all damage done to this ship until your next turn.", type: "hullLockdown" },
  { id: "overlapping-fields", name: "Overlapping Fields", phase: "Targeting Phase", text: "Fire once with +1 dmg per friendly ship in the same row or column (max +2).", type: "overlappingFields" },
  { id: "counter-battery", name: "Counter-Battery", phase: "Instant", text: "If attacked and survives, immediately fire back at attacker (once per match).", type: "counterBattery" },
  { id: "ghost-wake", name: "Ghost Wake", phase: "Movement Phase", text: "Move diagonally within this ship's movement; if an enemy occupies the endpoint, move 1 more square beyond it without collision.", type: "ghostWake" },
  { id: "vector-shift", name: "Vector Shift", phase: "Targeting Phase", text: "Move 1 tile diagonally, then fire on an enemy-occupied square; +1 damage on a 50/50 roll.", type: "vectorShift" },
  { id: "refraction-shot", name: "Refraction Shot", phase: "Targeting Phase", text: "Fire at a target, then ricochet up to 2 diagonal squares from the hit ship. Ricochet hits deal 1 damage.", type: "refractionShot" },
  { id: "sensor-sweep", name: "Sensor Sweep", phase: "Movement Phase", text: "Reveal occupied diagonal squares, but not identity, in all diagonal directions; +1 movement next turn if 3+ units/traps are found.", type: "sensorSweep" },
  { id: "evasive-roll", name: "Evasive Roll", phase: "Instant", text: "Dodge diagonally 1 tile when targeted; cancels attack if destination is empty.", type: "evasiveRoll" },
  { id: "surfacing-strike", name: "Surfacing Strike", phase: "Movement Phase", text: "Move like a Knight, then fire like a Knight with +1 damage. Does not consume the Targeting Phase.", type: "surfacingStrike" },
  { id: "flank-and-fade", name: "Flank-and-Fade", phase: "Targeting Phase", text: "Fire like a Knight, then move like a Knight to an unoccupied square.", type: "flankFade" },
  { id: "overwatch-ambush", name: "Overwatch Ambush", phase: "Instant", text: "Place a 3x3 trap zone within targeting range; first enemy entering it takes 1 damage. Lasts 2 of your turns.", type: "overwatchAmbush" },
  { id: "feint", name: "Feint", phase: "Movement Phase", text: "Reveals but does not provide identity of tile within any Knight-reachable square; may cancel move if trap/enemy are detected.", type: "feint" },
  { id: "chain-assault", name: "Chain Assault", phase: "Targeting Phase", text: "Fire using normal targeting rules, Knight-move to an empty square, then fire again using normal targeting rules.", type: "chainAssault" },
  { id: "broadside-barrage", name: "Broadside Barrage", phase: "Targeting Phase", text: "Fire at 3 consecutive tiles in a straight line (H/V).", type: "broadside" },
  { id: "power-push", name: "Power Push", phase: "Movement Phase", text: "Move up to 3 tiles straight; may pass adjacent to enemies but not through. If enemy ship is rammed +2 dmg to enemy ship and does not reveal the piece unless destroyed.", type: "powerPush" },
  { id: "suppressive-fire", name: "Suppressive Fire", phase: "Targeting Phase", text: "Choose a 3x3 zone reachable by this ship's targeting rules; enemies cannot move or target in that zone until their next turn.", type: "suppressiveFire" },
  { id: "overcharge-cannons", name: "Overcharge Cannons", phase: "Instant", text: "After a successful hit, immediately fire at another legal target tile with +1 damage.", type: "overcharge" },
  { id: "iron-bulwark", name: "Iron Bulwark", phase: "Movement Phase", text: "This ship ignores single-hit attacks for 2 of your turns.", type: "ironBulwark" },
  { id: "royal-command", name: "Royal Command", phase: "Movement Phase", text: "Instantly reposition one friendly within 3 squares; ignores movement rules.", type: "royalCommand" },
  { id: "defensive-muster", name: "Defensive Muster", phase: "Targeting Phase", text: "Adjacent allies ignore the first damage from any source until your next turn.", type: "defensiveMuster" },
  { id: "flagship-barrage", name: "Flagship Barrage", phase: "Targeting Phase", text: "Fire 2 shots at any reachable square of this ship; the same tile may be selected twice.", type: "flagshipBarrage" },
  { id: "last-stand", name: "Last Stand", phase: "Instant", text: "Non-pawn reduced to 1 HP may take a bonus move and target turn. No more special cards this turn.", type: "lastStand" },
  { id: "call-the-guard", name: "Call the Guard", phase: "Movement Phase", text: "Move a friendly ship within 3 squares to any adjacent tile of the caster, ignoring traps, mines, and enemy currents.", type: "callGuard" },
];

const GAME_MODES = {
  classic: {
    name: "Classic Flagship",
    description: "Sink the enemy King Flagship.",
  },
  "remove-throne": {
    name: "Remove the Throne",
    description: "Destroy both the enemy King Flagship and Queen Dreadnought.",
  },
  "crush-frontline": {
    name: "Crush the Frontline",
    description: "Destroy every enemy Pawn Corvette.",
  },
  "board-wipe": {
    name: "Board Wipe",
    description: "Eliminate every enemy ship.",
  },
};

const state = {
  active: "blue",
  turn: 1,
  phase: "setup",
  setupSide: "blue",
  pieces: [],
  selectedId: null,
  movedPieceId: null,
  actionTaken: false,
  lastMove: null,
  actionMode: null,
  commandMode: null,
  specialMode: null,
  specialData: null,
  reaction: null,
  commandedPieceId: null,
  commandBonus: null,
  commandBuffs: {},
  moveBonus: { blue: 0, red: 0 },
  nextMoveBonus: { blue: 0, red: 0 },
  attackBonus: { blue: 0, red: 0 },
  rangeBonus: { blue: 0, red: 0 },
  torpedo: { blue: false, red: false },
  contacts: { blue: new Set(), red: new Set() },
  mineContacts: { blue: new Set(), red: new Set() },
  shots: { blue: new Set(), red: new Set() },
  mines: [],
  currents: [],
  pendingCurrentShifts: [],
  currentAffectedPieceId: null,
  decks: { blue: [], red: [] },
  hands: { blue: [], red: [] },
  steadyShot: { blue: null, red: null },
  defensive: { blue: false, red: false },
  armor: { blue: false, red: false },
  passAbilityCooldown: { blue: 0, red: 0 },
  sacrificialMarks: [],
  counterBattery: new Set(),
  overwatch: [],
  shielded: new Set(),
  timedShields: [],
  invulnerable: new Set(),
  hullLockdowns: [],
  bulwarks: [],
  immobile: new Set(),
  suppressiveZones: [],
  lastStand: new Set(),
  lastStandLocks: { blue: false, red: false },
  lastSuccessfulHit: null,
  sunkShips: [],
  playerNames: { blue: null, red: null },
  hostColor: null,
  modeConfirmations: { blue: false, red: false },
  initiativeSide: "blue",
  initiativeToastKey: null,
  gameMode: "classic",
  gameModeConfirmed: false,
  gameOver: false,
  winner: null,
  log: [],
};

const boardEl = document.querySelector("#board");
const statusLine = document.querySelector("#statusLine");
const gameOverBanner = document.querySelector("#gameOverBanner");
const gameOverMessage = document.querySelector("#gameOverMessage");
const gameModeSelect = document.querySelector("#gameModeSelect");
const activePlayerEl = document.querySelector("#activePlayer");
const phaseNameEl = document.querySelector("#phaseName");
const turnToastEl = document.querySelector("#turnToast");
const selectedShipEl = document.querySelector("#selectedShip");
const battleLogEl = document.querySelector("#battleLog");
const endTurnButton = document.querySelector("#endTurnButton");
const newGameButton = document.querySelector("#newGameButton");
const lockSetupButton = document.querySelector("#lockSetupButton");
const randomizeSetupButton = document.querySelector("#randomizeSetupButton");
const resupplyButton = document.querySelector("#resupplyButton");
const reconButton = document.querySelector("#reconButton");
const surrenderButton = document.querySelector("#surrenderButton");
const leaveLobbyButton = document.querySelector("#leaveLobbyButton");
const mineButton = document.querySelector("#mineButton");
const repairButton = document.querySelector("#repairButton");
const steadyButton = document.querySelector("#steadyButton");
const speedButton = document.querySelector("#speedButton");
const fireButton = document.querySelector("#fireButton");
const defenseButton = document.querySelector("#defenseButton");
const cardHandEl = document.querySelector("#cardHand");
const capturedWingletEl = document.querySelector("#capturedWinglet");
const healthWingletEl = document.querySelector("#healthWinglet");
const confirmModeButton = document.querySelector("#confirmModeButton");
const chatPanel = document.querySelector("#chatPanel");
const chatMessagesEl = document.querySelector("#chatMessages");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const rulesButton = document.querySelector("#rulesButton");
const bugReportButton = document.querySelector("#bugReportButton");
const rulesDialog = document.querySelector("#rulesDialog");
const closeRulesButton = document.querySelector("#closeRulesButton");
const rulesContentEl = document.querySelector("#rulesContent");
const reactionDialog = document.querySelector("#reactionDialog");
const reactionTitleEl = document.querySelector("#reactionTitle");
const reactionTextEl = document.querySelector("#reactionText");
const reactionCardsEl = document.querySelector("#reactionCards");
const reactionPassButton = document.querySelector("#reactionPassButton");
const initiativeToastEl = document.querySelector("#initiativeToast");
const bugReportDialog = document.querySelector("#bugReportDialog");
const bugReportForm = document.querySelector("#bugReportForm");
const bugReportTitle = document.querySelector("#bugReportTitle");
const bugReportDetails = document.querySelector("#bugReportDetails");
const cancelBugReportButton = document.querySelector("#cancelBugReportButton");
const urlParams = new URLSearchParams(window.location.search);
function storedAuthToken() {
  try {
    return JSON.parse(localStorage.getItem("battlechess-auth") || "null")?.token || "";
  } catch {
    return "";
  }
}
function storedAuthUser() {
  try {
    return JSON.parse(localStorage.getItem("battlechess-auth") || "null")?.user || null;
  } catch {
    return null;
  }
}
const multiplayerSeat = {
  lobbyId: urlParams.get("lobby"),
  color: urlParams.get("color"),
  token: storedAuthToken(),
  user: storedAuthUser(),
};
const isMultiplayer = Boolean(multiplayerSeat.lobbyId && multiplayerSeat.color && multiplayerSeat.token);
const isSpectator = isMultiplayer && multiplayerSeat.color === "spectator";
const isAdminSpectator = isSpectator && (multiplayerSeat.user?.isAdmin || String(multiplayerSeat.user?.username || "").toLowerCase() === "bcaadmincrusibal");
const multiplayerSync = {
  version: 0,
  ready: !isMultiplayer,
  applying: false,
  publishing: false,
  publishQueued: false,
  pollTimer: null,
  chatTimer: null,
  chatLastId: null,
  lastTurnToastKey: null,
  turnToastTimer: null,
  lastInitiativeToastKey: null,
  initiativeToastTimer: null,
};

function setupLabels() {
  document.querySelector("#fileLabels").innerHTML = FILES.map((f) => `<span>${f}</span>`).join("");
  document.querySelector("#bottomFileLabels").innerHTML = FILES.map((f) => `<span>${f}</span>`).join("");
  document.querySelector("#rankLabels").innerHTML = Array.from({ length: BOARD_SIZE }, (_, i) => `<span>${BOARD_SIZE - i}</span>`).join("");
  document.querySelector("#rightRankLabels").innerHTML = Array.from({ length: BOARD_SIZE }, (_, i) => `<span>${BOARD_SIZE - i}</span>`).join("");
}

function newGame() {
  state.gameMode = gameModeSelect.value;
  state.active = "blue";
  state.turn = 1;
  state.phase = "setup";
  state.setupSide = "blue";
  state.pieces = [];
  state.selectedId = null;
  state.movedPieceId = null;
  state.actionTaken = false;
  state.lastMove = null;
  state.actionMode = null;
  state.commandMode = null;
  state.specialMode = null;
  state.specialData = null;
  state.reaction = null;
  state.commandedPieceId = null;
  state.commandBonus = null;
  state.commandBuffs = {};
  state.moveBonus = { blue: 0, red: 0 };
  state.nextMoveBonus = { blue: 0, red: 0 };
  state.attackBonus = { blue: 0, red: 0 };
  state.rangeBonus = { blue: 0, red: 0 };
  state.torpedo = { blue: false, red: false };
  state.contacts = { blue: new Set(), red: new Set() };
  state.mineContacts = { blue: new Set(), red: new Set() };
  state.shots = { blue: new Set(), red: new Set() };
  state.mines = [];
  state.currents = [];
  state.pendingCurrentShifts = [];
  state.currentAffectedPieceId = null;
  state.decks = { blue: buildDeck(), red: buildDeck() };
  state.hands = { blue: [], red: [] };
  state.steadyShot = { blue: null, red: null };
  state.defensive = { blue: false, red: false };
  state.armor = { blue: false, red: false };
  state.passAbilityCooldown = { blue: 0, red: 0 };
  state.sacrificialMarks = [];
  state.counterBattery = new Set();
  state.overwatch = [];
  state.shielded = new Set();
  state.timedShields = [];
  state.invulnerable = new Set();
  state.hullLockdowns = [];
  state.bulwarks = [];
  state.immobile = new Set();
  state.suppressiveZones = [];
  state.lastStand = new Set();
  state.lastStandLocks = { blue: false, red: false };
  state.lastSuccessfulHit = null;
  state.sunkShips = [];
  state.playerNames = state.playerNames || { blue: null, red: null };
  state.hostColor = state.hostColor || (isMultiplayer && !isSpectator ? multiplayerSeat.color : "blue");
  state.modeConfirmations = isMultiplayer ? { blue: false, red: false } : { blue: true, red: true };
  state.initiativeSide = randomSide();
  state.initiativeToastKey = null;
  state.gameMode = gameModeSelect.value;
  state.gameModeConfirmed = !isMultiplayer;
  state.gameOver = false;
  state.winner = null;
  state.log = [];

  for (const side of ["blue", "red"]) {
    STARTING_LAYOUT[side].forEach(([type, x, y], index) => {
      state.pieces.push({
        id: `${side}-${type}-${index}`,
        side,
        type,
        x,
        y,
        hp: PIECES[type].hp,
        maxHp: PIECES[type].hp,
        revealedTo: new Set([side]),
      });
    });
  }

  drawCards("blue", 5);
  drawCards("red", 5);
  addLog(`Game mode: ${GAME_MODES[state.gameMode].name}. ${GAME_MODES[state.gameMode].description}`);
  if (isMultiplayer) {
    addLog(`Admiral Blue proposed ${GAME_MODES[state.gameMode].name}. Admiral Red must confirm the game mode.`);
    addLog("Deployment begins after game mode confirmation. Admiral Blue may rearrange ships inside rows 1-3, then lock setup.");
    addLog(`Connected as ${playerName(multiplayerSeat.color)}. The board will update when your opponent acts.`);
  } else {
    addLog("Deployment begins. Blue may rearrange ships inside rows 1-3, then lock setup.");
  }
  render();
}

function randomSide() {
  return Math.random() < 0.5 ? "blue" : "red";
}

function buildDeck() {
  const deck = [];
  for (const card of CARD_LIBRARY) deck.push({ ...card, instanceId: `${card.id}-${Math.random()}` });
  return shuffle(deck);
}

function shuffle(cards) {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function drawCards(side, count) {
  for (let i = 0; i < count; i++) {
    if (!state.decks[side].length) state.decks[side] = buildDeck();
    state.hands[side].push(state.decks[side].pop());
  }
}

function addLog(message) {
  state.log.push(message);
  if (state.log.length > 80) state.log.shift();
}

function coord(x, y) {
  return `${FILES[x]}${BOARD_SIZE - y}`;
}

function key(x, y) {
  return `${x},${y}`;
}

function isInside(x, y) {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

function playerName(side) {
  if (!side) return "Admiral";
  const username = state.playerNames?.[side];
  if (username) return `Admiral ${username}`;
  return side === "blue" ? "Admiral Blue" : "Admiral Red";
}

function gameModeObjective(mode = gameModeSelect.value) {
  const selectedMode = GAME_MODES[mode] || GAME_MODES.classic;
  return `${selectedMode.name}: ${selectedMode.description}`;
}

function updateGameModeTooltip() {
  const objective = gameModeObjective();
  gameModeSelect.title = objective;
  gameModeSelect.closest(".mode-select").title = objective;
  Array.from(gameModeSelect.options).forEach((option) => {
    option.title = gameModeObjective(option.value);
  });
}

function enemyOf(side) {
  return side === "blue" ? "red" : "blue";
}

function pieceAt(x, y) {
  return state.pieces.find((piece) => piece.x === x && piece.y === y);
}

function mineAt(x, y) {
  return state.mines.find((mine) => mine.x === x && mine.y === y);
}

function currentAt(x, y) {
  return state.currents.find((current) => Math.abs(x - current.x) <= 1 && Math.abs(y - current.y) <= 1);
}

function selectedPiece() {
  return state.pieces.find((piece) => piece.id === state.selectedId) || null;
}

function movedPiece() {
  return state.pieces.find((piece) => piece.id === state.movedPieceId) || null;
}

function getDirectionalSteps(pattern, side) {
  if (pattern === "any") {
    return [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];
  }
  if (pattern === "orthogonal") return [[1, 0], [-1, 0], [0, 1], [0, -1]];
  if (pattern === "diagonal") return [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  if (pattern === "pawnMove") return [[0, side === "blue" ? 1 : -1]];
  if (pattern === "pawnAttack") {
    const dy = side === "blue" ? 1 : -1;
    return [[1, dy], [-1, dy]];
  }
  return [];
}

function knightSquares(piece) {
  const squares = [];
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      const distance = Math.abs(dx) + Math.abs(dy);
      if (!distance || distance > 3) continue;
      const x = piece.x + dx;
      const y = piece.y + dy;
      if (isInside(x, y)) squares.push({ x, y });
    }
  }
  return squares;
}

function pathIsClear(piece, x, y) {
  const dx = Math.sign(x - piece.x);
  const dy = Math.sign(y - piece.y);
  let cx = piece.x + dx;
  let cy = piece.y + dy;
  while (cx !== x || cy !== y) {
    if (pieceAt(cx, cy)) return false;
    cx += dx;
    cy += dy;
  }
  return true;
}

function commandBuffFor(pieceOrId) {
  const id = typeof pieceOrId === "string" ? pieceOrId : pieceOrId?.id;
  return id ? state.commandBuffs[id] : null;
}

function setCommandBuff(piece, values) {
  state.commandBuffs[piece.id] = {
    side: piece.side,
    move: 0,
    attack: 0,
    shield: 0,
    ...values,
  };
}

function clearEmptyCommandBuff(pieceId) {
  const buff = commandBuffFor(pieceId);
  if (!buff) return;
  if ((buff.move || 0) <= 0 && (buff.attack || 0) <= 0 && (buff.shield || 0) <= 0) {
    delete state.commandBuffs[pieceId];
  }
}

function clearCommandBuffs(side, timing) {
  for (const [pieceId, buff] of Object.entries(state.commandBuffs)) {
    if (buff.side !== side) continue;
    if (timing === "turnEnd") {
      buff.move = 0;
      buff.attack = 0;
    }
    if (timing === "turnStart") {
      buff.shield = 0;
    }
    clearEmptyCommandBuff(pieceId);
  }
}

function legalSquares(piece, mode) {
  const def = PIECES[piece.type];
  const commandBuff = commandBuffFor(piece);
  let pattern = mode === "move" ? def.movement : def.targeting;
  let range =
    mode === "move"
      ? def.moveRange + state.moveBonus[piece.side] + (commandBuff?.move || 0)
      : def.targetRange + state.rangeBonus[piece.side];
  if (mode === "target" && state.torpedo[piece.side]) pattern = "knight";

  if (pattern === "knight") {
    return filterSuppressed(piece.side, knightSquares(piece).filter((sq) => !sameSideAt(piece.side, sq.x, sq.y)));
  }

  const squares = [];
  for (const [dx, dy] of getDirectionalSteps(pattern, piece.side)) {
    for (let distance = 1; distance <= range; distance++) {
      const x = piece.x + dx * distance;
      const y = piece.y + dy * distance;
      if (!isInside(x, y)) break;
      const occupant = pieceAt(x, y);

      if (mode === "move") {
        if (occupant?.side === piece.side) break;
        if (!isSuppressedFor(piece.side, x, y)) squares.push({ x, y });
        if (occupant) break;
      } else {
        if (occupant?.side !== piece.side && !isSuppressedFor(piece.side, x, y)) squares.push({ x, y });
      }
    }
  }
  return squares;
}

function filterSuppressed(side, squares) {
  return squares.filter((sq) => !isSuppressedFor(side, sq.x, sq.y));
}

function isSuppressedFor(side, x, y) {
  return state.suppressiveZones.some((zone) => zone.side === side && Math.abs(x - zone.x) <= 1 && Math.abs(y - zone.y) <= 1);
}

function sameSideAt(side, x, y) {
  return pieceAt(x, y)?.side === side;
}

function canSelect(piece) {
  if (!piece || state.gameOver) return false;
  if (!canUseActiveTurn()) return false;
  if (isMultiplayer && piece.side !== multiplayerSeat.color) return false;
  if (state.immobile.has(piece.id)) return false;
  if (state.reaction) return piece.side === state.reaction.side;
  if (piece.side !== state.active) return false;
  if (state.phase === "setup") return piece.side === state.setupSide;
  if (state.phase === "commandMove") return piece.id === state.commandedPieceId;
  if (state.phase === "move") return true;
  return piece.id === state.movedPieceId;
}

function choosePiece(piece) {
  if (!canSelect(piece)) return;
  state.selectedId = piece.id;
  state.actionMode = null;
  render();
}

function handleCellClick(x, y) {
  if (state.gameOver) return;
  if (!canUseActiveTurn()) return;
  const piece = pieceAt(x, y);

  if (state.phase === "setup") {
    handleSetupClick(piece, x, y);
    return;
  }

  if (state.phase === "currentSetup") {
    handleCurrentSetupClick(x, y);
    return;
  }

  if (state.reaction) {
    if (state.specialMode) {
      handleSpecialClick(x, y);
      return;
    }
    if (piece && canSelect(piece)) choosePiece(piece);
    return;
  }

  if (state.commandMode) {
    issueCommand(piece);
    return;
  }

  if (state.specialMode) {
    handleSpecialClick(x, y);
    return;
  }

  if (piece && canSelect(piece)) {
    choosePiece(piece);
    return;
  }

  const selected = selectedPiece();

  if (!selected) return;

  if (state.phase === "move" || state.phase === "commandMove") {
    moveSelectedTo(selected, x, y);
    return;
  }

  if (state.phase === "action") {
    if (state.actionMode === "recon") reconSquare(selected, x, y);
    else if (state.actionMode === "mine") deployMine(selected, x, y);
    else attackSquare(selected, x, y);
  }
}

function handleSetupClick(piece, x, y) {
  if (piece && piece.side === state.setupSide) {
    state.selectedId = piece.id;
    render();
    return;
  }

  const selected = selectedPiece();
  if (!selected || !isDeploymentSquare(state.setupSide, selected.type, x, y) || pieceAt(x, y)) return;
  selected.x = x;
  selected.y = y;
  addLog(`${playerName(state.setupSide)} placed ${PIECES[selected.type].title} at ${coord(x, y)}.`);
  render();
}

function isDeploymentSquare(side, type, x, y) {
  const rows = side === "blue" ? [0, 1, 2] : [9, 10, 11];
  const namedRows = side === "blue" ? [0, 1] : [10, 11];
  const pawnRows = side === "blue" ? [1, 2] : [9, 10];
  return type === "pawn" ? pawnRows.includes(y) : namedRows.includes(y);
}

function randomizeDeployment() {
  if (state.phase !== "setup" || state.gameOver || !canUseActiveTurn()) return;
  const side = state.setupSide;
  const pieces = state.pieces.filter((piece) => piece.side === side);
  const occupied = new Set(state.pieces.filter((piece) => piece.side !== side).map((piece) => key(piece.x, piece.y)));
  const shuffledPawns = shuffle(deploymentSquaresFor(side, "pawn"));
  const shuffledNamed = shuffle(deploymentSquaresFor(side, "king"));
  const orderedPieces = [
    ...shuffle(pieces.filter((piece) => piece.type === "pawn")),
    ...shuffle(pieces.filter((piece) => piece.type !== "pawn")),
  ];

  for (const piece of orderedPieces) {
    const pool = piece.type === "pawn" ? shuffledPawns : shuffledNamed;
    const square = takeAvailableSquare(pool, occupied);
    if (!square) return;
    piece.x = square.x;
    piece.y = square.y;
    occupied.add(key(square.x, square.y));
  }

  state.selectedId = null;
  addLog(`${playerName(side)} randomized deployment within legal setup zones.`);
  render();
}

function takeAvailableSquare(pool, occupied) {
  while (pool.length) {
    const square = pool.pop();
    if (!occupied.has(key(square.x, square.y))) return square;
  }
  return null;
}

function deploymentSquaresFor(side, type) {
  const squares = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (isDeploymentSquare(side, type, x, y)) squares.push({ x, y });
    }
  }
  return squares;
}

function handleCurrentSetupClick(x, y) {
  if (!isValidCurrentAnchor(x, y, state.setupSide) || currentZoneOverlaps(x, y)) return;
  state.currents.push({ id: `${state.setupSide}-current-${state.currents.length}`, side: state.setupSide, x, y, revealedTo: new Set([state.setupSide]) });
  addLog(`${playerName(state.setupSide)} placed Shifting Currents centered on ${coord(x, y)}.`);
  if (state.setupSide === "blue") {
    state.setupSide = "red";
    state.active = "red";
    addLog("Red places the second Shifting Currents zone.");
  } else {
    state.setupSide = null;
    state.active = state.initiativeSide || randomSide();
    state.phase = "move";
    state.initiativeToastKey = `${Date.now()}:${state.active}`;
    addLog(`Shifting Currents placed. Battle begins. ${playerName(state.active)} has initiative.`);
  }
  render();
}

function isValidCurrentAnchor(x, y, side = state.active) {
  if (x < 1 || x > BOARD_SIZE - 2 || y < 1 || y > BOARD_SIZE - 2) return false;
  const minY = side === "blue" ? 1 : 7;
  const maxY = side === "blue" ? 4 : 10;
  return y >= minY && y <= maxY;
}

function currentZoneOverlaps(x, y) {
  for (let yy = y - 1; yy <= y + 1; yy++) {
    for (let xx = x - 1; xx <= x + 1; xx++) {
      if (currentAt(xx, yy)) return true;
    }
  }
  return false;
}

function squareInList(x, y, squares) {
  return squares.some((sq) => sq.x === x && sq.y === y);
}

function traveledPathSquares() {
  if (!state.lastMove) return [];
  return pathBetween(state.lastMove.from, state.lastMove.to);
}

function pathBetween(from, to) {
  const totalDx = to.x - from.x;
  const totalDy = to.y - from.y;
  if (totalDx && totalDy && Math.abs(totalDx) !== Math.abs(totalDy)) {
    return [from, to];
  }
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  const squares = [];
  let x = from.x;
  let y = from.y;
  while (x !== to.x || y !== to.y) {
    squares.push({ x, y });
    x += dx;
    y += dy;
  }
  squares.push({ x: to.x, y: to.y });
  return squares;
}

function legalMineSquares() {
  const piece = movedPiece();
  if (!piece || !state.lastMove) return [];
  return traveledPathSquares().filter((sq) => !pieceAt(sq.x, sq.y) && !mineAt(sq.x, sq.y));
}

function moveSelectedTo(piece, x, y) {
  if (state.movedPieceId) return;
  const legal = legalSquares(piece, "move");
  if (!squareInList(x, y, legal)) return;
  if (state.steadyShot[piece.side] && state.steadyShot[piece.side] !== piece.id) {
    state.steadyShot[piece.side] = null;
    addLog(`${playerName(piece.side)} lost Steady Shot by activating a different ship.`);
  }

  const from = { x: piece.x, y: piece.y };
  const occupant = pieceAt(x, y);
  state.contacts[enemyOf(piece.side)].add(key(x, y));

  if (resolveCurrentEntry(piece, from, { x, y })) {
    if (state.gameOver || state.active !== piece.side) {
      render();
      return;
    }
    state.lastMove = { from, to: { x: piece.x, y: piece.y } };
    state.movedPieceId = piece.id;
    state.selectedId = piece.id;
    promoteIfNeeded(piece);
    if (!state.gameOver) addLog("Movement complete. Play any Movement Phase cards, then begin Targeting.");
    render();
    return;
  }

  if (occupant && occupant.side !== piece.side) {
    const rammingEndedTurn = resolveRamming(piece, occupant, from);
    if (rammingEndedTurn) {
      return;
    }
  } else {
    piece.x = x;
    piece.y = y;
    resolveMineEntry(piece);
    resolveOverwatch(piece);
    addLog(`${playerName(piece.side)} moved to ${coord(piece.x, piece.y)}.`);
  }

  state.lastMove = { from, to: { x: piece.x, y: piece.y } };
  state.movedPieceId = piece.id;
  state.selectedId = piece.id;
  promoteIfNeeded(piece);
  if (!state.gameOver) addLog("Movement complete. Play any Movement Phase cards, then begin Targeting.");
  render();
}

function resolveCurrentEntry(piece, from, to = { x: piece.x, y: piece.y }, visited = new Set()) {
  const entered = firstEnteredCurrent(from, to, visited);
  const current = entered?.current;
  if (!current) return false;
  visited.add(current.id);
  piece.x = entered.square.x;
  piece.y = entered.square.y;
  current.revealedTo = current.revealedTo || new Set([current.side]);
  current.revealedTo.add(piece.side);
  state.currentAffectedPieceId = piece.id;
  const dx = Math.sign(piece.x - from.x);
  const dy = Math.sign(piece.y - from.y);
  const forward = Math.random() >= 0.5;
  const drift = { x: piece.x + (forward ? dx : -dx), y: piece.y + (forward ? dy : -dy) };
  addLog(`${attackerDescription(piece)} entered Shifting Currents and drifted ${forward ? "forward" : "backward"}.`);
  if (isInside(drift.x, drift.y)) {
    const occupant = pieceAt(drift.x, drift.y);
    if (occupant && occupant.side !== piece.side) {
      const endedTurn = resolveRamming(piece, occupant, { x: piece.x, y: piece.y });
      if (endedTurn || state.gameOver || state.active !== piece.side) return true;
    }
    else if (!occupant) {
      const driftFrom = { x: piece.x, y: piece.y };
      piece.x = drift.x;
      piece.y = drift.y;
      resolveMineEntry(piece);
      resolveCurrentEntry(piece, driftFrom, drift, visited);
    }
  }
  if (!state.pendingCurrentShifts.includes(current)) {
    state.pendingCurrentShifts.push(current);
    addLog(`${playerName(current.side)} will roll to shift this Shifting Current after the Targeting Phase.`);
  }
  return true;
}

function firstEnteredCurrent(from, to, visited = new Set()) {
  let previousCurrent = currentAt(from.x, from.y);
  for (const square of pathBetween(from, to).slice(1)) {
    const current = currentAt(square.x, square.y);
    if (current && current !== previousCurrent && !visited.has(current.id)) return { current, square };
    previousCurrent = current;
  }
  return null;
}

function shiftCurrent(current) {
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  const [dirX, dirY] = directions[Math.floor(Math.random() * directions.length)];
  const dx = dirX * 3;
  const dy = dirY * 3;
  current.x = Math.max(1, Math.min(BOARD_SIZE - 2, current.x + dx));
  current.y = Math.max(1, Math.min(BOARD_SIZE - 2, current.y + dy));
  addLog(`Shifting Currents shifted and is now centered on ${coord(current.x, current.y)}.`);
}

function resolveRamming(attacker, defender, from) {
  const direction = {
    x: Math.sign(defender.x - from.x),
    y: Math.sign(defender.y - from.y),
  };
  const back = {
    x: defender.x - direction.x,
    y: defender.y - direction.y,
  };
  revealPiece(attacker, defender.side);
  revealPiece(defender, attacker.side);
  damagePiece(attacker, 1, "ramming");
  damagePiece(defender, 1, "ramming");
  const attackerDestroyed = !state.pieces.some((piece) => piece.id === attacker.id);
  const defenderDestroyed = !state.pieces.some((piece) => piece.id === defender.id);

  if (!attackerDestroyed && isInside(back.x, back.y) && !pieceAt(back.x, back.y)) {
    attacker.x = back.x;
    attacker.y = back.y;
  }

  addLog(`${attackerDescription(attacker)} rammed ${attackerDescription(defender)} at ${coord(defender.x, defender.y)}. Both ships took 1 damage.`);
  if (!state.gameOver && attackerDestroyed) {
    addLog("The ramming ship was destroyed, ending the active fleet's turn.");
    endTurn(true);
    return true;
  }
  if (!state.gameOver && defenderDestroyed) {
    addLog("The rammed ship was destroyed. The ramming fleet may continue to Targeting Phase.");
  }
  return false;
}

function resolveMineEntry(piece) {
  const mine = mineAt(piece.x, piece.y);
  if (!mine) return;
  if (mine.side === piece.side) {
    addLog(`${playerName(piece.side)} revealed a friendly mine at ${coord(piece.x, piece.y)}.`);
    return;
  }
  damagePiece(piece, 2, "mine");
  state.mines = state.mines.filter((m) => m !== mine);
  addLog(`${attackerDescription(piece)} struck a mine at ${coord(piece.x, piece.y)} for 2 damage.`);
}

function promoteIfNeeded(piece) {
  if (piece.type !== "pawn") return;
  if ((piece.side === "blue" && piece.y === BOARD_SIZE - 1) || (piece.side === "red" && piece.y === 0)) {
    piece.type = "queen";
    piece.maxHp = PIECES.queen.hp;
    piece.hp = PIECES.queen.hp;
    addLog(`${playerName(piece.side)} promoted a Pawn Corvette into a Queen Dreadnought.`);
  }
}

function attackSquare(piece, x, y) {
  if (state.actionTaken) return;
  const legal = legalSquares(piece, "target");
  if (!squareInList(x, y, legal)) return;
  performShot(piece, x, y, { finish: true });
}

function performShot(piece, x, y, options = {}) {
  const finish = options.finish !== false;
  if (pieceAt(x, y)?.side === piece.side) return false;
  recordShot(piece.side, x, y);

  let damage = (options.damage ?? 1) + state.attackBonus[piece.side];
  const commandBuff = commandBuffFor(piece);
  if (commandBuff?.attack > 0) {
    damage += commandBuff.attack;
    commandBuff.attack = 0;
    clearEmptyCommandBuff(piece.id);
  }
  if (state.steadyShot[piece.side] === piece.id) {
    damage += 1;
    state.steadyShot[piece.side] = null;
  }

  if (state.currentAffectedPieceId === piece.id && Math.random() >= 0.5) {
    addLog(`${attackerDescription(piece)} fired from Shifting Currents and the shot drifted wide.`);
    state.lastSuccessfulHit = null;
    if (finish) clearActionModifiers(piece.side);
    if (finish) finishAction();
    return false;
  }

  const mine = mineAt(x, y);
  if (mine && mine.side !== piece.side) {
    state.mines = state.mines.filter((m) => m !== mine);
    addLog(`${playerName(piece.side)} fired on ${coord(x, y)} and detonated a hidden mine.`);
    state.lastSuccessfulHit = null;
    if (finish) finishAction();
    return true;
  }

  const target = pieceAt(x, y);
  if (!target) {
    addLog(`${playerName(piece.side)} fired on ${coord(x, y)} and missed.`);
    state.lastSuccessfulHit = null;
    if (finish) finishAction();
    return false;
  }

  state.contacts[piece.side].add(key(x, y));
  const targetHpBefore = target.hp;
  if (state.defensive[target.side]) damage = Math.max(0, damage - 1);
  if (state.armor[target.side]) damage = Math.max(0, damage - 2);
  if (state.shielded.has(target.id)) {
    damage = 0;
    state.shielded.delete(target.id);
    addLog(`${attackerDescription(target)} ignored the hit with Shielded status.`);
  }
  const appliedDamage = damagePiece(target, damage, "attack", piece);
  state.lastSuccessfulHit = appliedDamage > 0 ? { side: piece.side, pieceId: piece.id, x, y } : null;
  const targetName = target.revealedTo.has(piece.side) ? attackerDescription(target) : `${playerName(target.side)} hidden ship`;
  addLog(`${attackerDescription(piece)} hit ${targetName} at ${coord(x, y)} for ${appliedDamage} damage.`);
  if (state.active !== piece.side || state.gameOver) return appliedDamage > 0;
  if (appliedDamage > 0 && targetHpBefore > appliedDamage && state.counterBattery.has(target.id) && state.pieces.some((candidate) => candidate.id === target.id)) {
    state.counterBattery.delete(target.id);
    performShot(target, piece.x, piece.y, { finish: false });
    addLog(`${attackerDescription(target)} returned fire with Counter-Battery.`);
  }
  if (finish) clearActionModifiers(piece.side);
  if (finish) finishAction();
  return true;
}

function recordShot(shooterSide, x, y) {
  state.shots[enemyOf(shooterSide)].add(key(x, y));
}

function specialPiece() {
  return state.pieces.find((piece) => piece.id === state.specialData?.pieceId) || movedPiece() || selectedPiece();
}

function handleSpecialClick(x, y) {
  const piece = specialPiece();
  if (!piece) return;
  if (state.specialMode === "evasiveRoll") {
    if (Math.abs(piece.x - x) === 1 && Math.abs(piece.y - y) === 1 && !pieceAt(x, y)) {
      piece.x = x;
      piece.y = y;
      addLog(`${attackerDescription(piece)} used Evasive Roll to dodge to ${coord(x, y)}.`);
      clearSpecialMode();
      if (state.reaction?.cardPlayed) {
        completeReactionWindow();
        return;
      }
      render();
    }
    return;
  }
  if (state.specialMode === "royalCommand") {
    const picks = state.specialData.picks;
    if (!picks.length) {
      const target = pieceAt(x, y);
      if (!target || target.side !== piece.side || target.id === piece.id || distance(piece, target) > 3) return;
      picks.push({ pieceId: target.id, casterId: piece.id });
      state.specialData.pieceId = target.id;
      addLog(`Royal Command: select the reposition destination for ${attackerDescription(target)}.`);
      render();
      return;
    }
    const caster = state.pieces.find((candidate) => candidate.id === picks[0].casterId);
    if (caster && distance(caster, { x, y }) <= 3 && !pieceAt(x, y)) {
      piece.x = x;
      piece.y = y;
      addLog(`${attackerDescription(piece)} was repositioned by Royal Command to ${coord(x, y)}.`);
      finishCardEffect(piece);
    }
    return;
  }
  if (state.specialMode === "callGuard") {
    const picks = state.specialData.picks;
    if (!picks.length) {
      const target = pieceAt(x, y);
      if (!target || target.side !== piece.side || target.id === piece.id || distance(piece, target) > 3) return;
      picks.push({ pieceId: target.id, casterId: piece.id });
      state.specialData.pieceId = target.id;
      addLog(`Call the Guard: select an empty square adjacent to ${attackerDescription(piece)}.`);
      render();
      return;
    }
    const caster = state.pieces.find((candidate) => candidate.id === picks[0].casterId);
    if (!caster || distance(caster, { x, y }) > 1 || pieceAt(x, y)) return;
    piece.x = x;
    piece.y = y;
    addLog(`${attackerDescription(piece)} answered Call the Guard at ${coord(x, y)}.`);
    finishCardEffect(piece);
    return;
  }
  if (state.specialMode === "lineBreaker") {
    const legal = legalSquares(piece, "target");
    if (!squareInList(x, y, legal)) return;
    const picks = state.specialData.picks;
    if (!picks.length) {
      picks.push({ x, y });
      addLog("Line Breaker Salvo: select a second target in the same row or column.");
      render();
      return;
    }
    const first = picks[0];
    if ((first.x !== x && first.y !== y) || (first.x === x && first.y === y)) return;
    const bothTargetsOccupied =
      pieceAt(first.x, first.y)?.side === enemyOf(piece.side) &&
      pieceAt(x, y)?.side === enemyOf(piece.side);
    const shotDamage = bothTargetsOccupied ? 2 : 1;
    const firstHit = performShot(piece, first.x, first.y, { finish: false, damage: shotDamage });
    const secondHit = performShot(piece, x, y, { finish: false, damage: shotDamage });
    addLog(`Line Breaker Salvo resolved${firstHit && secondHit ? " with both shots on target" : ""}.`);
    clearActionModifiers(piece.side);
    finishCardEffect(piece);
    return;
  }
  if (state.specialMode === "broadside") {
    const legal = legalSquares(piece, "target");
    if (!squareInList(x, y, legal)) return;
    const picks = state.specialData.picks;
    if (!picks.length) {
      picks.push({ x, y });
      addLog("Broadside Barrage: select an adjacent square in the row or column to set the firing line.");
      render();
      return;
    }
    const first = picks[0];
    const dx = Math.sign(x - first.x);
    const dy = Math.sign(y - first.y);
    if ((dx && dy) || (!dx && !dy) || Math.max(Math.abs(x - first.x), Math.abs(y - first.y)) !== 1) return;
    for (let i = 0; i < 3; i++) {
      const tx = first.x + dx * i;
      const ty = first.y + dy * i;
      if (isInside(tx, ty) && pieceAt(tx, ty)?.side !== piece.side) performShot(piece, tx, ty, { finish: false });
    }
    addLog("Broadside Barrage swept three consecutive squares.");
    clearActionModifiers(piece.side);
    finishCardEffect(piece);
    return;
  }
  if (state.specialMode === "overcharge") {
    const legal = legalSquares(piece, "target");
    if (!squareInList(x, y, legal)) return;
    performShot(piece, x, y, { damage: 2, finish: false });
    addLog("Overcharge Cannons fired an extra shot.");
    state.lastSuccessfulHit = null;
    clearActionModifiers(piece.side);
    finishCardEffect(piece);
    return;
  }
  if (state.specialMode === "surfacingStrike" && state.specialData.picks.length) {
    if (!squareInList(x, y, knightSquares(piece)) || pieceAt(x, y)?.side === piece.side) return;
    performShot(piece, x, y, { damage: 2, finish: false });
    addLog("Surfacing Strike fired a Knight-pattern shot for +1 damage.");
    clearActionModifiers(piece.side);
    finishCardEffect(piece);
    return;
  }
  if (["forwardProbe", "blockadeDrift", "ironAdvance", "ghostWake", "surfacingStrike", "powerPush"].includes(state.specialMode)) {
    if (!squareInList(x, y, specialTargets())) return;
    const from = { x: piece.x, y: piece.y };
    const occupant = pieceAt(x, y);
    if (state.specialMode === "powerPush" && occupant?.side === enemyOf(piece.side)) {
      damagePiece(occupant, 2, "Power Push");
      if (state.pieces.some((candidate) => candidate.id === occupant.id) && resolveRamming(piece, occupant, from)) return;
      addLog(`${attackerDescription(piece)} used Power Push into ${coord(x, y)}.`);
      finishCardEffect(piece);
      return;
    }
    piece.x = x;
    piece.y = y;
    resolveMineEntry(piece);
    resolveCurrentEntry(piece, from, { x, y });
    resolveOverwatch(piece);
    if (!state.pieces.some((candidate) => candidate.id === piece.id) || state.gameOver || state.active !== piece.side) {
      render();
      return;
    }
    state.movedPieceId = piece.id;
    state.selectedId = piece.id;
    addLog(`${attackerDescription(piece)} moved to ${coord(piece.x, piece.y)} with ${state.specialData.cardName}.`);
    if (state.specialMode === "forwardProbe") {
      revealAhead(piece, from, 3);
      state.nextMoveBonus[piece.side] += 1;
    }
    if (state.specialMode === "surfacingStrike") {
      state.specialData.picks.push({ x: piece.x, y: piece.y });
      addLog("Surfacing Strike: select a Knight-fire target.");
      render();
      return;
    } else if (state.specialMode === "powerPush") {
      state.phase = "action";
    } else if (state.specialMode === "ironAdvance") {
      clearSpecialMode();
      state.phase = "action";
      state.actionMode = null;
      addLog("Iron Advance ended the Movement Phase.");
      render();
      return;
    } else {
      state.phase = "action";
    }
    finishCardEffect(piece);
    return;
  }
  if (["refractionShot", "flankFade", "chainAssault", "flagshipBarrage", "suppressiveFire", "sacrificialMark", "overwatchAmbush"].includes(state.specialMode)) {
    resolveTargetSpecial(piece, x, y);
    return;
  }
  if (state.specialMode === "vectorShift") {
    const picks = state.specialData.picks;
    if (!picks.length) {
      if (!squareInList(x, y, specialTargets())) return;
      piece.x = x;
      piece.y = y;
      picks.push({ x, y });
      addLog(`${attackerDescription(piece)} shifted diagonally. Select an enemy-occupied target.`);
      render();
      return;
    }
    if (!squareInList(x, y, legalSquares(piece, "target")) || pieceAt(x, y)?.side !== enemyOf(piece.side)) return;
    const bonus = Math.random() >= 0.5 ? 1 : 0;
    performShot(piece, x, y, { damage: 1 + bonus, finish: false });
    addLog(`Vector Shift ${bonus ? "added +1 damage" : "did not add bonus damage"}.`);
    clearActionModifiers(piece.side);
    finishCardEffect(piece);
  }
}

function clearSpecialMode() {
  state.specialMode = null;
  state.specialData = null;
}

function finishCardEffect(piece = specialPiece()) {
  const cardPhase = state.specialData?.cardPhase || "";
  const returnPhase = cardPhase === "Movement Phase" ? "move" : cardPhase === "Targeting Phase" ? "action" : state.phase;
  clearSpecialMode();
  if (state.reaction?.cardPlayed && cardPhase === "Instant") {
    completeReactionWindow();
    return;
  }
  if (returnPhase === "move" || returnPhase === "commandMove") {
    state.phase = returnPhase;
    state.actionMode = null;
    if (piece?.side === state.active) state.selectedId = piece.id;
  } else if (returnPhase === "action") {
    state.phase = "action";
    if (piece?.side === state.active) {
      state.movedPieceId = state.movedPieceId || piece.id;
      state.selectedId = piece.id;
    }
  }
  render();
}

function specialTargets() {
  const piece = specialPiece();
  if (!piece || !state.specialMode) return [];
  if (state.specialMode === "evasiveRoll") {
    return getDirectionalSteps("diagonal", piece.side)
      .map(([dx, dy]) => ({ x: piece.x + dx, y: piece.y + dy }))
      .filter((sq) => isInside(sq.x, sq.y) && !pieceAt(sq.x, sq.y));
  }
  if (state.specialMode === "royalCommand") {
    const picks = state.specialData?.picks || [];
    if (!picks.length) return radiusSquares(piece, 3, { friendlyOnly: true });
    const caster = state.pieces.find((candidate) => candidate.id === picks[0].casterId);
    if (!caster) return [];
    const squares = [];
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        const x = caster.x + dx;
        const y = caster.y + dy;
        if ((dx || dy) && isInside(x, y) && distance(caster, { x, y }) <= 3 && !pieceAt(x, y)) squares.push({ x, y });
      }
    }
    return squares;
  }
  if (state.specialMode === "callGuard") {
    const picks = state.specialData?.picks || [];
    if (!picks.length) return radiusSquares(piece, 3, { friendlyOnly: true });
    const caster = state.pieces.find((candidate) => candidate.id === picks[0].casterId);
    if (!caster) return [];
    return radiusSquares(caster, 1, { emptyOnly: true });
  }
  if (["lineBreaker", "broadside", "overcharge"].includes(state.specialMode)) return legalSquares(piece, "target");
  if (state.specialMode === "forwardProbe") return movementSquaresWithBonus(piece, 2);
  if (state.specialMode === "blockadeDrift") return anyDirectionSquares(piece, PIECES[piece.type].moveRange + 2, { emptyOnly: true });
  if (state.specialMode === "ironAdvance") return straightSquares(piece, PIECES[piece.type].moveRange + 3, { emptyOnly: true, passFriendly: true });
  if (state.specialMode === "ghostWake") return ghostWakeSquares(piece);
  if (state.specialMode === "surfacingStrike" && !state.specialData?.picks?.length) return knightSquares(piece).filter((sq) => !pieceAt(sq.x, sq.y));
  if (state.specialMode === "surfacingStrike") return knightSquares(piece).filter((sq) => !sameSideAt(piece.side, sq.x, sq.y));
  if (state.specialMode === "powerPush") return straightSquares(piece, 3, { emptyOrEnemy: true, bypass: false });
  if (state.specialMode === "vectorShift" && !state.specialData?.picks?.length) {
    return getDirectionalSteps("diagonal", piece.side)
      .map(([dx, dy]) => ({ x: piece.x + dx, y: piece.y + dy }))
      .filter((sq) => isInside(sq.x, sq.y) && !pieceAt(sq.x, sq.y));
  }
  if (state.specialMode === "vectorShift") return legalSquares(piece, "target").filter((sq) => pieceAt(sq.x, sq.y)?.side === enemyOf(piece.side));
  if (["refractionShot", "flankFade", "chainAssault", "flagshipBarrage"].includes(state.specialMode)) return legalSquares(piece, "target");
  if (["suppressiveFire", "overwatchAmbush"].includes(state.specialMode)) return legalSquares(piece, "target");
  if (state.specialMode === "sacrificialMark") return radiusSquares(piece, 2, { friendlyOnly: true });
  return [];
}

function revealKnightReachableOccupancy(piece) {
  let found = 0;
  for (const sq of knightSquares(piece)) {
    const target = pieceAt(sq.x, sq.y);
    const mine = mineAt(sq.x, sq.y);
    if ((target && target.side !== piece.side) || (mine && mine.side !== piece.side)) {
      state.contacts[piece.side].add(key(sq.x, sq.y));
      if (mine && mine.side !== piece.side) state.mineContacts[piece.side].add(key(sq.x, sq.y));
      found += 1;
    }
  }
  addLog(`${attackerDescription(piece)} used Feint and detected ${found} occupied reachable square${found === 1 ? "" : "s"}.`);
}

function promotionBurst(piece) {
  let hits = 0;
  for (const [dx, dy] of getDirectionalSteps("any", piece.side)) {
    for (let i = 1; i < BOARD_SIZE; i++) {
      const x = piece.x + dx * i;
      const y = piece.y + dy * i;
      if (!isInside(x, y)) break;
      const target = pieceAt(x, y);
      if (!target) continue;
      if (target.side === piece.side) break;
      recordShot(piece.side, x, y);
      state.contacts[piece.side].add(key(x, y));
      const appliedDamage = damagePiece(target, 1, "Promotion Burst", piece);
      const targetName = target.revealedTo.has(piece.side) ? attackerDescription(target) : `${playerName(target.side)} hidden ship`;
      addLog(`${attackerDescription(piece)} hit ${targetName} at ${coord(x, y)} with Promotion Burst for ${appliedDamage} damage.`);
      hits += 1;
      break;
    }
  }
  addLog(`${attackerDescription(piece)} unleashed Promotion Burst in all directions and hit ${hits} target${hits === 1 ? "" : "s"}.`);
  clearActionModifiers(piece.side);
}

function resolveTargetSpecial(piece, x, y) {
  if (state.specialMode === "sacrificialMark") {
    const target = pieceAt(x, y);
    if (!target || target.side !== piece.side || target.id === piece.id || distance(piece, target) > 2) return;
    state.sacrificialMarks.push({ ownerId: piece.id, targetId: target.id, side: piece.side, turns: 2 });
    addLog(`${attackerDescription(piece)} marked ${attackerDescription(target)} with Sacrificial Mark.`);
    finishCardEffect(piece);
    if (state.reaction?.cardPlayed) {
      completeReactionWindow();
      return;
    }
    return;
  }
  if (state.specialMode === "suppressiveFire") {
    if (!squareInList(x, y, legalSquares(piece, "target"))) return;
    state.suppressiveZones.push({ side: enemyOf(piece.side), x, y, turns: 1 });
    addLog(`${playerName(piece.side)} suppressed the 3x3 zone centered on ${coord(x, y)}.`);
    finishCardEffect(piece);
    return;
  }
  if (state.specialMode === "overwatchAmbush") {
    if (!squareInList(x, y, legalSquares(piece, "target"))) return;
    state.overwatch.push({ pieceId: piece.id, side: piece.side, x, y, turns: 2 });
    addLog(`${attackerDescription(piece)} set Overwatch Ambush centered on ${coord(x, y)}.`);
    finishCardEffect(piece);
    return;
  }
  if (state.specialMode === "flagshipBarrage") {
    if (!squareInList(x, y, legalSquares(piece, "target"))) return;
    const picks = state.specialData.picks;
    picks.push({ x, y });
    performShot(piece, x, y, { finish: false });
    if (picks.length < 2) {
      addLog("Flagship Barrage: select the second shot.");
      render();
      return;
    }
    clearActionModifiers(piece.side);
    finishCardEffect(piece);
    return;
  }
  if (state.specialMode === "refractionShot") {
    const legal = legalSquares(piece, "target");
    if (!squareInList(x, y, legal)) return;
    const hitTarget = pieceAt(x, y);
    if (!hitTarget || hitTarget.side === piece.side) return;
    const hit = performShot(piece, x, y, { finish: false });
    if (hit) resolveRefractionRicochet(piece, x, y);
    addLog("Refraction Shot ricocheted behind the target.");
    clearActionModifiers(piece.side);
    finishCardEffect(piece);
    return;
  }
  if (state.specialMode === "flankFade") {
    const picks = state.specialData.picks;
    if (!picks.length) {
      if (!squareInList(x, y, knightSquares(piece)) || pieceAt(x, y)?.side !== enemyOf(piece.side)) return;
      performShot(piece, x, y, { finish: false });
      picks.push({ x, y });
      addLog("Flank-and-Fade: select an empty Knight-move destination.");
      render();
      return;
    }
    if (!squareInList(x, y, knightSquares(piece)) || pieceAt(x, y)) return;
    piece.x = x;
    piece.y = y;
    addLog(`${attackerDescription(piece)} faded to ${coord(x, y)}.`);
    clearActionModifiers(piece.side);
    finishCardEffect(piece);
    return;
  }
  if (state.specialMode === "chainAssault") {
    const picks = state.specialData.picks;
    if (!picks.length) {
      if (!squareInList(x, y, legalSquares(piece, "target"))) return;
      performShot(piece, x, y, { finish: false });
      picks.push({ x, y });
      addLog("Chain Assault: select an empty Knight-move position.");
      render();
      return;
    }
    if (picks.length === 1) {
      if (!squareInList(x, y, knightSquares(piece)) || pieceAt(x, y)) return;
      piece.x = x;
      piece.y = y;
      picks.push({ x, y });
      addLog("Chain Assault: select the second target.");
      render();
      return;
    }
    if (!squareInList(x, y, legalSquares(piece, "target"))) return;
    performShot(piece, x, y, { finish: false });
    clearActionModifiers(piece.side);
    finishCardEffect(piece);
  }
}

function radiusSquares(piece, radius, options = {}) {
  const squares = [];
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      if (!dx && !dy) continue;
      const x = piece.x + dx;
      const y = piece.y + dy;
      if (!isInside(x, y) || distance(piece, { x, y }) > radius) continue;
      const occupant = pieceAt(x, y);
      if (options.emptyOnly && occupant) continue;
      if (options.enemyOnly && occupant?.side !== enemyOf(piece.side)) continue;
      if (options.friendlyOnly && (occupant?.side !== piece.side || occupant.id === piece.id)) continue;
      squares.push({ x, y });
    }
  }
  return squares;
}

function allBoardSquares() {
  const squares = [];
  for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) squares.push({ x, y });
  return squares;
}

function raySquares(piece, [dx, dy], range, options = {}) {
  const squares = [];
  for (let i = 1; i <= range; i++) {
    const x = piece.x + dx * i;
    const y = piece.y + dy * i;
    if (!isInside(x, y)) break;
    const occupant = pieceAt(x, y);
    if (options.emptyOnly && occupant) {
      if (options.passFriendly && occupant.side === piece.side) continue;
      if (options.bypass) continue;
      break;
    }
    if (options.emptyOrEnemy && occupant?.side === piece.side) continue;
    squares.push({ x, y });
    if (options.emptyOrEnemy && occupant) break;
  }
  return squares;
}

function getForwardStep(side) {
  return [0, side === "blue" ? 1 : -1];
}

function straightSquares(piece, range, options = {}) {
  return getDirectionalSteps("orthogonal", piece.side).flatMap((step) => raySquares(piece, step, range, options));
}

function diagonalSquares(piece, range, options = {}) {
  return getDirectionalSteps("diagonal", piece.side).flatMap((step) => raySquares(piece, step, range, options));
}

function movementSquaresWithBonus(piece, bonus) {
  const original = state.moveBonus[piece.side];
  state.moveBonus[piece.side] += bonus;
  const squares = legalSquares(piece, "move");
  state.moveBonus[piece.side] = original;
  return squares;
}

function anyDirectionSquares(piece, range, options = {}) {
  return getDirectionalSteps("any", piece.side).flatMap((step) => raySquares(piece, step, range, options));
}

function ghostWakeSquares(piece) {
  const range = PIECES[piece.type].moveRange + state.moveBonus[piece.side] + (commandBuffFor(piece)?.move || 0);
  return getDirectionalSteps("diagonal", piece.side).flatMap(([dx, dy]) => {
    const squares = [];
    for (let i = 1; i <= range; i++) {
      const x = piece.x + dx * i;
      const y = piece.y + dy * i;
      if (!isInside(x, y)) break;
      const occupant = pieceAt(x, y);
      if (!occupant) {
        squares.push({ x, y });
        continue;
      }
      if (occupant.side !== piece.side) {
        const beyond = { x: x + dx, y: y + dy };
        if (isInside(beyond.x, beyond.y) && !pieceAt(beyond.x, beyond.y)) squares.push(beyond);
      }
      break;
    }
    return squares;
  });
}

function revealAhead(piece, from, range) {
  const forwardY = piece.side === "blue" ? 1 : -1;
  const scanSteps = [[0, forwardY], [-1, forwardY], [1, forwardY]];
  let found = 0;
  for (const step of scanSteps) {
    for (const sq of raySquares(piece, step, range)) {
      const target = pieceAt(sq.x, sq.y);
      const mine = mineAt(sq.x, sq.y);
      if (target && target.side !== piece.side) {
        revealPiece(target, piece.side);
        state.contacts[piece.side].add(key(sq.x, sq.y));
        found += 1;
      } else if (mine && mine.side !== piece.side) {
        state.mineContacts[piece.side].add(key(sq.x, sq.y));
        found += 1;
      }
    }
  }
  addLog(`${attackerDescription(piece)} completed Forward Probe and detected ${found} contact${found === 1 ? "" : "s"} ahead.`);
}

function resolveRefractionRicochet(piece, hitX, hitY) {
  const candidates = [];
  for (const [dx, dy] of getDirectionalSteps("diagonal", piece.side)) {
    for (let i = 1; i <= 2; i++) {
      const x = hitX + dx * i;
      const y = hitY + dy * i;
      if (!isInside(x, y)) break;
      const target = pieceAt(x, y);
      if (target?.side === enemyOf(piece.side)) candidates.push({ target, x, y, distance: i });
    }
  }
  candidates.sort((a, b) => a.distance - b.distance);
  const ricochet = candidates[0];
  if (!ricochet) {
    addLog("Refraction Shot found no ricochet target.");
    return;
  }
  recordShot(piece.side, ricochet.x, ricochet.y);
  state.contacts[piece.side].add(key(ricochet.x, ricochet.y));
  damagePiece(ricochet.target, 1, "Refraction Shot", piece);
  addLog(`Refraction Shot ricocheted into an enemy ship at ${coord(ricochet.x, ricochet.y)} for 1 damage.`);
}

function reconSquare(piece, x, y) {
  const legal = legalSquares(piece, "target");
  if (!squareInList(x, y, legal)) return;
  const target = pieceAt(x, y);
  const mine = mineAt(x, y);
  if (target && target.side !== piece.side) {
    state.contacts[piece.side].add(key(x, y));
    addLog(`${playerName(piece.side)} recon at ${coord(x, y)}: occupied by an enemy contact.`);
  } else if (mine && mine.side !== piece.side) {
    state.mineContacts[piece.side].add(key(x, y));
    addLog(`${playerName(piece.side)} recon at ${coord(x, y)}: mine detected.`);
  } else {
    addLog(`${playerName(piece.side)} recon at ${coord(x, y)}: clear water.`);
  }
  clearActionModifiers(piece.side);
  clearSteadyIfActivated(piece);
  finishAction();
}

function deployMine(piece, x, y) {
  if (!state.lastMove || piece.id !== state.movedPieceId) return;
  if (!squareInList(x, y, legalMineSquares())) return;
  const activeMines = state.mines.filter((mine) => mine.side === piece.side);
  if (activeMines.length >= 3) state.mines = state.mines.filter((mine) => mine !== activeMines[0]);
  state.mines.push({ side: piece.side, x, y });
  addLog(`${playerName(piece.side)} deployed a hidden mine along the traveled path.`);
  clearActionModifiers(piece.side);
  clearSteadyIfActivated(piece);
  finishAction();
}

function repairCrew() {
  const piece = movedPiece();
  if (!piece || state.passAbilityCooldown[piece.side] > 0 || piece.type === "pawn" || piece.hp >= piece.maxHp) return;
  const repaired = Math.random() >= 0.5;
  if (repaired) piece.hp += 1;
  addLog(`${attackerDescription(piece)} called Repair Crew: ${repaired ? "repaired 1 HP" : "no effect"}.`);
  state.passAbilityCooldown[piece.side] = 2;
  clearActionModifiers(piece.side);
  clearSteadyIfActivated(piece);
  finishAction();
}

function steadyShot() {
  const piece = movedPiece();
  if (!piece || state.passAbilityCooldown[piece.side] > 0) return;
  state.steadyShot[piece.side] = piece.id;
  state.passAbilityCooldown[piece.side] = 2;
  addLog(`${attackerDescription(piece)} held fire for Steady Shot. Only this ship's next attack gains +1 damage.`);
  clearActionModifiers(piece.side);
  finishAction();
}

function clearActionModifiers(side) {
  state.attackBonus[side] = 0;
  state.rangeBonus[side] = 0;
  state.torpedo[side] = false;
}

function clearSteadyIfActivated(piece) {
  if (state.steadyShot[piece.side] === piece.id) {
    state.steadyShot[piece.side] = null;
    addLog(`${attackerDescription(piece)} lost Steady Shot by taking a non-attack action.`);
  }
}

function clearTurnModifiers(side) {
  state.moveBonus[side] = 0;
  clearActionModifiers(side);
  clearCommandBuffs(side, "turnEnd");
}

function hasInstantCard(side) {
  return state.hands[side]?.some((card) => card.phase === "Instant");
}

function startReactionWindow(pending, message) {
  if (state.gameOver || state.reaction) return false;
  const side = enemyOf(state.active);
  if (!hasInstantCard(side)) return false;
  state.reaction = {
    side,
    pending,
    message,
    cardPlayed: false,
    resumeSelectedId: state.selectedId,
  };
  state.selectedId = null;
  addLog(`${playerName(side)} may respond with an Instant Special Action card or pass.`);
  return true;
}

function passReactionWindow() {
  if (!state.reaction || !canUseReactionWindow()) return;
  addLog(`${playerName(state.reaction.side)} passed the Instant response.`);
  completeReactionWindow();
}

function completeReactionWindow() {
  const reaction = state.reaction;
  if (!reaction) return;
  state.reaction = null;
  clearSpecialMode();
  if (reaction.pending === "actionPhase") {
    state.phase = "action";
    state.selectedId = state.movedPieceId || reaction.resumeSelectedId;
    render();
    return;
  }
  if (reaction.pending === "turnEnd") {
    state.selectedId = reaction.resumeSelectedId;
    completeEndTurn();
    return;
  }
  render();
}

function canUseReactionWindow() {
  if (!state.reaction) return false;
  return !isMultiplayer || multiplayerSeat.color === state.reaction.side;
}

function visibleCurrentAt(x, y) {
  const viewer = viewSide();
  return state.currents.find(
    (current) =>
      Math.abs(x - current.x) <= 1 &&
      Math.abs(y - current.y) <= 1 &&
      (current.side === viewer || current.revealedTo?.has(viewer)),
  );
}

function viewSide() {
  if (!isMultiplayer && state.reaction) return state.reaction.side;
  if (isSpectator) return state.active;
  return isMultiplayer ? multiplayerSeat.color : state.active;
}

function finishAction() {
  if (state.gameOver) {
    render();
    return;
  }
  state.actionTaken = true;
  state.actionMode = null;
  addLog("Targeting action complete. Play any Targeting Phase cards, then end the turn.");
  render();
}

function endTurn(force = false) {
  if (state.reaction) return;
  if (state.phase === "setup") return lockSetup();
  if (state.phase === "currentSetup") return;
  if (!force && (state.phase === "move" || state.phase === "commandMove") && state.movedPieceId) return beginTargetingPhase();
  if (!force && state.phase === "action" && state.turn > 2 && !state.actionTaken) return;
  if (startReactionWindow("turnEnd", "before the turn ends")) {
    render();
    return;
  }
  completeEndTurn();
}

function beginTargetingPhase() {
  if (state.gameOver || !state.movedPieceId) return;
  if (startReactionWindow("actionPhase", "before the Targeting Phase")) {
    render();
    return;
  }
  state.phase = "action";
  state.selectedId = state.movedPieceId;
  state.actionMode = null;
  addLog("Targeting Phase begins. Fire, recon, deploy a mine, use an ability, or play Targeting Phase cards.");
  render();
}

function completeEndTurn() {
  resolvePendingCurrentShift();
  clearTurnModifiers(state.active);
  if (state.passAbilityCooldown[state.active] > 0) state.passAbilityCooldown[state.active] -= 1;
  state.active = enemyOf(state.active);
  if (state.active === (state.initiativeSide || "blue")) state.turn += 1;
  clearCommandBuffs(state.active, "turnStart");
  state.phase = "move";
  state.selectedId = null;
  state.movedPieceId = null;
  state.actionTaken = false;
  state.lastMove = null;
  state.pendingCurrentShifts = [];
  state.currentAffectedPieceId = null;
  state.actionMode = null;
  state.commandMode = null;
  clearSpecialMode();
  state.commandedPieceId = null;
  state.commandBonus = null;
  state.defensive[state.active] = false;
  state.armor[state.active] = false;
  state.lastStandLocks[state.active] = false;
  state.lastSuccessfulHit = null;
  tickCardStatuses(state.active);
  if (state.nextMoveBonus[state.active] > 0) {
    state.moveBonus[state.active] += state.nextMoveBonus[state.active];
    addLog(`${playerName(state.active)} gains +${state.nextMoveBonus[state.active]} movement from a prior Forward Probe.`);
    state.nextMoveBonus[state.active] = 0;
  }
  addLog(`${playerName(state.active)} begins turn ${state.turn}.`);
  render();
}

function tickCardStatuses(side) {
  for (const piece of state.pieces.filter((candidate) => candidate.side === side)) {
    state.immobile.delete(piece.id);
  }
  state.hullLockdowns = tickTimedStatus(state.hullLockdowns, side, (status) => state.invulnerable.delete(status.pieceId));
  state.bulwarks = tickTimedStatus(state.bulwarks, side, (status) => state.invulnerable.delete(status.pieceId));
  state.timedShields = tickTimedStatus(state.timedShields, side, (status) => state.shielded.delete(status.pieceId));
  state.suppressiveZones = state.suppressiveZones
    .map((zone) => (zone.side === side ? { ...zone, turns: zone.turns - 1 } : zone))
    .filter((zone) => zone.turns > 0);
  state.overwatch = state.overwatch
    .map((trap) => (trap.side === side ? { ...trap, turns: trap.turns - 1 } : trap))
    .filter((trap) => trap.turns > 0);
  state.sacrificialMarks = state.sacrificialMarks
    .map((mark) => (mark.side === side ? { ...mark, turns: mark.turns - 1 } : mark))
    .filter((mark) => mark.turns > 0);
}

function tickTimedStatus(statuses, side, expire) {
  return statuses
    .map((status) => (status.side === side ? { ...status, turns: status.turns - 1 } : status))
    .filter((status) => {
      if (status.turns > 0) return true;
      expire(status);
      return false;
    });
}

function resolvePendingCurrentShift() {
  if (!state.pendingCurrentShifts.length) return;
  for (const current of state.pendingCurrentShifts) {
    if (Math.random() < 0.5) {
      addLog(`${playerName(current.side)} rolled to shift Shifting Currents, but it stayed in place.`);
    } else {
      addLog(`${playerName(current.side)} shifted Shifting Currents.`);
      shiftCurrent(current);
    }
  }
  state.pendingCurrentShifts = [];
}

function lockSetup() {
  if (state.phase !== "setup") return;
  if (isMultiplayer && !state.gameModeConfirmed) {
    addLog("Game mode must be confirmed before setup can be locked.");
    render();
    return;
  }
  if (state.setupSide === "blue") {
    state.setupSide = "red";
    state.active = "red";
    state.selectedId = null;
    addLog("Blue setup locked. Red may rearrange ships inside rows 10-12, then lock setup.");
  } else {
    state.setupSide = "blue";
    state.active = "blue";
    state.phase = "currentSetup";
    state.selectedId = null;
    addLog("Red setup locked. Blue places the first 3x3 Shifting Currents zone.");
  }
  render();
}

function startCommand(type) {
  const king = selectedPiece();
  if (state.phase !== "move" || !king || king.type !== "king" || king.side !== state.active) return;
  state.commandMode = type;
  state.actionMode = null;
  addLog(`${attackerDescription(king)} is choosing a ${commandName(type)} target within 3 spaces.`);
  render();
}

function commandName(type) {
  if (type === "speed") return "Full Speed Ahead";
  if (type === "fire") return "Concentrated Fire";
  return "Defensive Maneuver";
}

function commandTargets() {
  const king = selectedPiece();
  if (!king || !state.commandMode) return [];
  return state.pieces
    .filter((piece) => piece.side === king.side && piece.id !== king.id && distance(king, piece) <= 3)
    .map((piece) => ({ x: piece.x, y: piece.y }));
}

function distance(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function issueCommand(piece) {
  const king = selectedPiece();
  if (!king || !piece || piece.side !== king.side || piece.id === king.id || distance(king, piece) > 3) return;
  const type = state.commandMode;
  state.commandMode = null;
  state.commandedPieceId = piece.id;
  state.selectedId = piece.id;
  state.movedPieceId = null;
  if (type === "speed") {
    setCommandBuff(piece, { move: 1 });
    state.phase = "commandMove";
    addLog(`${attackerDescription(king)} ordered ${PIECES[piece.type].title}: Full Speed Ahead (+1 movement this turn).`);
  } else if (type === "fire") {
    setCommandBuff(piece, { attack: 1 });
    state.phase = "commandMove";
    addLog(`${attackerDescription(king)} ordered ${PIECES[piece.type].title}: Concentrated Fire (+1 damage on its next shot).`);
  } else {
    setCommandBuff(piece, { shield: 1 });
    state.phase = "commandMove";
    addLog(`${attackerDescription(king)} ordered ${PIECES[piece.type].title}: Defensive Maneuver (1 HP shield until ${playerName(piece.side)}'s next turn).`);
  }
  render();
}

function resupply() {
  if (state.phase !== "move" || state.movedPieceId || state.gameOver || state.turn < 3) return;
  drawCards(state.active, 1);
  addLog(`${playerName(state.active)} skipped the turn to resupply and drew 1 Special Action card.`);
  endTurn();
}

function surrenderGame() {
  if (state.gameOver || state.phase === "setup" || state.phase === "currentSetup") return;
  state.winner = enemyOf(state.active);
  state.gameOver = true;
  addLog(`Game Over. ${playerName(state.active)} surrendered. ${playerName(state.winner)} wins.`);
  render();
}

function playCard(instanceId) {
  if (!canUseActiveTurn()) return;
  if (state.phase === "setup" || state.phase === "currentSetup" || state.gameOver) return;
  const actorSide = state.reaction?.side || state.active;
  const hand = state.hands[actorSide];
  const card = hand.find((candidate) => candidate.instanceId === instanceId);
  if (!card) return;
  const piece = selectedPiece() || movedPiece();
  if (!canPlayCard(card, piece, actorSide)) return;
  state.hands[actorSide] = hand.filter((candidate) => candidate.instanceId !== instanceId);
  applyCard(card, piece, actorSide);
  if (state.reaction) state.reaction.cardPlayed = true;
  addLog(`${playerName(actorSide)} played ${card.name}.`);
  if (state.reaction?.cardPlayed && !state.specialMode) {
    completeReactionWindow();
    return;
  }
  render();
}

function canPlayCard(card, piece, actorSide = state.active) {
  if (state.lastStandLocks[actorSide]) return false;
  if (card.type === "overcharge") {
    return (
      state.phase === "action" &&
      !!movedPiece() &&
      state.lastSuccessfulHit?.side === actorSide &&
      state.lastSuccessfulHit?.pieceId === movedPiece()?.id
    );
  }
  if (card.type === "lastStand") return !!piece && piece.side === actorSide && piece.type !== "pawn";
  if (state.reaction) return card.phase === "Instant" && !!piece && piece.side === actorSide;
  if (card.phase === "Instant") return !!piece && piece.side === actorSide;
  if (card.phase === "Movement Phase" && state.phase !== "move" && state.phase !== "commandMove") return false;
  if (card.phase === "Targeting Phase" && state.phase !== "action") return false;
  if (card.type === "promotionBurst") return !!piece && piece.side === actorSide && isOnOpponentBackline(piece);
  if (["hullLockdown", "ironBulwark"].includes(card.type)) return !!piece && piece.side === actorSide;
  if (card.type === "moveBoost") return state.phase === "move" || state.phase === "commandMove";
  if (
    [
      "attackBoost",
      "rangeBoost",
      "torpedo",
      "coordinatedVolley",
      "overlappingFields",
      "vectorShift",
      "chainAssault",
      "broadside",
      "lineBreaker",
      "promotionBurst",
      "flagshipBarrage",
      "refractionShot",
      "flankFade",
      "chainAssault",
      "suppressiveFire",
      "vectorShift",
    ].includes(card.type)
  ) {
    return state.phase === "action" && !!movedPiece();
  }
  if (card.type === "repair") return !!piece && piece.side === actorSide && piece.type !== "pawn" && piece.hp < piece.maxHp;
  if (["wideRecon", "sensorSweep", "feint", "forwardProbe", "blockadeDrift", "ironAdvance", "ghostWake", "surfacingStrike", "powerPush", "callGuard"].includes(card.type)) return !!piece && piece.side === actorSide;
  if (["evasiveRoll", "royalCommand", "sacrificialMark", "counterBattery", "overwatchAmbush"].includes(card.type)) return !!piece && piece.side === actorSide;
  return true;
}

function isOnOpponentBackline(piece) {
  return (piece.side === "blue" && piece.y === BOARD_SIZE - 1) || (piece.side === "red" && piece.y === 0);
}

function applyCard(card, piece, actorSide = state.active) {
  if (
    [
      "broadside",
      "lineBreaker",
      "evasiveRoll",
      "royalCommand",
      "callGuard",
      "forwardProbe",
      "blockadeDrift",
      "ironAdvance",
      "ghostWake",
      "surfacingStrike",
      "powerPush",
      "refractionShot",
      "flankFade",
      "chainAssault",
      "flagshipBarrage",
      "suppressiveFire",
      "vectorShift",
      "overwatchAmbush",
      "sacrificialMark",
    ].includes(card.type) ||
    (card.type === "overcharge" && state.phase === "action" && movedPiece())
  ) {
    state.specialMode = card.type;
    state.specialData = { cardName: card.name, cardPhase: card.phase, pieceId: piece?.id, picks: [] };
    addLog(`${playerName(actorSide)} is resolving ${card.name}.`);
    return;
  }
  if (card.type === "attackBoost") state.attackBonus[actorSide] += card.amount;
  if (card.type === "rangeBoost") state.rangeBonus[actorSide] += card.amount;
  if (card.type === "moveBoost") state.moveBonus[actorSide] += card.amount;
  if (card.type === "defense") state.defensive[actorSide] = true;
  if (card.type === "armor") state.armor[actorSide] = true;
  if (card.type === "hullLockdown" && piece) {
    state.invulnerable.add(piece.id);
    state.hullLockdowns.push({ pieceId: piece.id, side: piece.side, turns: 1 });
    addLog(`${attackerDescription(piece)} entered Hull Lockdown.`);
    return;
  }
  if (card.type === "ironBulwark" && piece) {
    state.invulnerable.add(piece.id);
    state.bulwarks.push({ pieceId: piece.id, side: piece.side, turns: 2 });
    addLog(`${attackerDescription(piece)} activated Iron Bulwark.`);
    return;
  }
  if (card.type === "counterBattery" && piece) state.counterBattery.add(piece.id);
  if (card.type === "repair" && piece) piece.hp = Math.min(piece.maxHp, piece.hp + 1);
  if (card.type === "wideRecon" || card.type === "forwardProbe") {
    state.actionMode = "recon";
    state.rangeBonus[actorSide] = Math.max(state.rangeBonus[actorSide], 2);
  }
  if (card.type === "feint" && piece) revealKnightReachableOccupancy(piece);
  if (card.type === "defensiveMuster" && piece) {
    for (const ally of state.pieces.filter((candidate) => candidate.side === piece.side && candidate.id !== piece.id && distance(candidate, piece) <= 1)) {
      state.shielded.add(ally.id);
      state.timedShields.push({ pieceId: ally.id, side: piece.side, turns: 1 });
    }
    addLog(`${attackerDescription(piece)} shielded adjacent allies with Defensive Muster.`);
    return;
  }
  if (card.type === "promotionBurst" && piece) {
    promotionBurst(piece);
    return;
  }
  if (card.type === "forwardProbe") state.moveBonus[actorSide] += 1;
  if (card.type === "sensorSweep" && piece) revealDiagonalContacts(piece);
  if (card.type === "coordinatedVolley" && piece) {
    const bonus = nearbyFriendlyCount(piece, 2, 2);
    state.attackBonus[actorSide] += bonus;
    addLog(`Coordinated Volley added +${bonus} damage from nearby friendly support.`);
  }
  if (card.type === "overlappingFields" && piece) {
    const bonus = alignedFriendlyCount(piece);
    state.attackBonus[actorSide] += bonus;
    addLog(`Overlapping Fields added +${bonus} damage from aligned friendly support.`);
  }
  if (card.type === "lastStand") {
    if (piece) state.lastStand.add(piece.id);
    state.lastStandLocks[actorSide] = true;
    addLog(`${attackerDescription(piece)} prepared Last Stand. No more special cards may be played by ${playerName(actorSide)} this turn.`);
  }
  if (card.type === "torpedo") state.torpedo[actorSide] = true;
  if (card.type === "draw") drawCards(actorSide, card.amount);
  if (card.type === "shiftCurrents") state.currents.forEach(shiftCurrent);
}

function nearbyFriendlyCount(piece, width, height) {
  const halfX = Math.floor(width / 2);
  const halfY = Math.floor(height / 2);
  return Math.min(
    2,
    state.pieces.filter(
      (candidate) =>
        candidate.side === piece.side &&
        candidate.id !== piece.id &&
        Math.abs(candidate.x - piece.x) <= halfX &&
        Math.abs(candidate.y - piece.y) <= halfY,
    ).length,
  );
}

function alignedFriendlyCount(piece) {
  return Math.min(2, state.pieces.filter((candidate) => candidate.side === piece.side && candidate.id !== piece.id && (candidate.x === piece.x || candidate.y === piece.y)).length);
}

function revealDiagonalContacts(piece) {
  let detected = 0;
  for (const [dx, dy] of getDirectionalSteps("diagonal", piece.side)) {
    let x = piece.x + dx;
    let y = piece.y + dy;
    while (isInside(x, y)) {
      const target = pieceAt(x, y);
      if (target && target.side !== piece.side) {
        state.contacts[piece.side].add(key(x, y));
        detected += 1;
      }
      const mine = mineAt(x, y);
      if (mine && mine.side !== piece.side) {
        state.mineContacts[piece.side].add(key(x, y));
        detected += 1;
      }
      x += dx;
      y += dy;
    }
  }
  if (detected >= 3) state.nextMoveBonus[piece.side] += 1;
  addLog(`${attackerDescription(piece)} completed Sensor Sweep and detected ${detected} occupied diagonal square${detected === 1 ? "" : "s"}.`);
}

function damagePiece(piece, amount, source, sourcePiece = null) {
  if (amount > 0 && state.invulnerable.has(piece.id)) {
    addLog(`${attackerDescription(piece)} ignored damage from ${source}.`);
    return 0;
  }
  const commandBuff = commandBuffFor(piece);
  if (amount > 0 && commandBuff?.shield > 0) {
    const blocked = Math.min(amount, commandBuff.shield);
    amount -= blocked;
    commandBuff.shield -= blocked;
    addLog(`${attackerDescription(piece)} absorbed ${blocked} damage with Defensive Maneuver.`);
    clearEmptyCommandBuff(piece.id);
  }
  if (amount <= 0) return 0;
  if (amount > 0 && state.lastStand.has(piece.id) && piece.hp - amount <= 1) {
    piece.hp = 1;
    state.lastStand.delete(piece.id);
    beginLastStandTurn(piece);
    return 0;
  }
  piece.hp -= amount;
  if (piece.hp <= 0) {
    state.sunkShips.push({ id: piece.id, side: piece.side, type: piece.type });
    delete state.commandBuffs[piece.id];
    state.hullLockdowns = state.hullLockdowns.filter((status) => status.pieceId !== piece.id);
    state.bulwarks = state.bulwarks.filter((status) => status.pieceId !== piece.id);
    state.timedShields = state.timedShields.filter((status) => status.pieceId !== piece.id);
    state.invulnerable.delete(piece.id);
    state.shielded.delete(piece.id);
    state.pieces = state.pieces.filter((p) => p.id !== piece.id);
    const destroyedName = source === "attack" ? `${playerName(piece.side)} ship` : attackerDescription(piece);
    addLog(`${destroyedName} was destroyed by ${source}.`);
    resolveSacrificialMarks(piece, sourcePiece);
    checkWinCondition(piece.side);
  }
  return amount;
}

function beginLastStandTurn(piece) {
  state.active = piece.side;
  state.phase = "move";
  state.selectedId = piece.id;
  state.movedPieceId = null;
  state.actionTaken = false;
  state.lastMove = null;
  state.actionMode = null;
  state.commandMode = null;
  state.commandedPieceId = null;
  state.commandBonus = null;
  state.lastStandLocks[piece.side] = true;
  clearSpecialMode();
  addLog(`${attackerDescription(piece)} triggered Last Stand at 1 HP and begins a bonus turn. Special Action Cards are locked for this turn.`);
}

function resolveSacrificialMarks(destroyedPiece, sourcePiece = null) {
  const marks = state.sacrificialMarks.filter((mark) => mark.targetId === destroyedPiece.id);
  state.sacrificialMarks = state.sacrificialMarks.filter((mark) => mark.targetId !== destroyedPiece.id && mark.ownerId !== destroyedPiece.id);
  for (const mark of marks) {
    if (sourcePiece && sourcePiece.side !== destroyedPiece.side && state.pieces.some((piece) => piece.id === sourcePiece.id)) {
      damagePiece(sourcePiece, 2, "Sacrificial Mark");
      addLog("Sacrificial Mark dealt 2 damage to the attacking ship.");
    }
  }
}

function resolveOverwatch(piece) {
  for (const trap of [...state.overwatch]) {
    const owner = state.pieces.find((candidate) => candidate.id === trap.pieceId);
    if (!owner || owner.side === piece.side) continue;
    if (Math.abs(piece.x - trap.x) <= 1 && Math.abs(piece.y - trap.y) <= 1) {
      damagePiece(piece, 1, "Overwatch Ambush");
      state.overwatch = state.overwatch.filter((candidate) => candidate !== trap);
      addLog(`${attackerDescription(owner)} triggered Overwatch Ambush.`);
    }
  }
}

function checkWinCondition(defeatedSide) {
  const winner = enemyOf(defeatedSide);
  const remaining = state.pieces.filter((piece) => piece.side === defeatedSide);
  let won = false;
  let reason = "";

  if (state.gameMode === "classic") {
    won = !remaining.some((piece) => piece.id.includes("-king-"));
    reason = "sinking the King Flagship";
  } else if (state.gameMode === "remove-throne") {
    won = !remaining.some((piece) => piece.id.includes("-king-") || piece.id.includes("-queen-"));
    reason = "destroying both the King Flagship and Queen Dreadnought";
  } else if (state.gameMode === "crush-frontline") {
    won = !remaining.some((piece) => piece.id.includes("-pawn-"));
    reason = "eliminating every Pawn Corvette";
  } else if (state.gameMode === "board-wipe") {
    won = remaining.length === 0;
    reason = "eliminating the entire enemy fleet";
  }

  if (won) {
    state.gameOver = true;
    state.winner = winner;
    addLog(`Game Over. ${playerName(winner)} wins by ${reason}.`);
  }
}

function revealPiece(piece, side) {
  piece.revealedTo.add(side);
  state.contacts[side].delete(key(piece.x, piece.y));
}

function attackerDescription(piece) {
  const def = PIECES[piece.type];
  return `${playerName(piece.side)} ${def.title}`;
}

function phaseText() {
  if (state.gameOver) return "Battle Complete";
  if (state.reaction) return "Instant Response";
  if (state.phase === "setup") return "Deployment";
  if (state.phase === "currentSetup") return "Current Placement";
  if (state.phase === "commandMove") return "Command Move";
  return state.phase === "move" ? "Movement Phase" : "Targeting / Action Phase";
}

function render() {
  activePlayerEl.textContent = playerName(state.active);
  phaseNameEl.textContent = phaseText();
  statusLine.textContent = state.gameOver
    ? gameOverText()
    : statusText();
  maybeShowInitiativeToast();
  maybeShowTurnToast();
  renderGameOverBanner();

  renderBoard();
  renderSelected();
  renderWinglets();
  renderHand();
  renderReactionPrompt();
  renderLog();
  updateButtons();
  scheduleMultiplayerPublish();
}

function maybeShowInitiativeToast() {
  if (!isMultiplayer || state.gameOver || !initiativeToastEl || !state.initiativeToastKey) return;
  if (multiplayerSync.lastInitiativeToastKey === state.initiativeToastKey) return;
  multiplayerSync.lastInitiativeToastKey = state.initiativeToastKey;
  initiativeToastEl.textContent = `${playerName(state.active)} moves first`;
  initiativeToastEl.hidden = false;
  window.clearTimeout(multiplayerSync.initiativeToastTimer);
  multiplayerSync.initiativeToastTimer = window.setTimeout(() => {
    initiativeToastEl.hidden = true;
  }, 3000);
}

function maybeShowTurnToast() {
  if (!isMultiplayer || isSpectator || state.gameOver || !turnToastEl) return;
  if (state.active !== multiplayerSeat.color) return;
  if (state.phase === "setup" || state.phase === "currentSetup") return;
  const key = `${state.turn}:${state.active}`;
  if (multiplayerSync.lastTurnToastKey === key) return;
  multiplayerSync.lastTurnToastKey = key;
  turnToastEl.textContent = `Your turn, ${playerName(state.active)}`;
  turnToastEl.hidden = false;
  window.clearTimeout(multiplayerSync.turnToastTimer);
  multiplayerSync.turnToastTimer = window.setTimeout(() => {
    turnToastEl.hidden = true;
  }, 2000);
}

function gameOverText() {
  return `Game Over. ${playerName(state.winner)} wins.`;
}

function renderGameOverBanner() {
  gameOverBanner.hidden = !state.gameOver;
  if (state.gameOver) {
    gameOverMessage.textContent = `${playerName(state.winner)} Wins`;
    gameOverBanner.classList.toggle("blue-win", state.winner === "blue");
    gameOverBanner.classList.toggle("red-win", state.winner === "red");
  }
}

function statusText() {
  if (state.reaction) {
    if (canUseReactionWindow()) return `${playerName(state.reaction.side)} may play an Instant Special Action card or pass ${state.reaction.message}.`;
    return `${playerName(state.reaction.side)} is deciding whether to play an Instant Special Action card.`;
  }
  if (isMultiplayer && !state.gameModeConfirmed && !state.gameOver) {
    if (isSpectator) return `Waiting for players to confirm ${GAME_MODES[state.gameMode].name}.`;
    if (multiplayerSeat.color === state.hostColor && !state.modeConfirmations[multiplayerSeat.color]) return `Select a game mode, then confirm ${GAME_MODES[state.gameMode].name}.`;
    if (!state.modeConfirmations[multiplayerSeat.color]) return `${playerName(state.hostColor)} selected ${GAME_MODES[state.gameMode].name}. Confirm the game mode to begin.`;
    return `Waiting for the other player to confirm ${GAME_MODES[state.gameMode].name}.`;
  }
  if (state.phase === "setup") {
    if (isMultiplayer && state.setupSide !== viewSide()) return "Opponent deployment in progress. Waiting for setup to be locked.";
    return `${playerName(state.setupSide)} deployment. Select a ship and place it in your legal setup zone.`;
  }
  if (state.phase === "currentSetup") {
    if (isMultiplayer && state.setupSide !== viewSide()) return "Opponent is placing Shifting Currents. Location is hidden.";
    return `${playerName(state.setupSide)} places a 3x3 Shifting Currents zone inside the first 6 rows closest to that fleet.`;
  }
  if (state.phase === "commandMove") return `Turn ${state.turn}. Move the ordered ship, then take its action.`;
  if (state.phase === "move" && state.movedPieceId) return `Turn ${state.turn}. Movement complete. Play Movement Phase cards or begin Targeting.`;
  if (state.phase === "move") return `Turn ${state.turn}. Move one ship, issue a King command, or play a Movement Phase card.`;
  if (state.phase === "action" && state.actionTaken) return `Turn ${state.turn}. Targeting action complete. Play Targeting Phase cards or end the turn.`;
  return `Turn ${state.turn}. Fire, recon, deploy mine, use an ability, or play a Targeting Phase card.`;
}

function renderBoard() {
  const viewer = viewSide();
  const canPreviewRanges = canUseActiveTurn();
  const canPreviewSetup = !isMultiplayer || state.setupSide === viewer;
  const selected = selectedPiece();
  const moved = movedPiece();
  const activeTargets = canPreviewRanges && !state.movedPieceId && (state.phase === "move" || state.phase === "commandMove") && selected?.side === viewer ? legalSquares(selected, "move") : [];
  const actionTargets =
    canPreviewRanges && !state.actionTaken && state.phase === "action" && moved?.side === viewer && state.actionMode !== "mine" ? legalSquares(moved, "target") : [];
  const mineTargets = canPreviewRanges && !state.actionTaken && state.phase === "action" && moved?.side === viewer && state.actionMode === "mine" ? legalMineSquares() : [];
  const specialSquares = canPreviewRanges ? specialTargets() : [];
  const commandSquares = canPreviewRanges ? commandTargets() : [];
  const selectedKey = canPreviewRanges && (state.phase !== "setup" || canPreviewSetup) && selected?.side === viewer ? key(selected.x, selected.y) : "";
  const lastKeys = state.lastMove ? [key(state.lastMove.to.x, state.lastMove.to.y)] : [];

  boardEl.innerHTML = "";
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      if ((x + y) % 2) cell.classList.add("alt");
      if (key(x, y) === selectedKey) cell.classList.add("selected");
      if (lastKeys.includes(key(x, y))) cell.classList.add("last-move");
      if (squareInList(x, y, activeTargets)) cell.classList.add("move");
      if (squareInList(x, y, mineTargets)) cell.classList.add("move");
      if (squareInList(x, y, specialSquares)) cell.classList.add(["evasiveRoll", "royalCommand", "callGuard"].includes(state.specialMode) ? "move" : "target");
      if (squareInList(x, y, actionTargets)) cell.classList.add(state.actionMode === "recon" ? "recon" : "target");
      if (squareInList(x, y, commandSquares)) cell.classList.add("command");
      const visibleCurrent = visibleCurrentAt(x, y);
      if (visibleCurrent) {
        cell.classList.add("current");
        if (visibleCurrent.side === viewer) cell.classList.add("owned-current");
      }
      if (canPreviewRanges && canPreviewSetup && state.phase === "currentSetup" && isValidCurrentAnchor(x, y, state.setupSide) && !currentZoneOverlaps(x, y)) cell.classList.add("move");
      const shotVisible = state.shots[viewer].has(key(x, y));
      if (shotVisible) cell.classList.add("shot");

      const mine = mineAt(x, y);
      if (mine && (mine.side === viewer || state.mineContacts[viewer]?.has(key(x, y)))) cell.classList.add("mine");

      const piece = pieceAt(x, y);
      if (piece) {
        const visible = piece.side === viewer || piece.revealedTo.has(viewer);
        const contactVisible = state.contacts[viewer].has(key(x, y));
        if (visible || contactVisible) {
          const pieceEl = document.createElement("span");
          pieceEl.className = visible ? `piece ${piece.side}` : "hidden-contact";
          pieceEl.dataset.hp = visible ? piece.hp : "";
          pieceEl.textContent = visible ? PIECES[piece.type].symbol : "?";
          pieceEl.title = visible ? `${playerName(piece.side)} ${PIECES[piece.type].title} (${piece.hp}/${piece.maxHp})` : "Enemy contact";
          cell.append(pieceEl);
        }
        if (canSelect(piece)) cell.classList.add("selectable");
      } else if (state.contacts[viewer].has(key(x, y))) {
        const contact = document.createElement("span");
        contact.className = "hidden-contact";
        contact.textContent = "?";
        contact.title = "Reported enemy destination";
        cell.append(contact);
      }

      if (shotVisible) {
        const shot = document.createElement("span");
        shot.className = "shot-marker";
        shot.title = "Opponent fired at this coordinate";
        cell.append(shot);
      }

      cell.ariaLabel = coord(x, y);
      cell.addEventListener("click", () => handleCellClick(x, y));
      boardEl.append(cell);
    }
  }
}

function renderSelected() {
  const piece = selectedPiece() || movedPiece();
  if (isMultiplayer && piece?.side !== viewSide()) {
    selectedShipEl.className = "ship-card muted";
    selectedShipEl.textContent = canUseActiveTurn() ? "Select one of your ships." : "Waiting for opponent action.";
    return;
  }
  if (!piece) {
    selectedShipEl.className = "ship-card muted";
    selectedShipEl.textContent = state.phase === "setup"
      ? "Select a ship to reposition during deployment."
      : state.phase === "move"
        ? "Select one of your ships."
        : "Choose an action for the moved ship.";
    return;
  }
  const def = PIECES[piece.type];
  selectedShipEl.className = "ship-card";
  selectedShipEl.innerHTML = `
    <strong>${def.symbol} ${def.title}</strong>
    <div>${playerName(piece.side)} at ${coord(piece.x, piece.y)}</div>
    <div>HP ${piece.hp}/${piece.maxHp}</div>
    <div class="muted">Move: ${def.movement}, range ${def.moveRange}. Target: ${def.targeting}, range ${def.targetRange}.</div>
    ${state.phase === "move" && state.movedPieceId === piece.id ? `<div class="muted">Movement complete. Use Begin Targeting when ready.</div>` : ""}
    ${state.phase === "action" && state.actionTaken ? `<div class="muted">Targeting complete. Use End Turn when ready.</div>` : ""}
  `;
}

function renderHand() {
  const viewer = viewSide();
  const actorSide = state.reaction?.side || state.active;
  const activePiece = selectedPiece() || (state.reaction ? null : movedPiece());
  cardHandEl.innerHTML = state.hands[viewSide()]
    .map(
      (card) => {
        const playable = canUseActiveTurn() && viewer === actorSide && activePiece?.side === viewer && canPlayCard(card, activePiece, actorSide);
        const phaseClass = card.phase === "Instant" ? " instant-card" : playable ? " playable-card" : "";
        return `
        <button class="action-card${phaseClass}" type="button" data-card="${card.instanceId}" ${playable ? "" : "disabled"}>
          <strong>${card.name}</strong>
          <small>${card.phase}</small>
          <small>${card.text}</small>
        </button>
      `;
      },
    )
    .join("");
  cardHandEl.querySelectorAll("[data-card]").forEach((button) => {
    button.addEventListener("click", () => playCard(button.dataset.card));
  });
}

function renderReactionPrompt() {
  const shouldShow = Boolean(state.reaction && canUseReactionWindow());
  if (!shouldShow || (state.reaction?.cardPlayed && state.specialMode)) {
    if (reactionDialog.open) reactionDialog.close();
    if (!shouldShow) reactionCardsEl.innerHTML = "";
    return;
  }

  const side = state.reaction.side;
  const piece = selectedPiece();
  reactionTitleEl.textContent = `${playerName(side)} Instant Response`;
  reactionTextEl.textContent = piece?.side === side
    ? `Selected: ${PIECES[piece.type].title}. Play an Instant card or pass ${state.reaction.message}.`
    : `Select one of your ships for cards that need a ship, then play an Instant card or pass ${state.reaction.message}.`;
  reactionCardsEl.innerHTML = state.hands[side]
    .filter((card) => card.phase === "Instant")
    .map((card) => {
      const playable = piece?.side === side && canPlayCard(card, piece, side);
      return `
        <button class="action-card instant-card" type="button" data-reaction-card="${card.instanceId}" ${playable ? "" : "disabled"}>
          <strong>${card.name}</strong>
          <small>${card.phase}</small>
          <small>${card.text}</small>
        </button>
      `;
    })
    .join("");
  reactionCardsEl.querySelectorAll("[data-reaction-card]").forEach((button) => {
    button.addEventListener("click", () => playCard(button.dataset.reactionCard));
  });
  if (!reactionDialog.open) reactionDialog.show();
}

function renderWinglets() {
  renderCapturedWinglet();
  renderHealthWinglet();
}

function renderCapturedWinglet() {
  const enemy = enemyOf(viewSide());
  const sunk = state.sunkShips.filter((piece) => piece.side === enemy).slice(0, 16);
  const slots = Array.from({ length: 16 }, (_, index) => sunk[index] || null);
  capturedWingletEl.innerHTML = slots.map((piece) => renderWingletSlot(piece, "captured")).join("");
}

function renderHealthWinglet() {
  const order = { king: 0, queen: 1, rook: 2, knight: 3, bishop: 4 };
  const controlled = state.pieces
    .filter((piece) => piece.side === viewSide())
    .sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9) || a.id.localeCompare(b.id))
    .slice(0, 16);
  const slots = Array.from({ length: 16 }, (_, index) => controlled[index] || null);
  healthWingletEl.innerHTML = slots.map((piece) => renderWingletSlot(piece, "health")).join("");
}

function renderWingletSlot(piece, mode) {
  if (!piece) return `<div class="winglet-slot empty"></div>`;
  const def = PIECES[piece.type];
  const hpMarkup = mode === "health" ? `<span class="winglet-hp">${piece.hp}/${piece.maxHp}</span>` : "";
  return `
    <div class="winglet-slot ${piece.side}" title="${def.title}${mode === "health" ? ` HP ${piece.hp}/${piece.maxHp}` : ""}">
      <span class="winglet-piece">${def.symbol}</span>
      ${hpMarkup}
    </div>
  `;
}

function renderLog() {
  battleLogEl.replaceChildren();
  for (const entry of [...state.log].reverse()) {
    const item = document.createElement("li");
    item.textContent = visibleLogEntry(entry);
    battleLogEl.append(item);
  }
}

function visibleLogEntry(entry) {
  if (!isMultiplayer) return entry;
  const viewer = viewSide();
  const enemy = enemyOf(viewer);
  const enemyName = playerName(enemy);

  if (entry.startsWith(`${enemyName} placed Shifting Currents centered on `)) {
    return `${enemyName} placed Shifting Currents. Location hidden.`;
  }

  if (entry.startsWith(`${enemyName} deployed a hidden mine along the traveled path at `)) {
    return `${enemyName} deployed a hidden mine along the traveled path.`;
  }

  if (entry.startsWith(`${enemyName} placed `) && / at [A-L](?:[1-9]|1[0-2])\.$/.test(entry)) {
    return `${enemyName} repositioned a ship during deployment.`;
  }

  return redactHiddenEnemyShipNames(entry, enemy);
}

function redactHiddenEnemyShipNames(entry, enemy) {
  if (isRevealLogEntry(entry)) return entry;
  const enemyName = playerName(enemy);
  let redacted = entry;
  for (const def of Object.values(PIECES)) {
    redacted = redacted.replaceAll(`${enemyName} ${def.title}`, `${enemyName} hidden ship`);
  }
  return redacted;
}

function isRevealLogEntry(entry) {
  return (
    entry.includes(" rammed ") ||
    entry.includes("Forward Probe") ||
    entry.includes("Sensor Sweep") ||
    entry.includes("Sacrificial Mark") ||
    entry.includes("revealed") ||
    entry.includes("recon at")
  );
}

function updateButtons() {
  const canAct = state.phase === "action" && !!movedPiece() && !state.actionTaken && !state.gameOver;
  const canUseTurn = canUseActiveTurn();
  const reactionOpen = Boolean(state.reaction);
  const pieceMovedThisTurn = !!state.movedPieceId || state.phase === "action" || state.phase === "commandMove";
  const kingSelected = selectedPiece()?.type === "king" && selectedPiece()?.side === state.active && state.phase === "move" && !pieceMovedThisTurn;
  const phaseButtonLocked = state.phase === "action" && state.turn > 2 && !state.actionTaken;
  const passAbilityLocked = state.passAbilityCooldown[state.active] > 0;
  if (state.phase === "setup") endTurnButton.textContent = "Lock Setup";
  else if ((state.phase === "move" || state.phase === "commandMove") && state.movedPieceId) endTurnButton.textContent = "Begin Targeting";
  else if (state.phase === "action") endTurnButton.textContent = state.actionTaken ? "End Turn" : "Pass Targeting";
  else endTurnButton.textContent = "End Turn";
  const isHost = !isMultiplayer || multiplayerSeat.color === state.hostColor;
  const canConfirmMode = isMultiplayer && !isSpectator && ["blue", "red"].includes(multiplayerSeat.color) && !state.gameModeConfirmed && !state.gameOver;
  newGameButton.disabled = isMultiplayer && (!isHost || !state.gameOver);
  gameModeSelect.disabled = isMultiplayer && (!isHost || state.gameModeConfirmed || state.phase !== "setup");
  confirmModeButton.hidden = !canConfirmMode;
  confirmModeButton.disabled = !canConfirmMode || Boolean(state.modeConfirmations[multiplayerSeat.color]);
  confirmModeButton.textContent = state.modeConfirmations[multiplayerSeat.color] ? "Mode Confirmed" : "Confirm Mode";
  lockSetupButton.disabled = !canUseTurn || state.phase !== "setup" || (isMultiplayer && !state.gameModeConfirmed);
  randomizeSetupButton.disabled = !canUseTurn || state.phase !== "setup" || (isMultiplayer && !state.gameModeConfirmed);
  resupplyButton.disabled = !canUseTurn || state.phase !== "move" || pieceMovedThisTurn || state.turn < 3 || state.gameOver;
  surrenderButton.disabled = reactionOpen || !canUseTurn || state.gameOver || state.phase === "setup" || state.phase === "currentSetup";
  endTurnButton.disabled = reactionOpen || !canUseTurn || state.gameOver || state.phase === "currentSetup" || phaseButtonLocked;
  reconButton.disabled = reactionOpen || !canUseTurn || !canAct;
  mineButton.disabled = reactionOpen || !canUseTurn || !canAct;
  repairButton.disabled = reactionOpen || !canUseTurn || !canAct || passAbilityLocked || movedPiece()?.type === "pawn" || movedPiece()?.hp >= movedPiece()?.maxHp;
  steadyButton.disabled = reactionOpen || !canUseTurn || !canAct || passAbilityLocked;
  speedButton.disabled = reactionOpen || !canUseTurn || !kingSelected;
  fireButton.disabled = reactionOpen || !canUseTurn || !kingSelected;
  defenseButton.disabled = reactionOpen || !canUseTurn || !kingSelected;

  reconButton.classList.toggle("active", state.actionMode === "recon");
  mineButton.classList.toggle("active", state.actionMode === "mine");
  speedButton.classList.toggle("active", state.commandMode === "speed");
  fireButton.classList.toggle("active", state.commandMode === "fire");
  defenseButton.classList.toggle("active", state.commandMode === "defense");
}

function canUseActiveTurn() {
  if (state.reaction) return canUseReactionWindow();
  if (isSpectator) return false;
  return !isMultiplayer || state.active === multiplayerSeat.color || (state.phase === "setup" && state.setupSide === multiplayerSeat.color) || (state.phase === "currentSetup" && state.setupSide === multiplayerSeat.color);
}

function serializeSet(set) {
  return Array.from(set || []);
}

function hydrateSet(values) {
  return new Set(Array.isArray(values) ? values : []);
}

function serializeGameState() {
  return {
    active: state.active,
    turn: state.turn,
    phase: state.phase,
    setupSide: state.setupSide,
    pieces: state.pieces.map((piece) => ({ ...piece, revealedTo: serializeSet(piece.revealedTo) })),
    selectedId: state.selectedId,
    movedPieceId: state.movedPieceId,
    actionTaken: state.actionTaken,
    lastMove: state.lastMove,
    actionMode: state.actionMode,
    commandMode: state.commandMode,
    specialMode: state.specialMode,
    specialData: state.specialData,
    reaction: state.reaction,
    commandedPieceId: state.commandedPieceId,
    commandBonus: state.commandBonus,
    commandBuffs: state.commandBuffs,
    moveBonus: state.moveBonus,
    nextMoveBonus: state.nextMoveBonus,
    attackBonus: state.attackBonus,
    rangeBonus: state.rangeBonus,
    torpedo: state.torpedo,
    contacts: { blue: serializeSet(state.contacts.blue), red: serializeSet(state.contacts.red) },
    mineContacts: { blue: serializeSet(state.mineContacts.blue), red: serializeSet(state.mineContacts.red) },
    shots: { blue: serializeSet(state.shots.blue), red: serializeSet(state.shots.red) },
    mines: state.mines,
    currents: state.currents.map((current) => ({ ...current, revealedTo: serializeSet(current.revealedTo) })),
    pendingCurrentShifts: state.pendingCurrentShifts,
    currentAffectedPieceId: state.currentAffectedPieceId,
    decks: state.decks,
    hands: state.hands,
    steadyShot: state.steadyShot,
    defensive: state.defensive,
    armor: state.armor,
    passAbilityCooldown: state.passAbilityCooldown,
    sacrificialMarks: state.sacrificialMarks,
    counterBattery: serializeSet(state.counterBattery),
    overwatch: state.overwatch,
    shielded: serializeSet(state.shielded),
    timedShields: state.timedShields,
    invulnerable: serializeSet(state.invulnerable),
    hullLockdowns: state.hullLockdowns,
    bulwarks: state.bulwarks,
    immobile: serializeSet(state.immobile),
    suppressiveZones: state.suppressiveZones,
    lastStand: serializeSet(state.lastStand),
    lastStandLocks: state.lastStandLocks,
    lastSuccessfulHit: state.lastSuccessfulHit,
    sunkShips: state.sunkShips,
    playerNames: state.playerNames,
    hostColor: state.hostColor,
    modeConfirmations: state.modeConfirmations,
    initiativeSide: state.initiativeSide,
    initiativeToastKey: state.initiativeToastKey,
    gameMode: state.gameMode,
    gameModeConfirmed: state.gameModeConfirmed,
    gameOver: state.gameOver,
    winner: state.winner,
    log: state.log,
  };
}

function applySharedGameState(sharedState, version = multiplayerSync.version) {
  if (!sharedState) return;
  multiplayerSync.applying = true;
  Object.assign(state, {
    ...sharedState,
    pieces: (sharedState.pieces || []).map((piece) => ({ ...piece, revealedTo: hydrateSet(piece.revealedTo) })),
    contacts: {
      blue: hydrateSet(sharedState.contacts?.blue),
      red: hydrateSet(sharedState.contacts?.red),
    },
    mineContacts: {
      blue: hydrateSet(sharedState.mineContacts?.blue),
      red: hydrateSet(sharedState.mineContacts?.red),
    },
    shots: {
      blue: hydrateSet(sharedState.shots?.blue),
      red: hydrateSet(sharedState.shots?.red),
    },
    currents: (sharedState.currents || []).map((current) => ({ ...current, revealedTo: hydrateSet(current.revealedTo) })),
    counterBattery: hydrateSet(sharedState.counterBattery),
    shielded: hydrateSet(sharedState.shielded),
    timedShields: Array.isArray(sharedState.timedShields) ? sharedState.timedShields : [],
    invulnerable: hydrateSet(sharedState.invulnerable),
    hullLockdowns: Array.isArray(sharedState.hullLockdowns) ? sharedState.hullLockdowns : [],
    bulwarks: Array.isArray(sharedState.bulwarks) ? sharedState.bulwarks : [],
    immobile: hydrateSet(sharedState.immobile),
    lastStand: hydrateSet(sharedState.lastStand),
    commandBuffs: sharedState.commandBuffs || {},
    sunkShips: Array.isArray(sharedState.sunkShips) ? sharedState.sunkShips : [],
    playerNames: sharedState.playerNames || state.playerNames || { blue: null, red: null },
    hostColor: sharedState.hostColor || state.hostColor || null,
    modeConfirmations: sharedState.modeConfirmations || { blue: false, red: false },
    initiativeSide: sharedState.initiativeSide || "blue",
    initiativeToastKey: sharedState.initiativeToastKey || null,
  });
  state.gameMode = state.gameMode || "classic";
  state.gameModeConfirmed = Boolean(sharedState.gameModeConfirmed || (state.modeConfirmations.blue && state.modeConfirmations.red));
  state.reaction = sharedState.reaction || null;
  state.actionTaken = Boolean(sharedState.actionTaken);
  state.nextMoveBonus = sharedState.nextMoveBonus || { blue: 0, red: 0 };
  state.lastStandLocks = sharedState.lastStandLocks || { blue: false, red: false };
  state.lastSuccessfulHit = sharedState.lastSuccessfulHit || null;
  if (gameModeSelect.value !== state.gameMode) gameModeSelect.value = state.gameMode;
  multiplayerSync.version = version;
  multiplayerSync.ready = true;
  render();
  multiplayerSync.applying = false;
}

function multiplayerHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${multiplayerSeat.token}`,
  };
}

async function fetchSharedGameState() {
  if (!isMultiplayer) return null;
  const response = await fetch(`/api/lobbies/${encodeURIComponent(multiplayerSeat.lobbyId)}/state`, {
    headers: { Authorization: `Bearer ${multiplayerSeat.token}` },
  });
  if (!response.ok) throw new Error(`State sync failed (${response.status}).`);
  return response.json();
}

async function publishSharedGameState() {
  if (!isMultiplayer || isSpectator || multiplayerSync.applying) return;
  if (multiplayerSync.publishing) {
    multiplayerSync.publishQueued = true;
    return;
  }
  multiplayerSync.publishing = true;
  try {
    const response = await fetch(`/api/lobbies/${encodeURIComponent(multiplayerSeat.lobbyId)}/state`, {
      method: "PUT",
      headers: multiplayerHeaders(),
      body: JSON.stringify({ version: multiplayerSync.version, state: serializeGameState() }),
    });
    if (!response.ok) throw new Error(`State publish failed (${response.status}).`);
    const payload = await response.json();
    multiplayerSync.version = payload.version || multiplayerSync.version;
  } catch (error) {
    addLog(error.message);
  } finally {
    multiplayerSync.publishing = false;
    if (multiplayerSync.publishQueued) {
      multiplayerSync.publishQueued = false;
      publishSharedGameState();
    }
  }
}

function scheduleMultiplayerPublish() {
  if (!isMultiplayer || !multiplayerSync.ready || multiplayerSync.applying) return;
  window.clearTimeout(multiplayerSync.publishTimer);
  multiplayerSync.publishTimer = window.setTimeout(() => {
    publishSharedGameState();
  }, 150);
}

async function pollSharedGameState() {
  if (!isMultiplayer || multiplayerSync.applying) return;
  try {
    const payload = await fetchSharedGameState();
    if (payload.hostColor) state.hostColor = payload.hostColor;
    if (payload.players) {
      state.playerNames = {
        blue: payload.players.blue?.name || state.playerNames.blue,
        red: payload.players.red?.name || state.playerNames.red,
      };
    }
    if (payload.state && payload.version > multiplayerSync.version) {
      applySharedGameState(payload.state, payload.version);
    } else if (!payload.state && multiplayerSeat.color === state.hostColor && multiplayerSync.version === 0) {
      multiplayerSync.ready = true;
      publishSharedGameState();
    } else if (!payload.state) {
      multiplayerSync.ready = true;
    }
  } catch (error) {
    addLog(error.message);
    render();
  }
}

function startMultiplayerSync() {
  if (!isMultiplayer) return;
  pollSharedGameState();
  multiplayerSync.pollTimer = window.setInterval(pollSharedGameState, 1500);
  if (isSpectator && !isAdminSpectator) return;
  chatPanel.hidden = false;
  if (isAdminSpectator) chatInput.placeholder = "Message players as GameMaster...";
  pollLobbyChat();
  multiplayerSync.chatTimer = window.setInterval(pollLobbyChat, 2500);
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

async function pollLobbyChat() {
  if (!isMultiplayer) return;
  try {
    const response = await fetch(`/api/lobbies/${encodeURIComponent(multiplayerSeat.lobbyId)}/chat`, {
      headers: { Authorization: `Bearer ${multiplayerSeat.token}` },
    });
    if (!response.ok) return;
    const payload = await response.json();
    renderLobbyChat(payload.messages || []);
  } catch {
    // Chat is non-critical; gameplay sync has its own error path.
  }
}

function renderLobbyChat(messages) {
  chatMessagesEl.innerHTML = messages
    .map(
      (message) => `
        <div class="chat-message ${message.color}">
          <strong>${escapeHtml(message.name)}</strong>
          <span>${escapeHtml(message.text)}</span>
        </div>
      `,
    )
    .join("");
  const last = messages[messages.length - 1];
  if (last?.id !== multiplayerSync.chatLastId) {
    multiplayerSync.chatLastId = last?.id || null;
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  }
}

async function sendLobbyChat(event) {
  event.preventDefault();
  if (!isMultiplayer) return;
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";
  const response = await fetch(`/api/lobbies/${encodeURIComponent(multiplayerSeat.lobbyId)}/chat`, {
    method: "POST",
    headers: multiplayerHeaders(),
    body: JSON.stringify({ text }),
  });
  if (response.ok) pollLobbyChat();
}

function openBugReport() {
  if (!isMultiplayer || isSpectator) return;
  bugReportTitle.value = "";
  bugReportDetails.value = "";
  bugReportDialog.showModal();
}

async function submitBugReport(event) {
  event.preventDefault();
  if (!isMultiplayer || isSpectator) return;
  const response = await fetch("/api/bug-reports", {
    method: "POST",
    headers: multiplayerHeaders(),
    body: JSON.stringify({
      lobbyId: multiplayerSeat.lobbyId,
      title: bugReportTitle.value,
      details: bugReportDetails.value,
    }),
  });
  if (!response.ok) throw new Error("Bug report could not be submitted.");
  bugReportDialog.close();
  addLog("Bug report submitted. Thank you.");
  render();
}

async function leaveLobbyFromGame() {
  if (!isMultiplayer) return;
  if (isSpectator) {
    window.location.href = "/multiplayer.html";
    return;
  }
  await fetch(`/api/lobbies/${encodeURIComponent(multiplayerSeat.lobbyId)}/leave`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${multiplayerSeat.token}`,
    },
    body: "{}",
  });
  window.location.href = "/multiplayer.html";
}

async function openRules() {
  rulesContentEl.innerHTML = `<div class="rules-loading">Loading rules...</div>`;
  rulesDialog.showModal();
  try {
    const response = await fetch("assets/rules-reference.html");
    if (!response.ok) throw new Error("Rules reference unavailable.");
    rulesContentEl.innerHTML = await response.text();
  } catch {
    rulesContentEl.innerHTML = `
      <article class="rules-reference">
        <h1>Battlechess Armada Rules</h1>
        <p>The readable rules reference could not be loaded.</p>
        <p><a href="assets/battlechess-armada-rules.pdf" target="_blank" rel="noopener">Open the rule book PDF</a></p>
      </article>
    `;
  }
}

function closeRules() {
  rulesDialog.close();
}

function proposeGameMode() {
  updateGameModeTooltip();
  if (!isMultiplayer || isSpectator || multiplayerSeat.color !== state.hostColor || state.gameOver || state.gameModeConfirmed) return;
  state.gameMode = gameModeSelect.value;
  state.modeConfirmations = { blue: false, red: false };
  state.gameModeConfirmed = false;
  addLog(`${playerName(multiplayerSeat.color)} selected ${GAME_MODES[state.gameMode].name}. Both players must confirm.`);
  render();
}

function confirmGameMode() {
  if (!isMultiplayer || isSpectator || !["blue", "red"].includes(multiplayerSeat.color) || state.gameModeConfirmed || state.gameOver) return;
  state.modeConfirmations[multiplayerSeat.color] = true;
  state.gameModeConfirmed = Boolean(state.modeConfirmations.blue && state.modeConfirmations.red);
  addLog(`${playerName(multiplayerSeat.color)} confirmed ${GAME_MODES[state.gameMode].name}.`);
  if (state.gameModeConfirmed) addLog(`${GAME_MODES[state.gameMode].name} confirmed by both players. Deployment may begin.`);
  render();
}

endTurnButton.addEventListener("click", () => endTurn());
newGameButton.addEventListener("click", newGame);
lockSetupButton.addEventListener("click", lockSetup);
randomizeSetupButton.addEventListener("click", randomizeDeployment);
resupplyButton.addEventListener("click", resupply);
surrenderButton.addEventListener("click", surrenderGame);
leaveLobbyButton.addEventListener("click", () => leaveLobbyFromGame().catch((error) => addLog(error.message)));
rulesButton.addEventListener("click", openRules);
bugReportButton.addEventListener("click", openBugReport);
bugReportForm.addEventListener("submit", (event) => submitBugReport(event).catch((error) => addLog(error.message)));
cancelBugReportButton.addEventListener("click", () => bugReportDialog.close());
closeRulesButton.addEventListener("click", closeRules);
rulesDialog.addEventListener("click", (event) => {
  if (event.target === rulesDialog) closeRules();
});
reactionPassButton.addEventListener("click", passReactionWindow);
gameModeSelect.addEventListener("change", proposeGameMode);
confirmModeButton.addEventListener("click", confirmGameMode);
chatForm.addEventListener("submit", (event) => sendLobbyChat(event).catch((error) => addLog(error.message)));
reconButton.addEventListener("click", () => {
  state.actionMode = state.actionMode === "recon" ? null : "recon";
  render();
});
mineButton.addEventListener("click", () => {
  state.actionMode = state.actionMode === "mine" ? null : "mine";
  render();
});
repairButton.addEventListener("click", repairCrew);
steadyButton.addEventListener("click", steadyShot);
speedButton.addEventListener("click", () => startCommand("speed"));
fireButton.addEventListener("click", () => startCommand("fire"));
defenseButton.addEventListener("click", () => startCommand("defense"));

setupLabels();
updateGameModeTooltip();
if (isMultiplayer) {
  leaveLobbyButton.hidden = false;
  bugReportButton.hidden = isSpectator;
  statusLine.textContent = isSpectator
    ? `Watching lobby ${multiplayerSeat.lobbyId}.`
    : `Connected as ${multiplayerSeat.color.toUpperCase()} in lobby ${multiplayerSeat.lobbyId}.`;
}
newGame();
startMultiplayerSync();
