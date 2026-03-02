'use client';

import { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Chip,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  User as UserAvatar,
  Spinner
} from '@heroui/react';
import type { Session } from '@split-snap/shared';
import { calculateSummaries, getCurrencySymbol } from '@split-snap/shared';

interface ParticipantSidebarProps {
  session: Session;
  currentParticipantId: string | null;
  isCreator?: boolean;
  onKick?: (participantId: string) => Promise<void>;
}

export function ParticipantSidebar({
  session,
  currentParticipantId,
  isCreator = false,
  onKick
}: ParticipantSidebarProps) {
  const summaries = calculateSummaries(session);
  const [kickingId, setKickingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const cs = getCurrencySymbol(session.currency);

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

  const canKick = isCreator && session.status === 'active' && !!onKick;

  // Determine if a participant is the initiator (creator)
  const isInitiator = (participant: (typeof session.participants)[0]) =>
    participant.userId != null &&
    session.createdBy != null &&
    participant.userId === session.createdBy;

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-1">
        <div className="flex items-center justify-between w-full">
          <h3 className="font-bold">Participants</h3>
          <Chip size="sm" variant="flat">
            {session.participants.length}
          </Chip>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="gap-3">
        {session.participants.length === 0 ? (
          <p className="text-sm text-default-400 text-center py-4">
            No one has joined yet. Share the link!
          </p>
        ) : (
          session.participants.map((participant) => {
            const summary = summaries.find(
              (s) => s.participantId === participant.id
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
                    className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
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
                              : 'default'
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="font-semibold text-sm">
                          {cs}{(summary?.total ?? 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-default-400">
                          {summary?.items.length ?? 0} items
                        </p>
                      </div>
                      {isKicking && (
                        <Spinner size="sm" color="danger" />
                      )}
                    </div>
                  </div>
                </PopoverTrigger>
                {canKickThis && (
                  <PopoverContent>
                    <div className="p-3 space-y-2">
                      <p className="text-sm font-medium">
                        Remove {participant.displayName}?
                      </p>
                      <p className="text-xs text-default-400">
                        All their claims will be removed.
                      </p>
                      <div className="flex gap-2 justify-end">
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
            <span className="text-default-500">Subtotal</span>
            <span>{cs}{session.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-default-500">Tax</span>
            <span>{cs}{session.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-default-500">Service Charge/Tip</span>
            <span>{cs}{session.tip.toFixed(2)}</span>
          </div>
          <Divider />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{cs}{session.total.toFixed(2)}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
