// TEMPORARY: Middleware disabled for debugging
// This simply passes through all requests to default Pages handling

export async function onRequest(context) {
  return context.next();
}
