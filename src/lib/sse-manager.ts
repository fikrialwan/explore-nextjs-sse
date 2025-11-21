import type { NextApiResponse } from 'next';

export interface SSEEvent {
  type: string;
  message: string;
  timestamp: string;
}

// Store the singleton on the global object to persist across hot reloads
const globalForSSE = global as typeof globalThis & {
  sseManagerInstance?: SSEManager;
};

class SSEManager {
  private clients: Set<NextApiResponse>;

  constructor() {
    this.clients = new Set<NextApiResponse>();
  }

  public static getInstance(): SSEManager {
    if (!globalForSSE.sseManagerInstance) {
      globalForSSE.sseManagerInstance = new SSEManager();
    }
    return globalForSSE.sseManagerInstance;
  }

  public addClient(client: NextApiResponse): void {
    this.clients.add(client);
    console.log('Client connected. Active connections:', this.clients.size);
  }

  public removeClient(client: NextApiResponse): void {
    this.clients.delete(client);
    console.log('Client disconnected. Active connections:', this.clients.size);
  }

  public sendEventToClients(data: SSEEvent): number {
    const message = `data: ${JSON.stringify(data)}\n\n`;

    this.clients.forEach((client) => {
      try {
        client.write(message);
      } catch (error) {
        console.error('Error sending to client:', error);
        this.clients.delete(client);
      }
    });

    return this.clients.size;
  }

  public getClientCount(): number {
    return this.clients.size;
  }
}

export const sseManager = SSEManager.getInstance();
