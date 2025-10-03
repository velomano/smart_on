export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const upgradeHeader = req.headers.get('upgrade') || '';
  
  if (upgradeHeader.toLowerCase() !== 'websocket') {
    return new Response('Expected WebSocket', { status: 400 });
  }
  
  const { socket, response } = Deno.upgradeWebSocket(req);
  
  socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'hello' }));
  };
  
  socket.onmessage = (e) => {
    socket.send(e.data);
  };
  
  socket.onclose = () => {};
  socket.onerror = () => {};
  
  return response;
}
