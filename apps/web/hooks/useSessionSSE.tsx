"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Session, SSEEventType } from "@split-snap/shared";
import { api } from "@/lib/api";

interface UseSessionSSEOptions {
  code: string;
  onUpdate?: (session: Session) => void;
}

export function useSessionSSE({ code, onUpdate }: UseSessionSSEOptions) {
  const [session, setSession] = useState<Session | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = api.sessions.eventsUrl(code);
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
      setError(null);
    };

    // Listen for all session event types
    const eventTypes: SSEEventType[] = [
      "session:updated",
      "participant:joined",
      "item:claimed",
      "item:unclaimed",
      "session:settled",
    ];

    for (const eventType of eventTypes) {
      es.addEventListener(eventType, (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as Session;
          setSession(data);
          onUpdate?.(data);
        } catch {
          console.error("Failed to parse SSE event:", event.data);
        }
      });
    }

    es.onerror = () => {
      setConnected(false);
      es.close();

      // Auto-reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };
  }, [code, onUpdate]);

  useEffect(() => {
    connect();

    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { session, connected, error };
}
