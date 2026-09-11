// Cloudflare Pages Middleware - Multi-site static file routing
// Routes static files based on hostname to appropriate site directory

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();
  const pathname = url.pathname;

  let sitePrefix = '';

  if (host.includes('mifron.')) {
    sitePrefix = '/mifron';
  } else if (host.includes('crewmate.')) {
    sitePrefix = '/crewmate';
  } else if (host.includes('texroot.')) {
    sitePrefix = '/texroot';
  }
  // Default: mct-official.com serves from root

  if (!sitePrefix) {
    return next();
  }

  // For static files, rewrite the path to include the site prefix and
  // resolve it directly against the Pages static asset binding.
  // NOTE: a plain fetch() here would re-enter this same middleware
  // (same host), and Cloudflare's recursion guard would then fall back
  // to serving the original (root) asset - which caused every subdomain
  // to render the mct-official.com content. env.ASSETS.fetch() serves
  // the asset directly without re-triggering middleware.
  const newUrl = new URL(`${sitePrefix}${pathname}`, url.origin);
  const assetRequest = new Request(newUrl, request);

  let response = await env.ASSETS.fetch(assetRequest);

  if (response.status === 404 && !pathname.endsWith('/') && !pathname.includes('.')) {
    const fallbackUrl = new URL(`${sitePrefix}/index.html`, url.origin);
    response = await env.ASSETS.fetch(new Request(fallbackUrl, request));
  }

  return response;
}
