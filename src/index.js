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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

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
