"use client";

import { useState, useEffect, useCallback, use } from "react";
import {
  Button,
  Chip,
  Spinner,
  addToast,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import type { Session } from "@split-snap/shared";
import { api } from "@/lib/api";
import { useSessionSSE } from "@/hooks/useSessionSSE";
import { SessionItemList } from "@/components/session/SessionItemList";
import { ParticipantSidebar } from "@/components/session/ParticipantSidebar";
import { ShareLinkModal } from "@/components/session/ShareLinkModal";

export default function SessionPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const [initialSession, setInitialSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);

  // Load initial session data
  useEffect(() => {
    api.sessions
      .get(code)
      .then((s) => {
        setInitialSession(s);
        // Check if we have a stored participant ID for this session
        const stored = localStorage.getItem(`participant_${code}`);
        if (stored) setParticipantId(stored);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Session not found");
      })
      .finally(() => setLoading(false));
  }, [code]);

  // Real-time updates via SSE
  const { session: liveSession, connected } = useSessionSSE({
    code,
    onUpdate: (updated) => {
      setInitialSession(updated);
    },
  });

  const session = liveSession ?? initialSession;

  useEffect(() => {
    if (!loading && !error && session && !participantId) {
      router.replace(`/join/${code}`);
    }
  }, [loading, error, session, participantId, router, code]);

  const handleClaimToggle = useCallback(
    async (itemId: string) => {
      if (!participantId || !session) return;
      try {
        await api.sessions.claimItem(code, itemId, {
          participantId,
          portion: 1,
        });
      } catch (err) {
        addToast({
          title: "Failed to update claim",
          description: err instanceof Error ? err.message : "Unknown error",
          color: "danger",
        });
      }
    },
    [code, participantId, session]
  );

  const handleSettle = useCallback(async () => {
    try {
      await api.sessions.settle(code);
      addToast({ title: "Session settled!", color: "success" });
    } catch (err) {
      addToast({
        title: "Failed to settle",
        description: err instanceof Error ? err.message : "Unknown error",
        color: "danger",
      });
    }
  }, [code]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-xl text-danger">{error || "Session not found"}</p>
        <Button onPress={() => router.push("/")}>Go Home</Button>
      </div>
    );
  }

  // If user hasn't joined yet, redirect to join page
  if (!participantId) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Session {code}</h1>
            <Chip
              size="sm"
              color={
                session.status === "active"
                  ? "success"
                  : session.status === "settled"
                    ? "default"
                    : "warning"
              }
              variant="flat"
            >
              {session.status}
            </Chip>
            <Chip
              size="sm"
              variant="dot"
              color={connected ? "success" : "danger"}
            >
              {connected ? "Live" : "Reconnecting..."}
            </Chip>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="flat"
            size="sm"
            onPress={() => setShowShare(true)}
          >
            🔗 Share
          </Button>
          <Button
            as="a"
            href={`/session/${code}/summary`}
            variant="flat"
            size="sm"
          >
            📊 Summary
          </Button>
          {session.status === "active" && (
            <Button
              color="success"
              size="sm"
              onPress={handleSettle}
            >
              ✓ Settle
            </Button>
          )}
        </div>
      </div>

      {/* Main content: items + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3">
            Items ({session.items.length})
          </h2>
          <SessionItemList
            session={session}
            participantId={participantId}
            onClaimToggle={handleClaimToggle}
          />
        </div>

        <div className="order-first lg:order-last">
          <ParticipantSidebar
            session={session}
            currentParticipantId={participantId}
          />
        </div>
      </div>

      {/* Share modal */}
      <ShareLinkModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        sessionCode={code}
      />
    </div>
  );
}
