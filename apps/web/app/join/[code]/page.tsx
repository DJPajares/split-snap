'use client';

import { useState, use, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Divider,
  Spinner,
  addToast,
  Link
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/errors';
import { useAuth } from '@/hooks/useAuth';
import { useSessionSSE } from '@/hooks/useSessionSSE';
import { useApiError } from '@/hooks/useApiError';

type JoinState = 'idle' | 'joining' | 'pending' | 'rejected' | 'kicked';

export default function JoinPage({
  params
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [joinState, setJoinState] = useState<JoinState>('idle');
  const [checkingStoredParticipant, setCheckingStoredParticipant] =
    useState(true);
  const [autoJoinError, setAutoJoinError] = useState<string | null>(null);
  const [pendingParticipantId, setPendingParticipantId] = useState<
    string | null
  >(null);
  const hasAttemptedAutoJoinRef = useRef(false);
  const { handleError } = useApiError({ redirectTo: '/' });

  // Check for stored participant — if found, go directly to session
  useEffect(() => {
    const stored = localStorage.getItem(`participant_${code}`);
    if (stored) {
      router.replace(`/session/${code}`);
      return;
    }
    setCheckingStoredParticipant(false);
  }, [code, router]);

  const joinSession = useCallback(
    async (displayName: string, userId?: string) => {
      setJoinState('joining');
      setAutoJoinError(null);

      try {
        const result = await api.sessions.join(code, {
          displayName,
          userId: userId ?? null
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
        // Check if kicked
        if (err instanceof ApiError && err.code === 'SESSION_JOIN_KICKED') {
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
    [code, router, handleError]
  );

  const handleJoin = async () => {
    if (!name.trim()) return;
    await joinSession(name.trim());
  };

  // SSE subscription when pending — listen for approval/rejection
  const { session: liveSession } = useSessionSSE({
    code,
    onUpdate: (updated) => {
      if (joinState !== 'pending' || !pendingParticipantId) return;

      // Check if we've been approved (moved from pending to participants)
      const isStillPending = updated.pendingParticipants?.some(
        (p) => p.id === pendingParticipantId
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
    }
  });

  // Auto-join for logged-in users (but not auto — show confirmation)
  // Only pre-fill name, don't auto-submit to avoid kicked-user loop
  useEffect(() => {
    if (checkingStoredParticipant || authLoading || !user) return;
    setName(user.name);
  }, [checkingStoredParticipant, authLoading, user]);

  const handleLoginRedirect = () => {
    localStorage.setItem('pending_session_code', code);
    router.push('/auth/login');
  };

  if (checkingStoredParticipant || authLoading) {
    return null;
  }

  // Kicked state
  if (joinState === 'kicked') {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card>
          <CardBody className="flex flex-col items-center gap-4 py-12">
            <span className="text-5xl">🚫</span>
            <h2 className="text-xl font-bold">Cannot Rejoin</h2>
            <p className="text-default-500 text-center">
              You have been removed from this session and cannot rejoin.
            </p>
            <Button color="primary" onPress={() => router.push('/')}>
              Go Home
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Rejected state
  if (joinState === 'rejected') {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
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
      <div className="max-w-md mx-auto px-4 py-16">
        <Card>
          <CardBody className="flex flex-col items-center gap-4 py-12">
            <Spinner size="lg" />
            <h2 className="text-xl font-bold">Waiting for Approval</h2>
            <p className="text-default-500 text-center">
              The host needs to approve your request to join this session.
            </p>
            <div className="font-mono text-lg tracking-widest font-bold text-primary">
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
    <div className="max-w-md mx-auto px-4 py-16">
      <Card>
        <CardHeader className="flex flex-col items-center gap-2 pt-8">
          <span className="text-5xl">👋</span>
          <h1 className="text-2xl font-bold">Join Session</h1>
          <p className="text-default-500 text-center">
            {user
              ? `Joining as ${user.name}`
              : 'Enter your name to start claiming your items'}
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
            <p className="text-xs text-danger text-center">{autoJoinError}</p>
          )}
          {!user && (
            <>
              <Divider />
              <Button variant="flat" size="md" onPress={handleLoginRedirect}>
                Log in to join with your account
              </Button>
            </>
          )}
          <p className="text-xs text-default-400 text-center">
            No account needed — just pick a name.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
