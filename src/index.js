const SITE_ROOTS = {
  "mifron.mct-official.com": "/mifron",
  "crewmate.mct-official.com": "/crewmate",
  "texroot.mct-official.com": "/texroot",
};

const PREPARING_SITES = new Set([
  "crewmate.mct-official.com",
  "texroot.mct-official.com",
]);

function assetPath(root, pathname) {
  if (pathname === "/" || pathname === "") return `${root}/index.html`;
  return `${root}${pathname}`;
}

function preparingPage(host) {
  const name = host.startsWith("crewmate.") ? "Crewmate" : "Texroot";
  return new Response(`<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name} - 準備中</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#111;color:#fff;font-family:system-ui,sans-serif}
main{text-align:center;padding:32px}
h1{margin:0 0 12px;font-size:32px}
p{margin:0;color:#bbb}
</style>
</head>
<body><main><h1>${name}</h1><p>このサイトは現在準備中です。</p></main></body>
</html>`, {
    status: 200,
    headers: { "content-type": "text/html; charset=UTF-8" },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();
    const root = SITE_ROOTS[host];

    if (!root) {
      return new Response("Not Found", { status: 404 });
    }

    if (PREPARING_SITES.has(host)) {
      return preparingPage(host);
    }

    const path = assetPath(root, url.pathname);
    const assetUrl = new URL(path, url.origin);

    try {
      const response = await env.ASSETS.fetch(new Request(assetUrl, request));

      if (response.status !== 404) {
        return response;
      }

      const notFoundUrl = new URL(`${root}/404.html`, url.origin);
      const notFound = await env.ASSETS.fetch(new Request(notFoundUrl, request));

      if (notFound.status !== 404) {
        return notFound;
      }

      return new Response("Not Found", { status: 404 });
    } catch (error) {
      console.error("officialsites asset routing error", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};
