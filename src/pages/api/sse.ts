import type { NextApiRequest, NextApiResponse } from "next";
import { sseManager } from "@/lib/sse-manager";

// Disable response buffering for SSE
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  // Add client to the manager
  sseManager.addClient(res);

  // Send initial connection message
  res.write(
    `data: ${JSON.stringify({
      type: "connected",
      message: "Connected to SSE",
      timestamp: new Date().toISOString(),
    })}\n\n`
  );

  // Send periodic heartbeat to keep connection alive
  const heartbeatInterval = setInterval(() => {
    res.write(`:heartbeat\n\n`);
  }, 30000); // Every 30 seconds

  // Handle client disconnect
  req.on("close", () => {
    clearInterval(heartbeatInterval);
    sseManager.removeClient(res);
  });
}
