import type { MiddlewareHandler } from '../.functions/types'

export const onRequest: MiddlewareHandler = async ({ request, env }) => {
  const url = new URL(request.url)
  const host = url.hostname
  
  if (host === 'mifron.mct-official.com') {
    const path = url.pathname
    const assetPath = `/mifron${path}`
    
    const response = await env.ASSETS.fetch(assetPath)
    
    if (response.status === 404) {
      return await env.ASSETS.fetch('/mifron/404.html')
    }
    
    return response
  }
  
  return await env.ASSETS.fetch(request)
}
