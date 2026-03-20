'use client';

import {
  addToast,
  Button,
  Card,
  CardBody,
  Chip,
  Select,
  SelectItem,
  Spinner,
} from '@heroui/react';
import { STORAGE_KEYS } from '@split-snap/shared/constants';
import { CURRENCIES, formatCurrency } from '@split-snap/shared/currency';
import { calculateSummaries } from '@split-snap/shared/tax';
import type { ParamsCodeProps, Session } from '@split-snap/shared/types';
import { IconArrowBigLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useMemo, useState } from 'react';

import PersonSummaryCard from '@/components/shared/PersonSummaryCard';
import { useApiError } from '@/hooks/useApiError';
import { api } from '@/lib/api';

export default function SummaryPage({ params }: ParamsCodeProps) {
  const { code } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { handleError } = useApiError({ redirectTo: '/' });

  const summaries = useMemo(
    () => (session ? calculateSummaries(session) : []),
    [session],
  );

  useEffect(() => {
    api.sessions
      .get(code)
      .then(setSession)
      .catch((err) => handleError(err, 'Session error'))
      .finally(() => setLoading(false));
  }, [code, handleError]);

  const handleConvertExchangeRates = async (currency: string) => {
    if (!session) return;

    const rates = sessionStorage.getItem(STORAGE_KEYS.KEY_EXCHANGE_RATES);

    if (!rates) {
      addToast({
        title: 'Exchange rates not available',
        description:
          'Unable to fetch exchange rates. Please try again later or refresh the page.',
        color: 'danger',
      });
      return;
    }

    const parsedRates = JSON.parse(rates);
    const rate = parsedRates[currency];

    if (!rate) {
      addToast({
        title: 'Currency not supported',
        description: `Exchange rate for ${currency} is not available.`,
        color: 'danger',
      });
      return;
    }

    const baseCurrency = session.currency;
    const conversionRate = rate / parsedRates[baseCurrency];

    const convertedSession = {
      ...session,
      items: session.items.map((item) => ({
        ...item,
        price: item.price * conversionRate,
      })),
      tip: session.tip * conversionRate,
      tax: session.tax * conversionRate,
      total: session.total * conversionRate,
      currency,
    };

    setSession(convertedSession);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) return null;

  const unclaimedItems = session.items.filter(
    (item) => item.claimedBy.length === 0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between gap-3">
        <div className="flex flex-col">
          <h3 className="title-section">Bill Summary</h3>
          <p className="text-description-lg">Session {code}</p>
        </div>
        <Button
          variant="flat"
          size="sm"
          startContent={<IconArrowBigLeft size={16} />}
          onPress={() => router.push(`/session/${code}`)}
        >
          Back
        </Button>
      </div>

      <div className="flex items-center justify-end gap-2">
        <p className="text-description-lg">Convert currency to:</p>
        <Select
          className="w-24"
          aria-label="convert currency to"
          defaultSelectedKeys={[`${session.currency}`]}
          onChange={(e) => handleConvertExchangeRates(e.target.value)}
        >
          {CURRENCIES.map((currency) => (
            <SelectItem key={currency.code}>{currency.code}</SelectItem>
          ))}
        </Select>
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
            <h3 className="title-section">Grand Total</h3>
            <h3 className="title-section">
              {formatCurrency({
                value: session.total,
                currency: session.currency,
                decimal: 2,
              })}
            </h3>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
