const PREPARING = {
  "crewmate.mct-official.com": "CREWMATE",
  "texroot.mct-official.com": "TEXROOT",
};

function preparing(name) {
  const description = name === "CREWMATE"
    ? "クリエイター同士の交流と制作活動を支えるサービスを準備しています。"
    : "PC・テクノロジー領域の情報とプロダクトを扱うブランドを準備しています。";
  return new Response(`<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#090909"><title>${name} | MCT Official</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 50% 0,#292929,#0a0a0a 48%,#050505);color:#f5f5f5;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}.page{min-height:100vh;display:flex;flex-direction:column}.header{padding:22px 6vw;border-bottom:1px solid #ffffff14;font-weight:800;letter-spacing:.18em}.header small{display:block;font-size:9px;color:#777;letter-spacing:.3em;margin-top:5px}.main{width:min(900px,88vw);margin:auto;padding:72px 0}.eyebrow{display:inline-block;padding:7px 11px;border:1px solid #ffffff20;border-radius:999px;color:#aaa;font-size:11px;letter-spacing:.16em}h1{font-size:clamp(44px,8vw,82px);line-height:1;margin:24px 0 18px;letter-spacing:-.05em}.lead{max-width:620px;color:#aaa;line-height:1.9;font-size:17px}.card{margin-top:44px;padding:28px;border:1px solid #ffffff14;border-radius:24px;background:#ffffff08}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:26px}a{color:inherit;text-decoration:none}.btn{display:inline-block;padding:13px 18px;border-radius:12px;border:1px solid #ffffff20;background:#151515;font-weight:700;font-size:14px}.primary{background:#fff;color:#090909}.footer{padding:24px 6vw;border-top:1px solid #ffffff12;color:#666;font-size:11px}</style></head><body><div class="page"><header class="header">MCT<small>OFFICIAL</small></header><main class="main"><span class="eyebrow">COMING SOON</span><h1>${name}</h1><p class="lead">${description}</p><section class="card"><div>現在、公開に向けて準備中です。</div><div class="actions"><a class="btn primary" href="https://mct-official.com/">MCT公式サイトへ</a><a class="btn" href="https://mifron.mct-official.com/">Mifronを見る</a></div></section></main><footer class="footer">© 2026 MCT. All rights reserved.</footer></div></body></html>`,{status:200,headers:{"content-type":"text/html; charset=UTF-8","cache-control":"no-store"}})
}

function assetUrl(pathname) {
  return new URL(`https://assets.local${pathname}`);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    if (PREPARING[host]) return preparing(PREPARING[host]);

    if (host === "mct-official.com" || host === "www.mct-official.com") {
      return env.ASSETS.fetch(assetUrl(url.pathname === "/" ? "/index.html" : url.pathname));
    }

    if (host !== "mifron.mct-official.com") return new Response("Not Found",{status:404});

    const publicPath = url.pathname === "/" ? "/index.html" : url.pathname;
    const response = await env.ASSETS.fetch(assetUrl(`/mifron${publicPath}`));
    if (response.status !== 404) return response;

    if (!publicPath.endsWith("/") && !publicPath.includes(".")) {
      const indexResponse = await env.ASSETS.fetch(assetUrl(`/mifron${publicPath}/index.html`));
      if (indexResponse.status !== 404) return indexResponse;
    }

    const notFound = await env.ASSETS.fetch(assetUrl("/mifron/404.html"));
    return notFound.status !== 404 ? notFound : new Response("Not Found",{status:404});
  }
};