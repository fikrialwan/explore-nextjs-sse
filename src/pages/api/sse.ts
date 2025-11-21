import type { NextApiRequest, NextApiResponse } from 'next';

// Disable response buffering for SSE
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

// Store active connections
const clients = new Set<NextApiResponse>();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Add client to the set
  clients.add(res);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to SSE', timestamp: new Date().toISOString() })}\n\n`);

  // Send periodic heartbeat to keep connection alive
  const heartbeatInterval = setInterval(() => {
    res.write(`:heartbeat\n\n`);
  }, 30000); // Every 30 seconds

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    clients.delete(res);
    console.log('Client disconnected. Active connections:', clients.size);
  });
}

// Export function to send events to all clients
export function sendEventToClients(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;

  clients.forEach((client) => {
    try {
      client.write(message);
    } catch (error) {
      console.error('Error sending to client:', error);
      clients.delete(client);
    }
  });

  return clients.size;
}

// Export clients for access from other modules
export { clients };
