"use client";

import { useState, use, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Divider,
  addToast,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [checkingStoredParticipant, setCheckingStoredParticipant] = useState(true);
  const [autoJoinError, setAutoJoinError] = useState<string | null>(null);
  const hasAttemptedAutoJoinRef = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem(`participant_${code}`);
    if (stored) {
      router.replace(`/session/${code}`);
      return;
    }
    setCheckingStoredParticipant(false);
  }, [code, router]);

  const joinSession = useCallback(async (displayName: string, userId?: string) => {
    setJoining(true);
    setAutoJoinError(null);

    try {
      const result = await api.sessions.join(code, {
        displayName,
        userId: userId ?? null,
      });

      // Store participant ID
      localStorage.setItem(`participant_${code}`, result.participantId);

      addToast({ title: `Welcome, ${displayName}!`, color: "success" });
      router.push(`/session/${code}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to join session";
      setAutoJoinError(message);
      addToast({ title: "Error", description: message, color: "danger" });
    } finally {
      setJoining(false);
    }
  }, [code, router]);

  const handleJoin = async () => {
    if (!name.trim()) return;
    await joinSession(name.trim());
  };

  useEffect(() => {
    if (
      checkingStoredParticipant ||
      authLoading ||
      !user ||
      joining ||
      hasAttemptedAutoJoinRef.current
    ) {
      return;
    }

    hasAttemptedAutoJoinRef.current = true;
    void joinSession(user.name, user.id);
  }, [checkingStoredParticipant, authLoading, user, joining, joinSession]);

  if (checkingStoredParticipant || authLoading) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card>
        <CardHeader className="flex flex-col items-center gap-2 pt-8">
          <span className="text-5xl">👋</span>
          <h1 className="text-2xl font-bold">Join Session</h1>
          <p className="text-default-500 text-center">
            {user
              ? `Joining as ${user.name}`
              : "Enter your name to start claiming your items"}
          </p>
          <div className="font-mono text-lg tracking-widest font-bold text-primary">
            {code.toUpperCase()}
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="gap-4 pb-8 px-6">
          {!user && (
            <Input
              label="Your Name"
              placeholder="e.g. Alex"
              value={name}
              onValueChange={setName}
              size="lg"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
          )}
          <Button
            color="primary"
            size="lg"
            className="font-semibold"
            onPress={() => {
              if (user) {
                void joinSession(user.name, user.id);
                return;
              }
              void handleJoin();
            }}
            isLoading={joining}
            isDisabled={user ? false : !name.trim()}
          >
            {user ? "Join as Account" : "Join & Start Picking"}
          </Button>
          {user && autoJoinError && (
            <p className="text-xs text-danger text-center">{autoJoinError}</p>
          )}
          <p className="text-xs text-default-400 text-center">
            No account needed — just pick a name.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
