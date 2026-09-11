// Cloudflare Pages Functions - Unified API for Mifron
// Handles all API requests from any domain

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const host = url.hostname.toLowerCase();

  // Determine which site this request is for
  let siteType = 'mifron'; // default
  if (host.includes('crewmate.')) {
    siteType = 'crewmate';
  } else if (host.includes('texroot.')) {
    siteType = 'texroot';
  }
  // mifron.mct-official.com or mct-official.com/mifron both map to mifron

  // Route API requests
  if (path.startsWith('/api/quests')) {
    return handleQuestsRequest(context, path, request, env);
  } else if (path.startsWith('/api/proposals')) {
    return handleProposalsRequest(context, path, request, env);
  }

  // Return 404 for unknown routes
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// Handle OPTIONS for CORS preflight
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

async function handleQuestsRequest(context, path, request, env) {
  const method = request.method;
  
  if (method === 'GET') {
    try {
      const list = await env.QUESTS.list();
      const quests = await Promise.all(
        list.keys.map(async key => {
          const data = await env.QUESTS.get(key.name);
          return data ? JSON.parse(data) : null;
        })
      );
      return new Response(JSON.stringify(quests.filter(q => q !== null)), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  } else if (method === 'POST') {
    try {
      const body = await request.json();
      const questId = Date.now().toString();
      
      if (!body.name || !body.condition || !body.reward) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: name, condition, reward' 
        }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      body.id = questId;
      body.createdAt = new Date().toISOString();
      body.status = 'pending';
      body.type = body.type || 'single';
      body.dependencies = body.dependencies || [];
      
      await env.QUESTS.put(questId, JSON.stringify(body));
      
      return new Response(JSON.stringify({ 
        success: true, 
        id: questId 
      }), {
        status: 201,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
  
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleProposalsRequest(context, path, request, env) {
  const method = request.method;
  
  if (method === 'GET') {
    try {
      const list = await env.PROPOSALS.list();
      const proposals = await Promise.all(
        list.keys.map(async key => {
          const data = await env.PROPOSALS.get(key.name);
          return data ? JSON.parse(data) : null;
        })
      );
      return new Response(JSON.stringify(proposals.filter(p => p !== null)), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  } else if (method === 'POST') {
    try {
      const body = await request.json();
      const proposalId = Date.now().toString();
      
      if (!body.title || !body.description) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: title, description' 
        }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      body.id = proposalId;
      body.createdAt = new Date().toISOString();
      body.status = 'open';
      body.author = body.author || 'Anonymous';
      body.type = body.type || 'feature';
      body.upvotes = 0;
      
      await env.PROPOSALS.put(proposalId, JSON.stringify(body));
      
      return new Response(JSON.stringify({ 
        success: true, 
        id: proposalId 
      }), {
        status: 201,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
  
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
