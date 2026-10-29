// KV使用量削減リファクタリングの回帰テスト。
// Wrangler を使わず、src/index.js を data URL として読み込み、
// メモリ上の KV / Cache API モックで API 契約とKV操作回数を検証する。
//
// 実行: node tools/test_worker_api.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const worker = (
  await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`)
).default;

function createKv(seed = {}, options = {}) {
  const store = new Map(Object.entries(seed));
  const stats = { list: 0, get: 0, put: 0, delete: 0 };
  return {
    store,
    stats,
    async get(key) {
      stats.get += 1;
      if (options.failGet) throw new Error("KV get failed");
      return store.has(key) ? store.get(key) : null;
    },
    async put(key, value) {
      stats.put += 1;
      if (options.failPut) throw new Error("KV put failed");
      store.set(key, String(value));
    },
    async delete(key) {
      stats.delete += 1;
      store.delete(key);
    },
    async list(query = {}) {
      stats.list += 1;
      if (options.failList) throw new Error("KV list quota exhausted");
      const prefix = query.prefix || "";
      const limit = query.limit || 1000;
      const keys = [...store.keys()]
        .filter((key) => key.startsWith(prefix))
        .sort()
        .slice(0, limit)
        .map((name) => ({ name }));
      return { keys, list_complete: true };
    },
  };
}

function createCache() {
  const entries = new Map();
  return {
    entries,
    async match(request) {
      const key = typeof request === "string" ? request : request.url;
      const entry = entries.get(key);
      if (!entry) return undefined;
      return new Response(entry.body, {
        status: entry.status,
        headers: entry.headers,
      });
    },
    async put(request, response) {
      const key = typeof request === "string" ? request : request.url;
      entries.set(key, {
        status: response.status,
        headers: [...response.headers],
        body: await response.text(),
      });
    },
    async delete(request) {
      const key = typeof request === "string" ? request : request.url;
      return entries.delete(key);
    },
  };
}

function createCtx() {
  const waits = [];
  return {
    waitUntil(promise) {
      waits.push(promise);
    },
    async flush() {
      await Promise.all(waits.splice(0));
    },
  };
}

function request(path, init = {}) {
  return new Request(`https://mifron.mct-official.com${path}`, init);
}

function postJson(path, body) {
  return request(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function call(env, req, ctx = createCtx()) {
  const response = await worker.fetch(req, env, ctx);
  await ctx.flush();
  return response;
}

async function readJson(response) {
  return response.json();
}

function useFreshCache() {
  globalThis.caches = { default: createCache() };
}

async function silence(fn) {
  const { warn, error } = console;
  console.warn = () => {};
  console.error = () => {};
  try {
    return await fn();
  } finally {
    console.warn = warn;
    console.error = error;
  }
}

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

test("GET /api/quests は index を1回だけ構築し、2回目はキャッシュから返す", async () => {
  useFreshCache();
  const kv = createKv({
    quest_q1: JSON.stringify({ id: "quest_q1", name: "Q1" }),
    quest_q2: JSON.stringify({ id: "quest_q2", name: "Q2" }),
  });
  const env = { QUESTS: kv };

  const first = await call(env, request("/api/quests"));
  assert.equal(first.status, 200);
  assert.deepEqual((await readJson(first)).map((q) => q.id), ["quest_q1", "quest_q2"]);
  assert.equal(kv.stats.list, 1);
  assert.ok(kv.store.has("__index:quests"));

  const etag = first.headers.get("etag");
  assert.ok(etag);

  const statsBefore = { ...kv.stats };
  const second = await call(env, request("/api/quests"));
  assert.equal(second.status, 200);
  assert.equal((await readJson(second)).length, 2);
  assert.deepEqual(kv.stats, statsBefore, "cache hit must not touch KV");

  const third = await call(
    env,
    request("/api/quests", { headers: { "if-none-match": etag } })
  );
  assert.equal(third.status, 304);
  assert.deepEqual(kv.stats, statsBefore, "304 must not touch KV");
});

test("古い index は legacy キーから再構築される", async () => {
  useFreshCache();
  const kv = createKv({
    "__index:quests": JSON.stringify({
      updatedAt: 0,
      records: [{ id: "quest_old", name: "old" }],
    }),
    quest_new: JSON.stringify({ id: "quest_new", name: "new" }),
  });

  const response = await call({ QUESTS: kv }, request("/api/quests"));
  assert.equal(response.status, 200);
  assert.deepEqual((await readJson(response)).map((q) => q.id), ["quest_new"]);
  assert.equal(kv.stats.list, 1);

  const index = JSON.parse(kv.store.get("__index:quests"));
  assert.ok(index.updatedAt > Date.now() - 60_000);
});

test("index 再構築に失敗しても stale index を返す", async () => {
  useFreshCache();
  const kv = createKv(
    {
      "__index:quests": JSON.stringify({
        updatedAt: 0,
        records: [{ id: "quest_stale", name: "stale" }],
      }),
    },
    { failList: true }
  );

  const response = await silence(() =>
    call({ QUESTS: kv }, request("/api/quests"))
  );
  assert.equal(response.status, 200);
  assert.deepEqual((await readJson(response)).map((q) => q.id), ["quest_stale"]);
});

test("index が無く list が失敗したら 503 と retry-after を返す", async () => {
  useFreshCache();
  const kv = createKv({}, { failList: true });

  const response = await silence(() =>
    call({ QUESTS: kv }, request("/api/quests"))
  );
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("retry-after"), "60");
  assert.deepEqual(await readJson(response), {
    error: "Storage temporarily unavailable",
  });
});

test("KV binding が無ければ 503 を返す", async () => {
  useFreshCache();
  const response = await call({}, request("/api/proposals"));
  assert.equal(response.status, 503);
  assert.deepEqual(await readJson(response), { error: "Storage unavailable" });
});

test("提案への投票は up/down/none を O(1) で集計する", async () => {
  useFreshCache();
  const kv = createKv({
    "__index:proposals": JSON.stringify({
      updatedAt: Date.now(),
      records: [{ id: "prop_p1", title: "P1", upvotes: 0 }],
    }),
  });
  const env = { PROPOSALS: kv };

  const up = await call(
    env,
    postJson("/api/proposals/vote", {
      proposalId: "prop_p1",
      vote: "up",
      voter: "v1",
    })
  );
  assert.equal(up.status, 200);
  assert.deepEqual(await readJson(up), {
    success: true,
    id: "prop_p1",
    count: { up: 1, down: 0 },
    myVote: "up",
  });
  assert.equal(JSON.parse(kv.store.get("__tally:proposals")).prop_p1.up, 1);
  assert.deepEqual(JSON.parse(kv.store.get("__votes:proposals:v1")), {
    prop_p1: "up",
  });

  const again = await call(
    env,
    postJson("/api/proposals/vote", {
      proposalId: "prop_p1",
      vote: "up",
      voter: "v1",
    })
  );
  assert.deepEqual((await readJson(again)).count, { up: 1, down: 0 });

  const down = await call(
    env,
    postJson("/api/proposals/vote", {
      proposalId: "prop_p1",
      vote: "down",
      voter: "v1",
    })
  );
  assert.deepEqual(await readJson(down), {
    success: true,
    id: "prop_p1",
    count: { up: 0, down: 1 },
    myVote: "down",
  });

  const state = await call(env, request("/api/proposals/votes?voter=v1"));
  assert.deepEqual(await readJson(state), {
    counts: { prop_p1: { up: 0, down: 1 } },
    mine: { prop_p1: "down" },
  });

  const none = await call(
    env,
    postJson("/api/proposals/vote", {
      proposalId: "prop_p1",
      vote: "none",
      voter: "v1",
    })
  );
  assert.deepEqual(await readJson(none), {
    success: true,
    id: "prop_p1",
    count: { up: 0, down: 0 },
    myVote: null,
  });
  assert.equal(JSON.parse(kv.store.get("__tally:proposals")).prop_p1, undefined);
  assert.deepEqual(JSON.parse(kv.store.get("__votes:proposals:v1")), {});
});

test("クエスト投票は提案の集計キーと混ざらない", async () => {
  useFreshCache();
  const kv = createKv({
    "__index:quests": JSON.stringify({ updatedAt: Date.now(), records: [] }),
  });

  const response = await call(
    { QUESTS: kv },
    postJson("/api/quests/vote", {
      questId: "quest_q1",
      vote: "up",
      voter: "v1",
    })
  );
  assert.equal(response.status, 200);
  assert.deepEqual((await readJson(response)).count, { up: 1, down: 0 });
  assert.ok(kv.store.has("__tally:quests"));
  assert.ok(kv.store.has("__votes:quests:v1"));
  assert.equal(kv.store.has("__tally:proposals"), false);
});

test("GET /api/proposals は tally の upvotes を一覧へ重ねる", async () => {
  useFreshCache();
  const kv = createKv({
    "__index:proposals": JSON.stringify({
      updatedAt: Date.now(),
      records: [
        { id: "prop_p1", title: "P1", upvotes: 0 },
        { id: "prop_p2", title: "P2", upvotes: 7 },
      ],
    }),
    "__tally:proposals": JSON.stringify({ prop_p1: { up: 4, down: 2 } }),
  });

  const response = await call({ PROPOSALS: kv }, request("/api/proposals"));
  assert.equal(response.status, 200);
  assert.deepEqual(await readJson(response), [
    { id: "prop_p1", title: "P1", upvotes: 4 },
    { id: "prop_p2", title: "P2", upvotes: 7 },
  ]);
});

test("POST /api/quests は index へ追記し、一覧キャッシュを破棄する", async () => {
  useFreshCache();
  const kv = createKv();
  const env = { QUESTS: kv };

  const before = await call(env, request("/api/quests"));
  assert.deepEqual(await readJson(before), []);

  const created = await call(
    env,
    postJson("/api/quests", {
      name: "新しいクエスト",
      condition: "石を100個採掘",
      reward: "100 MP",
      author: "tester",
    })
  );
  assert.equal(created.status, 201);
  const payload = await readJson(created);
  assert.equal(payload.success, true);
  assert.ok(payload.id.startsWith("quest_"));

  const after = await call(env, request("/api/quests"));
  const list = await readJson(after);
  assert.deepEqual(list.map((q) => q.id), [payload.id]);
  assert.equal(list[0].name, "新しいクエスト");
});

test("POST /api/proposals は index へ追記し、一覧に反映する", async () => {
  useFreshCache();
  const kv = createKv();
  const env = { PROPOSALS: kv };

  const created = await call(
    env,
    postJson("/api/proposals", {
      title: "新しい提案",
      description: "テスト用の提案です",
      type: "feature",
      author: "tester",
    })
  );
  assert.equal(created.status, 201);
  const payload = await readJson(created);

  const list = await readJson(await call(env, request("/api/proposals")));
  assert.deepEqual(list.map((p) => p.id), [payload.id]);
  assert.equal(list[0].upvotes, 0);
});

let failed = 0;
for (const { name, fn } of tests) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`not ok - ${name}`);
    console.error(error);
  }
}

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log(`\n${tests.length} test(s) passed`);
