export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const traceId = crypto.randomUUID();
  
  return new Response(
    JSON.stringify({ 
      data: { ok: true }, 
      error: null, 
      traceId 
    }), 
    {
      headers: { 'content-type': 'application/json' }
    }
  );
}
