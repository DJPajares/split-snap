'use client';

import { Card, Checkbox, Chip, Label } from '@heroui/react';
import { formatCurrency } from '@split-snap/shared/currency';
import type { Session } from '@split-snap/shared/types';

import { TypographyCaption } from '../shared/Typography';

interface SessionItemListProps {
  session: Session;
  participantId: string | null;
  onClaimToggle: (itemId: string) => void;
  onClaimAllToggle: (claimAll: boolean) => void;
  claimingItems?: Set<string>;
}

export function SessionItemList({
  session,
  participantId,
  onClaimToggle,
  onClaimAllToggle,
  claimingItems = new Set(),
}: SessionItemListProps) {
  const isSettled = session.status === 'settled';

  const isClaimedByParticipant = (item: Session['items'][number]) =>
    participantId
      ? item.claimedBy.some((claim) => claim.participantId === participantId)
      : false;

  const allClaimed =
    !!participantId &&
    session.items.length > 0 &&
    session.items.every((item) => isClaimedByParticipant(item));

  const someClaimed =
    !!participantId &&
    session.items.some((item) => isClaimedByParticipant(item));

  const allItemsLoading =
    session.items.length > 0 &&
    session.items.every((item) => claimingItems.has(item.id));

  const handleClaimToggle = (itemId: string) => {
    if (isSettled || !participantId) return;
    onClaimToggle(itemId);
  };

  const handleToggleAll = () => {
    if (isSettled || !participantId) return;
    onClaimAllToggle(!allClaimed);
  };

  return (
    <div className="space-y-2">
      {participantId && session.items.length > 0 && (
        <div className="px-1">
          <Checkbox
            id="claim-all-items"
            aria-label="claim-all-items"
            isSelected={allClaimed}
            isIndeterminate={!allClaimed && someClaimed}
            isDisabled={isSettled || allItemsLoading}
            onChange={handleToggleAll}
          >
            <Checkbox.Control className="rounded-xl">
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Content>
              <Label htmlFor="claim-all-items">
                {allClaimed ? 'Unclaim all' : 'Claim all'}
              </Label>
            </Checkbox.Content>
          </Checkbox>
        </div>
      )}

      {session.items.map((item) => {
        const isClaimed = isClaimedByParticipant(item);
        const totalClaimers = item.claimedBy.length;
        const itemTotal = item.price * item.quantity;
        const isLoading = claimingItems.has(item.id);

        return (
          <Card
            key={item.id}
            className={`w-full transition-all ${
              isLoading
                ? 'opacity-70'
                : isClaimed
                  ? 'border-accent bg-accent/5 border-2'
                  : 'border-2 border-transparent'
            }`}
          >
            <button
              type="button"
              className="cursor-pointer"
              onClick={() => handleClaimToggle(item.id)}
              disabled={isSettled || !participantId || isLoading}
            >
              <Card.Content className="flex flex-row items-center justify-between gap-3 p-3">
                <div className="flex flex-row gap-4">
                  {participantId && (
                    <Checkbox
                      variant="secondary"
                      aria-label={`claim-item-${item.id}`}
                      isSelected={isClaimed}
                      isDisabled={isSettled || isLoading}
                      onChange={() => handleClaimToggle(item.id)}
                    >
                      <Checkbox.Control className="size-6 rounded-2xl">
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox>
                  )}
                  <div className="flex flex-col items-start gap-1">
                    <p className="truncate font-medium">{item.name}</p>
                    {item.quantity > 1 && (
                      <TypographyCaption>
                        {formatCurrency({
                          value: item.price,
                          currency: session.currency,
                          decimal: 2,
                        })}{' '}
                        × {item.quantity}
                      </TypographyCaption>
                    )}
                    {totalClaimers > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.claimedBy.map((claim) => (
                          <Chip
                            key={claim.participantId}
                            size="sm"
                            variant="soft"
                            color={
                              claim.participantId === participantId
                                ? 'accent'
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
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold">
                    {formatCurrency({
                      value: itemTotal,
                      currency: session.currency,
                      decimal: 2,
                    })}
                  </p>
                  {totalClaimers === 0 && (
                    <p className="text-warning text-xs">unclaimed</p>
                  )}
                </div>
              </Card.Content>
            </button>
          </Card>
        );
      })}
    </div>
  );
}
