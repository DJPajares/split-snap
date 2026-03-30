'use client';

import {
  Button,
  Card,
  CardHeader,
  FieldError,
  Fieldset,
  Form,
  Input,
  Label,
  Separator,
  Spinner,
  TextField,
  toast,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { STORAGE_KEYS } from '@split-snap/shared/constants';
import {
  type JoinSessionFormData,
  joinSessionSchema,
} from '@split-snap/shared/schemas';
import { ParamsCodeProps } from '@split-snap/shared/types';
import {
  IconArrowBigRightLines,
  IconBan,
  IconHourglassLow,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import {
  TypographyCaption,
  TypographyCardTitle,
  TypographyMuted,
  TypographySectionTitle,
} from '@/components/shared/Typography';
import { useApiError } from '@/hooks/useApiError';
import { useAuth } from '@/hooks/useAuth';
import { useSessionSSE } from '@/hooks/useSessionSSE';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/errors';

type JoinState = 'idle' | 'joining' | 'pending' | 'rejected' | 'kicked';

export default function JoinPage({ params }: ParamsCodeProps) {
  const { code } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const nameForm = useForm<JoinSessionFormData>({
    resolver: zodResolver(joinSessionSchema),
    defaultValues: { name: '' },
    mode: 'onChange',
  });
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

    const storedParticipantId = localStorage.getItem(
      `${STORAGE_KEYS.KEY_PARTICIPANT_PREFIX}${code}`,
    );
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
            `${STORAGE_KEYS.KEY_GUEST_PARTICIPANT_PREFIX}${code}`,
            storedParticipantId,
          );
        }

        localStorage.removeItem(
          `${STORAGE_KEYS.KEY_PARTICIPANT_PREFIX}${code}`,
        );
        setCheckingStoredParticipant(false);
      })
      .catch(() => {
        if (!active) return;
        localStorage.removeItem(
          `${STORAGE_KEYS.KEY_PARTICIPANT_PREFIX}${code}`,
        );
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
          toast.warning('Waiting for host approval...');
          return;
        }

        if (result.participantId) {
          // Directly admitted
          localStorage.setItem(
            `${STORAGE_KEYS.KEY_PARTICIPANT_PREFIX}${code}`,
            result.participantId,
          );
          toast.success(`Welcome, ${displayName}!`);
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

  const handleJoin = async (data: JoinSessionFormData) => {
    await joinSession(data.name);
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
        return (
          p.displayName.toLowerCase() ===
          nameForm.getValues('name').toLowerCase()
        );
      });

      if (!isStillPending && approvedParticipant) {
        // Approved!
        localStorage.setItem(
          `${STORAGE_KEYS.KEY_PARTICIPANT_PREFIX}${code}`,
          approvedParticipant.id,
        );
        toast.success('You have been approved!');
        router.push(`/session/${code}`);
        return;
      }

      // Check if rejected (no longer in pending and not in participants)
      if (!isStillPending && !approvedParticipant) {
        setJoinState('rejected');
        toast.danger('Your join request was rejected');
      }
    },
  });

  // Auto-join after login redirect (user came from handleLoginRedirect)
  useEffect(() => {
    if (checkingStoredParticipant || authLoading || !user) return;
    const pendingCode = localStorage.getItem(
      STORAGE_KEYS.KEY_PENDING_SESSION_CODE,
    );
    if (pendingCode === code) {
      localStorage.removeItem(STORAGE_KEYS.KEY_PENDING_SESSION_CODE);
      // Auto-submit join for the logged-in user
      queueMicrotask(() => {
        void joinSession(user.name, user.id);
      });
    }
  }, [checkingStoredParticipant, authLoading, user, code, joinSession]);

  const handleLoginRedirect = () => {
    localStorage.setItem(STORAGE_KEYS.KEY_PENDING_SESSION_CODE, code);
    // Preserve existing guest participantId so it survives the login flow
    const existingParticipant = localStorage.getItem(
      `${STORAGE_KEYS.KEY_PARTICIPANT_PREFIX}${code}`,
    );
    if (existingParticipant) {
      localStorage.setItem(
        STORAGE_KEYS.KEY_PENDING_PARTICIPANT_ID,
        existingParticipant,
      );
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
          <Card.Content className="flex flex-col items-center gap-4 py-12">
            <IconHourglassLow size={48} className="text-warning" />
            <TypographyCardTitle>Temporarily Removed</TypographyCardTitle>
            <TypographyMuted className="text-center text-base">
              You were removed from this session.
              {hasCountdown
                ? ` You can rejoin in ${minutes}:${seconds.toString().padStart(2, '0')}.`
                : ' You can try again shortly.'}
            </TypographyMuted>
            <div className="flex gap-2">
              <Button onPress={() => router.push('/')}>Go Home</Button>
              {!hasCountdown && (
                <Button variant="tertiary" onPress={() => setJoinState('idle')}>
                  Try Again
                </Button>
              )}
            </div>
          </Card.Content>
        </Card>
      </div>
    );
  }

  // Rejected state
  if (joinState === 'rejected') {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card>
          <Card.Content className="flex flex-col items-center gap-4 py-12">
            <IconBan size={48} className="text-danger" />
            <TypographyCardTitle>Request Rejected</TypographyCardTitle>
            <TypographyMuted className="text-center text-base">
              The host has rejected your join request.
            </TypographyMuted>
            <Button onPress={() => router.push('/')}>Go Home</Button>
          </Card.Content>
        </Card>
      </div>
    );
  }

  // Pending state
  if (joinState === 'pending') {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card>
          <Card.Content className="flex flex-col items-center gap-4 py-12">
            <Spinner size="lg" />
            <TypographyCardTitle>Waiting for Approval</TypographyCardTitle>
            <TypographyMuted className="text-center text-base">
              The host needs to approve your request to join this session.
            </TypographyMuted>
            <div className="text-accent font-mono text-lg font-bold tracking-widest">
              {code.toUpperCase()}
            </div>
            <Button
              variant="tertiary"
              onPress={() => {
                setJoinState('idle');
                setPendingParticipantId(null);
              }}
            >
              Cancel
            </Button>
          </Card.Content>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-col items-center gap-2">
          <IconArrowBigRightLines size={40} />
          <TypographySectionTitle>Join Session</TypographySectionTitle>
          <TypographyMuted className="text-center text-base">
            {user
              ? `Joining as ${user.name}`
              : 'Enter your name to start claiming your items'}
          </TypographyMuted>
          <p className="text-accent font-mono text-lg font-bold tracking-widest">
            {code.toUpperCase()}
          </p>
        </CardHeader>
        <Separator />
        <Card.Content className="gap-4 px-6 pb-8">
          {!user && (
            <Form onSubmit={nameForm.handleSubmit(handleJoin)}>
              <Fieldset>
                <Fieldset.Group>
                  <Controller
                    name="name"
                    control={nameForm.control}
                    render={({ field }) => (
                      <TextField type="text">
                        <Label>Your Name</Label>
                        <Input
                          variant="secondary"
                          placeholder="e.g. DJ"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          autoFocus
                        />
                        <FieldError />
                      </TextField>
                    )}
                  />
                </Fieldset.Group>
                <Fieldset.Actions>
                  <Button
                    type="submit"
                    size="lg"
                    isPending={joinState === 'joining'}
                    isDisabled={!nameForm.formState.isValid}
                    fullWidth
                  >
                    Join & Start Picking
                  </Button>
                </Fieldset.Actions>
              </Fieldset>
            </Form>
          )}
          {user && (
            <Button
              size="lg"
              onPress={() => void joinSession(user.name, user.id)}
              isPending={joinState === 'joining'}
              fullWidth
            >
              Join as Account
            </Button>
          )}
          {autoJoinError && (
            <p className="text-danger text-center text-xs">{autoJoinError}</p>
          )}
          {!user && (
            <>
              <Separator />
              <Button
                variant="tertiary"
                size="md"
                onPress={handleLoginRedirect}
                fullWidth
              >
                Log in to join with your account
              </Button>
            </>
          )}
          <TypographyCaption className="text-center">
            No account needed — just pick a name.
          </TypographyCaption>
        </Card.Content>
      </Card>
    </div>
  );
}
