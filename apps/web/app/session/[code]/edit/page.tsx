'use client';

import { addToast, Button, Spinner } from '@heroui/react';
import { STORAGE_KEYS } from '@split-snap/shared/constants';
import type { ScannedItem, Session } from '@split-snap/shared/types';
import { IconArrowBigLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

import { ItemEditor } from '@/components/receipt/ItemEditor';
import { useApiError } from '@/hooks/useApiError';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

export default function EditSessionPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const normalizedCode = code.toUpperCase();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | null>(null);
  const { handleError } = useApiError({ redirectTo: '/' });
  const hasHostToken =
    typeof window !== 'undefined' &&
    Boolean(
      localStorage.getItem(
        `${STORAGE_KEYS.KEY_HOST_TOKEN_PREFIX}${normalizedCode}`,
      ),
    );

  // Load receipt image from sessionStorage if available
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEYS.KEY_RECEIPT_IMAGE);
      if (stored) {
        setReceiptImageUrl(stored);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Fetch existing session
  useEffect(() => {
    api.sessions
      .get(normalizedCode)
      .then((s) => {
        setSession(s);
      })
      .catch((err) => {
        handleError(err, 'Session error');
        setError(err instanceof Error ? err.message : 'Session not found');
      })
      .finally(() => setLoading(false));
  }, [normalizedCode, handleError]);

  // Guard: redirect if not the creator
  useEffect(() => {
    if (!loading && !authLoading && session) {
      const isLoggedInCreator = Boolean(user && session.createdBy === user.id);
      if (!isLoggedInCreator && !hasHostToken) {
        router.replace(`/session/${normalizedCode}`);
      }
    }
  }, [
    loading,
    authLoading,
    session,
    user,
    hasHostToken,
    router,
    normalizedCode,
  ]);

  const handleSubmit = async (data: {
    items: ScannedItem[];
    subtotal: number;
    tax: number;
    tip: number;
    taxMode: '$' | '%';
    tipMode: '$' | '%';
    total: number;
    currency: string;
  }) => {
    setSubmitting(true);
    try {
      // Map items, preserving IDs for existing items by matching name+occurrence
      const existingItemsByName = new Map<string, Session['items']>();
      for (const existingItem of session?.items ?? []) {
        const bucket = existingItemsByName.get(existingItem.name) ?? [];
        bucket.push(existingItem);
        existingItemsByName.set(existingItem.name, bucket);
      }

      const itemsWithIds = data.items.map((item) => {
        const bucket = existingItemsByName.get(item.name) ?? [];
        const existingItem = bucket.shift();

        return {
          ...(existingItem ? { id: existingItem.id } : {}),
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        };
      });

      await api.sessions.updateItems(normalizedCode, {
        items: itemsWithIds,
        subtotal: data.subtotal,
        tax: data.tax,
        tip: data.tip,
        taxMode: data.taxMode,
        tipMode: data.tipMode,
        total: data.total,
        currency: data.currency,
      });

      addToast({ title: 'Items updated!', color: 'success' });
      router.push(`/session/${normalizedCode}`);
    } catch (err) {
      handleError(err, 'Failed to update items');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-danger text-xl">{error || 'Session not found'}</p>
        <Button onPress={() => router.push('/')}>Go Home</Button>
      </div>
    );
  }

  // Not the creator — will redirect via useEffect
  if ((!user || session.createdBy !== user.id) && !hasHostToken) {
    return null;
  }

  // Map session items to ScannedItem format for the editor
  const initialItems: ScannedItem[] = session.items.map((item) => ({
    name: item.name,
    price: item.price,
    quantity: item.quantity,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between gap-3">
          <div className="flex flex-col">
            <h1 className="title-section">Edit Items</h1>
            <p className="text-description-lg">Session {code}</p>
          </div>
          <Button
            variant="flat"
            size="sm"
            startContent={<IconArrowBigLeft size={16} />}
            onPress={() => router.push(`/session/${normalizedCode}`)}
          >
            Back
          </Button>
        </div>
        <p className="text-description">
          Modify items, prices, or quantities. Claims on changed items will be
          cleared.
        </p>
      </div>

      <ItemEditor
        initialItems={initialItems}
        initialSubtotal={session.subtotal}
        initialTax={session.tax}
        initialTip={session.tip}
        initialTaxMode={session.taxMode}
        initialTipMode={session.tipMode}
        initialTotal={session.total}
        initialCurrency={session.currency}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
        submitLabel="Save Changes"
        receiptImageUrl={receiptImageUrl}
      />
    </div>
  );
}
