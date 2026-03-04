'use client';

import { useState, use, useEffect, useCallback } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Divider,
  Spinner,
  addToast,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/errors';
import { useAuth } from '@/hooks/useAuth';
import { useSessionSSE } from '@/hooks/useSessionSSE';
import { useApiError } from '@/hooks/useApiError';

type JoinState = 'idle' | 'joining' | 'pending' | 'rejected' | 'kicked';

export default function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [joinState, setJoinState] = useState<JoinState>('idle');
  const [kickCooldownEnd, setKickCooldownEnd] = useState<string | null>(null);
  const [kickCountdown, setKickCountdown] = useState(0);
  const [checkingStoredParticipant, setCheckingStoredParticipant] =
    useState(true);
  const [autoJoinError, setAutoJoinError] = useState<string | null>(null);
  const [pendingParticipantId, setPendingParticipantId] = useState<
    string | null
  >(null);
  const { handleError } = useApiError({ redirectTo: '/' });

  // Check for stored participant and validate against auth state
  useEffect(() => {
    if (authLoading) return;

    const storedParticipantId = localStorage.getItem(`participant_${code}`);
    if (!storedParticipantId) {
      queueMicrotask(() => {
        setCheckingStoredParticipant(false);
      });
      return;
    }

    if (!user) {
      router.replace(`/session/${code}`);
      return;
    }

    let active = true;
    void api.sessions
      .get(code)
      .then((session) => {
        if (!active) return;

        const participant = session.participants.find(
          (p) => p.id === storedParticipantId,
        );

        if (
          participant &&
          participant.userId === user.id &&
          !participant.isAnonymous
        ) {
          router.replace(`/session/${code}`);
          return;
        }

        if (participant && !participant.userId) {
          localStorage.setItem(
            `guest_participant_${code}`,
            storedParticipantId,
          );
        }

        localStorage.removeItem(`participant_${code}`);
        setCheckingStoredParticipant(false);
      })
      .catch(() => {
        if (!active) return;
        localStorage.removeItem(`participant_${code}`);
        setCheckingStoredParticipant(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, code, router, user]);

  const joinSession = useCallback(
    async (displayName: string, userId?: string) => {
      setJoinState('joining');
      setAutoJoinError(null);

      try {
        const result = await api.sessions.join(code, {
          displayName,
          userId: userId ?? null,
        });

        if (result.status === 'pending') {
          // Host approval required — wait
          setPendingParticipantId(result.pendingParticipantId ?? null);
          setJoinState('pending');
          addToast({ title: 'Waiting for host approval...', color: 'warning' });
          return;
        }

        if (result.participantId) {
          // Directly admitted
          localStorage.setItem(`participant_${code}`, result.participantId);
          addToast({ title: `Welcome, ${displayName}!`, color: 'success' });
          router.push(`/session/${code}`);
        }
      } catch (err) {
        // Check if kicked (with cooldown)
        if (err instanceof ApiError && err.code === 'SESSION_JOIN_KICKED') {
          const details = err.details as
            | { cooldownEndsAt?: string; remainingMs?: number }
            | undefined;
          if (details?.cooldownEndsAt) {
            setKickCooldownEnd(details.cooldownEndsAt);
          }
          setJoinState('kicked');
          return;
        }

        const message =
          err instanceof Error ? err.message : 'Failed to join session';

        setAutoJoinError(message);
        setJoinState('idle');
        handleError(err, 'Failed to join session');
      }
    },
    [code, router, handleError],
  );

  const handleJoin = async () => {
    if (!name.trim()) return;
    await joinSession(name.trim());
  };

  // SSE subscription when pending — listen for approval/rejection
  useSessionSSE({
    code,
    onUpdate: (updated) => {
      if (joinState !== 'pending' || !pendingParticipantId) return;

      // Check if we've been approved (moved from pending to participants)
      const isStillPending = updated.pendingParticipants?.some(
        (p) => p.id === pendingParticipantId,
      );
      const approvedParticipant = updated.participants.find((p) => {
        // Match by userId or displayName since the id changes when moved
        if (user?.id) {
          return p.userId === user.id;
        }
        return p.displayName.toLowerCase() === name.toLowerCase();
      });

      if (!isStillPending && approvedParticipant) {
        // Approved!
        localStorage.setItem(`participant_${code}`, approvedParticipant.id);
        addToast({ title: 'You have been approved!', color: 'success' });
        router.push(`/session/${code}`);
        return;
      }

      // Check if rejected (no longer in pending and not in participants)
      if (!isStillPending && !approvedParticipant) {
        setJoinState('rejected');
        addToast({ title: 'Your join request was rejected', color: 'danger' });
      }
    },
  });

  // Auto-join after login redirect (user came from handleLoginRedirect)
  useEffect(() => {
    if (checkingStoredParticipant || authLoading || !user) return;
    const pendingCode = localStorage.getItem('pending_session_code');
    if (pendingCode === code) {
      localStorage.removeItem('pending_session_code');
      // Auto-submit join for the logged-in user
      queueMicrotask(() => {
        void joinSession(user.name, user.id);
      });
    }
  }, [checkingStoredParticipant, authLoading, user, code, joinSession]);

  const handleLoginRedirect = () => {
    localStorage.setItem('pending_session_code', code);
    // Preserve existing guest participantId so it survives the login flow
    const existingParticipant = localStorage.getItem(`participant_${code}`);
    if (existingParticipant) {
      localStorage.setItem('pending_participant_id', existingParticipant);
    }
    router.push('/auth/login');
  };

  // Kick cooldown countdown timer
  useEffect(() => {
    if (joinState !== 'kicked' || !kickCooldownEnd) return;
    const endTime = new Date(kickCooldownEnd).getTime();
    const tick = () => {
      const remaining = Math.max(0, endTime - Date.now());
      setKickCountdown(remaining);
      if (remaining <= 0) {
        setJoinState('idle');
        setKickCooldownEnd(null);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [joinState, kickCooldownEnd]);

  if (checkingStoredParticipant || authLoading) {
    return null;
  }

  // Kicked state
  if (joinState === 'kicked') {
    const minutes = Math.floor(kickCountdown / 60000);
    const seconds = Math.ceil((kickCountdown % 60000) / 1000);
    const hasCountdown = kickCooldownEnd && kickCountdown > 0;

    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card>
          <CardBody className="flex flex-col items-center gap-4 py-12">
            <span className="text-5xl">⏳</span>
            <h2 className="text-xl font-bold">Temporarily Removed</h2>
            <p className="text-default-500 text-center">
              You were removed from this session.
              {hasCountdown
                ? ` You can rejoin in ${minutes}:${seconds.toString().padStart(2, '0')}.`
                : ' You can try again shortly.'}
            </p>
            <div className="flex gap-2">
              <Button color="primary" onPress={() => router.push('/')}>
                Go Home
              </Button>
              {!hasCountdown && (
                <Button variant="flat" onPress={() => setJoinState('idle')}>
                  Try Again
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Rejected state
  if (joinState === 'rejected') {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card>
          <CardBody className="flex flex-col items-center gap-4 py-12">
            <span className="text-5xl">❌</span>
            <h2 className="text-xl font-bold">Request Rejected</h2>
            <p className="text-default-500 text-center">
              The host has rejected your join request.
            </p>
            <Button color="primary" onPress={() => router.push('/')}>
              Go Home
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Pending state
  if (joinState === 'pending') {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card>
          <CardBody className="flex flex-col items-center gap-4 py-12">
            <Spinner size="lg" />
            <h2 className="text-xl font-bold">Waiting for Approval</h2>
            <p className="text-default-500 text-center">
              The host needs to approve your request to join this session.
            </p>
            <div className="text-primary font-mono text-lg font-bold tracking-widest">
              {code.toUpperCase()}
            </div>
            <Button
              variant="flat"
              onPress={() => {
                setJoinState('idle');
                setPendingParticipantId(null);
              }}
            >
              Cancel
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader className="flex flex-col items-center gap-2 pt-8">
          <span className="text-5xl">👋</span>
          <h1 className="text-2xl font-bold">Join Session</h1>
          <p className="text-default-500 text-center">
            {user
              ? `Joining as ${user.name}`
              : 'Enter your name to start claiming your items'}
          </p>
          <div className="text-primary font-mono text-lg font-bold tracking-widest">
            {code.toUpperCase()}
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="gap-4 px-6 pb-8">
          {!user && (
            <Input
              label="Your Name"
              placeholder="e.g. DJ"
              value={name}
              onValueChange={setName}
              size="lg"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
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
            isLoading={joinState === 'joining'}
            isDisabled={user ? false : !name.trim()}
          >
            {user ? 'Join as Account' : 'Join & Start Picking'}
          </Button>
          {autoJoinError && (
            <p className="text-danger text-center text-xs">{autoJoinError}</p>
          )}
          {!user && (
            <>
              <Divider />
              <Button variant="flat" size="md" onPress={handleLoginRedirect}>
                Log in to join with your account
              </Button>
            </>
          )}
          <p className="text-default-400 text-center text-xs">
            No account needed — just pick a name.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
