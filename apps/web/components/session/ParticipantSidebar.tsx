"use client";

import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Chip,
  User as UserAvatar,
} from "@heroui/react";
import type { Session } from "@split-snap/shared";
import { calculateSummaries } from "@split-snap/shared";

interface ParticipantSidebarProps {
  session: Session;
  currentParticipantId: string | null;
}

export function ParticipantSidebar({
  session,
  currentParticipantId,
}: ParticipantSidebarProps) {
  const summaries = calculateSummaries(session);

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

            return (
              <div
                key={participant.id}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  isCurrentUser ? "bg-primary/10" : ""
                }`}
              >
                <UserAvatar
                  name={participant.displayName}
                  description={
                    isCurrentUser
                      ? "You"
                      : participant.isAnonymous
                        ? "Guest"
                        : "Member"
                  }
                  avatarProps={{
                    name: participant.displayName[0],
                    size: "sm",
                    color: isCurrentUser ? "primary" : "default",
                  }}
                />
                <div className="text-right">
                  <p className="font-semibold text-sm">
                    ${(summary?.total ?? 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-default-400">
                    {summary?.items.length ?? 0} items
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Session totals */}
        <Divider />
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-default-500">Subtotal</span>
            <span>${session.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-default-500">Tax</span>
            <span>${session.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-default-500">Tip</span>
            <span>${session.tip.toFixed(2)}</span>
          </div>
          <Divider />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>${session.total.toFixed(2)}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
