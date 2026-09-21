// Neon Trail level editor — canvas iframe client.
//
// Everything the user edits here is a plain level document that gets written
// back to `src/game/levels/<id>.json` by the extension, so the result is an
// ordinary file change the user commits and opens a PR for.

const API = {
  state: () => request("GET", "/api/state"),
  level: (id) => request("GET", `/api/level/${encodeURIComponent(id)}`),
  validate: (document) => request("POST", "/api/validate", { document }),
  save: (document, previousId) => request("POST", "/api/save", { document, previousId }),
  create: () => request("POST", "/api/create", {}),
  remove: (id) => request("POST", "/api/delete", { id }),
  manifest: (campaign) => request("POST", "/api/manifest", { campaign }),
};

async function request(method, url, body) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `${method} ${url} failed`);
  return payload;
}

const FOOD_KINDS = ["spark", "prism", "pulse", "nova"];
const ENEMY_KINDS = ["roller", "glitch"];

const TOOLS = [
  { id: "select", label: "Select", key: "v", hint: "Click an obstacle, enemy or snake segment to inspect it." },
  { id: "wall", label: "Wall", key: "1", hint: "Click or drag to lay solid walls. Deadly on contact." },
  { id: "crystal", label: "Crystal", key: "2", hint: "Solid crystal. Deadly unless it is breakable and you are in first person." },
  { id: "crystal-breakable", label: "Crystal (breakable)", key: "3", hint: "Breaks when hit in first person — this is what clear-crystals objectives count." },
  { id: "roller", label: "Roller", key: "4", hint: "Enemy. Set 'edible after' in the inspector so it can be eaten." },
  { id: "glitch", label: "Glitch", key: "5", hint: "Enemy. Set 'edible after' in the inspector so it can be eaten." },
  { id: "snake", label: "Snake", key: "6", hint: "Drag head-first to redraw the starting body. Must stay contiguous." },
  { id: "patrol", label: "Patrol", key: "7", hint: "With an enemy selected, click cells to append patrol waypoints." },
  { id: "region", label: "Spawn region", key: "8", hint: "Click cells to toggle them in the highlighted spawn rule's region." },
  { id: "erase", label: "Erase", key: "0", hint: "Click or drag to remove obstacles and enemies." },
];

const PALETTE = {
  background: "#120a24",
  gridLine: "rgba(157, 123, 255, 0.16)",
  wall: "#3c2f6b",
  wallEdge: "#6f5ad6",
  crystal: "#2a6f8f",
  crystalBreakable: "#36e6ff",
  roller: "#ff7a45",
  glitch: "#ff4fd8",
  snake: "#5ef2a4",
  snakeHead: "#c6ffe4",
  region: "rgba(54, 230, 255, 0.18)",
  regionEdge: "rgba(54, 230, 255, 0.5)",
  error: "#ff4d5e",
  hover: "rgba(255, 255, 255, 0.24)",
  selection: "#ffdf4a",
};

const state = {
  levels: [],
  manifest: { version: 1, campaign: [] },
  doc: null,
  activeId: null,
  savedJson: "",
  tool: "select",
  selection: null, // { type: "obstacle" | "enemy" | "snake", index }
  issues: [],
  highlight: null, // { x, y }
  hover: null,
  activeSpawnIndex: 0,
  pointerDown: false,
  pendingSwitch: null,
  pendingDelete: null,
  cell: 24,
};

const dom = {};
let validateTimer = null;
let toastTimer = null;

/* ------------------------------------------------------------------ utils */

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value !== undefined && value !== null) node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) {
    if (child) node.append(child);
  }
  return node;
}

function toast(message, isError = false) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  clearTimeout(toastTimer);
  const node = el("div", { class: isError ? "toast error" : "toast", text: message });
  document.body.append(node);
  toastTimer = setTimeout(() => node.remove(), isError ? 6000 : 2800);
}

function toHex(value) {
  return `#${Math.max(0, Math.min(0xffffff, Number(value) || 0)).toString(16).padStart(6, "0")}`;
}

function fromHex(value) {
  return parseInt(String(value).replace("#", ""), 16) || 0;
}

function nextId(prefix, taken) {
  let index = 1;
  while (taken.has(`${prefix}-${index}`)) index += 1;
  return `${prefix}-${index}`;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

function isDirty() {
  return Boolean(state.doc) && JSON.stringify(state.doc) !== state.savedJson;
}

function markChanged({ structural = false } = {}) {
  updateDirty();
  scheduleValidate();
  draw();
  if (structural) renderDynamicInspector();
}

function updateDirty() {
  const dirty = isDirty();
  dom.dirty.textContent = dirty ? "Unsaved changes" : "Saved";
  dom.dirty.className = dirty ? "badge badge-dirty" : "badge badge-clean";
  dom.revert.disabled = !dirty;
  dom.save.disabled = !state.doc;
}

/* ------------------------------------------------------- document helpers */

function cellKey(point) {
  return `${point.x},${point.y}`;
}

function obstacleAt(x, y) {
  return state.doc.obstacles.findIndex((item) => item.position.x === x && item.position.y === y);
}

function enemyAt(x, y) {
  return state.doc.enemies.findIndex((item) => item.position.x === x && item.position.y === y);
}

function snakeAt(x, y) {
  return state.doc.initialSnake.findIndex((item) => item.x === x && item.y === y);
}

function inGrid(x, y) {
  return x >= 0 && y >= 0 && x < state.doc.grid.width && y < state.doc.grid.height;
}

/* -------------------------------------------------------------- rendering */

function resizeCanvas() {
  if (!state.doc) return;
  const wrap = dom.canvas.parentElement;
  const available = wrap.getBoundingClientRect();
  const { width, height } = state.doc.grid;
  const cell = Math.max(
    8,
    Math.floor(Math.min((available.width - 24) / width, (available.height - 24) / height)),
  );
  state.cell = cell;
  const ratio = window.devicePixelRatio || 1;
  dom.canvas.width = width * cell * ratio;
  dom.canvas.height = height * cell * ratio;
  dom.canvas.style.width = `${width * cell}px`;
  dom.canvas.style.height = `${height * cell}px`;
  const ctx = dom.canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function errorCells() {
  const cells = new Set();
  for (const issue of state.issues) {
    const point = pointForPath(issue.path);
    if (point) cells.add(cellKey(point));
  }
  return cells;
}

function pointForPath(path) {
  if (!state.doc) return null;
  let match = /^obstacles\[(\d+)\]/.exec(path);
  if (match) return state.doc.obstacles[Number(match[1])]?.position ?? null;
  match = /^enemies\[(\d+)\]\.patrol\[(\d+)\]/.exec(path);
  if (match) return state.doc.enemies[Number(match[1])]?.patrol?.[Number(match[2])] ?? null;
  match = /^enemies\[(\d+)\]/.exec(path);
  if (match) return state.doc.enemies[Number(match[1])]?.position ?? null;
  match = /^initialSnake\[(\d+)\]/.exec(path);
  if (match) return state.doc.initialSnake[Number(match[1])] ?? null;
  match = /^spawns\[(\d+)\]\.regions\[(\d+)\]/.exec(path);
  if (match) return state.doc.spawns[Number(match[1])]?.regions?.[Number(match[2])] ?? null;
  return null;
}

function draw() {
  if (!state.doc) return;
  const ctx = dom.canvas.getContext("2d");
  const cell = state.cell;
  const { width, height } = state.doc.grid;

  ctx.fillStyle = PALETTE.background;
  ctx.fillRect(0, 0, width * cell, height * cell);

  ctx.strokeStyle = PALETTE.gridLine;
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 1) {
    ctx.beginPath();
    ctx.moveTo(x * cell + 0.5, 0);
    ctx.lineTo(x * cell + 0.5, height * cell);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 1) {
    ctx.beginPath();
    ctx.moveTo(0, y * cell + 0.5);
    ctx.lineTo(width * cell, y * cell + 0.5);
    ctx.stroke();
  }

  const spawn = state.doc.spawns[state.activeSpawnIndex];
  if (spawn?.regions?.length) {
    ctx.fillStyle = PALETTE.region;
    ctx.strokeStyle = PALETTE.regionEdge;
    for (const point of spawn.regions) {
      ctx.fillRect(point.x * cell, point.y * cell, cell, cell);
      ctx.strokeRect(point.x * cell + 0.5, point.y * cell + 0.5, cell - 1, cell - 1);
    }
  }

  for (const obstacle of state.doc.obstacles) {
    const breakable = obstacle.kind === "crystal" && obstacle.breakableInFirstPerson;
    const fill = obstacle.kind === "wall" ? PALETTE.wall : breakable ? PALETTE.crystal : "#20465c";
    ctx.fillStyle = fill;
    ctx.fillRect(obstacle.position.x * cell + 1, obstacle.position.y * cell + 1, cell - 2, cell - 2);
    ctx.strokeStyle = obstacle.kind === "wall" ? PALETTE.wallEdge : breakable ? PALETTE.crystalBreakable : "#2f7a99";
    ctx.lineWidth = breakable ? 2 : 1;
    ctx.strokeRect(obstacle.position.x * cell + 1.5, obstacle.position.y * cell + 1.5, cell - 3, cell - 3);
  }

  for (const enemy of state.doc.enemies) {
    if (enemy.patrol?.length) {
      ctx.strokeStyle = enemy.kind === "roller" ? PALETTE.roller : PALETTE.glitch;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo((enemy.position.x + 0.5) * cell, (enemy.position.y + 0.5) * cell);
      for (const point of enemy.patrol) ctx.lineTo((point.x + 0.5) * cell, (point.y + 0.5) * cell);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = enemy.kind === "roller" ? PALETTE.roller : PALETTE.glitch;
    ctx.beginPath();
    ctx.arc((enemy.position.x + 0.5) * cell, (enemy.position.y + 0.5) * cell, cell * 0.34, 0, Math.PI * 2);
    ctx.fill();
  }

  state.doc.initialSnake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? PALETTE.snakeHead : PALETTE.snake;
    const inset = index === 0 ? 2 : 4;
    ctx.fillRect(segment.x * cell + inset, segment.y * cell + inset, cell - inset * 2, cell - inset * 2);
  });

  const errors = errorCells();
  if (errors.size) {
    ctx.strokeStyle = PALETTE.error;
    ctx.lineWidth = 2;
    for (const key of errors) {
      const [x, y] = key.split(",").map(Number);
      ctx.strokeRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
    }
  }

  const selected = selectedPoint();
  if (selected) {
    ctx.strokeStyle = PALETTE.selection;
    ctx.lineWidth = 2;
    ctx.strokeRect(selected.x * cell + 1, selected.y * cell + 1, cell - 2, cell - 2);
  }

  if (state.highlight) {
    ctx.strokeStyle = PALETTE.error;
    ctx.lineWidth = 3;
    ctx.strokeRect(state.highlight.x * cell, state.highlight.y * cell, cell, cell);
  }

  if (state.hover) {
    ctx.strokeStyle = PALETTE.hover;
    ctx.lineWidth = 1;
    ctx.strokeRect(state.hover.x * cell + 0.5, state.hover.y * cell + 0.5, cell - 1, cell - 1);
  }
}

function selectedPoint() {
  if (!state.selection || !state.doc) return null;
  const { type, index } = state.selection;
  if (type === "obstacle") return state.doc.obstacles[index]?.position ?? null;
  if (type === "enemy") return state.doc.enemies[index]?.position ?? null;
  if (type === "snake") return state.doc.initialSnake[index] ?? null;
  return null;
}

/* ------------------------------------------------------------ grid editing */

function cellFromEvent(event) {
  const rect = dom.canvas.getBoundingClientRect();
  const x = Math.floor(((event.clientX - rect.left) / rect.width) * state.doc.grid.width);
  const y = Math.floor(((event.clientY - rect.top) / rect.height) * state.doc.grid.height);
  return inGrid(x, y) ? { x, y } : null;
}

let snakeDraft = null;
let snakeBefore = null;

function applyTool(point, isDragStart) {
  const { x, y } = point;
  const doc = state.doc;

  switch (state.tool) {
    case "select": {
      const obstacle = obstacleAt(x, y);
      if (obstacle !== -1) return select({ type: "obstacle", index: obstacle });
      const enemy = enemyAt(x, y);
      if (enemy !== -1) return select({ type: "enemy", index: enemy });
      const segment = snakeAt(x, y);
      if (segment !== -1) return select({ type: "snake", index: segment });
      return select(null);
    }

    case "wall":
    case "crystal":
    case "crystal-breakable": {
      const existing = obstacleAt(x, y);
      const kind = state.tool === "wall" ? "wall" : "crystal";
      const breakable = state.tool === "crystal-breakable";
      if (existing !== -1) {
        const current = doc.obstacles[existing];
        if (current.kind === kind && Boolean(current.breakableInFirstPerson) === breakable) return;
        current.kind = kind;
        if (breakable) current.breakableInFirstPerson = true;
        else delete current.breakableInFirstPerson;
        return markChanged({ structural: true });
      }
      const enemy = enemyAt(x, y);
      if (enemy !== -1) doc.enemies.splice(enemy, 1);
      const taken = new Set(doc.obstacles.map((item) => item.id));
      doc.obstacles.push({
        id: nextId(breakable ? "crystal" : kind, taken),
        kind,
        position: { x, y },
        ...(breakable ? { breakableInFirstPerson: true } : {}),
      });
      return markChanged({ structural: true });
    }

    case "roller":
    case "glitch": {
      if (!isDragStart) return;
      const existing = enemyAt(x, y);
      if (existing !== -1) {
        doc.enemies[existing].kind = state.tool;
        return markChanged({ structural: true });
      }
      const obstacle = obstacleAt(x, y);
      if (obstacle !== -1) doc.obstacles.splice(obstacle, 1);
      const taken = new Set(doc.enemies.map((item) => item.id));
      doc.enemies.push({ id: nextId(state.tool, taken), kind: state.tool, position: { x, y } });
      select({ type: "enemy", index: doc.enemies.length - 1 }, { silent: true });
      return markChanged({ structural: true });
    }

    case "snake": {
      if (isDragStart) {
        snakeBefore = doc.initialSnake.map((cell) => ({ ...cell }));
        snakeDraft = [{ x, y }];
      }
      if (!snakeDraft) return;
      const last = snakeDraft[snakeDraft.length - 1];
      const step = Math.abs(last.x - x) + Math.abs(last.y - y);
      if (step === 0) return;
      if (step !== 1) return;
      if (snakeDraft.some((cell) => cell.x === x && cell.y === y)) return;
      snakeDraft.push({ x, y });
      doc.initialSnake = snakeDraft.map((cell) => ({ ...cell }));
      return markChanged();
    }

    case "patrol": {
      if (!isDragStart) return;
      if (state.selection?.type !== "enemy") {
        toast("Select an enemy first, then click cells to build its patrol.", true);
        return;
      }
      const enemy = doc.enemies[state.selection.index];
      enemy.patrol = [...(enemy.patrol ?? []), { x, y }];
      return markChanged({ structural: true });
    }

    case "region": {
      if (!isDragStart) return;
      const spawn = doc.spawns[state.activeSpawnIndex];
      if (!spawn) {
        toast("Add a spawn rule before painting regions.", true);
        return;
      }
      const regions = spawn.regions ?? [];
      const index = regions.findIndex((cell) => cell.x === x && cell.y === y);
      if (index === -1) regions.push({ x, y });
      else regions.splice(index, 1);
      if (regions.length === 0) delete spawn.regions;
      else spawn.regions = regions;
      return markChanged({ structural: true });
    }

    case "erase": {
      const obstacle = obstacleAt(x, y);
      const enemy = enemyAt(x, y);
      if (obstacle === -1 && enemy === -1) return;
      if (obstacle !== -1) doc.obstacles.splice(obstacle, 1);
      if (enemy !== -1) doc.enemies.splice(enemy, 1);
      select(null, { silent: true });
      return markChanged({ structural: true });
    }

    default:
      return undefined;
  }
}

function select(selection, { silent = false } = {}) {
  state.selection = selection;
  state.highlight = null;
  if (!silent) {
    renderSelection();
    draw();
  }
}

/* ------------------------------------------------------------- validation */

function scheduleValidate() {
  clearTimeout(validateTimer);
  validateTimer = setTimeout(runValidate, 250);
}

async function runValidate() {
  if (!state.doc) return;
  try {
    const result = await API.validate(state.doc);
    state.issues = result.issues ?? [];
  } catch (error) {
    state.issues = [{ path: "level", code: "invalid-type", message: error.message }];
  }
  renderIssues();
  draw();
}

function renderIssues() {
  dom.issues.replaceChildren();
  dom.issuesHeading.textContent = state.issues.length ? `Validation — ${state.issues.length}` : "Validation";
  if (!state.issues.length) {
    dom.issues.append(el("li", { class: "ok-note", text: "Valid. Ready to save." }));
    return;
  }
  for (const issue of state.issues) {
    const button = el("button", { class: "issue", type: "button" }, [
      el("span", { class: "issue-path", text: `${issue.path} · ${issue.code}` }),
      el("span", { class: "issue-message", text: issue.message }),
    ]);
    button.addEventListener("click", () => {
      const point = pointForPath(issue.path);
      state.highlight = point ? { ...point } : null;
      draw();
    });
    dom.issues.append(el("li", {}, [button]));
  }
}

/* -------------------------------------------------------------- inspector */

function bindStaticInspector() {
  const bind = (node, apply) => {
    node.addEventListener("input", () => {
      if (!state.doc) return;
      apply(node);
      markChanged();
    });
  };

  bind(dom.fId, (node) => {
    state.doc.id = node.value.trim();
  });
  bind(dom.fName, (node) => {
    state.doc.name = node.value;
  });
  bind(dom.fSubtitle, (node) => {
    state.doc.subtitle = node.value;
  });
  bind(dom.fWidth, (node) => {
    state.doc.grid.width = Number(node.value);
    resizeCanvas();
  });
  bind(dom.fHeight, (node) => {
    state.doc.grid.height = Number(node.value);
    resizeCanvas();
  });
  bind(dom.fSpeed, (node) => {
    state.doc.speedMs = Number(node.value);
  });
  bind(dom.fFirstPerson, (node) => {
    state.doc.firstPersonEnabled = node.checked;
  });

  dom.fObjectiveType.addEventListener("change", () => {
    state.doc.objective.type = dom.fObjectiveType.value;
    if (state.doc.objective.type === "collect") {
      state.doc.objective.foodId = state.doc.objective.foodId ?? state.doc.food[0]?.id;
    } else {
      delete state.doc.objective.foodId;
    }
    syncObjectiveFields();
    markChanged();
  });
  bind(dom.fObjectiveTarget, (node) => {
    state.doc.objective.target = Number(node.value);
  });
  dom.fObjectiveFood.addEventListener("change", () => {
    state.doc.objective.foodId = dom.fObjectiveFood.value;
    markChanged();
  });
  bind(dom.fObjectiveFp, (node) => {
    if (node.checked) state.doc.objective.requiresFirstPerson = true;
    else delete state.doc.objective.requiresFirstPerson;
  });
}

function syncObjectiveFields() {
  const isCollect = state.doc.objective.type === "collect";
  dom.objectiveFoodField.style.display = isCollect ? "" : "none";
  const foodIds = state.doc.food.map((food) => food.id);
  dom.fObjectiveFood.replaceChildren(...foodIds.map((id) => el("option", { value: id, text: id })));
  dom.fObjectiveFood.value = state.doc.objective.foodId ?? foodIds[0] ?? "";
}

function populateStaticInspector() {
  const doc = state.doc;
  dom.fId.value = doc.id;
  dom.fName.value = doc.name;
  dom.fSubtitle.value = doc.subtitle ?? "";
  dom.fWidth.value = doc.grid.width;
  dom.fHeight.value = doc.grid.height;
  dom.fSpeed.value = doc.speedMs;
  dom.fFirstPerson.checked = Boolean(doc.firstPersonEnabled);
  dom.fObjectiveType.value = doc.objective.type;
  dom.fObjectiveTarget.value = doc.objective.target;
  dom.fObjectiveFp.checked = Boolean(doc.objective.requiresFirstPerson);
  syncObjectiveFields();
}

function renderDynamicInspector() {
  syncObjectiveFields();
  renderSelection();
  renderFood();
  renderSpawns();
}

function textField(label, value, onInput, type = "text") {
  const input = el("input", { type, value: value ?? "" });
  input.addEventListener("input", () => onInput(input.value, input));
  return el("div", { class: "field" }, [el("label", { text: label }), input]);
}

function selectField(label, value, options, onChange) {
  const node = el("select", {}, options.map((option) => el("option", { value: option, text: option })));
  node.value = value;
  node.addEventListener("change", () => onChange(node.value));
  return el("div", { class: "field" }, [el("label", { text: label }), node]);
}

function renderSelection() {
  const container = dom.selection;
  container.replaceChildren();
  const selection = state.selection;
  if (!selection || !state.doc) {
    container.append(el("p", { class: "hint", text: "Pick the Select tool and click something on the grid." }));
    return;
  }

  if (selection.type === "snake") {
    container.append(
      el("p", { class: "hint", text: `Snake segment ${selection.index + 1} of ${state.doc.initialSnake.length}${selection.index === 0 ? " (head)" : ""}. Use the Snake tool to redraw the body.` }),
    );
    return;
  }

  if (selection.type === "obstacle") {
    const obstacle = state.doc.obstacles[selection.index];
    if (!obstacle) return select(null);
    container.append(
      el("div", { class: "row-head" }, [
        el("span", { class: "row-title", text: `obstacles[${selection.index}]` }),
        el("button", {
          class: "btn btn-small btn-danger",
          type: "button",
          text: "Remove",
          onclick: () => {
            state.doc.obstacles.splice(selection.index, 1);
            select(null, { silent: true });
            markChanged({ structural: true });
          },
        }),
      ]),
      textField("Id", obstacle.id, (value) => {
        obstacle.id = value.trim();
        markChanged();
      }),
      selectField("Kind", obstacle.kind, ["wall", "crystal"], (value) => {
        obstacle.kind = value;
        if (value === "wall") delete obstacle.breakableInFirstPerson;
        markChanged({ structural: true });
      }),
    );
    if (obstacle.kind === "crystal") {
      const check = el("input", { type: "checkbox" });
      check.checked = Boolean(obstacle.breakableInFirstPerson);
      check.addEventListener("change", () => {
        if (check.checked) obstacle.breakableInFirstPerson = true;
        else delete obstacle.breakableInFirstPerson;
        markChanged();
      });
      container.append(el("label", { class: "check" }, [check, document.createTextNode(" Breakable in first person")]));
    }
    return;
  }

  const enemy = state.doc.enemies[selection.index];
  if (!enemy) return select(null);
  const foodKinds = [...new Set(state.doc.food.map((food) => food.kind))];
  container.append(
    el("div", { class: "row-head" }, [
      el("span", { class: "row-title", text: `enemies[${selection.index}]` }),
      el("button", {
        class: "btn btn-small btn-danger",
        type: "button",
        text: "Remove",
        onclick: () => {
          state.doc.enemies.splice(selection.index, 1);
          select(null, { silent: true });
          markChanged({ structural: true });
        },
      }),
    ]),
    textField("Id", enemy.id, (value) => {
      enemy.id = value.trim();
      markChanged();
    }),
    selectField("Kind", enemy.kind, ENEMY_KINDS, (value) => {
      enemy.kind = value;
      markChanged();
    }),
    selectField("Edible after food", enemy.edibleAfterFood ?? "(never)", ["(never)", ...foodKinds], (value) => {
      if (value === "(never)") delete enemy.edibleAfterFood;
      else enemy.edibleAfterFood = value;
      markChanged();
    }),
    el("div", { class: "row-head" }, [
      el("span", { class: "hint", text: `Patrol: ${enemy.patrol?.length ?? 0} waypoints` }),
      el("button", {
        class: "btn btn-small",
        type: "button",
        text: "Clear",
        onclick: () => {
          delete enemy.patrol;
          markChanged({ structural: true });
        },
      }),
    ]),
    el("p", { class: "hint", text: "Use the Patrol tool to append waypoints to this enemy." }),
  );
}

function renderFood() {
  const container = dom.food;
  container.replaceChildren();

  state.doc.food.forEach((food, index) => {
    const row = el("div", { class: "row" });
    row.append(
      el("div", { class: "row-head" }, [
        el("span", { class: "row-title" }, [
          el("span", { class: "swatch", style: `background:${toHex(food.color)}` }),
          document.createTextNode(food.id),
        ]),
        el("button", {
          class: "btn btn-small btn-danger",
          type: "button",
          text: "Remove",
          onclick: () => {
            state.doc.food.splice(index, 1);
            markChanged({ structural: true });
          },
        }),
      ]),
    );

    const idInput = el("input", { type: "text", value: food.id });
    idInput.addEventListener("input", () => {
      food.id = idInput.value.trim();
      markChanged();
    });
    const kindSelect = el("select", {}, FOOD_KINDS.map((kind) => el("option", { value: kind, text: kind })));
    kindSelect.value = food.kind;
    kindSelect.addEventListener("change", () => {
      food.kind = kindSelect.value;
      markChanged();
    });
    const colorInput = el("input", { type: "color", value: toHex(food.color) });
    colorInput.addEventListener("input", () => {
      food.color = fromHex(colorInput.value);
      markChanged();
    });
    row.append(
      el("div", { class: "grid3" }, [
        el("div", { class: "field" }, [el("label", { text: "Id" }), idInput]),
        el("div", { class: "field" }, [el("label", { text: "Kind" }), kindSelect]),
        el("div", { class: "field" }, [el("label", { text: "Colour" }), colorInput]),
      ]),
    );

    const numeric = (label, key, step) => {
      const input = el("input", { type: "number", step, value: food[key] });
      input.addEventListener("input", () => {
        food[key] = Number(input.value);
        markChanged();
      });
      return el("div", { class: "field" }, [el("label", { text: label }), input]);
    };
    row.append(
      el("div", { class: "grid3" }, [
        numeric("Growth", "growth", "1"),
        numeric("Score", "score", "10"),
        numeric("Rarity", "rarity", "0.05"),
      ]),
    );

    const fpOnly = el("input", { type: "checkbox" });
    fpOnly.checked = Boolean(food.firstPersonOnly);
    fpOnly.addEventListener("change", () => {
      if (fpOnly.checked) food.firstPersonOnly = true;
      else delete food.firstPersonOnly;
      markChanged();
    });
    row.append(el("label", { class: "check" }, [fpOnly, document.createTextNode(" First-person only")]));
    container.append(row);
  });

  container.append(
    el("button", {
      class: "btn btn-small",
      type: "button",
      text: "Add food",
      onclick: () => {
        const taken = new Set(state.doc.food.map((food) => food.id));
        state.doc.food.push({
          id: nextId("food", taken),
          kind: "spark",
          color: 16768842,
          growth: 1,
          score: 50,
          rarity: 1,
        });
        markChanged({ structural: true });
      },
    }),
  );
}

function renderSpawns() {
  const container = dom.spawns;
  container.replaceChildren();
  const foodIds = state.doc.food.map((food) => food.id);

  state.doc.spawns.forEach((spawn, index) => {
    const row = el("div", { class: "row" });
    const isActive = index === state.activeSpawnIndex;
    row.append(
      el("div", { class: "row-head" }, [
        el("span", { class: "row-title", text: `spawns[${index}]${isActive ? " ●" : ""}` }),
        el("button", {
          class: "btn btn-small btn-danger",
          type: "button",
          text: "Remove",
          onclick: () => {
            state.doc.spawns.splice(index, 1);
            state.activeSpawnIndex = Math.max(0, Math.min(state.activeSpawnIndex, state.doc.spawns.length - 1));
            markChanged({ structural: true });
          },
        }),
      ]),
    );

    const foodSelect = el("select", {}, foodIds.map((id) => el("option", { value: id, text: id })));
    foodSelect.value = spawn.foodId;
    foodSelect.addEventListener("change", () => {
      spawn.foodId = foodSelect.value;
      markChanged();
    });
    row.append(el("div", { class: "field" }, [el("label", { text: "Food" }), foodSelect]));

    const numeric = (label, key, step, min) => {
      const input = el("input", { type: "number", step, min, value: spawn[key] });
      input.addEventListener("input", () => {
        spawn[key] = Number(input.value);
        markChanged();
      });
      return el("div", { class: "field" }, [el("label", { text: label }), input]);
    };
    row.append(
      el("div", { class: "grid3" }, [
        numeric("Weight", "weight", "1", "0"),
        numeric("Max active", "maxActive", "1", "1"),
        numeric("Interval ms", "intervalMs", "100", "100"),
      ]),
    );

    row.append(
      el("div", { class: "row-head" }, [
        el("span", { class: "hint", text: `Region: ${spawn.regions?.length ?? 0} cells` }),
        el("span", {}, [
          el("button", {
            class: "btn btn-small",
            type: "button",
            text: isActive ? "Painting" : "Paint",
            onclick: () => {
              state.activeSpawnIndex = index;
              setTool("region");
              renderSpawns();
              draw();
            },
          }),
          el("button", {
            class: "btn btn-small",
            type: "button",
            text: "Clear",
            onclick: () => {
              delete spawn.regions;
              markChanged({ structural: true });
            },
          }),
        ]),
      ]),
    );
    container.append(row);
  });

  container.append(
    el("button", {
      class: "btn btn-small",
      type: "button",
      text: "Add spawn rule",
      onclick: () => {
        const used = new Set(state.doc.spawns.map((spawn) => spawn.foodId));
        const free = foodIds.find((id) => !used.has(id)) ?? foodIds[0] ?? "spark";
        state.doc.spawns.push({ foodId: free, weight: 1, maxActive: 1, intervalMs: 2500 });
        markChanged({ structural: true });
      },
    }),
  );
}

/* ------------------------------------------------------------- level list */

function renderLevelList() {
  dom.levelList.replaceChildren();
  state.levels.forEach((level, index) => {
    const item = el("li", {
      class: `level-item${level.id === state.activeId ? " active" : ""}${level.valid ? "" : " invalid"}`,
    });
    const body = el("div", { class: "level-item-body" }, [
      el("span", { class: "level-item-name", text: level.document?.name ?? level.id }),
      el("span", { class: "level-item-id", text: level.id }),
    ]);
    body.addEventListener("click", () => openLevel(level.id));
    const reorder = el("div", { class: "reorder" }, [
      el("button", {
        type: "button",
        text: "▲",
        title: "Move earlier in the campaign",
        onclick: (event) => {
          event.stopPropagation();
          moveLevel(index, -1);
        },
      }),
      el("button", {
        type: "button",
        text: "▼",
        title: "Move later in the campaign",
        onclick: (event) => {
          event.stopPropagation();
          moveLevel(index, 1);
        },
      }),
    ]);
    const remove = el("button", {
      class: "btn btn-small btn-danger",
      type: "button",
      text: state.pendingDelete === level.id ? "Sure?" : "×",
      title: "Delete this level file",
      onclick: (event) => {
        event.stopPropagation();
        deleteLevel(level.id);
      },
    });
    item.append(body, reorder, remove);
    dom.levelList.append(item);
  });
}

async function moveLevel(index, delta) {
  const order = state.levels.map((level) => level.id);
  const target = index + delta;
  if (target < 0 || target >= order.length) return;
  [order[index], order[target]] = [order[target], order[index]];
  try {
    await API.manifest(order);
    await refreshList();
    toast("Campaign order updated.");
  } catch (error) {
    toast(error.message, true);
  }
}

async function deleteLevel(id) {
  if (state.pendingDelete !== id) {
    state.pendingDelete = id;
    renderLevelList();
    setTimeout(() => {
      if (state.pendingDelete === id) {
        state.pendingDelete = null;
        renderLevelList();
      }
    }, 3500);
    toast("Click × again to delete the file.");
    return;
  }
  state.pendingDelete = null;
  try {
    await API.remove(id);
    if (state.activeId === id) {
      state.doc = null;
      state.activeId = null;
    }
    await refreshList();
    if (!state.doc && state.levels[0]) await openLevel(state.levels[0].id, { force: true });
    toast(`Deleted ${id}.json`);
  } catch (error) {
    toast(error.message, true);
  }
}

/* -------------------------------------------------------------- lifecycle */

async function refreshList() {
  const payload = await API.state();
  state.levels = payload.levels;
  state.manifest = payload.manifest;
  renderLevelList();
  return payload;
}

async function openLevel(id, { force = false } = {}) {
  if (!force && isDirty() && state.activeId !== id) {
    if (state.pendingSwitch !== id) {
      state.pendingSwitch = id;
      toast("Unsaved changes — click the level again to discard them.", true);
      return;
    }
  }
  state.pendingSwitch = null;
  try {
    const payload = await API.level(id);
    loadDocument(payload.document, id, payload.file);
  } catch (error) {
    toast(error.message, true);
  }
}

function loadDocument(document_, id, file) {
  state.doc = document_;
  state.activeId = id;
  state.savedJson = JSON.stringify(document_);
  state.selection = null;
  state.highlight = null;
  state.activeSpawnIndex = 0;
  dom.title.textContent = document_.name || id;
  dom.filepath.textContent = file ?? `src/game/levels/${id}.json`;
  populateStaticInspector();
  renderDynamicInspector();
  renderLevelList();
  resizeCanvas();
  updateDirty();
  draw();
  runValidate();
}

async function save() {
  if (!state.doc) return;
  dom.save.disabled = true;
  try {
    const result = await API.save(state.doc, state.activeId);
    state.savedJson = JSON.stringify(state.doc);
    state.activeId = state.doc.id;
    dom.filepath.textContent = result.file;
    dom.title.textContent = state.doc.name;
    await refreshList();
    updateDirty();
    toast(`Wrote ${result.file}`);
  } catch (error) {
    toast(error.message, true);
  } finally {
    updateDirty();
  }
}

async function revert() {
  if (!state.activeId) return;
  await openLevel(state.activeId, { force: true });
  toast("Reverted to the file on disk.");
}

async function createLevel() {
  try {
    const payload = await API.create();
    await refreshList();
    loadDocument(payload.document, payload.document.id, payload.file);
    toast("Created a new level. Edit the id and name, then save.");
  } catch (error) {
    toast(error.message, true);
  }
}

/* ------------------------------------------------------------------ tools */

function setTool(tool) {
  state.tool = tool;
  for (const button of dom.toolbar.children) {
    button.classList.toggle("active", button.dataset.tool === tool);
  }
  dom.toolHint.textContent = TOOLS.find((entry) => entry.id === tool)?.hint ?? "";
}

function renderToolbar() {
  dom.toolbar.replaceChildren();
  for (const tool of TOOLS) {
    const button = el("button", { class: "tool", type: "button" }, [
      document.createTextNode(tool.label),
      el("span", { class: "tool-key", text: tool.key }),
    ]);
    button.dataset.tool = tool.id;
    button.addEventListener("click", () => setTool(tool.id));
    dom.toolbar.append(button);
  }
  setTool(state.tool);
}

/* ------------------------------------------------------------------- boot */

function cacheDom() {
  const ids = {
    title: "title",
    filepath: "filepath",
    dirty: "dirty",
    save: "save",
    revert: "revert",
    newLevel: "new-level",
    levelList: "level-list",
    toolbar: "toolbar",
    canvas: "grid",
    cursor: "cursor",
    toolHint: "tool-hint",
    selection: "selection",
    spawns: "spawns",
    food: "food",
    issues: "issues",
    issuesHeading: "issues-heading",
    objectiveFoodField: "objective-food-field",
    fId: "f-id",
    fName: "f-name",
    fSubtitle: "f-subtitle",
    fWidth: "f-width",
    fHeight: "f-height",
    fSpeed: "f-speed",
    fFirstPerson: "f-firstperson",
    fObjectiveType: "f-objective-type",
    fObjectiveTarget: "f-objective-target",
    fObjectiveFood: "f-objective-food",
    fObjectiveFp: "f-objective-fp",
  };
  for (const [key, id] of Object.entries(ids)) dom[key] = document.getElementById(id);
}

function wireCanvas() {
  dom.canvas.addEventListener("pointerdown", (event) => {
    if (!state.doc) return;
    const point = cellFromEvent(event);
    if (!point) return;
    state.pointerDown = true;
    dom.canvas.setPointerCapture(event.pointerId);
    applyTool(point, true);
  });
  dom.canvas.addEventListener("pointermove", (event) => {
    if (!state.doc) return;
    const point = cellFromEvent(event);
    state.hover = point;
    dom.cursor.textContent = point ? `x ${point.x}, y ${point.y}` : "–";
    if (state.pointerDown && point) applyTool(point, false);
    else draw();
  });
  const end = () => {
    // A one-cell drag is never a valid body, so restore just the snake rather
    // than reloading the file and throwing away other unsaved edits.
    if (state.pointerDown && state.tool === "snake" && snakeDraft && snakeDraft.length < 2) {
      if (snakeBefore) state.doc.initialSnake = snakeBefore;
      toast("Drag head-first to draw at least two segments.", true);
      markChanged();
    }
    state.pointerDown = false;
    snakeDraft = null;
    snakeBefore = null;
  };
  dom.canvas.addEventListener("pointerup", end);
  dom.canvas.addEventListener("pointercancel", end);
  dom.canvas.addEventListener("pointerleave", () => {
    state.hover = null;
    dom.cursor.textContent = "–";
    draw();
  });
}

function wireKeys() {
  window.addEventListener("keydown", (event) => {
    const tag = event.target?.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      save();
      return;
    }
    const tool = TOOLS.find((entry) => entry.key === event.key.toLowerCase());
    if (tool) {
      event.preventDefault();
      setTool(tool.id);
    }
  });
}

function wireEvents() {
  const source = new EventSource("/events");
  source.addEventListener("refresh", async () => {
    await refreshList();
    if (state.activeId && !isDirty()) await openLevel(state.activeId, { force: true });
  });
  source.addEventListener("open-level", async (event) => {
    try {
      const data = JSON.parse(event.data);
      await refreshList();
      await openLevel(data.id, { force: true });
    } catch {
      /* ignore malformed pushes */
    }
  });
}

async function boot() {
  cacheDom();
  bindStaticInspector();
  renderToolbar();
  wireCanvas();
  wireKeys();
  dom.save.addEventListener("click", save);
  dom.revert.addEventListener("click", revert);
  dom.newLevel.addEventListener("click", createLevel);
  window.addEventListener("resize", () => {
    resizeCanvas();
    draw();
  });

  const payload = await refreshList();
  const initial = payload.activeId ?? state.levels[0]?.id;
  if (initial) await openLevel(initial, { force: true });
  else dom.title.textContent = "No levels yet — press New";
  wireEvents();
}

boot().catch((error) => {
  document.body.append(el("div", { class: "toast error", text: `Editor failed to start: ${error.message}` }));
});
