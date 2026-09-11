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

  // If no site prefix matched, let Pages handle it normally
  if (!sitePrefix) {
    return next();
  }

  // If env.ASSETS is not available, fall back to next()
  if (!env || !env.ASSETS) {
    console.error('env.ASSETS not available, falling back to next()');
    return next();
  }

  try {
    // Rewrite the path to include the site prefix.
    // Use a relative path (starting with /) so env.ASSETS.fetch()
    // resolves it from the Pages deployment root, not the custom domain.
    const newPath = `${sitePrefix}${pathname}`;
    const assetUrl = new URL(newPath, 'https://placeholder.local');
    const assetRequest = new Request(assetUrl, request);

    let response = await env.ASSETS.fetch(assetRequest);

    // If the exact path returns 404 and it's a directory-like path,
    // try serving index.html from that directory
    if (response.status === 404 && !pathname.endsWith('/') && !pathname.includes('.')) {
      const fallbackPath = `${sitePrefix}/index.html`;
      const fallbackUrl = new URL(fallbackPath, 'https://placeholder.local');
      response = await env.ASSETS.fetch(new Request(fallbackUrl, request));
    }

    return response;
  } catch (error) {
    console.error('Middleware error, falling back to next():', error);
    return next();
  }
}
