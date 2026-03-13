'use client';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
  User as UserAvatar,
} from '@heroui/react';
import { formatCurrency } from '@split-snap/shared/currency';
import { calculateSummaries } from '@split-snap/shared/tax';
import type { Session } from '@split-snap/shared/types';
import { useState } from 'react';

interface ParticipantSidebarProps {
  session: Session;
  currentParticipantId: string | null;
  isCreator?: boolean;
  onKick?: (participantId: string) => Promise<void>;
  onApprove?: (participantId: string) => Promise<void>;
  onReject?: (participantId: string) => Promise<void>;
}

export function ParticipantSidebar({
  session,
  currentParticipantId,
  isCreator = false,
  onKick,
  onApprove,
  onReject,
}: ParticipantSidebarProps) {
  const summaries = calculateSummaries(session);
  const [kickingId, setKickingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const handleKick = async (participantId: string) => {
    if (!onKick) return;
    setKickingId(participantId);
    setConfirmId(null);
    try {
      await onKick(participantId);
    } finally {
      setKickingId(null);
    }
  };

  const handleApprove = async (participantId: string) => {
    if (!onApprove) return;
    setApprovingId(participantId);
    try {
      await onApprove(participantId);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (participantId: string) => {
    if (!onReject) return;
    setRejectingId(participantId);
    try {
      await onReject(participantId);
    } finally {
      setRejectingId(null);
    }
  };

  const canKick = isCreator && session.status === 'active' && !!onKick;

  // Determine if a participant is the initiator (creator)
  const isInitiator = (participant: (typeof session.participants)[0]) =>
    participant.userId != null &&
    session.createdBy != null &&
    participant.userId === session.createdBy;

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-1">
        <div className="flex w-full items-center justify-between">
          <h3 className="title-subsection">Participants</h3>
          <Chip size="sm" variant="flat">
            {session.participants.length}
          </Chip>
        </div>
      </CardHeader>

      <Divider />

      <CardBody className="gap-3">
        {/* Pending participants (only visible to host) */}
        {isCreator &&
          session.pendingParticipants &&
          session.pendingParticipants.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-warning text-sm font-semibold">
                  Pending Requests
                </p>
                <Chip size="sm" variant="flat" color="warning">
                  {session.pendingParticipants.length}
                </Chip>
              </div>
              {session.pendingParticipants.map((pending) => (
                <div
                  key={pending.id}
                  className="bg-warning/10 flex items-center justify-between rounded-lg p-2"
                >
                  <UserAvatar
                    name={pending.displayName}
                    description={pending.isAnonymous ? 'Guest' : 'Member'}
                    avatarProps={{
                      name: pending.displayName[0],
                      size: 'sm',
                      color: 'warning',
                    }}
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      color="success"
                      variant="flat"
                      onPress={() => handleApprove(pending.id)}
                      isLoading={approvingId === pending.id}
                      isDisabled={rejectingId === pending.id}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      onPress={() => handleReject(pending.id)}
                      isLoading={rejectingId === pending.id}
                      isDisabled={approvingId === pending.id}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
              <Divider />
            </>
          )}

        {session.participants.length === 0 ? (
          <p className="text-description py-4 text-center">
            No one has joined yet. Share the link!
          </p>
        ) : (
          session.participants.map((participant) => {
            const summary = summaries.find(
              (s) => s.participantId === participant.id,
            );
            const isCurrentUser = participant.id === currentParticipantId;
            const isParticipantInitiator = isInitiator(participant);
            const canKickThis =
              canKick && !isCurrentUser && !isParticipantInitiator;
            const isKicking = kickingId === participant.id;

            return (
              <Popover
                key={participant.id}
                isOpen={confirmId === participant.id}
                onOpenChange={(open) =>
                  setConfirmId(open ? participant.id : null)
                }
                placement="bottom"
              >
                <PopoverTrigger>
                  <div
                    className={`flex items-center justify-between rounded-lg p-2 transition-colors ${
                      isCurrentUser
                        ? 'bg-primary/10'
                        : canKickThis
                          ? 'hover:bg-danger/10 cursor-pointer'
                          : ''
                    }`}
                    onClick={() => {
                      if (canKickThis && !isKicking) {
                        setConfirmId(participant.id);
                      }
                    }}
                    role={canKickThis ? 'button' : undefined}
                    tabIndex={canKickThis ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (
                        canKickThis &&
                        !isKicking &&
                        (e.key === 'Enter' || e.key === ' ')
                      ) {
                        e.preventDefault();
                        setConfirmId(participant.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        name={participant.displayName}
                        description={
                          isParticipantInitiator
                            ? 'Host'
                            : isCurrentUser
                              ? 'You'
                              : participant.isAnonymous
                                ? 'Guest'
                                : 'Member'
                        }
                        avatarProps={{
                          name: participant.displayName[0],
                          size: 'sm',
                          color: isParticipantInitiator
                            ? 'warning'
                            : isCurrentUser
                              ? 'primary'
                              : 'default',
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatCurrency({
                            value: summary?.total ?? 0,
                            currency: session.currency,
                            decimal: 2,
                          })}
                        </p>
                        <p className="text-description">
                          {summary?.items.length ?? 0} items
                        </p>
                      </div>
                      {isKicking && <Spinner size="sm" color="danger" />}
                    </div>
                  </div>
                </PopoverTrigger>
                {canKickThis && (
                  <PopoverContent>
                    <div className="space-y-2 p-3">
                      <p className="text-sm font-medium">
                        Remove {participant.displayName}?
                      </p>
                      <p className="text-description">
                        All their claims will be removed.
                      </p>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => setConfirmId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          onPress={() => handleKick(participant.id)}
                          isLoading={isKicking}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                )}
              </Popover>
            );
          })
        )}

        {/* Session totals */}
        <Divider />
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-description-lg">Subtotal</span>
            <span>
              {formatCurrency({
                value: session.subtotal,
                currency: session.currency,
                decimal: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-description-lg">Tax</span>
            <span>
              {formatCurrency({
                value: session.tax,
                currency: session.currency,
                decimal: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-description-lg">Service Charge/Tip</span>
            <span>
              {formatCurrency({
                value: session.tip,
                currency: session.currency,
                decimal: 2,
              })}
            </span>
          </div>
          <Divider />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>
              {formatCurrency({
                value: session.total,
                currency: session.currency,
                decimal: 2,
              })}
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
