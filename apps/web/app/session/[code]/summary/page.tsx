'use client';

import { useState, useEffect, use } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Spinner,
  Button,
  Chip
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import type { Session, PersonSummary } from '@split-snap/shared';
import { calculateSummaries, getCurrencySymbol } from '@split-snap/shared';
import { api } from '@/lib/api';

export default function SummaryPage({
  params
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.sessions
      .get(code)
      .then(setSession)
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [code, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) return null;

  const summaries = calculateSummaries(session);
  const cs = getCurrencySymbol(session.currency);
  const unclaimedItems = session.items.filter(
    (item) => item.claimedBy.length === 0
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bill Summary</h1>
          <p className="text-default-500">Session {code}</p>
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
        <Card className="mb-6 border-warning border-2">
          <CardBody className="p-4">
            <p className="text-warning font-semibold mb-2">
              ⚠️ {unclaimedItems.length} unclaimed item(s)
            </p>
            <div className="flex flex-wrap gap-2">
              {unclaimedItems.map((item) => (
                <Chip key={item.id} size="sm" variant="flat" color="warning">
                  {item.name} ({cs}{(item.price * item.quantity).toFixed(2)})
                </Chip>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="space-y-4">
        {summaries.map((summary) => (
          <PersonSummaryCard key={summary.participantId} summary={summary} currencySymbol={cs} />
        ))}
      </div>

      {/* Grand total */}
      <Card className="mt-6">
        <CardBody className="p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">Grand Total</span>
            <span className="text-2xl font-bold">
              {cs}{session.total.toFixed(2)}
            </span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function PersonSummaryCard({ summary, currencySymbol }: { summary: PersonSummary; currencySymbol: string }) {
  const quantityFormatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  const fractionGlyphs = [
    { value: 0.125, glyph: '⅛' },
    { value: 0.25, glyph: '¼' },
    { value: 0.333, glyph: '⅓' },
    { value: 0.375, glyph: '⅜' },
    { value: 0.5, glyph: '½' },
    { value: 0.625, glyph: '⅝' },
    { value: 0.667, glyph: '⅔' },
    { value: 0.75, glyph: '¾' },
    { value: 0.875, glyph: '⅞' }
  ];

  const isWholeNumber = (value: number) => Math.abs(value - Math.round(value)) < 0.001;

  const formatFriendlyQuantity = (value: number) => {
    const rounded = Math.round(value * 100) / 100;
    const whole = Math.trunc(rounded);
    const fractional = rounded - whole;

    for (const fraction of fractionGlyphs) {
      if (Math.abs(fractional - fraction.value) < 0.02) {
        return whole > 0 ? `${whole}${fraction.glyph}` : fraction.glyph;
      }
    }

    return quantityFormatter.format(rounded);
  };

  const getItemQuantityLabel = (
    claimedQuantity: number,
    totalQuantity: number
  ) => {
    const normalizedClaimed = isWholeNumber(claimedQuantity)
      ? Math.round(claimedQuantity)
      : claimedQuantity;
    const normalizedTotal = isWholeNumber(totalQuantity)
      ? Math.round(totalQuantity)
      : totalQuantity;

    if (normalizedClaimed === 1 && normalizedTotal === 1) {
      return '';
    }

    if (Number.isInteger(normalizedClaimed)) {
      return ` (x${normalizedClaimed})`;
    }

    return ` (${formatFriendlyQuantity(normalizedClaimed)} share)`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between w-full">
          <h3 className="font-bold text-lg">{summary.displayName}</h3>
          <span className="text-xl font-bold text-primary">
            {currencySymbol}{summary.total.toFixed(2)}
          </span>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="pt-3 gap-2">
        {summary.items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-default-600">
              {item.name}
              {getItemQuantityLabel(item.claimedQuantity, item.totalQuantity)}
            </span>
            <span>{currencySymbol}{item.amount.toFixed(2)}</span>
          </div>
        ))}

        {summary.items.length > 0 && <Divider className="my-1" />}

        <div className="flex justify-between text-sm">
          <span className="text-default-500">Items subtotal</span>
          <span>{currencySymbol}{summary.itemsSubtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-default-500">Tax (share)</span>
          <span>{currencySymbol}{summary.taxShare.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-default-500">Service Charge/Tip (share)</span>
          <span>{currencySymbol}{summary.tipShare.toFixed(2)}</span>
        </div>
      </CardBody>
    </Card>
  );
}
