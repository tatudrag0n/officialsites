// Cloudflare Pages Middleware - Multi-site static file routing
// Explicit path handling for index.html

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();
  const pathname = url.pathname;

  let sitePrefix = '';

  if (host.includes('mifron.')) {
    sitePrefix = 'mifron';
  } else if (host.includes('crewmate.')) {
    sitePrefix = 'crewmate';
  } else if (host.includes('texroot.')) {
    sitePrefix = 'texroot';
  }
  // Default: mct-official.com serves from root

  if (!sitePrefix) {
    return next();
  }

  if (!env || !env.ASSETS) {
    return next();
  }

  try {
    // Handle root path explicitly
    let path = `/${sitePrefix}${pathname}`;
    if (pathname === '/' || pathname === '') {
      path = `/${sitePrefix}/index.html`;
    }

    const response = await env.ASSETS.fetch(path);

    // If still 404, try index.html fallback
    if (response.status === 404 && !pathname.includes('.')) {
      const fallback = await env.ASSETS.fetch(`/${sitePrefix}/index.html`);
      if (fallback.status !== 404) {
        return fallback;
      }
    }

    return response;
  } catch {
    return next();
  }
}
