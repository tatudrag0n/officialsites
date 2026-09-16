const PREPARING = {
  "crewmate.mct-official.com": "CREWMATE",
  "texroot.mct-official.com": "TEXROOT",
};

function preparationResponse(name) {
  const description =
    name === "CREWMATE"
      ? "クリエイター同士の交流と制作活動を支えるサービスを準備しています。"
      : "PC・テクノロジー領域の情報とプロダクトを扱うブランドを準備しています。";

  return new Response(`<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#080808">
<title>${name} | MCT Official</title>
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:#080808;color:#f5f5f5;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
.wrap{min-height:100vh;display:grid;place-items:center;padding:24px}
.card{width:min(720px,100%);padding:48px;border:1px solid #ffffff18;border-radius:24px;background:#ffffff08}
small{letter-spacing:.18em;color:#888}
h1{font-size:clamp(44px,8vw,78px);margin:18px 0}
p{color:#aaa;line-height:1.8}
.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}
a{padding:13px 18px;border-radius:12px;text-decoration:none;color:#fff;background:#171717;border:1px solid #ffffff20;font-weight:700}
.primary{background:#fff;color:#080808}
</style>
</head>
<body>
<main class="wrap">
<section class="card">
<small>MCT / OFFICIAL</small>
<h1>${name}</h1>
<p>${description}</p>
<p>現在、公開に向けて準備中です。</p>
<div class="actions">
<a class="primary" href="https://mct-official.com/">MCT公式サイトへ</a>
<a href="https://mifron.mct-official.com/">Mifronを見る</a>
</div>
</section>
</main>
</body>
</html>`, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=UTF-8",
      "cache-control": "no-store",
    },
  });
}

function assetUrl(pathname) {
  return new URL(`https://assets.local${pathname}`);
}

async function fetchAsset(env, pathname) {
  return env.ASSETS.fetch(assetUrl(pathname));
}

const JSON_HEADERS = {
  "content-type": "application/json; charset=UTF-8",
  "cache-control": "no-store",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function cleanText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function cleanList(value, allowed, maxItems = 12) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === "string" && allowed.includes(item))
    .slice(0, maxItems);
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readKvList(namespace, prefix, limit = 100) {
  const list = await namespace.list({ prefix, limit });
  const records = await Promise.all(
    list.keys.map(async (key) => {
      const data = await namespace.get(key.name);
      if (!data) return null;
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    })
  );
  return records.filter((record) => record !== null);
}

const RATE_LIMIT_WINDOW_SECONDS = 600;
const RATE_LIMIT_MAX_REQUESTS = 5;

async function enforceRateLimit(request, namespace, bucket) {
  if (!namespace) return false;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const window = Math.floor(Date.now() / (RATE_LIMIT_WINDOW_SECONDS * 1000));
  const key = `__rl:${bucket}:${window}:${ip.slice(0, 100)}`;
  const current = Number.parseInt((await namespace.get(key)) || "0", 10);
  if (current >= RATE_LIMIT_MAX_REQUESTS) return true;
  await namespace.put(key, String(current + 1), {
    expirationTtl: RATE_LIMIT_WINDOW_SECONDS + 60,
  });
  return false;
}

// Proposal notifications are emailed to the Mifron operations inbox.
// Override with the PROPOSAL_NOTIFY_TO / PROPOSAL_NOTIFY_FROM environment
// variables if the receiving or sending address changes.
const NOTIFY_TO = "mifron@mct-official.com";
const NOTIFY_FROM_EMAIL = "noreply@mct-official.com";
const NOTIFY_FROM_NAME = "Mifron 提案通知";

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (character) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[character];
  });
}

function buildNotificationBody(rows) {
  const text = rows.map(([label, value]) => `${label}: ${value || "-"}`).join("\n");
  const html = rows
    .map(
      ([label, value]) =>
        `<tr><th align="left" style="padding:4px 12px 4px 0;vertical-align:top">${escapeHtml(
          label
        )}</th><td style="padding:4px 0">${escapeHtml(value || "-").replace(
          /\n/g,
          "<br>"
        )}</td></tr>`
    )
    .join("");
  return { text, html: `<table>${html}</table>` };
}

// Sends the notification and never throws: a saved proposal must still be
// reported as successful even if the email service is unavailable.
async function sendProposalNotification(env, subject, rows) {
  if (!env.EMAIL || typeof env.EMAIL.send !== "function") {
    console.warn("EMAIL binding is not configured; skipping proposal notification.");
    return false;
  }

  const { text, html } = buildNotificationBody(rows);
  try {
    await env.EMAIL.send({
      to: env.PROPOSAL_NOTIFY_TO || NOTIFY_TO,
      from: {
        email: env.PROPOSAL_NOTIFY_FROM || NOTIFY_FROM_EMAIL,
        name: NOTIFY_FROM_NAME,
      },
      subject,
      text,
      html: `<h2>${escapeHtml(subject)}</h2>${html}`,
    });
    return true;
  } catch (error) {
    console.error(
      "Proposal notification email failed:",
      (error && (error.code || error.message)) || error
    );
    return false;
  }
}

async function handleQuestsApi(request, env) {
  if (!env.QUESTS) return jsonResponse({ error: "Storage unavailable" }, 503);

  if (request.method === "GET") {
    return jsonResponse(await readKvList(env.QUESTS, "quest_", 100));
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (await enforceRateLimit(request, env.QUESTS, "quests")) {
    return jsonResponse({ error: "Too many requests. Try again later." }, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  if (!isPlainObject(body)) return jsonResponse({ error: "Invalid body" }, 400);

  const quest = {
    id: `quest_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    name: cleanText(body.name, 120),
    description: cleanText(body.description, 2000),
    condition: cleanText(body.condition, 500),
    reward: cleanText(body.reward, 300),
    type: ["daily", "weekly", "single", "hidden"].includes(body.type) ? body.type : "single",
    difficulty: ["easy", "normal", "hard", "very_hard", "extreme"].includes(body.difficulty)
      ? body.difficulty
      : "normal",
    conditionTypes: cleanList(body.conditionTypes, [
      "item_obtain",
      "mob_kill",
      "block_break",
      "move",
      "mp_gain",
      "advancement",
      "login",
    ]),
    rewardTypes: cleanList(body.rewardTypes, ["mp", "item", "title", "exp"]),
    dependencies: Array.isArray(body.dependencies)
      ? body.dependencies
          .filter((dep) => typeof dep === "string")
          .map((dep) => dep.trim().slice(0, 80))
          .filter(Boolean)
          .slice(0, 12)
      : [],
    unlockCondition: cleanText(body.unlockCondition, 500),
    proposedTitle: cleanText(body.proposedTitle, 120),
    author: cleanText(body.author, 60) || "匿名",
    notes: cleanText(body.notes, 1000),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  if (!quest.name || !quest.condition || !quest.reward) {
    return jsonResponse(
      { error: "Missing required fields: name, condition, reward" },
      400
    );
  }

  await env.QUESTS.put(quest.id, JSON.stringify(quest));

  const notified = await sendProposalNotification(
    env,
    `[Mifron クエスト提案] ${quest.name}`,
    [
      ["種別", "クエスト提案"],
      ["クエスト名", quest.name],
      ["種類", quest.type],
      ["難易度", quest.difficulty],
      ["成功条件", quest.condition],
      ["報酬", quest.reward],
      ["提案者", quest.author],
      ["説明", quest.description],
      ["前提クエスト", quest.dependencies.join(", ")],
      ["解放条件", quest.unlockCondition],
      ["提案称号", quest.proposedTitle],
      ["備考", quest.notes],
      ["ID", quest.id],
      ["受信日時", quest.createdAt],
      ["詳細", `https://mifron.mct-official.com/quests/detail.html?id=${quest.id}`],
    ]
  );

  return jsonResponse({ success: true, id: quest.id, notified }, 201);
}

async function handleProposalsApi(request, env) {
  if (!env.PROPOSALS) return jsonResponse({ error: "Storage unavailable" }, 503);

  if (request.method === "GET") {
    return jsonResponse(await readKvList(env.PROPOSALS, "prop_", 100));
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (await enforceRateLimit(request, env.PROPOSALS, "proposals")) {
    return jsonResponse({ error: "Too many requests. Try again later." }, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  if (!isPlainObject(body)) return jsonResponse({ error: "Invalid body" }, 400);

  const proposal = {
    id: `prop_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    title: cleanText(body.title, 160),
    description: cleanText(body.description, 3000),
    type: ["feature", "bug", "quest", "other"].includes(body.type) ? body.type : "feature",
    priority: ["low", "medium", "high", "critical"].includes(body.priority)
      ? body.priority
      : "medium",
    tags: Array.isArray(body.tags)
      ? body.tags
          .filter((tag) => typeof tag === "string")
          .map((tag) => tag.trim().slice(0, 30))
          .filter(Boolean)
          .slice(0, 8)
      : [],
    author: cleanText(body.author, 60) || "匿名",
    notes: cleanText(body.notes, 1000),
    status: "open",
    upvotes: 0,
    createdAt: new Date().toISOString(),
  };

  if (!proposal.title || !proposal.description) {
    return jsonResponse(
      { error: "Missing required fields: title, description" },
      400
    );
  }

  await env.PROPOSALS.put(proposal.id, JSON.stringify(proposal));

  const notified = await sendProposalNotification(
    env,
    `[Mifron 提案] ${proposal.title}`,
    [
      ["種別", "提案"],
      ["タイトル", proposal.title],
      ["種類", proposal.type],
      ["優先度", proposal.priority],
      ["提案者", proposal.author],
      ["タグ", proposal.tags.join(", ")],
      ["説明", proposal.description],
      ["備考", proposal.notes],
      ["ID", proposal.id],
      ["受信日時", proposal.createdAt],
      ["詳細", `https://mifron.mct-official.com/proposals/detail.html?id=${proposal.id}`],
    ]
  );

  return jsonResponse({ success: true, id: proposal.id, notified }, 201);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    if (url.pathname === "/api/quests" || url.pathname.startsWith("/api/quests/")) {
      return handleQuestsApi(request, env);
    }

    if (
      url.pathname === "/api/proposals" ||
      url.pathname.startsWith("/api/proposals/")
    ) {
      return handleProposalsApi(request, env);
    }

    if (PREPARING[host]) {
      return preparationResponse(PREPARING[host]);
    }

    if (host === "mct-official.com" || host === "www.mct-official.com") {
      const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
      return fetchAsset(env, pathname);
    }

    if (host === "mifron.mct-official.com") {
      const publicPath = url.pathname === "/" ? "/index.html" : url.pathname;
      let response = await fetchAsset(env, `/mifron${publicPath}`);

      if (
        response.status === 404 &&
        !publicPath.endsWith("/") &&
        !publicPath.includes(".")
      ) {
        response = await fetchAsset(
          env,
          `/mifron${publicPath}/index.html`
        );
      }

      if (response.status !== 404) {
        return response;
      }

      const notFound = await fetchAsset(env, "/mifron/404.html");
      return notFound.status !== 404
        ? notFound
        : new Response("Not Found", { status: 404 });
    }

    return new Response("Not Found", { status: 404 });
  },
};
