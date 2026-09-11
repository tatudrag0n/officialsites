// Cloudflare Pages Middleware - Multi-site static file routing
// Routes static files based on hostname to appropriate site directory

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();
  const pathname = url.pathname;

  // Don't handle API requests here - let Pages Functions handle them automatically
  // API requests to /api/* will be routed to functions/api/_middleware.js by Pages
  if (pathname.startsWith('/api/')) {
    // Let Pages Functions handle API routes
    return fetch(request);
  }

  // Determine which site to serve based on hostname
  let sitePrefix = '';
  
  if (host.includes('mifron.')) {
    sitePrefix = '/mifron';
  } else if (host.includes('crewmate.')) {
    sitePrefix = '/crewmate';
  } else if (host.includes('texroot.')) {
    sitePrefix = '/texroot';
  }
  // Default: mct-official.com serves from root

  // For static files, rewrite the path to include site prefix
  const newUrl = new URL(`${sitePrefix}${pathname}`, `https://${host}`);
  return fetch(new Request(newUrl, request));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/|api/).*)']
};
