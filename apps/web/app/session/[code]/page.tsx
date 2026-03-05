'use client';

import {
  addToast,
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  useDisclosure,
} from '@heroui/react';
import type { Session } from '@split-snap/shared/types';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useRef, useState } from 'react';

import { ParticipantSidebar } from '@/components/session/ParticipantSidebar';
import { SessionItemList } from '@/components/session/SessionItemList';
import { ShareLinkModal } from '@/components/session/ShareLinkModal';
import { useApiError } from '@/hooks/useApiError';
import { useAuth } from '@/hooks/useAuth';
import { useSessionSSE } from '@/hooks/useSessionSSE';
import { api } from '@/lib/api';

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
  const [claimingItems, setClaimingItems] = useState<Set<string>>(new Set());
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const [settleLoading, setSettleLoading] = useState(false);
  const [unsettleLoading, setUnsettleLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const {
    isOpen: isSettleOpen,
    onOpen: onSettleOpen,
    onOpenChange: onSettleOpenChange,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();
  const { user } = useAuth();
  const { handleError } = useApiError({ redirectTo: '/' });

  // Load initial session data and validate participant
  useEffect(() => {
    api.sessions
      .get(code)
      .then((s) => {
        setInitialSession(s);
        const stored = localStorage.getItem(`participant_${code}`);
        if (stored) {
          // Validate the stored participant still exists in the session
          const participant = s.participants.find((p) => p.id === stored);
          if (participant) {
            // If user is logged in, only allow a participant explicitly linked to them.
            if (user) {
              if (!participant.userId) {
                localStorage.setItem(`guest_participant_${code}`, stored);
                localStorage.removeItem(`participant_${code}`);
              } else if (participant.userId !== user.id) {
                localStorage.removeItem(`participant_${code}`);
              } else {
                setParticipantId(stored);
              }
            } else {
              setParticipantId(stored);
            }
          } else {
            // Participant was kicked — clear stale data
            localStorage.removeItem(`participant_${code}`);
          }
        }
      })
      .catch((err) => {
        handleError(err, 'Session error');
        setError(err instanceof Error ? err.message : 'Session not found');
      })
      .finally(() => setLoading(false));
  }, [code, handleError, user]);

  // Real-time updates via SSE
  const { session: liveSession, connected } = useSessionSSE({
    code,
    onUpdate: (updated) => {
      setInitialSession(updated);

      // Detect if current user was kicked
      if (participantId && updated.participants) {
        const stillInSession = updated.participants.some(
          (p) => p.id === participantId,
        );
        if (!stillInSession) {
          localStorage.removeItem(`participant_${code}`);
          setParticipantId(null);
          addToast({
            title: 'You were removed from this session',
            description: 'The host removed you from this session.',
            color: 'warning',
          });
          router.replace('/');
        }
      }
    },
    onDeleted: () => {
      addToast({
        title: 'Session deleted',
        description: 'This session was deleted by the host.',
        color: 'warning',
      });
      localStorage.removeItem(`participant_${code}`);
      router.replace('/');
    },
  });

  const session = liveSession ?? initialSession;
  const currentParticipant = session?.participants.find(
    (participant) => participant.id === participantId,
  );
  const hasUnclaimedItems = Boolean(
    session?.items.some((item) => item.claimedBy.length === 0),
  );
  const hasHostToken =
    typeof window !== 'undefined' &&
    Boolean(localStorage.getItem(`host_token_${code}`));
  const isCreator = Boolean(
    (user &&
      session?.createdBy &&
      session.createdBy === user.id &&
      currentParticipant?.userId === user.id &&
      !currentParticipant.isAnonymous) ||
    hasHostToken,
  );

  const [autoJoining, setAutoJoining] = useState(false);

  useEffect(() => {
    if (!loading && !error && session && !participantId && !autoJoining) {
      const isLoggedInHost =
        user && session.createdBy && session.createdBy === user.id;
      const isGuestHost = Boolean(localStorage.getItem(`host_token_${code}`));

      if (isLoggedInHost || isGuestHost) {
        // Auto-rejoin as host instead of redirecting to join page
        setAutoJoining(true);
        const displayName = user?.name ?? 'Host';
        api.sessions
          .join(code, {
            displayName,
            userId: user?.id ?? null,
          })
          .then((res) => {
            if (res.participantId) {
              localStorage.setItem(`participant_${code}`, res.participantId);
              setParticipantId(res.participantId);
            } else {
              router.replace(`/join/${code}`);
            }
          })
          .catch(() => {
            // If auto-join fails, fall back to join page
            router.replace(`/join/${code}`);
          })
          .finally(() => setAutoJoining(false));
      } else {
        router.replace(`/join/${code}`);
      }
    }
  }, [loading, error, session, participantId, router, code, user, autoJoining]);

  const handleClaimToggle = useCallback(
    (itemId: string) => {
      if (!participantId || !session) return;

      // Clear existing debounce timer for this item
      const existing = debounceTimers.current.get(itemId);
      if (existing) clearTimeout(existing);

      // Debounce: wait 400ms before firing the API call
      const timer = setTimeout(async () => {
        debounceTimers.current.delete(itemId);
        setClaimingItems((prev) => new Set(prev).add(itemId));
        try {
          await api.sessions.claimItem(code, itemId, {
            participantId,
            portion: 1,
          });
        } catch (err) {
          handleError(err, 'Failed to update claim');
        } finally {
          setClaimingItems((prev) => {
            const next = new Set(prev);
            next.delete(itemId);
            return next;
          });
        }
      }, 400);

      debounceTimers.current.set(itemId, timer);
    },
    [code, participantId, session, handleError],
  );

  const handleSettle = useCallback(async () => {
    setSettleLoading(true);
    try {
      await api.sessions.settle(code);
      addToast({ title: 'Session settled!', color: 'success' });
    } catch (err) {
      handleError(err, 'Failed to settle');
    } finally {
      setSettleLoading(false);
    }
  }, [code, handleError]);

  const handleUnsettle = useCallback(async () => {
    setUnsettleLoading(true);
    try {
      await api.sessions.unsettle(code);
      addToast({ title: 'Settlement undone', color: 'success' });
    } catch (err) {
      handleError(err, 'Failed to undo settlement');
    } finally {
      setUnsettleLoading(false);
    }
  }, [code, handleError]);

  const handleKick = useCallback(
    async (targetParticipantId: string) => {
      try {
        await api.sessions.kick(code, targetParticipantId);
        addToast({ title: 'Participant removed', color: 'success' });
      } catch (err) {
        handleError(err, 'Failed to remove participant');
      }
    },
    [code, handleError],
  );

  const handleApprove = useCallback(
    async (pendingParticipantId: string) => {
      try {
        await api.sessions.approveParticipant(code, pendingParticipantId);
        addToast({ title: 'Participant approved', color: 'success' });
      } catch (err) {
        handleError(err, 'Failed to approve participant');
      }
    },
    [code, handleError],
  );

  const handleReject = useCallback(
    async (pendingParticipantId: string) => {
      try {
        await api.sessions.rejectParticipant(code, pendingParticipantId);
        addToast({ title: 'Participant rejected', color: 'success' });
      } catch (err) {
        handleError(err, 'Failed to reject participant');
      }
    },
    [code, handleError],
  );

  const handleDelete = useCallback(async () => {
    setDeleteLoading(true);
    try {
      await api.sessions.delete(code);
      addToast({ title: 'Session deleted', color: 'success' });
      router.push('/');
    } catch (err) {
      handleError(err, 'Failed to delete session');
    } finally {
      setDeleteLoading(false);
    }
  }, [code, router, handleError]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-danger text-xl">{error || 'Session not found'}</p>
        <Button onPress={() => router.push('/')}>Go Home</Button>
      </div>
    );
  }

  // If user hasn't joined yet, redirect to join page
  if (!participantId) {
    return null;
  }

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Session {code}</h1>
            <Chip
              size="sm"
              color={
                session.status === 'active'
                  ? 'success'
                  : session.status === 'settled'
                    ? 'default'
                    : 'warning'
              }
              variant="flat"
            >
              {session.status}
            </Chip>
            <Chip
              size="sm"
              variant="dot"
              color={connected ? 'success' : 'danger'}
            >
              {connected ? 'Live' : 'Reconnecting...'}
            </Chip>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="flat" size="sm" onPress={() => setShowShare(true)}>
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
        </div>
      </div>

      {/* Creator CTA actions */}
      {isCreator && session.status === 'active' && (
        <div className="mb-4 flex flex-wrap gap-3">
          <Button
            color="success"
            variant="solid"
            size="md"
            className="w-full sm:w-auto"
            onPress={onSettleOpen}
            isDisabled={hasUnclaimedItems}
          >
            ✓ Settle
          </Button>
          <Button
            as="a"
            href={`/session/${code}/edit`}
            color="primary"
            variant="flat"
            size="md"
            className="w-full sm:w-auto"
          >
            ✏️ Edit Items
          </Button>
          <Button
            color="danger"
            variant="light"
            size="md"
            className="w-full sm:w-auto"
            onPress={onDeleteOpen}
          >
            🗑️ Delete
          </Button>
        </div>
      )}
      {isCreator && session.status === 'settled' && (
        <div className="mb-4 flex flex-wrap gap-3">
          <Button
            color="warning"
            variant="flat"
            size="md"
            className="w-full sm:w-auto"
            onPress={handleUnsettle}
            isLoading={unsettleLoading}
          >
            ↩ Undo Settlement
          </Button>
          <Button
            color="danger"
            variant="light"
            size="md"
            className="w-full sm:w-auto"
            onPress={onDeleteOpen}
          >
            🗑️ Delete
          </Button>
        </div>
      )}
      {session.status === 'active' && hasUnclaimedItems && isCreator && (
        <p className="text-warning mb-4 text-sm">
          Claim all items before finalizing settlement.
        </p>
      )}

      {/* Main content: items + sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">
            Items ({session.items.length})
          </h2>
          <SessionItemList
            session={session}
            participantId={participantId}
            onClaimToggle={handleClaimToggle}
            claimingItems={claimingItems}
          />
        </div>

        <div className="order-first lg:order-last">
          <ParticipantSidebar
            session={session}
            currentParticipantId={participantId}
            isCreator={isCreator}
            onKick={handleKick}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </div>
      </div>

      {/* Share modal */}
      <ShareLinkModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        sessionCode={code}
      />

      <Modal isOpen={isSettleOpen} onOpenChange={onSettleOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Settle Session</ModalHeader>
              <ModalBody>
                <p>Finalize this session now?</p>
                <p className="text-default-500 text-sm">
                  Participants will no longer be able to claim or unclaim items
                  until you undo settlement.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="success"
                  onPress={async () => {
                    await handleSettle();
                    onClose();
                  }}
                  isLoading={settleLoading}
                >
                  Confirm Settle
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Delete Session</ModalHeader>
              <ModalBody>
                <p>Are you sure you want to delete this session?</p>
                <p className="text-default-500 text-sm">
                  This will permanently remove the session and disconnect all
                  participants. This action cannot be undone.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={async () => {
                    await handleDelete();
                    onClose();
                  }}
                  isLoading={deleteLoading}
                >
                  Delete Session
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
