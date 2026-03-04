'use client';

import { Button, Card, CardBody, Chip, Spinner } from '@heroui/react';
import { formatCurrency } from '@split-snap/shared/currency';
import { calculateSummaries } from '@split-snap/shared/tax';
import type { Session } from '@split-snap/shared/types';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

import PersonSummaryCard from '@/components/shared/PersonSummaryCard';
import { useApiError } from '@/hooks/useApiError';
import { api } from '@/lib/api';

export default function SummaryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { handleError } = useApiError({ redirectTo: '/' });

  useEffect(() => {
    api.sessions
      .get(code)
      .then(setSession)
      .catch((err) => handleError(err, 'Session error'))
      .finally(() => setLoading(false));
  }, [code, handleError]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) return null;

  const summaries = calculateSummaries(session);
  const unclaimedItems = session.items.filter(
    (item) => item.claimedBy.length === 0,
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex justify-between gap-3">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Bill Summary</h1>
          <p className="text-default-500 text-base font-semibold">
            Session {code}
          </p>
        </div>
        <Button
          variant="flat"
          size="sm"
          onPress={() => router.push(`/session/${code}`)}
        >
          ← Back to Session
        </Button>
      </div>

      {unclaimedItems.length > 0 && (
        <Card className="border-warning border-2">
          <CardBody className="flex flex-col gap-2 p-4">
            <p className="text-warning font-semibold">
              ⚠️ {unclaimedItems.length} unclaimed item(s)
            </p>
            <div className="flex flex-wrap gap-2">
              {unclaimedItems.map((item) => (
                <Chip key={item.id} size="sm" variant="flat" color="warning">
                  {item.name} (
                  {formatCurrency({
                    value: item.price * item.quantity,
                    currency: session.currency,
                    decimal: 2,
                  })}
                  )
                </Chip>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="space-y-4">
        {summaries.map((summary) => (
          <PersonSummaryCard
            key={summary.participantId}
            summary={summary}
            currency={session.currency}
          />
        ))}
      </div>

      {/* Grand total */}
      <Card>
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">Grand Total</span>
            <span className="text-2xl font-bold">
              {formatCurrency({
                value: session.total,
                currency: session.currency,
                decimal: 2,
              })}
            </span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
