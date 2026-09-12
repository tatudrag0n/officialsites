const PREPARING = {
  "crewmate.mct-official.com": "CREWMATE",
  "texroot.mct-official.com": "TEXROOT",
};

function preparationResponse(name) {
  const description = name === "CREWMATE"
    ? "クリエイター同士の交流と制作活動を支えるサービスを準備しています。"
    : "PC・テクノロジー領域の情報とプロダクトを扱うブランドを準備しています.";

  return new Response(`<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#0a0a0a">
<title>${name} | MCT Official</title>
<style>
:root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:radial-gradient(circle at 50% 0%,#242424 0,#0d0d0d 42%,#050505 100%);color:#f5f5f5}
body:before{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(120deg,transparent 0 48%,rgba(255,255,255,.035) 50%,transparent 52%);opacity:.7}
.page{min-height:100vh;display:flex;flex-direction:column}
.header{padding:24px 6vw;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.08)}
.logo{font-weight:800;letter-spacing:.18em;font-size:14px}.logo span{display:block;font-size:9px;font-weight:500;letter-spacing:.3em;color:#888;margin-top:5px}
main{width:min(920px,88vw);margin:auto;padding:72px 0}
.eyebrow{display:inline-flex;padding:7px 11px;border:1px solid rgba(255,255,255,.14);border-radius:999px;color:#aaa;font-size:11px;letter-spacing:.16em}
h1{font-size:clamp(42px,8vw,82px);line-height:.98;letter-spacing:-.05em;margin:24px 0 22px}
.lead{max-width:620px;color:#aaa;font-size:17px;line-height:1.9;margin:0}
.card{margin-top:48px;padding:28px;border:1px solid rgba(255,255,255,.1);border-radius:24px;background:rgba(255,255,255,.045);backdrop-filter:blur(16px)}
.status{display:flex;align-items:center;gap:10px;color:#ddd;font-size:14px}.dot{width:8px;height:8px;border-radius:50%;background:#aaa;box-shadow:0 0 16px #aaa}
.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}
a{display:inline-flex;text-decoration:none}.btn{padding:13px 18px;border-radius:12px;border:1px solid rgba(255,255,255,.14);color:#fff;background:#151515;font-weight:650;font-size:14px;transition:.2s}.btn:hover{transform:translateY(-2px);background:#202020}.primary{background:#f5f5f5;color:#090909;border-color:#f5f5f5}.primary:hover{background:#fff}
footer{margin-top:auto;padding:24px 6vw;color:#666;font-size:11px;border-top:1px solid rgba(255,255,255,.08)}
</style>
</head>
<body>
<div class="page">
<header class="header"><div class="logo">MCT<span>OFFICIAL</span></div><span style="color:#666;font-size:11px">2026</span></header>
<main>
<span class="eyebrow">COMING SOON</span>
<h1>${name}</h1>
<p class="lead">${description}</p>
<div class="card">
<div class="status"><span class="dot"></span>現在、公開に向けて準備中です</div>
<div class="actions"><a class="btn primary" href="https://mct-official.com/">MCT公式サイトへ</a><a class="btn" href="https://mifron.mct-official.com/">Mifronを見る</a></div>
</div>
</main>
<footer>© 2026 MCT. All rights reserved.</footer>
</div>
</body>
</html>`, {
    status: 200,
    headers: {"content-type":"text/html; charset=UTF-8","cache-control":"no-store"}
  });
}

function assetRequest(pathname, request) {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("cookie");
  return new Request(`https://assets.internal${pathname}`, {
    method: request.method === "HEAD" ? "HEAD" : "GET",
    headers
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    if (host === "crewmate.mct-official.com" || host === "texroot.mct-official.com") {
      return preparationResponse(PREPARING[host]);
    }

    if (host === "mct-official.com" || host === "www.mct-official.com") {\n      const path = url.pathname === "/" ? "/index.html" : url.pathname;\n      try {\n        const response = await env.ASSETS.fetch(new URL(`https://assets.local${path}`));\n        return response.status !== 404 ? response : new Response("Not Found", { status: 404 });\n      } catch (error) {\n        console.error("officialsites MCT asset error", error);\n        return new Response("Internal Server Error", { status: 500 });\n      }\n    }\n\n    if (host !== "mifron.mct-official.com") {
      return new Response("Not Found", {status:404});
    }

    const pathname = url.pathname === "/" ? "/mifron/index.html" : `/mifron${url.pathname}`;

    try {
      let response = await env.ASSETS.fetch(assetRequest(pathname, request));

      if (response.status === 404 && !url.pathname.endsWith("/") && !url.pathname.includes(".")) {
        response = await env.ASSETS.fetch(assetRequest(`/mifron${url.pathname}/index.html`, request));
      }

      if (response.status !== 404) return response;

      const notFound = await env.ASSETS.fetch(assetRequest("/mifron/404.html", request));
      return notFound.status !== 404 ? notFound : new Response("Not Found", {status:404});
    } catch (error) {
      console.error("officialsites asset routing error", error);
      return new Response("Internal Server Error", {status:500});
    }
  }
};
