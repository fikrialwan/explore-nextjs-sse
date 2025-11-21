import type { NextApiRequest, NextApiResponse } from 'next';
import { sseManager } from '@/lib/sse-manager';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { message, type = 'update' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Create event data
    const eventData = {
      type,
      message,
      timestamp: new Date().toISOString(),
    };

    // Send to all connected SSE clients
    const clientCount = sseManager.sendEventToClients(eventData);

    return res.status(200).json({
      success: true,
      message: 'Event sent successfully',
      clientCount,
      data: eventData,
    });
  } catch (error) {
    console.error('Error sending event:', error);
    return res.status(500).json({ error: 'Failed to send event' });
  }
}
