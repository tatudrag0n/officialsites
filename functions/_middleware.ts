import type { MiddlewareHandler } from '../.functions/types'

export const onRequest: MiddlewareHandler = async ({ request, env }) => {
  const url = new URL(request.url)
  const host = url.hostname
  
  if (host === 'mifron.mct-official.com') {
    const path = url.pathname === '/' ? '/mifron/index.html' : `/mifron${url.pathname}`
    const newRequest = new Request(path, request)
    
    try {
      const response = await env.ASSETS.fetch(newRequest)
      
      if (response.status === 404) {
        return await env.ASSETS.fetch('/mifron/404.html')
      }
      
      return response
    } catch (e) {
      console.error('Error fetching asset:', e)
      return new Response('Internal error', { status: 500 })
    }
  }
  
  return await env.ASSETS.fetch(request)
}
