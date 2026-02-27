"use client";

import {
  Card,
  CardBody,
  Chip,
  Checkbox,
} from "@heroui/react";
import type { Session, SessionItem } from "@split-snap/shared";

interface SessionItemListProps {
  session: Session;
  participantId: string | null;
  onClaimToggle: (itemId: string) => void;
}

export function SessionItemList({
  session,
  participantId,
  onClaimToggle,
}: SessionItemListProps) {
  const isSettled = session.status === "settled";

  return (
    <div className="space-y-2">
      {session.items.map((item) => {
        const isClaimed = participantId
          ? item.claimedBy.some((c) => c.participantId === participantId)
          : false;
        const totalClaimers = item.claimedBy.length;
        const itemTotal = item.price * item.quantity;

        return (
          <Card
            key={item.id}
            isPressable={!isSettled && !!participantId}
            onPress={() => !isSettled && participantId && onClaimToggle(item.id)}
            className={`transition-all ${
              isClaimed
                ? "border-primary border-2 bg-primary/5"
                : "border-transparent border-2"
            }`}
          >
            <CardBody className="flex flex-row items-center gap-3 p-3">
              {participantId && (
                <Checkbox
                  isSelected={isClaimed}
                  isDisabled={isSettled}
                  onChange={() => onClaimToggle(item.id)}
                  size="lg"
                  color="primary"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                {item.quantity > 1 && (
                  <p className="text-xs text-default-400">
                    ${item.price.toFixed(2)} × {item.quantity}
                  </p>
                )}
                {totalClaimers > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.claimedBy.map((claim) => (
                      <Chip
                        key={claim.participantId}
                        size="sm"
                        variant="flat"
                        color={
                          claim.participantId === participantId
                            ? "primary"
                            : "default"
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
              <div className="text-right shrink-0">
                <p className="font-semibold">${itemTotal.toFixed(2)}</p>
                {totalClaimers === 0 && (
                  <p className="text-xs text-warning">unclaimed</p>
                )}
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
