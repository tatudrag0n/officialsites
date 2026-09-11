import type { MiddlewareHandler } from '../.functions/types'

export const onRequest: MiddlewareHandler = async ({ request, env }) => {
  const url = new URL(request.url)
  const host = url.hostname.toLowerCase()

  if (host === 'mifron.mct-official.com') {
    const assetPath = url.pathname === '/' ? '/mifron/index.html' : `/mifron${url.pathname}`
    const assetUrl = new URL(assetPath, url.origin)

    try {
      const response = await env.ASSETS.fetch(new Request(assetUrl.toString(), request))

      if (response.status === 404) {
        return await env.ASSETS.fetch(new Request(new URL('/mifron/404.html', url.origin), request))
      }

      return response
    } catch (e) {
      console.error('Error fetching asset:', e)
      return new Response('Internal error', { status: 500 })
    }
  }

  return await env.ASSETS.fetch(request)
}
