'use client';

import {
  Avatar,
  Button,
  Card,
  Chip,
  Popover,
  Separator,
  Spinner,
} from '@heroui/react';
import { formatCurrency } from '@split-snap/shared/currency';
import { calculateSummaries } from '@split-snap/shared/tax';
import type { Session } from '@split-snap/shared/types';
import { useState } from 'react';

import { TypographyLabel, TypographyMuted } from '../shared/Typography';

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
      <Card.Content className="gap-3">
        {/* Pending participants (only visible to host) */}
        {isCreator &&
          session.pendingParticipants &&
          session.pendingParticipants.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-warning text-sm font-semibold">
                  Pending Requests
                </p>
                <Chip size="sm" variant="soft" color="warning">
                  {session.pendingParticipants.length}
                </Chip>
              </div>
              {session.pendingParticipants.map((pending) => (
                <div
                  key={pending.id}
                  className="bg-warning/10 flex items-center justify-between rounded-lg p-2"
                >
                  <div className="inline-flex items-center gap-2">
                    <Avatar color="warning" size="sm">
                      <Avatar.Fallback>
                        {pending.displayName[0]}
                      </Avatar.Fallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <TypographyLabel>{pending.displayName}</TypographyLabel>
                      <TypographyMuted>
                        {pending.isAnonymous ? 'Guest' : 'Member'}
                      </TypographyMuted>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="tertiary"
                      onPress={() => handleApprove(pending.id)}
                      isPending={approvingId === pending.id}
                      isDisabled={rejectingId === pending.id}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onPress={() => handleReject(pending.id)}
                      isPending={rejectingId === pending.id}
                      isDisabled={approvingId === pending.id}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
              <Separator />
            </>
          )}

        {session.participants.length === 0 ? (
          <TypographyMuted className="py-4 text-center">
            No one has joined yet. Share the link!
          </TypographyMuted>
        ) : (
          session.participants.map((participant) => {
            const summary = summaries.find(
              (s) => s.participantId === participant.id,
            );
            const isCurrentUser = participant.id === currentParticipantId;
            const isParticipantInitiator = isInitiator(participant);
            const isKickable =
              canKick && !isCurrentUser && !isParticipantInitiator;
            const isKicking = kickingId === participant.id;

            return (
              <Popover
                key={participant.id}
                isOpen={confirmId === participant.id}
                onOpenChange={(open) =>
                  setConfirmId(open ? participant.id : null)
                }
                // triggerScaleOnOpen={isKickable ? true : false}
              >
                {/* Trigger */}
                <div
                  className={`flex items-center justify-between rounded-lg p-2 transition-colors ${
                    isCurrentUser
                      ? 'bg-accent/10'
                      : isKickable
                        ? 'hover:bg-danger/10 cursor-pointer'
                        : ''
                  }`}
                  onClick={() => {
                    if (isKickable && !isKicking) {
                      setConfirmId(participant.id);
                    }
                  }}
                >
                  {/* User Avatar */}
                  <div className="inline-flex items-center gap-2">
                    <Avatar
                      size="sm"
                      color={
                        isParticipantInitiator
                          ? 'warning'
                          : isCurrentUser
                            ? 'accent'
                            : 'default'
                      }
                    >
                      <Avatar.Fallback>
                        {participant.displayName[0]}
                      </Avatar.Fallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <TypographyLabel className="font-semibold">
                        {participant.displayName}
                      </TypographyLabel>
                      <TypographyMuted className="text-xs">
                        {isParticipantInitiator
                          ? 'Host'
                          : isCurrentUser
                            ? 'You'
                            : participant.isAnonymous
                              ? 'Guest'
                              : 'Member'}
                      </TypographyMuted>
                    </div>
                  </div>
                  {/* Amount */}
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatCurrency({
                          value: summary?.total ?? 0,
                          currency: session.currency,
                          decimal: 2,
                        })}
                      </p>
                      <TypographyMuted>
                        {summary?.items.length ?? 0} items
                      </TypographyMuted>
                    </div>
                    {isKicking && <Spinner size="sm" color="danger" />}
                  </div>
                </div>

                {/* Content */}
                {isKickable && (
                  <Popover.Content placement="bottom">
                    <div className="space-y-2 p-3">
                      <p className="text-sm font-medium">
                        Remove {participant.displayName}?
                      </p>
                      <TypographyMuted>
                        All their claims will be removed.
                      </TypographyMuted>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="tertiary"
                          onPress={() => setConfirmId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onPress={() => handleKick(participant.id)}
                          isPending={isKicking}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </Popover.Content>
                )}
              </Popover>
            );
          })
        )}

        {/* Session totals */}
        <Separator />

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <TypographyMuted>Subtotal</TypographyMuted>
            <span>
              {formatCurrency({
                value: session.subtotal,
                currency: session.currency,
                decimal: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <TypographyMuted>Tax</TypographyMuted>
            <span>
              {formatCurrency({
                value: session.tax,
                currency: session.currency,
                decimal: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <TypographyMuted>Service Charge/Tip</TypographyMuted>
            <span>
              {formatCurrency({
                value: session.tip,
                currency: session.currency,
                decimal: 2,
              })}
            </span>
          </div>
          <Separator />
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
      </Card.Content>
    </Card>
  );
}
