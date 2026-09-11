// Cloudflare Pages Middleware - Multi-site static file routing
// Simplest possible implementation using string paths

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
    // Pass path string directly to env.ASSETS.fetch()
    const path = `/${sitePrefix}${pathname}`;
    const response = await env.ASSETS.fetch(path);

    if (response.status === 404 && !pathname.endsWith('/') && !pathname.includes('.')) {
      return env.ASSETS.fetch(`/${sitePrefix}/index.html`);
    }

    return response;
  } catch {
    return next();
  }
}
