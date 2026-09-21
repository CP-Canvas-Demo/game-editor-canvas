/**
 * Neon Trail level format validation.
 *
 * Authored as plain ESM (with a sibling `levelSchema.d.mts` for types) so that
 * both the TypeScript game and the Node-based level editor extension import the
 * exact same implementation. There is deliberately no second copy of these
 * rules anywhere in the repo.
 */

export const LEVEL_FORMAT_VERSION = 1;

export const FOOD_KINDS = ["spark", "prism", "pulse", "nova"];
export const ENEMY_KINDS = ["roller", "glitch"];
export const OBSTACLE_KINDS = ["wall", "crystal"];
export const OBJECTIVE_TYPES = ["score", "collect", "clear-crystals"];
export const DIRECTIONS = ["up", "down", "left", "right"];

export const GRID_LIMITS = { minWidth: 6, maxWidth: 64, minHeight: 6, maxHeight: 48 };
export const SPEED_LIMITS = { min: 60, max: 600 };

class Collector {
  constructor() {
    this.issues = [];
  }

  add(path, code, message) {
    this.issues.push({ path, code, message });
  }

  get ok() {
    return this.issues.length === 0;
  }
}

function isBag(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireBag(value, path, issues) {
  if (!isBag(value)) {
    issues.add(path, "invalid-type", `Expected an object at ${path}.`);
    return null;
  }
  return value;
}

function requireArray(value, path, issues) {
  if (!Array.isArray(value)) {
    issues.add(path, "invalid-type", `Expected an array at ${path}.`);
    return null;
  }
  return value;
}

function requireString(value, path, issues) {
  if (typeof value !== "string" || value.trim() === "") {
    issues.add(path, value === undefined ? "missing-field" : "invalid-type", `Expected a non-empty string at ${path}.`);
    return null;
  }
  return value;
}

function requireNumber(value, path, issues, options = {}) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    issues.add(path, value === undefined ? "missing-field" : "invalid-type", `Expected a finite number at ${path}.`);
    return null;
  }
  if (options.integer && !Number.isInteger(value)) {
    issues.add(path, "invalid-value", `Expected an integer at ${path}, received ${value}.`);
    return null;
  }
  if (options.min !== undefined && value < options.min) {
    issues.add(path, "invalid-value", `${path} must be at least ${options.min}, received ${value}.`);
    return null;
  }
  if (options.max !== undefined && value > options.max) {
    issues.add(path, "invalid-value", `${path} must be at most ${options.max}, received ${value}.`);
    return null;
  }
  return value;
}

function requireBoolean(value, path, issues) {
  if (typeof value !== "boolean") {
    issues.add(path, value === undefined ? "missing-field" : "invalid-type", `Expected a boolean at ${path}.`);
    return null;
  }
  return value;
}

function optionalBoolean(value, path, issues) {
  if (value === undefined) return undefined;
  return requireBoolean(value, path, issues) ?? undefined;
}

function requireEnum(value, allowed, path, issues) {
  if (typeof value !== "string" || !allowed.includes(value)) {
    issues.add(
      path,
      value === undefined ? "missing-field" : "invalid-value",
      `${path} must be one of ${allowed.join(", ")}.`,
    );
    return null;
  }
  return value;
}

function requirePoint(value, path, issues) {
  const bag = requireBag(value, path, issues);
  if (!bag) return null;
  const x = requireNumber(bag.x, `${path}.x`, issues, { integer: true });
  const y = requireNumber(bag.y, `${path}.y`, issues, { integer: true });
  if (x === null || y === null) return null;
  return { x, y };
}

function inBounds(point, grid) {
  return point.x >= 0 && point.y >= 0 && point.x < grid.width && point.y < grid.height;
}

function pointKey(point) {
  return `${point.x},${point.y}`;
}

function checkUniqueIds(ids, basePath, issues) {
  const seen = new Set();
  ids.forEach((id, index) => {
    if (id === null) return;
    if (seen.has(id)) {
      issues.add(`${basePath}[${index}].id`, "duplicate-id", `Duplicate id "${id}" in ${basePath}.`);
    }
    seen.add(id);
  });
}

/**
 * Validates an arbitrary parsed JSON document against the level format.
 *
 * The game calls this when loading bundled levels; the level editor calls the
 * same function before writing a document back to disk, so both surfaces agree
 * on exactly what a valid level is. Every issue is collected rather than
 * failing on the first, so an editor can highlight every bad field at once.
 */
export function validateLevel(input) {
  const issues = new Collector();
  const root = requireBag(input, "level", issues);
  if (!root) {
    return { ok: false, level: null, issues: issues.issues };
  }

  if (root.version !== LEVEL_FORMAT_VERSION) {
    issues.add(
      "version",
      "unsupported-version",
      `Unsupported level version ${String(root.version)}; this build reads version ${LEVEL_FORMAT_VERSION}.`,
    );
  }

  const id = requireString(root.id, "id", issues);
  const name = requireString(root.name, "name", issues);
  const subtitle = requireString(root.subtitle, "subtitle", issues);
  const speedMs = requireNumber(root.speedMs, "speedMs", issues, {
    integer: true,
    min: SPEED_LIMITS.min,
    max: SPEED_LIMITS.max,
  });
  const firstPersonEnabled = requireBoolean(root.firstPersonEnabled, "firstPersonEnabled", issues);

  const gridBag = requireBag(root.grid, "grid", issues);
  const width = gridBag
    ? requireNumber(gridBag.width, "grid.width", issues, {
        integer: true,
        min: GRID_LIMITS.minWidth,
        max: GRID_LIMITS.maxWidth,
      })
    : null;
  const height = gridBag
    ? requireNumber(gridBag.height, "grid.height", issues, {
        integer: true,
        min: GRID_LIMITS.minHeight,
        max: GRID_LIMITS.maxHeight,
      })
    : null;
  const grid = width !== null && height !== null ? { width, height } : null;

  const foods = validateFoods(root.food, issues);
  const obstacles = validateObstacles(root.obstacles, grid, issues);
  const enemies = validateEnemies(root.enemies, grid, foods, issues);
  const spawns = validateSpawns(root.spawns, grid, foods, issues);
  const initialSnake = validateInitialSnake(root.initialSnake, grid, obstacles, issues);
  const objective = validateObjective(root.objective, foods, obstacles, firstPersonEnabled, issues);

  if (!issues.ok) {
    return { ok: false, level: null, issues: issues.issues };
  }

  return {
    ok: true,
    issues: [],
    level: {
      version: LEVEL_FORMAT_VERSION,
      id,
      name,
      subtitle,
      grid,
      speedMs,
      initialSnake,
      obstacles,
      enemies,
      food: foods,
      spawns,
      objective,
      firstPersonEnabled,
    },
  };
}

function validateFoods(value, issues) {
  const raw = requireArray(value, "food", issues);
  if (!raw) return null;
  if (raw.length === 0) {
    issues.add("food", "invalid-value", "A level needs at least one food definition.");
    return null;
  }

  const ids = [];
  const foods = raw.map((entry, index) => {
    const path = `food[${index}]`;
    const bag = requireBag(entry, path, issues);
    if (!bag) {
      ids.push(null);
      return null;
    }
    const foodId = requireString(bag.id, `${path}.id`, issues);
    ids.push(foodId);
    const kind = requireEnum(bag.kind, FOOD_KINDS, `${path}.kind`, issues);
    const color = requireNumber(bag.color, `${path}.color`, issues, { integer: true, min: 0, max: 0xffffff });
    const growth = requireNumber(bag.growth, `${path}.growth`, issues, { integer: true, min: 0, max: 20 });
    const score = requireNumber(bag.score, `${path}.score`, issues, { integer: true, min: 0 });
    const rarity = requireNumber(bag.rarity, `${path}.rarity`, issues, { min: 0, max: 1 });
    const firstPersonOnly = optionalBoolean(bag.firstPersonOnly, `${path}.firstPersonOnly`, issues);
    if (foodId === null || kind === null || color === null || growth === null || score === null || rarity === null) {
      return null;
    }
    return { id: foodId, kind, color, growth, score, rarity, ...(firstPersonOnly === undefined ? {} : { firstPersonOnly }) };
  });

  checkUniqueIds(ids, "food", issues);
  return foods.every((food) => food !== null) ? foods : null;
}

function validateObstacles(value, grid, issues) {
  const raw = requireArray(value, "obstacles", issues);
  if (!raw) return null;

  const ids = [];
  const seenCells = new Map();
  const obstacles = raw.map((entry, index) => {
    const path = `obstacles[${index}]`;
    const bag = requireBag(entry, path, issues);
    if (!bag) {
      ids.push(null);
      return null;
    }
    const obstacleId = requireString(bag.id, `${path}.id`, issues);
    ids.push(obstacleId);
    const kind = requireEnum(bag.kind, OBSTACLE_KINDS, `${path}.kind`, issues);
    const position = requirePoint(bag.position, `${path}.position`, issues);
    const breakableInFirstPerson = optionalBoolean(bag.breakableInFirstPerson, `${path}.breakableInFirstPerson`, issues);

    if (position && grid && !inBounds(position, grid)) {
      issues.add(`${path}.position`, "out-of-bounds", `Obstacle sits outside the ${grid.width}x${grid.height} grid.`);
    }
    if (position) {
      const key = pointKey(position);
      const previous = seenCells.get(key);
      if (previous !== undefined) {
        issues.add(`${path}.position`, "overlap", `Cell ${key} is already used by obstacles[${previous}].`);
      } else {
        seenCells.set(key, index);
      }
    }
    if (breakableInFirstPerson && kind !== "crystal") {
      issues.add(
        `${path}.breakableInFirstPerson`,
        "invalid-value",
        "Only crystal obstacles can be breakable in first-person view.",
      );
    }
    if (obstacleId === null || kind === null || position === null) return null;
    return {
      id: obstacleId,
      kind,
      position,
      ...(breakableInFirstPerson === undefined ? {} : { breakableInFirstPerson }),
    };
  });

  checkUniqueIds(ids, "obstacles", issues);
  return obstacles.every((obstacle) => obstacle !== null) ? obstacles : null;
}

function validateEnemies(value, grid, foods, issues) {
  const raw = requireArray(value, "enemies", issues);
  if (!raw) return null;

  const availableKinds = new Set((foods ?? []).map((food) => food.kind));
  const ids = [];
  const enemies = raw.map((entry, index) => {
    const path = `enemies[${index}]`;
    const bag = requireBag(entry, path, issues);
    if (!bag) {
      ids.push(null);
      return null;
    }
    const enemyId = requireString(bag.id, `${path}.id`, issues);
    ids.push(enemyId);
    const kind = requireEnum(bag.kind, ENEMY_KINDS, `${path}.kind`, issues);
    const position = requirePoint(bag.position, `${path}.position`, issues);
    if (position && grid && !inBounds(position, grid)) {
      issues.add(`${path}.position`, "out-of-bounds", `Enemy sits outside the ${grid.width}x${grid.height} grid.`);
    }

    let patrol;
    if (bag.patrol !== undefined) {
      const rawPatrol = requireArray(bag.patrol, `${path}.patrol`, issues);
      if (rawPatrol) {
        const points = rawPatrol.map((point, pointIndex) => {
          const patrolPath = `${path}.patrol[${pointIndex}]`;
          const parsed = requirePoint(point, patrolPath, issues);
          if (parsed && grid && !inBounds(parsed, grid)) {
            issues.add(patrolPath, "out-of-bounds", "Patrol waypoint sits outside the grid.");
          }
          return parsed;
        });
        if (points.length === 0) {
          issues.add(`${path}.patrol`, "invalid-value", "Patrol must contain at least one waypoint when present.");
        }
        patrol = points.every((point) => point !== null) ? points : undefined;
      }
    }

    let edibleAfterFood;
    if (bag.edibleAfterFood !== undefined) {
      const parsed = requireEnum(bag.edibleAfterFood, FOOD_KINDS, `${path}.edibleAfterFood`, issues);
      if (parsed && foods && !availableKinds.has(parsed)) {
        issues.add(
          `${path}.edibleAfterFood`,
          "unknown-reference",
          `No food of kind "${parsed}" exists in this level, so this enemy can never be eaten.`,
        );
      }
      edibleAfterFood = parsed ?? undefined;
    }

    if (enemyId === null || kind === null || position === null) return null;
    return {
      id: enemyId,
      kind,
      position,
      ...(patrol === undefined ? {} : { patrol }),
      ...(edibleAfterFood === undefined ? {} : { edibleAfterFood }),
    };
  });

  checkUniqueIds(ids, "enemies", issues);
  return enemies.every((enemy) => enemy !== null) ? enemies : null;
}

function validateSpawns(value, grid, foods, issues) {
  const raw = requireArray(value, "spawns", issues);
  if (!raw) return null;
  if (raw.length === 0) {
    issues.add("spawns", "invalid-value", "A level needs at least one spawn rule or no food will ever appear.");
    return null;
  }

  const foodIds = new Set((foods ?? []).map((food) => food.id));
  const seenFoodIds = new Set();
  const spawns = raw.map((entry, index) => {
    const path = `spawns[${index}]`;
    const bag = requireBag(entry, path, issues);
    if (!bag) return null;
    const foodId = requireString(bag.foodId, `${path}.foodId`, issues);
    if (foodId && foods && !foodIds.has(foodId)) {
      issues.add(`${path}.foodId`, "unknown-reference", `No food definition with id "${foodId}".`);
    }
    if (foodId) {
      if (seenFoodIds.has(foodId)) {
        issues.add(`${path}.foodId`, "duplicate-id", `Food "${foodId}" already has a spawn rule.`);
      }
      seenFoodIds.add(foodId);
    }
    const weight = requireNumber(bag.weight, `${path}.weight`, issues, { min: 0 });
    const maxActive = requireNumber(bag.maxActive, `${path}.maxActive`, issues, { integer: true, min: 1 });
    const intervalMs = requireNumber(bag.intervalMs, `${path}.intervalMs`, issues, { integer: true, min: 100 });

    let regions;
    if (bag.regions !== undefined) {
      const rawRegions = requireArray(bag.regions, `${path}.regions`, issues);
      if (rawRegions) {
        const points = rawRegions.map((point, pointIndex) => {
          const regionPath = `${path}.regions[${pointIndex}]`;
          const parsed = requirePoint(point, regionPath, issues);
          if (parsed && grid && !inBounds(parsed, grid)) {
            issues.add(regionPath, "out-of-bounds", "Spawn region cell sits outside the grid.");
          }
          return parsed;
        });
        if (points.length === 0) {
          issues.add(`${path}.regions`, "invalid-value", "Regions must contain at least one cell when present.");
        }
        regions = points.every((point) => point !== null) ? points : undefined;
      }
    }

    if (foodId === null || weight === null || maxActive === null || intervalMs === null) return null;
    return { foodId, weight, maxActive, intervalMs, ...(regions === undefined ? {} : { regions }) };
  });

  if (spawns.every((rule) => rule !== null)) {
    const total = spawns.reduce((sum, rule) => sum + rule.weight, 0);
    if (total <= 0) {
      issues.add("spawns", "invalid-value", "At least one spawn rule must have a weight greater than zero.");
    }
    return spawns;
  }
  return null;
}

function validateInitialSnake(value, grid, obstacles, issues) {
  const raw = requireArray(value, "initialSnake", issues);
  if (!raw) return null;
  if (raw.length < 2) {
    issues.add("initialSnake", "invalid-value", "The starting trail needs at least two segments.");
    return null;
  }

  const points = raw.map((entry, index) => requirePoint(entry, `initialSnake[${index}]`, issues));
  if (!points.every((point) => point !== null)) return null;
  const snake = points;

  const seen = new Set();
  const obstacleCells = new Set((obstacles ?? []).map((obstacle) => pointKey(obstacle.position)));
  snake.forEach((point, index) => {
    const path = `initialSnake[${index}]`;
    if (grid && !inBounds(point, grid)) {
      issues.add(path, "out-of-bounds", `Segment sits outside the ${grid.width}x${grid.height} grid.`);
    }
    const key = pointKey(point);
    if (seen.has(key)) {
      issues.add(path, "overlap", `Segment repeats cell ${key}.`);
    }
    seen.add(key);
    if (obstacleCells.has(key)) {
      issues.add(path, "overlap", `Segment starts inside an obstacle at ${key}.`);
    }
    if (index > 0) {
      const previous = snake[index - 1];
      const step = Math.abs(point.x - previous.x) + Math.abs(point.y - previous.y);
      if (step !== 1) {
        issues.add(path, "not-contiguous", "Each segment must be orthogonally adjacent to the previous one.");
      }
    }
  });

  return snake;
}

function validateObjective(value, foods, obstacles, firstPersonEnabled, issues) {
  const bag = requireBag(value, "objective", issues);
  if (!bag) return null;
  const type = requireEnum(bag.type, OBJECTIVE_TYPES, "objective.type", issues);
  const target = requireNumber(bag.target, "objective.target", issues, { integer: true, min: 1 });
  const requiresFirstPerson = optionalBoolean(bag.requiresFirstPerson, "objective.requiresFirstPerson", issues);

  let foodId;
  if (bag.foodId !== undefined) {
    const parsed = requireString(bag.foodId, "objective.foodId", issues);
    if (parsed && foods && !foods.some((food) => food.id === parsed)) {
      issues.add("objective.foodId", "unknown-reference", `No food definition with id "${parsed}".`);
    }
    foodId = parsed ?? undefined;
  }

  if (type === "collect" && foodId === undefined) {
    issues.add("objective.foodId", "missing-field", "A collect objective must name the food id to collect.");
  }
  if (type === "clear-crystals" && obstacles && target !== null) {
    const breakable = obstacles.filter((obstacle) => obstacle.kind === "crystal" && obstacle.breakableInFirstPerson).length;
    if (target > breakable) {
      issues.add(
        "objective.target",
        "unsolvable-objective",
        `Objective asks for ${target} crystals but only ${breakable} breakable crystals exist.`,
      );
    }
  }
  if (requiresFirstPerson && firstPersonEnabled === false) {
    issues.add(
      "objective.requiresFirstPerson",
      "invalid-value",
      "Objective requires first-person view but firstPersonEnabled is false.",
    );
  }

  if (type === null || target === null) return null;
  return {
    type,
    target,
    ...(foodId === undefined ? {} : { foodId }),
    ...(requiresFirstPerson === undefined ? {} : { requiresFirstPerson }),
  };
}

export function formatIssues(issues) {
  return issues.map((issue) => `  - [${issue.code}] ${issue.path}: ${issue.message}`).join("\n");
}

/**
 * Canonical key order for serialized level documents. The editor writes files
 * in this order so hand-edited and tool-edited files produce readable diffs.
 */
export const LEVEL_KEY_ORDER = [
  "version",
  "id",
  "name",
  "subtitle",
  "grid",
  "speedMs",
  "firstPersonEnabled",
  "initialSnake",
  "obstacles",
  "enemies",
  "food",
  "spawns",
  "objective",
];

/** Reorders a level document's top-level keys into {@link LEVEL_KEY_ORDER}. */
export function orderLevelKeys(level) {
  const ordered = {};
  for (const key of LEVEL_KEY_ORDER) {
    if (level[key] !== undefined) ordered[key] = level[key];
  }
  for (const key of Object.keys(level)) {
    if (ordered[key] === undefined && level[key] !== undefined) ordered[key] = level[key];
  }
  return ordered;
}
