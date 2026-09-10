// Cloudflare Workers Functions middleware
// This file handles routing for all API endpoints

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Route to appropriate handler based on path
  if (path.startsWith('/api/quests')) {
    return handleQuestsRequest(context, path, request);
  } else if (path.startsWith('/api/proposals')) {
    return handleProposalsRequest(context, path, request);
  }

  // Return 404 for unknown routes
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleQuestsRequest(context, path, request) {
  const { env } = context;
  const method = request.method;
  
  if (method === 'GET') {
    // Get all quests
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
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } else if (method === 'POST') {
    // Create new quest
    try {
      const body = await request.json();
      const questId = Date.now().toString();
      
      // Validate required fields
      if (!body.name || !body.condition || !body.reward) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: name, condition, reward' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Add metadata
      body.id = questId;
      body.createdAt = new Date().toISOString();
      body.status = 'pending'; // pending, approved, rejected
      body.type = body.type || 'single'; // single, daily, weekly, hidden
      body.dependencies = body.dependencies || []; // Array of quest IDs
      
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
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleProposalsRequest(context, path, request) {
  const { env } = context;
  const method = request.method;
  
  if (method === 'GET') {
    // Get all proposals
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
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } else if (method === 'POST') {
    // Create new proposal
    try {
      const body = await request.json();
      const proposalId = Date.now().toString();
      
      // Validate required fields
      if (!body.title || !body.description) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: title, description' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Add metadata
      body.id = proposalId;
      body.createdAt = new Date().toISOString();
      body.status = 'open'; // open, in_progress, completed, rejected
      body.author = body.author || 'Anonymous';
      body.type = body.type || 'feature'; // feature, bug, quest, other
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
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
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
