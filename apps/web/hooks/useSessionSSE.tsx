'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Session, SSEEventType } from '@split-snap/shared';
import { api } from '@/lib/api';

interface UseSessionSSEOptions {
  code: string;
  onUpdate?: (session: Session) => void;
  onDeleted?: () => void;
}

const HEARTBEAT_TIMEOUT_MS = 45_000; // server sends every 30s, 15s grace
const INITIAL_RECONNECT_MS = 3_000;
const MAX_RECONNECT_MS = 30_000;

export function useSessionSSE({
  code,
  onUpdate,
  onDeleted,
}: UseSessionSSEOptions) {
  const [session, setSession] = useState<Session | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onUpdateRef = useRef(onUpdate);
  const onDeletedRef = useRef(onDeleted);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_MS);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    onDeletedRef.current = onDeleted;
  }, [onDeleted]);

  const resetHeartbeatTimer = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }
    heartbeatTimeoutRef.current = setTimeout(() => {
      // No events received within timeout — connection is stale
      setConnected(false);
      eventSourceRef.current?.close();
      // Trigger reconnect
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, reconnectDelayRef.current);
      reconnectDelayRef.current = Math.min(
        reconnectDelayRef.current * 2,
        MAX_RECONNECT_MS,
      );
    }, HEARTBEAT_TIMEOUT_MS);
  }, []);

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
      reconnectDelayRef.current = INITIAL_RECONNECT_MS;
      resetHeartbeatTimer();
    };

    // Listen for all session event types
    const eventTypes: SSEEventType[] = [
      'session:updated',
      'participant:joined',
      'participant:kicked',
      'participant:updated',
      'participant:pending',
      'participant:approved',
      'participant:rejected',
      'item:claimed',
      'item:unclaimed',
      'items:updated',
      'session:settled',
    ];

    for (const eventType of eventTypes) {
      es.addEventListener(eventType, (event: MessageEvent) => {
        resetHeartbeatTimer();
        try {
          const data = JSON.parse(event.data) as Session;
          setSession(data);
          onUpdateRef.current?.(data);
        } catch {
          console.error('Failed to parse SSE event:', event.data);
        }
      });
    }

    // Listen for session:deleted
    es.addEventListener('session:deleted', () => {
      resetHeartbeatTimer();
      es.close();
      onDeletedRef.current?.();
    });

    // Listen for heartbeat to reset the stale timer
    es.addEventListener('heartbeat', () => {
      resetHeartbeatTimer();
    });

    es.onerror = () => {
      setConnected(false);
      es.close();

      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
      }

      // Auto-reconnect with exponential backoff
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, reconnectDelayRef.current);
      reconnectDelayRef.current = Math.min(
        reconnectDelayRef.current * 2,
        MAX_RECONNECT_MS,
      );
    };
  }, [code, resetHeartbeatTimer]);

  useEffect(() => {
    connect();

    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
      }
    };
  }, [connect]);

  return { session, connected, error };
}
