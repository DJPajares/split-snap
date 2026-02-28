import type { SSEEventType, Session } from '../lib/types.js';

type SSEClient = {
  controller: ReadableStreamDefaultController;
  encoder: TextEncoder;
};

/**
 * In-memory SSE connection manager.
 * Maps session codes to sets of connected clients.
 */
class SSEManager {
  private clients = new Map<string, Set<SSEClient>>();

  /**
   * Register a new SSE client for a session.
   * Returns a ReadableStream to pipe to the response.
   */
  connect(sessionCode: string): ReadableStream {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start: (controller) => {
        const client: SSEClient = { controller, encoder };

        if (!this.clients.has(sessionCode)) {
          this.clients.set(sessionCode, new Set());
        }
        this.clients.get(sessionCode)!.add(client);

        // Send initial connection event
        const data = `event: connected\ndata: ${JSON.stringify({ sessionCode })}\n\n`;
        controller.enqueue(encoder.encode(data));
      },
      cancel: () => {
        // Cleanup happens below via the returned stream
      }
    });

    return stream;
  }

  /**
   * Remove a client when they disconnect.
   */
  disconnect(sessionCode: string, stream: ReadableStream) {
    const clients = this.clients.get(sessionCode);
    if (!clients) return;

    // We can't easily match by stream, so we clean up empty sets
    // The actual cleanup is done via the controller.close() in broadcast errors
    if (clients.size === 0) {
      this.clients.delete(sessionCode);
    }
  }

  /**
   * Broadcast an event to all clients connected to a session.
   */
  broadcast(sessionCode: string, type: SSEEventType, data: Session) {
    const clients = this.clients.get(sessionCode);
    if (!clients) return;

    const message = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;

    const staleClients: SSEClient[] = [];

    for (const client of clients) {
      try {
        client.controller.enqueue(client.encoder.encode(message));
      } catch {
        // Client disconnected — mark for removal
        staleClients.push(client);
      }
    }

    // Clean up disconnected clients
    for (const stale of staleClients) {
      clients.delete(stale);
    }

    if (clients.size === 0) {
      this.clients.delete(sessionCode);
    }
  }

  /**
   * Get the number of connected clients for a session.
   */
  getClientCount(sessionCode: string): number {
    return this.clients.get(sessionCode)?.size ?? 0;
  }
}

export const sseManager = new SSEManager();
