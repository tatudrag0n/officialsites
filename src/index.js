const SITES = {
  "mct-official.com": "/index.html",
  "www.mct-official.com": "/index.html",
  "mifron.mct-official.com": "/mifron/index.html",
  "crewmate.mct-official.com": null,
  "texroot.mct-official.com": null,
};

const PREPARING = {
  "crewmate.mct-official.com": "Crewmate",
  "texroot.mct-official.com": "Texroot",
};

function preparationResponse(name) {
  return new Response(`<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name} - 準備中</title>
<style>
html,body{margin:0;min-height:100%;background:#111;color:#fff;font-family:system-ui,sans-serif}
body{min-height:100vh;display:grid;place-items:center}
main{text-align:center;padding:32px}
h1{margin:0 0 12px}
p{margin:0;color:#aaa}
</style>
</head>
<body><main><h1>${name}</h1><p>このサイトは現在準備中です。</p></main></body>
</html>`, {
    status: 200,
    headers: { "content-type": "text/html; charset=UTF-8", "cache-control": "no-store" },
  });
}

function withPath(root, pathname) {
  if (pathname === "/" || pathname === "") return root;
  return `${root.slice(0, -10)}${pathname}`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    if (!(host in SITES)) {
      return new Response("Not Found", { status: 404 });
    }

    if (host in PREPARING) {
      return preparationResponse(PREPARING[host]);
    }

    const root = SITES[host];
    const pathname = url.pathname;

    // Mifron: preserve the public URL while resolving files inside /mifron.
    const assetPath = pathname === "/" ? "/mifron/index.html" : `/mifron${pathname}`;
    const assetUrl = new URL(assetPath, url.origin);

    try {
      let response = await env.ASSETS.fetch(new Request(assetUrl.toString(), request));

      // For extensionless paths, try the directory index explicitly.
      if (response.status === 404 && !pathname.endsWith("/") && !pathname.includes(".")) {
        const indexUrl = new URL(`/mifron${pathname}/index.html`, url.origin);
        response = await env.ASSETS.fetch(new Request(indexUrl.toString(), request));
      }

      if (response.status !== 404) {
        return response;
      }

      const notFoundUrl = new URL("/mifron/404.html", url.origin);
      const notFound = await env.ASSETS.fetch(new Request(notFoundUrl.toString(), request));
      return notFound.status !== 404 ? notFound : new Response("Not Found", { status: 404 });
    } catch (error) {
      console.error("officialsites worker error", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};
