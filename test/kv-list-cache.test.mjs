// KV 一覧キャッシュのテスト: node --test test/
// src/index.js を毎回 .mjs として読み込み直し、isolate 内メモリを初期化する。
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "..", "src", "index.js"), "utf8");
const workDir = mkdtempSync(join(tmpdir(), "kv-list-cache-"));
let loadCount = 0;

async function loadWorker() {
  loadCount += 1;
  const file = join(workDir, `index-${loadCount}.mjs`);
  writeFileSync(file, source);
  return (await import(pathToFileURL(file).href)).default;
}

class FakeKV {
  constructor(entries = {}) {
    this.data = new Map(Object.entries(entries));
    this.ops = { list: 0, get: 0, put: 0, delete: 0 };
  }
  async list({ prefix = "", limit = 1000 } = {}) {
    this.ops.list += 1;
    const keys = [...this.data.keys()].filter((k) => k.startsWith(prefix)).sort().slice(0, limit);
    return { keys: keys.map((name) => ({ name })), list_complete: true };
  }
  async get(key) {
    this.ops.get += 1;
    return this.data.has(key) ? this.data.get(key) : null;
  }
  async put(key, value) {
    this.ops.put += 1;
    this.data.set(key, value);
  }
  async delete(key) {
    this.ops.delete += 1;
    this.data.delete(key);
  }
}

class FakeCache {
  constructor() {
    this.store = new Map();
  }
  async match(request) {
    const hit = this.store.get(request.url);
    return hit ? new Response(hit.body, { headers: hit.headers }) : undefined;
  }
  async put(request, response) {
    this.store.set(request.url, { body: await response.text(), headers: [...response.headers] });
  }
}

function installCache() {
  const cache = new FakeCache();
  globalThis.caches = { default: cache };
  return cache;
}

function makeEnv(extra = {}) {
  return {
    PROPOSALS: new FakeKV({
      prop_a: JSON.stringify({ id: "prop_a", title: "A", upvotes: 0 }),
      prop_b: JSON.stringify({ id: "prop_b", title: "B", upvotes: 0 }),
    }),
    QUESTS: new FakeKV({
      quest_a: JSON.stringify({ id: "quest_a", name: "Q" }),
    }),
    ...extra,
  };
}

const ctx = { waitUntil() {} };
const BASE = "https://mifron.mct-official.com";

function req(path, init = {}) {
  return new Request(`${BASE}${path}`, {
    ...init,
    headers: { "CF-Connecting-IP": "203.0.113.9", "content-type": "application/json", ...(init.headers || {}) },
  });
}

async function call(worker, env, path, init) {
  const response = await worker.fetch(req(path, init), env, ctx);
  return { status: response.status, body: await response.json().catch(() => null), headers: response.headers };
}

console.warn = () => {};

test("GET /api/proposals は TTL 内なら KV を一覧しない", async () => {
  installCache();
  const worker = await loadWorker();
  const env = makeEnv();
  const first = await call(worker, env, "/api/proposals");
  assert.deepEqual(first.body.map((p) => p.id), ["prop_a", "prop_b"]);
  assert.equal(first.headers.get("cache-control"), "no-store");
  for (let i = 0; i < 20; i += 1) {
    const again = await call(worker, env, "/api/proposals");
    assert.deepEqual(again.body, first.body);
  }
  assert.equal(env.PROPOSALS.ops.list, 1);
});

test("別 isolate でも caches.default を共有して KV を一覧しない", async () => {
  installCache();
  const env = makeEnv();
  await call(await loadWorker(), env, "/api/quests");
  await call(await loadWorker(), env, "/api/quests");
  assert.equal(env.QUESTS.ops.list, 1);
});

test("提案の投稿はキャッシュに即反映され、一覧を増やさない", async () => {
  installCache();
  const worker = await loadWorker();
  const env = makeEnv();
  await call(worker, env, "/api/proposals");
  const created = await call(worker, env, "/api/proposals", {
    method: "POST",
    body: JSON.stringify({ title: "New", description: "desc" }),
  });
  assert.equal(created.status, 201);
  const after = await call(worker, env, "/api/proposals");
  assert.deepEqual(after.body.map((p) => p.id), ["prop_a", "prop_b", created.body.id]);
  assert.equal(env.PROPOSALS.ops.list, 1);
  // KV から直接読み直した結果と同じであること。
  const fresh = await call(await loadWorker(), { ...env, KV_LIST_CACHE_TTL_SECONDS: "0" }, "/api/proposals");
  assert.deepEqual(after.body, fresh.body);
});

test("クエスト提案の投稿もキャッシュに反映される", async () => {
  installCache();
  const worker = await loadWorker();
  const env = makeEnv();
  await call(worker, env, "/api/quests");
  const created = await call(worker, env, "/api/quests", {
    method: "POST",
    body: JSON.stringify({ name: "N", condition: "C", reward: "R" }),
  });
  assert.equal(created.status, 201);
  const after = await call(worker, env, "/api/quests");
  assert.ok(after.body.some((q) => q.id === created.body.id));
  assert.equal(env.QUESTS.ops.list, 1);
});

test("評価: 集計・自分の票・支持数の同期がキャッシュ経由でも正しい", async () => {
  installCache();
  const worker = await loadWorker();
  const env = makeEnv();
  const empty = await call(worker, env, "/api/proposals/votes?voter=u1");
  assert.deepEqual(empty.body, { counts: {}, mine: {} });
  await call(worker, env, "/api/proposals");

  const up = await call(worker, env, "/api/proposals/vote", {
    method: "POST",
    body: JSON.stringify({ proposalId: "prop_a", vote: "up", voter: "u1" }),
  });
  assert.deepEqual(up.body, { success: true, id: "prop_a", count: { up: 1, down: 0 }, myVote: "up" });

  const down = await call(worker, env, "/api/proposals/vote", {
    method: "POST",
    body: JSON.stringify({ proposalId: "prop_a", vote: "down", voter: "u2" }),
  });
  assert.deepEqual(down.body.count, { up: 1, down: 1 });

  const mine = await call(worker, env, "/api/proposals/votes?voter=u1");
  assert.deepEqual(mine.body, { counts: { prop_a: { up: 1, down: 1 } }, mine: { prop_a: "up" } });

  const cleared = await call(worker, env, "/api/proposals/vote", {
    method: "POST",
    body: JSON.stringify({ proposalId: "prop_a", vote: "none", voter: "u1" }),
  });
  assert.deepEqual(cleared.body, { success: true, id: "prop_a", count: { up: 0, down: 1 }, myVote: null });

  const list = await call(worker, env, "/api/proposals");
  assert.equal(list.body.find((p) => p.id === "prop_a").upvotes, 0);

  // 一覧は最初の votes GET と proposals GET の1回ずつだけ。
  assert.equal(env.PROPOSALS.ops.list, 2);

  // KV を直接集計した結果と一致すること。
  const fresh = await call(await loadWorker(), { ...env, KV_LIST_CACHE_TTL_SECONDS: "0" }, "/api/proposals/votes?voter=u2");
  assert.deepEqual(fresh.body, { counts: { prop_a: { up: 0, down: 1 } }, mine: { prop_a: "down" } });
});

test("KV_LIST_CACHE_TTL_SECONDS=0 で従来どおり毎回一覧する", async () => {
  installCache();
  const worker = await loadWorker();
  const env = makeEnv({ KV_LIST_CACHE_TTL_SECONDS: "0" });
  await call(worker, env, "/api/proposals");
  await call(worker, env, "/api/proposals");
  assert.equal(env.PROPOSALS.ops.list, 2);
});

test("Cache API が無い環境（workers.dev 等）でも動作する", async () => {
  delete globalThis.caches;
  const worker = await loadWorker();
  const env = makeEnv();
  const a = await call(worker, env, "/api/proposals");
  const b = await call(worker, env, "/api/proposals");
  assert.deepEqual(a.body, b.body);
  assert.equal(env.PROPOSALS.ops.list, 1);
});

test("/api/sync/quests は KV に触れない（Worker 側に未実装のため 404）", async () => {
  installCache();
  const worker = await loadWorker();
  const env = makeEnv({
    ASSETS: { fetch: async () => new Response("Not Found", { status: 404 }) },
  });
  const response = await worker.fetch(req("/api/sync/quests", { method: "POST", body: "{}" }), env, ctx);
  assert.equal(response.status, 404);
  assert.deepEqual(env.PROPOSALS.ops, { list: 0, get: 0, put: 0, delete: 0 });
  assert.deepEqual(env.QUESTS.ops, { list: 0, get: 0, put: 0, delete: 0 });
});
