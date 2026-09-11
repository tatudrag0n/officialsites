const SITE_ROOTS = {
  "mifron.mct-official.com": "/mifron",
  "crewmate.mct-official.com": "/crewmate",
  "texroot.mct-official.com": "/texroot",
};

function assetPath(root, pathname) {
  if (pathname === "/" || pathname === "") return `${root}/index.html`;
  return `${root}${pathname}`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();
    const root = SITE_ROOTS[host];

    // Only the configured site hostnames are public entry points.
    if (!root) {
      return new Response("Not Found", { status: 404 });
    }

    const path = assetPath(root, url.pathname);
    const assetUrl = new URL(path, url.origin);

    try {
      const assetRequest = new Request(assetUrl, request);
      const response = await env.ASSETS.fetch(assetRequest);

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
