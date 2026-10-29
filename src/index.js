const PREPARING = {
  "crewmate.mct-official.com": "CREWMATE",
  "texroot.mct-official.com": "TEXROOT",
};

function preparationResponse(name) {
  const isCrewmate = name === "CREWMATE";
  const description = isCrewmate
    ? "クリエイター、コミュニティ、制作活動をつなぐプロジェクト。"
    : "PC・テクノロジー、プロダクト、実験的なアイデアを扱うブランド。";
  const eyebrow = isCrewmate ? "CREATIVE COMMUNITY / 01" : "TECH & PRODUCTS / 02";
  const accent = isCrewmate ? "#a8ff4d" : "#6ee7ff";
  const accentSoft = isCrewmate ? "rgba(168,255,77,.12)" : "rgba(110,231,255,.12)";
  const indexLabel = isCrewmate ? "CREW" : "TEX";
  const copy = isCrewmate
    ? "つくる人が集まり、作品とプロジェクトが動き出す場所へ。"
    : "技術を試し、プロダクトに変え、次の体験をつくる場所へ。";
  const secondary = isCrewmate
    ? "制作・発信・コラボレーションを支えるサービスを準備しています。"
    : "PC・テクノロジー領域を中心に、新しいプロダクトを準備しています。";
  // 公式Xアカウントは CREWMATE のみ。未開設のブランドはリンクを出さない。
  const xAccount = isCrewmate ? { url: "https://x.com/mct_crewmate", label: "@mct_crewmate" } : null;

  const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#07090d">
<meta name="description" content="${description}">
<title>${name} — MCT Official</title>
<style>
:root{--accent:${accent};--accent-soft:${accentSoft};--bg:#07090d;--panel:rgba(255,255,255,.055);--line:rgba(255,255,255,.11);--muted:#9aa3b2;--text:#f4f7fb}
*{box-sizing:border-box}
html{background:var(--bg)}
body{margin:0;min-height:100vh;color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;background:radial-gradient(900px 500px at 80% 0%,var(--accent-soft),transparent 62%),radial-gradient(700px 450px at 0% 100%,rgba(255,255,255,.035),transparent 65%),var(--bg)}
a{color:inherit}
.page{min-height:100vh;display:flex;flex-direction:column}
.nav{width:min(1180px,calc(100% - 40px));margin:auto;padding:24px 0;display:flex;justify-content:space-between;align-items:center}
.brand{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:800;letter-spacing:.16em}
.mark{width:30px;height:30px;border:1px solid var(--line);border-radius:9px;display:grid;place-items:center;background:var(--panel);color:var(--accent);font-size:11px}
.nav-link{text-decoration:none;color:#aeb6c3;font-size:13px}
.nav-link:hover{color:#fff}
main{width:min(1180px,calc(100% - 40px));margin:auto;flex:1;display:grid;align-items:center;padding:48px 0 80px}
.hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:clamp(36px,7vw,96px);align-items:end}
.eyebrow{display:inline-flex;align-items:center;gap:9px;color:var(--accent);font-size:11px;font-weight:800;letter-spacing:.18em}
.eyebrow:before{content:"";width:24px;height:1px;background:var(--accent)}
h1{font-size:clamp(64px,12vw,148px);line-height:.82;letter-spacing:-.075em;margin:24px 0 34px;font-weight:850}
.lead{font-size:clamp(20px,2.4vw,30px);line-height:1.45;letter-spacing:-.025em;max-width:760px;margin:0}
.copy{color:var(--muted);line-height:1.8;max-width:650px;margin:20px 0 0;font-size:15px}
.panel{border:1px solid var(--line);background:linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.025));border-radius:24px;padding:26px;backdrop-filter:blur(14px);box-shadow:0 24px 80px rgba(0,0,0,.25)}
.status{display:flex;align-items:center;justify-content:space-between;padding-bottom:22px;border-bottom:1px solid var(--line)}
.status strong{font-size:13px;letter-spacing:.08em}
.dot{width:9px;height:9px;border-radius:50%;background:var(--accent);box-shadow:0 0 18px var(--accent)}
.meta{display:grid;gap:18px;padding-top:22px}
.meta-row{display:flex;justify-content:space-between;gap:20px;font-size:13px}
.meta-row span:first-child{color:#727c8b}
.meta-row span:last-child{text-align:right}
.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 18px;border-radius:12px;border:1px solid var(--line);background:var(--panel);text-decoration:none;font-size:13px;font-weight:750;transition:.18s ease}
.btn.primary{background:var(--text);color:#07090d;border-color:var(--text)}
.btn:hover{transform:translateY(-1px);border-color:var(--accent)}
footer{width:min(1180px,calc(100% - 40px));margin:auto;padding:20px 0 28px;color:#687180;font-size:11px;display:flex;justify-content:space-between;gap:20px;border-top:1px solid var(--line)}
footer a{text-decoration:none}
@media(max-width:760px){
.nav{width:min(100% - 28px,1180px);padding:18px 0}
main{width:min(100% - 28px,1180px);padding:44px 0 60px}
.hero{grid-template-columns:1fr;align-items:start}
h1{font-size:clamp(64px,22vw,110px);margin:22px 0 28px}
.panel{padding:22px}
footer{width:min(100% - 28px,1180px);flex-direction:column}
}

/* Clarity-first preparation pages */
:root{--accent:${accent};--accent-soft:${accentSoft};--bg:#fff;--panel:#f7f8fa;--line:#dfe1e5;--muted:#626771;--text:#16181d}
*{box-sizing:border-box}
html{background:#fff}
body{margin:0;min-height:100vh;color:var(--text);font-family:"Noto Sans JP","Hiragino Sans","Yu Gothic",Meiryo,system-ui,sans-serif;background:#fff;line-height:1.8;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.page{min-height:100vh;display:flex;flex-direction:column}
.nav{width:min(1180px,calc(100% - 40px));margin:auto;padding:18px 0;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line)}
.brand{display:flex;align-items:center;gap:10px;font-size:12px;font-weight:700;letter-spacing:.04em}
.mark{width:30px;height:30px;border:1px solid #16181d;border-radius:6px;display:grid;place-items:center;background:#16181d;color:#fff;font-size:10px}
.nav-link{text-decoration:none;color:#626771;font-size:11px;font-weight:600}
main{width:min(1180px,calc(100% - 40px));margin:auto;flex:1;display:grid;align-items:center;padding:72px 0 92px}
.hero{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(300px,.75fr);gap:clamp(40px,7vw,88px);align-items:center}
.eyebrow{display:inline-flex;align-items:center;gap:9px;color:#626771;font-size:9px;font-weight:700;letter-spacing:.13em}
.eyebrow:before{content:"";width:22px;height:2px;background:#16181d}
h1{font-size:clamp(56px,9vw,108px);line-height:1;letter-spacing:-.075em;margin:20px 0 24px;font-weight:700}
.lead{font-size:clamp(19px,2.1vw,27px);line-height:1.6;letter-spacing:-.025em;max-width:700px;margin:0;font-weight:600}
.copy{color:var(--muted);line-height:1.8;max-width:650px;margin:16px 0 0;font-size:13px}
.panel{border:1px solid var(--line);background:var(--panel);border-radius:8px;padding:24px;box-shadow:none}
.status{display:flex;align-items:center;justify-content:space-between;padding-bottom:18px;border-bottom:1px solid var(--line)}
.status strong{font-size:11px;letter-spacing:.08em}
.dot{width:8px;height:8px;border-radius:50%;background:var(--accent)}
.meta{display:grid;gap:14px;padding-top:18px}
.meta-row{display:flex;justify-content:space-between;gap:20px;font-size:12px}
.meta-row span:first-child{color:#858991}.meta-row span:last-child{text-align:right}
.actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:26px}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 17px;border-radius:6px;border:1px solid #16181d;background:#fff;color:#16181d;text-decoration:none;font-size:11px;font-weight:700;transition:.18s ease}
.btn.primary{background:#16181d;color:#fff;border-color:#16181d}.btn:hover{transform:translateY(-1px)}
footer{width:min(1180px,calc(100% - 40px));margin:auto;padding:20px 0 26px;color:#777b83;font-size:10px;display:flex;justify-content:space-between;gap:20px;border-top:1px solid var(--line)}
footer a{text-decoration:none;color:inherit}
@media(max-width:760px){.nav{width:min(100% - 28px,1180px);padding:16px 0}main{width:min(100% - 28px,1180px);padding:54px 0 68px}.hero{grid-template-columns:1fr;gap:36px}h1{font-size:clamp(52px,16vw,78px);margin:18px 0 22px}.lead{font-size:18px}.panel{padding:20px}footer{width:min(100% - 28px,1180px);flex-direction:column}}

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&family=Noto+Sans+JP:wght@400;500;600;700&display=swap');
:root{--bg:#f7f7f4;--panel:#fff;--line:#d8d9dc;--muted:#676a72;--text:#111216}
body{background:var(--bg);font-family:Inter,"Noto Sans JP","Helvetica Neue",sans-serif;letter-spacing:-.01em}
.nav{padding:22px 0;border-bottom:1px solid var(--line)}
.brand{letter-spacing:.1em}.mark{border-radius:2px;background:#111216;color:#fff;border-color:#111216}.nav-link{color:#676a72;font-size:11px;font-weight:700}
main{padding:76px 0 100px}.eyebrow{color:#676a72;font-size:9px;letter-spacing:.16em}.eyebrow:before{background:#111216}
h1{font-weight:700;letter-spacing:-.085em}.lead{font-weight:600;letter-spacing:-.035em}
.copy{font-size:13px;color:var(--muted)}
.panel{background:#fff;border:1px solid var(--line);border-radius:2px;box-shadow:none}
.btn{border-radius:2px;border-color:#111216;background:#fff;color:#111216}.btn.primary{background:#111216;color:#fff;border-color:#111216}
.status{border-color:var(--line)}.meta-row span:first-child{color:#888b92}
footer{color:#676a72;border-color:var(--line)}
@media(max-width:760px){main{padding:52px 0 64px}}
</style>
</head>
<body>
<div class="page">
<header class="nav">
  <div class="brand"><span class="mark">${indexLabel}</span><span>MCT / OFFICIAL</span></div>
  <a class="nav-link" href="https://mct-official.com/">MCT Official ↗</a>
</header>
<main>
<section class="hero">
  <div>
    <span class="eyebrow">${eyebrow}</span>
    <h1>${name}</h1>
    <p class="lead">${copy}</p>
    <p class="copy">${secondary}</p>
    <div class="actions">
      <a class="btn primary" href="https://mct-official.com/">MCT公式サイト</a>
      <a class="btn" href="https://mifron.mct-official.com/">Mifronを見る</a>
      ${xAccount ? `<a class="btn" href="${xAccount.url}" target="_blank" rel="noopener noreferrer">X ${xAccount.label}</a>` : ""}
    </div>
  </div>
  <aside class="panel">
    <div class="status"><strong>PROJECT STATUS</strong><span class="dot" aria-label="準備中"></span></div>
    <div class="meta">
      <div class="meta-row"><span>STATUS</span><span>準備中</span></div>
      <div class="meta-row"><span>PROJECT</span><span>${name}</span></div>
      <div class="meta-row"><span>OPERATED BY</span><span>MCT</span></div>
    </div>
  </aside>
</section>
</main>
<footer><span>© 2026 MCT. All rights reserved.</span><a href="https://mct-official.com/">mct-official.com</a></footer>
</div>
</body>
</html>`;
  return new Response(html, {
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

// Custom domains that serve a site directory: hostname -> directory in assets.
const SITE_ROOTS = {
  "mifron.mct-official.com": "/mifron",
  "tatudragon.mct-official.com": "/tatudragon",
};

// The URL parser collapses plain dot segments, but percent-encoded ones
// (%2e%2e) survive it. Reject those so a request cannot escape its site
// directory, and reject malformed encodings instead of passing them through.
function isUnsafePath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return true;
  }
  if (decoded.includes("\0") || decoded.includes("\\")) return true;
  return decoded.split("/").some((segment) => segment === "..");
}

// Serves one site directory. Resolves "/", "/page.html", extension-less
// "/dir" to "/dir/index.html", and falls back to the site's own 404 page.
async function serveSite(env, siteRoot, pathname) {
  if (isUnsafePath(pathname)) {
    return new Response("Not Found", { status: 404 });
  }

  const publicPath = pathname === "/" ? "/index.html" : pathname;
  let response = await fetchAsset(env, `${siteRoot}${publicPath}`);

  if (
    response.status === 404 &&
    !publicPath.endsWith("/") &&
    !publicPath.includes(".")
  ) {
    response = await fetchAsset(env, `${siteRoot}${publicPath}/index.html`);
  }

  if (response.status !== 404) {
    return response;
  }

  const notFound = await fetchAsset(env, `${siteRoot}/404.html`);
  if (notFound.status === 404) {
    return new Response("Not Found", { status: 404 });
  }

  // The branded 404 body must still be sent with a 404 status, otherwise
  // search engines index every missing URL as a real page.
  return new Response(notFound.body, {
    status: 404,
    headers: {
      "content-type":
        notFound.headers.get("content-type") || "text/html; charset=UTF-8",
      "cache-control": "no-store",
    },
  });
}

const JSON_CONTENT_TYPE = "application/json; charset=UTF-8";
const API_CACHE_SECONDS = 300;
const INDEX_REFRESH_MS = 60 * 60 * 1000;
// Cloudflare Workers allows 1,000 KV operations per invocation. Keeping the
// legacy scan at 900 keys leaves room for the index get/put and avoids
// silently truncating records as the site grows.
const LEGACY_LIST_LIMIT = 900;
const QUEST_INDEX_KEY = "__index:quests";
const PROPOSAL_INDEX_KEY = "__index:proposals";
const QUEST_TALLY_KEY = "__tally:quests";
const PROPOSAL_TALLY_KEY = "__tally:proposals";
const VOTER_KEY_PREFIX = "__votes:";

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": JSON_CONTENT_TYPE,
      "cache-control": "no-store",
      ...headers,
    },
  });
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function cachedJsonResponse(request, body, maxAge = API_CACHE_SECONDS) {
  const json = JSON.stringify(body);
  const etag = `"${hashString(json)}"`;
  const cacheControl = `public, max-age=60, s-maxage=${maxAge}`;
  if (request.headers.get("If-None-Match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { etag, "cache-control": cacheControl },
    });
  }
  return new Response(json, {
    status: 200,
    headers: {
      "content-type": JSON_CONTENT_TYPE,
      "cache-control": cacheControl,
      etag,
    },
  });
}

// Serves public GET responses from the local Cloudflare cache. A cache hit
// never touches KV. The body is built lazily so a hit skips KV entirely.
async function cachedJson(request, ctx, build, maxAge = API_CACHE_SECONDS) {
  const cache = typeof caches === "undefined" ? null : caches.default;
  const cacheKey = cache ? new Request(request.url, { method: "GET" }) : null;
  if (cache) {
    try {
      const hit = await cache.match(cacheKey);
      if (hit) {
        const etag = hit.headers.get("etag");
        if (etag && request.headers.get("If-None-Match") === etag) {
          return new Response(null, {
            status: 304,
            headers: {
              etag,
              "cache-control":
                hit.headers.get("cache-control") || `public, max-age=${maxAge}`,
            },
          });
        }
        return hit;
      }
    } catch (error) {
      console.warn("Cache read failed:", error);
    }
  }

  const body = await build();
  if (body instanceof Response) return body;

  const response = cachedJsonResponse(request, body, maxAge);
  if (cache && ctx && typeof ctx.waitUntil === "function") {
    const cacheResponse = new Response(response.clone().body, {
      status: response.status,
      headers: response.headers,
    });
    cacheResponse.headers.set("cache-control", `public, max-age=${maxAge}`);
    ctx.waitUntil(cache.put(cacheKey, cacheResponse).catch(() => {}));
  }
  return response;
}

function purgeApiCache(ctx, request, paths) {
  const cache = typeof caches === "undefined" ? null : caches.default;
  if (!cache) return;
  const origin = new URL(request.url).origin;
  const work = Promise.all(
    paths.map((path) =>
      cache.delete(new Request(`${origin}${path}`, { method: "GET" })).catch(() => {})
    )
  );
  if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(work);
}

function storageError(scope, error) {
  console.error(
    `KV ${scope} API failed:`,
    (error && (error.code || error.message)) || error
  );
  return jsonResponse({ error: "Storage temporarily unavailable" }, 503, {
    "retry-after": "60",
  });
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

// Legacy namespaces store each record under its own key. This scan only runs
// when the index is missing or older than INDEX_REFRESH_MS.
async function readLegacyList(namespace, prefix, limit = LEGACY_LIST_LIMIT) {
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

async function readJson(namespace, key, fallback) {
  const raw = await namespace.get(key);
  if (raw === null || raw === undefined) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed === null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

// The index is a read model for list endpoints. It is refreshed from the
// per-record keys once per hour so manual KV edits and the operator's sync
// tools are picked up. If the refresh fails (for example, the daily list
// quota is exhausted), a stale index is still served instead of a 500.
async function readIndex(namespace, indexKey, prefix) {
  let staleRecords = null;
  const raw = await namespace.get(indexKey);
  if (raw !== null && raw !== undefined) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.records)) {
        staleRecords = parsed.records;
        if (Number(parsed.updatedAt) > Date.now() - INDEX_REFRESH_MS) {
          return staleRecords;
        }
      }
    } catch {
      // Fall through to the legacy scan.
    }
  }

  try {
    const records = await readLegacyList(namespace, prefix);
    await namespace.put(
      indexKey,
      JSON.stringify({ updatedAt: Date.now(), records })
    );
    return records;
  } catch (error) {
    if (staleRecords) {
      console.warn(
        `KV index refresh failed for ${indexKey}; serving stale index.`,
        error
      );
      return staleRecords;
    }
    throw error;
  }
}

async function appendToIndex(namespace, indexKey, prefix, record) {
  const records = await readIndex(namespace, indexKey, prefix);
  const existing = records.findIndex((item) => item && item.id === record.id);
  if (existing >= 0) records[existing] = record;
  else records.push(record);
  await namespace.put(
    indexKey,
    JSON.stringify({ updatedAt: Date.now(), records })
  );
}

const RATE_LIMIT_WINDOW_SECONDS = 600;
const RATE_LIMIT_MAX_REQUESTS = 5;

// KVベースのレート制限は投稿系のみに使う。投票は1票あたりのKV操作を
// 抑えるため、ここではカウントしない（乱用対策はWAF/Turnstileへ移す）。

async function enforceRateLimit(
  request,
  namespace,
  bucket,
  maxRequests = RATE_LIMIT_MAX_REQUESTS
) {
  if (!namespace) return false;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const window = Math.floor(Date.now() / (RATE_LIMIT_WINDOW_SECONDS * 1000));
  const key = `__rl:${bucket}:${window}:${ip.slice(0, 100)}`;
  const current = Number.parseInt((await namespace.get(key)) || "0", 10);
  if (current >= maxRequests) return true;
  await namespace.put(key, String(current + 1), {
    expirationTtl: RATE_LIMIT_WINDOW_SECONDS + 60,
  });
  return false;
}

/* ---------- 評価（高評価 / 低評価） ----------
   1人1票。集計は __tally:* に、投票者ごとの選択は __votes:<section>:<voter> に
   保持する。以前は list + 全件get で集計していたが、票数に比例してKV読み取りが
   増えるため、O(1)で読める集計キー方式に変更した。
   KVには原子的な更新がないため、同時投票では稀に集計がずれる可能性がある。
   厳密な整合性が必要になったらD1へ移行する。 */

function cleanIdentifier(value, maxLength = 80) {
  if (typeof value !== "string") return "";
  return value.replace(/[^A-Za-z0-9_.:-]/g, "").slice(0, maxLength);
}

function cleanVoter(value) {
  if (typeof value !== "string") return "";
  return value.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
}

function adjustTally(tally, id, previous, next) {
  const current = isPlainObject(tally[id]) ? tally[id] : { up: 0, down: 0 };
  const count = {
    up: Math.max(0, Number(current.up) || 0),
    down: Math.max(0, Number(current.down) || 0),
  };
  if (previous === "up") count.up = Math.max(0, count.up - 1);
  if (previous === "down") count.down = Math.max(0, count.down - 1);
  if (next === "up") count.up += 1;
  if (next === "down") count.down += 1;
  if (count.up === 0 && count.down === 0) delete tally[id];
  else tally[id] = count;
  return count;
}

async function readVoteState(namespace, tallyKey, voterSection, voter = "") {
  const voterKey = voter ? `${VOTER_KEY_PREFIX}${voterSection}:${voter}` : "";
  const [tallyRaw, voterRaw] = await Promise.all([
    readJson(namespace, tallyKey, {}),
    voterKey ? readJson(namespace, voterKey, {}) : Promise.resolve({}),
  ]);
  return {
    counts: isPlainObject(tallyRaw) ? tallyRaw : {},
    mine: voterKey && isPlainObject(voterRaw) ? voterRaw : {},
  };
}

async function applyVote(namespace, tallyKey, voterSection, voter, id, vote) {
  const next = vote === "none" ? null : vote;
  const voterKey = `${VOTER_KEY_PREFIX}${voterSection}:${voter}`;
  const [tallyRaw, voterRaw] = await Promise.all([
    readJson(namespace, tallyKey, {}),
    readJson(namespace, voterKey, {}),
  ]);
  const tally = isPlainObject(tallyRaw) ? tallyRaw : {};
  const sectionVotes = isPlainObject(voterRaw) ? { ...voterRaw } : {};
  const previous = sectionVotes[id] || null;

  if (previous === next) {
    return {
      count: isPlainObject(tally[id]) ? tally[id] : { up: 0, down: 0 },
      myVote: previous,
    };
  }

  const count = adjustTally(tally, id, previous, next);
  if (next === null) delete sectionVotes[id];
  else sectionVotes[id] = next;

  await Promise.all([
    namespace.put(tallyKey, JSON.stringify(tally)),
    namespace.put(voterKey, JSON.stringify(sectionVotes)),
  ]);

  return { count, myVote: next };
}

async function handleVoteApi(request, env, ctx, options) {
  const { namespace, tallyKey, voterSection, idField } = options;
  const url = new URL(request.url);
  const voter = cleanVoter(url.searchParams.get("voter"));

  if (request.method === "GET") {
    if (!voter) {
      return cachedJson(request, ctx, () =>
        readVoteState(namespace, tallyKey, voterSection)
      );
    }
    return jsonResponse(
      await readVoteState(namespace, tallyKey, voterSection, voter)
    );
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  if (!isPlainObject(body)) return jsonResponse({ error: "Invalid body" }, 400);

  const id = cleanIdentifier(body[idField]);
  if (!id) return jsonResponse({ error: `Missing required field: ${idField}` }, 400);

  const vote = ["up", "down", "none"].includes(body.vote) ? body.vote : "";
  if (!vote) return jsonResponse({ error: "Invalid vote" }, 400);

  // ログイン機構がないため、端末ごとの匿名IDを投票者IDとして使う。
  const who =
    cleanVoter(body.voter) ||
    voter ||
    cleanVoter(request.headers.get("CF-Connecting-IP") || "") ||
    "anonymous";

  const result = await applyVote(namespace, tallyKey, voterSection, who, id, vote);

  purgeApiCache(
    ctx,
    request,
    voterSection === "quests"
      ? ["/api/quests/votes"]
      : ["/api/proposals", "/api/proposals/votes"]
  );

  return jsonResponse({
    success: true,
    id,
    count: result.count,
    myVote: result.myVote,
  });
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

async function handleQuestsApi(request, env, ctx) {
  if (!env.QUESTS) return jsonResponse({ error: "Storage unavailable" }, 503);
  const pathname = new URL(request.url).pathname;

  if (pathname === "/api/quests/votes" || pathname === "/api/quests/vote") {
    return handleVoteApi(request, env, ctx, {
      namespace: env.QUESTS,
      tallyKey: QUEST_TALLY_KEY,
      voterSection: "quests",
      idField: "questId",
    });
  }

  if (request.method === "GET") {
    return cachedJson(request, ctx, () =>
      readIndex(env.QUESTS, QUEST_INDEX_KEY, "quest_")
    );
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
  await appendToIndex(env.QUESTS, QUEST_INDEX_KEY, "quest_", quest);
  purgeApiCache(ctx, request, ["/api/quests"]);

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

async function readProposals(namespace) {
  const [records, tallyRaw] = await Promise.all([
    readIndex(namespace, PROPOSAL_INDEX_KEY, "prop_"),
    readJson(namespace, PROPOSAL_TALLY_KEY, {}),
  ]);
  const tally = isPlainObject(tallyRaw) ? tallyRaw : {};
  return records.map((record) => {
    const counts = record && tally[record.id];
    if (!counts) return record;
    return { ...record, upvotes: Math.max(0, Number(counts.up) || 0) };
  });
}

async function handleProposalsApi(request, env, ctx) {
  if (!env.PROPOSALS) return jsonResponse({ error: "Storage unavailable" }, 503);
  const pathname = new URL(request.url).pathname;

  if (pathname === "/api/proposals/votes" || pathname === "/api/proposals/vote") {
    return handleVoteApi(request, env, ctx, {
      namespace: env.PROPOSALS,
      tallyKey: PROPOSAL_TALLY_KEY,
      voterSection: "proposals",
      idField: "proposalId",
    });
  }

  if (request.method === "GET") {
    return cachedJson(request, ctx, () => readProposals(env.PROPOSALS));
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
    type: ["feature", "bug", "quest", "deletion", "other"].includes(body.type)
      ? body.type
      : "feature",
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
    // 削除提案は対象クエストを参照する。
    targetId: cleanIdentifier(body.targetId),
    targetName: cleanText(body.targetName, 120),
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

  if (proposal.type === "deletion" && (!proposal.targetId || !proposal.targetName)) {
    return jsonResponse(
      { error: "Missing required fields: targetId, targetName" },
      400
    );
  }

  await env.PROPOSALS.put(proposal.id, JSON.stringify(proposal));
  await appendToIndex(env.PROPOSALS, PROPOSAL_INDEX_KEY, "prop_", proposal);
  purgeApiCache(ctx, request, ["/api/proposals", "/api/proposals/votes"]);

  const notified = await sendProposalNotification(
    env,
    `[Mifron 提案] ${proposal.title}`,
    [
      ["種別", "提案"],
      ["タイトル", proposal.title],
      ["種類", proposal.type],
      ["対象クエスト", proposal.targetName ? `${proposal.targetName} (${proposal.targetId})` : ""],
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
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    if (url.pathname === "/api/quests" || url.pathname.startsWith("/api/quests/")) {
      try {
        return await handleQuestsApi(request, env, ctx);
      } catch (error) {
        return storageError("quests", error);
      }
    }

    if (
      url.pathname === "/api/proposals" ||
      url.pathname.startsWith("/api/proposals/")
    ) {
      try {
        return await handleProposalsApi(request, env, ctx);
      } catch (error) {
        return storageError("proposals", error);
      }
    }

    if (PREPARING[host]) {
      return preparationResponse(PREPARING[host]);
    }

    if (host === "mct-official.com" || host === "www.mct-official.com") {
      const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
      return fetchAsset(env, pathname);
    }

    const siteRoot = SITE_ROOTS[host];
    if (siteRoot) {
      return serveSite(env, siteRoot, url.pathname);
    }

    return new Response("Not Found", { status: 404 });
  },
};
