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
import { STORAGE_KEYS } from '@split-snap/shared/constants';
import type { Session } from '@split-snap/shared/types';
import {
  IconArrowBack,
  IconChartColumn,
  IconCheck,
  IconEdit,
  IconShare3,
  IconTrash,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useRef, useState } from 'react';

import { ReceiptImage } from '@/components/receipt/ReceiptImage';
import { ParticipantSidebar } from '@/components/session/ParticipantSidebar';
import { SessionItemList } from '@/components/session/SessionItemList';
import { ShareLinkModal } from '@/components/session/ShareLinkModal';
import { useApiError } from '@/hooks/useApiError';
import { useAuth } from '@/hooks/useAuth';
import { useSessionSSE } from '@/hooks/useSessionSSE';
import { api } from '@/lib/api';

type SessionPageProps = {
  params: Promise<{
    code: string;
  }>;
};

export default function SessionPage({ params }: SessionPageProps) {
  const { code } = use(params);
  const normalizedCode = code.toUpperCase();
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
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | null>(null);

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

  // Load receipt image from sessionStorage if available
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEYS.KEY_RECEIPT_IMAGE);
      if (stored) {
        setReceiptImageUrl(stored);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Load initial session data and validate participant
  useEffect(() => {
    api.sessions
      .get(normalizedCode)
      .then((s) => {
        setInitialSession(s);
        const stored = localStorage.getItem(
          `${STORAGE_KEYS.KEY_PARTICIPANT_PREFIX}${normalizedCode}`,
        );
        if (stored) {
          // Validate the stored participant still exists in the session
          const participant = s.participants.find((p) => p.id === stored);
          if (participant) {
            // If user is logged in, only allow a participant explicitly linked to them.
            if (user) {
              if (!participant.userId) {
                localStorage.setItem(
                  `${STORAGE_KEYS.KEY_GUEST_PARTICIPANT_PREFIX}${normalizedCode}`,
                  stored,
                );
                localStorage.removeItem(
                  `${STORAGE_KEYS.KEY_PARTICIPANT_PREFIX}${normalizedCode}`,
                );
              } else if (participant.userId !== user.id) {
                localStorage.removeItem(
                  `${STORAGE_KEYS.KEY_PARTICIPANT_PREFIX}${normalizedCode}`,
                );
              } else {
                setParticipantId(stored);
              }
            } else {
              setParticipantId(stored);
            }
          } else {
            // Participant was kicked — clear stale data
            localStorage.removeItem(
              `${STORAGE_KEYS.KEY_PARTICIPANT_PREFIX}${normalizedCode}`,
            );
          }
        }
      })
      .catch((err) => {
        handleError(err, 'Session error');
        setError(err instanceof Error ? err.message : 'Session not found');
      })
      .finally(() => setLoading(false));
  }, [normalizedCode, handleError, user]);

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
          localStorage.removeItem(
            `${STORAGE_KEYS.KEY_PARTICIPANT_PREFIX}${code}`,
          );
          localStorage.removeItem(
            `${STORAGE_KEYS.KEY_PARTICIPANT_PREFIX}${normalizedCode}`,
          );
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
      localStorage.removeItem(`${STORAGE_KEYS.KEY_PARTICIPANT_PREFIX}${code}`);
      localStorage.removeItem(
        `${STORAGE_KEYS.KEY_PARTICIPANT_PREFIX}${normalizedCode}`,
      );
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
    Boolean(
      localStorage.getItem(
        `${STORAGE_KEYS.KEY_HOST_TOKEN_PREFIX}${normalizedCode}`,
      ),
    );
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
      const isGuestHost = Boolean(
        localStorage.getItem(
          `${STORAGE_KEYS.KEY_HOST_TOKEN_PREFIX}${normalizedCode}`,
        ),
      );

      if (isLoggedInHost || isGuestHost) {
        // Auto-rejoin as host instead of redirecting to join page
        setAutoJoining(true);
        const displayName = user?.name ?? 'Host';
        api.sessions
          .join(normalizedCode, {
            displayName,
            userId: user?.id ?? null,
          })
          .then((res) => {
            if (res.participantId) {
              localStorage.setItem(
                `${STORAGE_KEYS.KEY_PARTICIPANT_PREFIX}${normalizedCode}`,
                res.participantId,
              );
              setParticipantId(res.participantId);
            } else {
              router.replace(`/join/${normalizedCode}`);
            }
          })
          .catch(() => {
            // If auto-join fails, fall back to join page
            router.replace(`/join/${normalizedCode}`);
          })
          .finally(() => setAutoJoining(false));
      } else {
        router.replace(`/join/${normalizedCode}`);
      }
    }
  }, [
    loading,
    error,
    session,
    participantId,
    router,
    normalizedCode,
    user,
    autoJoining,
  ]);

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
          await api.sessions.claimItem(normalizedCode, itemId, {
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
    [normalizedCode, participantId, session, handleError],
  );

  const handleClaimAllToggle = useCallback(
    async (claimAll: boolean) => {
      if (!participantId || !session) return;

      // Clear pending single-item timers to avoid conflicting writes.
      for (const timer of debounceTimers.current.values()) {
        clearTimeout(timer);
      }
      debounceTimers.current.clear();

      const allItemIds = session.items.map((item) => item.id);
      setClaimingItems(new Set(allItemIds));

      try {
        await api.sessions.claimAllItems(normalizedCode, {
          participantId,
          claimAll,
          portion: 1,
        });
      } catch (err) {
        handleError(err, 'Failed to update claims');
      } finally {
        setClaimingItems(new Set());
      }
    },
    [normalizedCode, participantId, session, handleError],
  );

  const handleSettle = useCallback(async () => {
    setSettleLoading(true);
    try {
      await api.sessions.settle(normalizedCode);
      addToast({ title: 'Session settled!', color: 'success' });
    } catch (err) {
      handleError(err, 'Failed to settle');
    } finally {
      setSettleLoading(false);
    }
  }, [normalizedCode, handleError]);

  const handleUnsettle = useCallback(async () => {
    setUnsettleLoading(true);
    try {
      await api.sessions.unsettle(normalizedCode);
      addToast({ title: 'Settlement undone', color: 'success' });
    } catch (err) {
      handleError(err, 'Failed to undo settlement');
    } finally {
      setUnsettleLoading(false);
    }
  }, [normalizedCode, handleError]);

  const handleKick = useCallback(
    async (targetParticipantId: string) => {
      try {
        await api.sessions.kick(normalizedCode, targetParticipantId);
        addToast({ title: 'Participant removed', color: 'success' });
      } catch (err) {
        handleError(err, 'Failed to remove participant');
      }
    },
    [normalizedCode, handleError],
  );

  const handleApprove = useCallback(
    async (pendingParticipantId: string) => {
      try {
        await api.sessions.approveParticipant(
          normalizedCode,
          pendingParticipantId,
        );
        addToast({ title: 'Participant approved', color: 'success' });
      } catch (err) {
        handleError(err, 'Failed to approve participant');
      }
    },
    [normalizedCode, handleError],
  );

  const handleReject = useCallback(
    async (pendingParticipantId: string) => {
      try {
        await api.sessions.rejectParticipant(
          normalizedCode,
          pendingParticipantId,
        );
        addToast({ title: 'Participant rejected', color: 'success' });
      } catch (err) {
        handleError(err, 'Failed to reject participant');
      }
    },
    [normalizedCode, handleError],
  );

  const handleDelete = useCallback(async () => {
    setDeleteLoading(true);
    try {
      await api.sessions.delete(normalizedCode);
      addToast({ title: 'Session deleted', color: 'success' });
      router.push('/');
    } catch (err) {
      handleError(err, 'Failed to delete session');
    } finally {
      setDeleteLoading(false);
    }
  }, [normalizedCode, router, handleError]);

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
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="title-section">Session {code}</h1>
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
          <Button
            variant="flat"
            size="sm"
            startContent={<IconShare3 />}
            onPress={() => setShowShare(true)}
          >
            Share
          </Button>
          <Button
            as="a"
            href={`/session/${code}/summary`}
            variant="flat"
            size="sm"
            startContent={<IconChartColumn />}
          >
            Summary
          </Button>
        </div>
      </div>

      {/* Creator CTA actions */}
      {isCreator && (
        <div className="flex flex-wrap gap-3">
          {session.status === 'active' && (
            <>
              <Button
                color="success"
                variant="solid"
                size="md"
                className="w-full sm:w-auto"
                startContent={<IconCheck size={16} />}
                onPress={onSettleOpen}
                isDisabled={hasUnclaimedItems}
              >
                Settle
              </Button>
              <Button
                as="a"
                href={`/session/${code}/edit`}
                variant="faded"
                size="md"
                className="w-full sm:w-auto"
                startContent={<IconEdit size={16} />}
              >
                Edit Items
              </Button>
            </>
          )}
          {session.status === 'settled' && (
            <Button
              color="warning"
              variant="flat"
              size="md"
              className="w-full sm:w-auto"
              startContent={<IconArrowBack size={16} />}
              onPress={handleUnsettle}
              isLoading={unsettleLoading}
            >
              Undo Settlement
            </Button>
          )}
          <Button
            color="danger"
            variant="light"
            size="md"
            className="w-full sm:w-auto"
            startContent={<IconTrash size={16} />}
            onPress={onDeleteOpen}
          >
            Delete
          </Button>
        </div>
      )}

      {session.status === 'active' && hasUnclaimedItems && isCreator && (
        <p className="text-warning text-sm">
          Claim all items before finalizing settlement.
        </p>
      )}

      {/* Receipt reference image */}
      {receiptImageUrl && <ReceiptImage receiptImageUrl={receiptImageUrl} />}

      {/* Main content: items + sidebar */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-5">
        <div className="flex flex-col gap-2 sm:col-span-3">
          <h2 className="text-lg font-semibold">
            Items ({session.items.length})
          </h2>
          <SessionItemList
            session={session}
            participantId={participantId}
            onClaimToggle={handleClaimToggle}
            onClaimAllToggle={handleClaimAllToggle}
            claimingItems={claimingItems}
          />
        </div>

        <div className="order-first flex flex-col gap-2 sm:order-last sm:col-span-2">
          <h2 className="text-lg font-semibold">{`Participants (${session.participants.length})`}</h2>
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
                <p className="text-description">
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
                <p className="text-description">
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
