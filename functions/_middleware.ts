import type { MiddlewareHandler } from '../.functions/types'

const SITE_ROOTS: Record<string, string> = {
  'mifron.mct-official.com': '/mifron',
  'crewmate.mct-official.com': '/crewmate',
  'texroot.mct-official.com': '/texroot',
}

export const onRequest: MiddlewareHandler = async ({ request, env }) => {
  const url = new URL(request.url)
  const host = url.hostname.toLowerCase()
  const root = SITE_ROOTS[host]

  if (!root) {
    return env.ASSETS.fetch(request)
  }

  // Map each custom hostname to its own static directory while keeping
  // the public URL unchanged.
  const pathname = url.pathname === '/' ? '/index.html' : url.pathname
  const assetUrl = new URL(`${root}${pathname}`, url.origin)

  try {
    const response = await env.ASSETS.fetch(new Request(assetUrl.toString(), request))

    if (response.status !== 404) {
      return response
    }

    const notFoundUrl = new URL(`${root}/404.html`, url.origin)
    const notFound = await env.ASSETS.fetch(new Request(notFoundUrl.toString(), request))
    return notFound.status === 404 ? new Response('Not Found', { status: 404 }) : notFound
  } catch (error) {
    console.error('Asset routing error:', error)
    return new Response('Internal error', { status: 500 })
  }
}
