'use client';

import { useState, useEffect, use } from 'react';
import { Spinner, Button, addToast } from '@heroui/react';
import { useRouter } from 'next/navigation';
import type { Session, ScannedItem } from '@split-snap/shared/types';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useApiError } from '@/hooks/useApiError';
import { ItemEditor } from '@/components/receipt/ItemEditor';

export default function EditSessionPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { handleError } = useApiError({ redirectTo: '/' });

  // Fetch existing session
  useEffect(() => {
    api.sessions
      .get(code)
      .then((s) => {
        setSession(s);
      })
      .catch((err) => {
        handleError(err, 'Session error');
        setError(err instanceof Error ? err.message : 'Session not found');
      })
      .finally(() => setLoading(false));
  }, [code, handleError]);

  // Guard: redirect if not the creator
  useEffect(() => {
    if (!loading && !authLoading && session) {
      if (!user || session.createdBy !== user.id) {
        router.replace(`/session/${code}`);
      }
    }
  }, [loading, authLoading, session, user, router, code]);

  const handleSubmit = async (data: {
    items: ScannedItem[];
    subtotal: number;
    tax: number;
    tip: number;
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

      await api.sessions.updateItems(code, {
        items: itemsWithIds,
        subtotal: data.subtotal,
        tax: data.tax,
        tip: data.tip,
        total: data.total,
        currency: data.currency,
      });

      addToast({ title: 'Items updated!', color: 'success' });
      router.push(`/session/${code}`);
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
  if (!user || session.createdBy !== user.id) {
    return null;
  }

  // Map session items to ScannedItem format for the editor
  const initialItems: ScannedItem[] = session.items.map((item) => ({
    name: item.name,
    price: item.price,
    quantity: item.quantity,
  }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between gap-3">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">Edit Items</h1>
            <p className="text-default-500 text-base font-semibold">
              Session {code}
            </p>
          </div>
          <Button
            variant="flat"
            size="sm"
            onPress={() => router.push(`/session/${code}`)}
          >
            ← Back
          </Button>
        </div>
        <p className="text-default-500 text-sm">
          Modify items, prices, or quantities. Claims on changed items will be
          cleared.
        </p>
      </div>

      <ItemEditor
        initialItems={initialItems}
        initialSubtotal={session.subtotal}
        initialTax={session.tax}
        initialTip={session.tip}
        initialTotal={session.total}
        initialCurrency={session.currency}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
        submitLabel="Save Changes"
      />
    </div>
  );
}
