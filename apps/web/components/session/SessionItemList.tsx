'use client';

import { Card, CardBody, Chip, Checkbox } from '@heroui/react';
import type { Session } from '@split-snap/shared/types';
import { getCurrencySymbol } from '@split-snap/shared/currency';

interface SessionItemListProps {
  session: Session;
  participantId: string | null;
  onClaimToggle: (itemId: string) => void;
  claimingItems?: Set<string>;
}

export function SessionItemList({
  session,
  participantId,
  onClaimToggle,
  claimingItems = new Set(),
}: SessionItemListProps) {
  const isSettled = session.status === 'settled';
  const cs = getCurrencySymbol(session.currency);

  const handleClaimToggle = (itemId: string) => {
    if (isSettled || !participantId) return;
    onClaimToggle(itemId);
  };

  return (
    <div className="space-y-2">
      {session.items.map((item) => {
        const isClaimed = participantId
          ? item.claimedBy.some((c) => c.participantId === participantId)
          : false;
        const totalClaimers = item.claimedBy.length;
        const itemTotal = item.price * item.quantity;
        const isLoading = claimingItems.has(item.id);

        return (
          <Card
            key={item.id}
            isPressable={!isSettled && !!participantId && !isLoading}
            onPress={() => handleClaimToggle(item.id)}
            className={`w-full transition-all ${
              isLoading
                ? 'opacity-70'
                : isClaimed
                  ? 'border-primary bg-primary/5 border-2'
                  : 'border-2 border-transparent'
            }`}
          >
            <CardBody className="flex flex-row items-center gap-3 p-3">
              {participantId && (
                <Checkbox
                  isSelected={isClaimed}
                  isDisabled={isSettled}
                  onChange={() => handleClaimToggle(item.id)}
                  size="lg"
                  color="primary"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.name}</p>
                {item.quantity > 1 && (
                  <p className="text-default-400 text-xs">
                    {cs}
                    {item.price.toFixed(2)} × {item.quantity}
                  </p>
                )}
                {totalClaimers > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.claimedBy.map((claim) => (
                      <Chip
                        key={claim.participantId}
                        size="sm"
                        variant="flat"
                        color={
                          claim.participantId === participantId
                            ? 'primary'
                            : 'default'
                        }
                      >
                        {claim.displayName}
                        {totalClaimers > 1 && (
                          <span className="ml-1 opacity-60">
                            (1/{totalClaimers})
                          </span>
                        )}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold">
                  {cs}
                  {itemTotal.toFixed(2)}
                </p>
                {totalClaimers === 0 && (
                  <p className="text-warning text-xs">unclaimed</p>
                )}
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
