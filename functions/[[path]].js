export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const host = url.hostname;
  
  // mifron.mct-official.com へのリクエストを処理
  if (host === 'mifron.mct-official.com') {
    const path = url.pathname;
    // /mifron/ のコンテンツを取得
    const assetPath = `/mifron${path}`;
    
    try {
      const response = await env.ASSETS.fetch(new Request(assetPath, request));
      
      if (response.status === 404) {
        // 404 の場合、/mifron/404.html を返す
        const notFound = await env.ASSETS.fetch(new Request('/mifron/404.html', request));
        return notFound;
      }
      
      return response;
    } catch (e) {
      // エラー時も /mifron/404.html を返す
      const notFound = await env.ASSETS.fetch(new Request('/mifron/404.html', request));
      return notFound;
    }
  }
  
  // その他のリクエストはそのまま Pages に返す
  return await env.ASSETS.fetch(request);
}
