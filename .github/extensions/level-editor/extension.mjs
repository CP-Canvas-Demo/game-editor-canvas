// Neon Trail level editor canvas.
//
// Serves a small loopback web app that reads and writes the real level files in
// `src/game/levels/`. Saving writes a normal JSON file, so the user commits the
// result and opens a PR exactly as they would for a hand-edited level.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createCanvas, CanvasError, joinSession } from "@github/copilot-sdk/extension";

import {
  StoreError,
  assertValidId,
  createTemplate,
  deleteLevel,
  listLevels,
  readLevel,
  repoRoot,
  saveLevel,
  serializeLevel,
  validateLevel,
  writeManifest,
} from "./levelStore.mjs";

const uiDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "ui");

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

/** instanceId -> { server, url, clients, activeId } */
const instances = new Map();

let session;

function log(message, level = "info") {
  session?.log?.(message, { level, ephemeral: true });
}

/* ------------------------------------------------------------- http layer */

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new StoreError("invalid_json", "Request body was not valid JSON.");
  }
}

async function serveAsset(res, urlPath) {
  const relative = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  const file = path.join(uiDir, relative);
  // Keep traversal inside the ui directory.
  if (!file.startsWith(uiDir) || !existsSync(file)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  const body = await readFile(file);
  res.writeHead(200, {
    "Content-Type": CONTENT_TYPES[path.extname(file)] ?? "application/octet-stream",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function broadcast(instance, event, data = {}) {
  const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of instance.clients) client.write(frame);
}

function broadcastAll(event, data = {}) {
  for (const instance of instances.values()) broadcast(instance, event, data);
}

async function handleApi(instance, req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/state") {
    const { levels, manifest } = await listLevels();
    return sendJson(res, 200, {
      levels: levels.map((level) => ({
        id: level.id,
        file: `src/game/levels/${level.file}`,
        document: level.document,
        valid: level.valid,
        issues: level.issues,
        inCampaign: level.inCampaign,
      })),
      manifest,
      activeId: instance.activeId,
    });
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/level/")) {
    const id = decodeURIComponent(url.pathname.slice("/api/level/".length));
    const document_ = await readLevel(id);
    instance.activeId = id;
    return sendJson(res, 200, { document: document_, file: `src/game/levels/${id}.json` });
  }

  if (req.method === "POST" && url.pathname === "/api/validate") {
    const { document: document_ } = await readBody(req);
    const result = validateLevel(document_);
    return sendJson(res, 200, { ok: result.ok, issues: result.issues });
  }

  if (req.method === "POST" && url.pathname === "/api/save") {
    const { document: document_, previousId } = await readBody(req);
    const result = await saveLevel(document_, { previousId });
    instance.activeId = result.level.id;
    log(`Level editor wrote ${result.file}`);
    broadcastAll("refresh");
    return sendJson(res, 200, { file: result.file, id: result.level.id });
  }

  if (req.method === "POST" && url.pathname === "/api/create") {
    const { levels } = await listLevels();
    const taken = new Set(levels.map((level) => level.id));
    let id = "new-level";
    let counter = 2;
    while (taken.has(id)) id = `new-level-${counter++}`;
    const result = await saveLevel(createTemplate({ id, name: "New Level" }), {});
    instance.activeId = id;
    log(`Level editor created ${result.file}`);
    broadcastAll("refresh");
    return sendJson(res, 200, { document: result.level, file: result.file });
  }

  if (req.method === "POST" && url.pathname === "/api/delete") {
    const { id } = await readBody(req);
    const result = await deleteLevel(id);
    if (instance.activeId === id) instance.activeId = null;
    log(`Level editor deleted ${result.file}`);
    broadcastAll("refresh");
    return sendJson(res, 200, result);
  }

  if (req.method === "POST" && url.pathname === "/api/manifest") {
    const { campaign } = await readBody(req);
    if (!Array.isArray(campaign)) throw new StoreError("invalid_campaign", "campaign must be an array of level ids.");
    const manifest = await writeManifest(campaign);
    broadcastAll("refresh");
    return sendJson(res, 200, { manifest });
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
  return undefined;
}

async function startServer(instanceId, activeId) {
  const instance = { server: null, url: "", clients: new Set(), activeId: activeId ?? null };

  const server = createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");

    if (url.pathname === "/events") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store",
        Connection: "keep-alive",
      });
      res.write("retry: 2000\n\n");
      instance.clients.add(res);
      req.on("close", () => instance.clients.delete(res));
      return;
    }

    if (url.pathname === "/favicon.ico") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      handleApi(instance, req, res, url).catch((error) => {
        const code = error instanceof StoreError ? error.code : "internal_error";
        const status = code === "level_not_found" ? 404 : code === "internal_error" ? 500 : 400;
        sendJson(res, status, { code, message: error.message });
      });
      return;
    }

    serveAsset(res, url.pathname).catch(() => {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Internal error");
    });
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  instance.server = server;
  instance.url = `http://127.0.0.1:${server.address().port}/`;
  instances.set(instanceId, instance);
  return instance;
}

/* --------------------------------------------------------------- actions */

function wrapStoreError(error) {
  if (error instanceof CanvasError) return error;
  if (error instanceof StoreError) return new CanvasError(error.code, error.message);
  return new CanvasError("internal_error", error.message);
}

async function summariseLevels() {
  const { levels, manifest } = await listLevels();
  return {
    campaign: manifest.campaign,
    levels: levels.map((level) => ({
      id: level.id,
      name: level.document?.name ?? null,
      file: `src/game/levels/${level.file}`,
      valid: level.valid,
      issueCount: level.issues.length,
      inCampaign: level.inCampaign,
      objective: level.document?.objective ?? null,
      grid: level.document?.grid ?? null,
    })),
  };
}

function focusLevel(id) {
  for (const instance of instances.values()) instance.activeId = id;
  broadcastAll("open-level", { id });
}

const canvas = createCanvas({
  id: "level-editor",
  displayName: "Neon Trail level editor",
  description:
    "Visual editor for Neon Trail levels that reads and writes the real src/game/levels/*.json files so changes can be committed and opened as a PR.",
  inputSchema: {
    type: "object",
    properties: {
      levelId: {
        type: "string",
        description: "Level id to open first, matching the file name in src/game/levels (without .json).",
        pattern: "^[a-z0-9][a-z0-9-]{0,62}$",
      },
    },
    additionalProperties: false,
  },
  open: async (ctx) => {
    const levelId = ctx.input?.levelId ?? null;
    let instance = instances.get(ctx.instanceId);
    if (!instance) {
      instance = await startServer(ctx.instanceId, levelId);
    } else if (levelId) {
      instance.activeId = levelId;
      broadcast(instance, "open-level", { id: levelId });
    }
    const { levels } = await listLevels();
    const invalid = levels.filter((level) => !level.valid).length;
    return {
      url: instance.url,
      title: "Neon Trail level editor",
      status: invalid ? `${levels.length} levels · ${invalid} with issues` : `${levels.length} levels · all valid`,
    };
  },
  onClose: async (ctx) => {
    const instance = instances.get(ctx.instanceId);
    if (!instance) return;
    instances.delete(ctx.instanceId);
    for (const client of instance.clients) client.end();
    await new Promise((resolve) => instance.server.close(resolve));
  },
  actions: [
    {
      name: "list_levels",
      description: "List every level file with its campaign position and validation state.",
      handler: async () => {
        try {
          return await summariseLevels();
        } catch (error) {
          throw wrapStoreError(error);
        }
      },
    },
    {
      name: "open_level",
      description: "Focus a level in the open editor panel.",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
        additionalProperties: false,
      },
      handler: async (ctx) => {
        try {
          const document_ = await readLevel(ctx.input.id);
          focusLevel(ctx.input.id);
          return { id: ctx.input.id, document: document_ };
        } catch (error) {
          throw wrapStoreError(error);
        }
      },
    },
    {
      name: "read_level",
      description: "Read one level document without changing what the panel is showing.",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
        additionalProperties: false,
      },
      handler: async (ctx) => {
        try {
          return { id: ctx.input.id, document: await readLevel(ctx.input.id) };
        } catch (error) {
          throw wrapStoreError(error);
        }
      },
    },
    {
      name: "create_level",
      description: "Create a new valid level file from the starter template and open it.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          subtitle: { type: "string" },
          width: { type: "integer", minimum: 6, maximum: 64 },
          height: { type: "integer", minimum: 6, maximum: 48 },
          speedMs: { type: "integer", minimum: 60, maximum: 600 },
        },
        required: ["id"],
        additionalProperties: false,
      },
      handler: async (ctx) => {
        try {
          assertValidId(ctx.input.id);
          const result = await saveLevel(createTemplate(ctx.input), {});
          focusLevel(result.level.id);
          broadcastAll("refresh");
          return { id: result.level.id, file: result.file };
        } catch (error) {
          throw wrapStoreError(error);
        }
      },
    },
    {
      name: "save_level",
      description:
        "Validate and write a complete level document to src/game/levels/<id>.json. Invalid documents are rejected.",
      inputSchema: {
        type: "object",
        properties: {
          document: { type: "object" },
          previousId: { type: "string" },
        },
        required: ["document"],
        additionalProperties: false,
      },
      handler: async (ctx) => {
        try {
          const result = await saveLevel(ctx.input.document, { previousId: ctx.input.previousId });
          focusLevel(result.level.id);
          broadcastAll("refresh");
          return { id: result.level.id, file: result.file };
        } catch (error) {
          throw wrapStoreError(error);
        }
      },
    },
    {
      name: "validate_level",
      description: "Validate a level document (or a level on disk by id) and return every issue found.",
      inputSchema: {
        type: "object",
        properties: {
          document: { type: "object" },
          id: { type: "string" },
        },
        additionalProperties: false,
      },
      handler: async (ctx) => {
        try {
          const document_ = ctx.input?.document ?? (ctx.input?.id ? await readLevel(ctx.input.id) : null);
          if (!document_) throw new StoreError("invalid_request", "Pass either a document or an id.");
          const result = validateLevel(document_);
          return {
            ok: result.ok,
            issues: result.issues,
            preview: result.ok ? serializeLevel(result.level) : null,
          };
        } catch (error) {
          throw wrapStoreError(error);
        }
      },
    },
    {
      name: "delete_level",
      description: "Delete a level file and drop it from the campaign order.",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
        additionalProperties: false,
      },
      handler: async (ctx) => {
        try {
          const result = await deleteLevel(ctx.input.id);
          broadcastAll("refresh");
          return result;
        } catch (error) {
          throw wrapStoreError(error);
        }
      },
    },
    {
      name: "set_campaign_order",
      description: "Rewrite src/game/levels/manifest.json with a new campaign order.",
      inputSchema: {
        type: "object",
        properties: {
          campaign: { type: "array", items: { type: "string" } },
        },
        required: ["campaign"],
        additionalProperties: false,
      },
      handler: async (ctx) => {
        try {
          const manifest = await writeManifest(ctx.input.campaign);
          broadcastAll("refresh");
          return { manifest, file: "src/game/levels/manifest.json" };
        } catch (error) {
          throw wrapStoreError(error);
        }
      },
    },
  ],
});

session = await joinSession({ canvases: [canvas] });
log(`Neon Trail level editor ready (${path.relative(process.cwd(), repoRoot) || "."}/src/game/levels).`);
