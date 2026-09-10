// Cloudflare Pages middleware for multi-site routing
// Routes requests based on hostname to appropriate site directory

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();
  const pathname = url.pathname;

  // Determine which site to serve based on hostname
  let sitePrefix = '';
  
  if (host.includes('mifron.')) {
    sitePrefix = '/mifron';
  } else if (host.includes('crewmate.')) {
    sitePrefix = '/crewmate';
  } else if (host.includes('texroot.')) {
    sitePrefix = '/texroot';
  }
  // Default (mct-official.com) serves from root

  // For API requests, proxy to the site's API
  if (pathname.startsWith('/api/')) {
    const newUrl = new URL(`${sitePrefix}${pathname}`, `https://${host}`);
    return fetch(new Request(newUrl, request));
  }

  // For static files, rewrite the path
  const newUrl = new URL(`${sitePrefix}${pathname}`, `https://${host}`);
  return fetch(new Request(newUrl, request));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*|/mifron/:path*|/crewmate/:path*|/texroot/:path*)']
};
