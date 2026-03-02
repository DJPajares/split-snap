'use client';

import { useState, useEffect, use } from 'react';
import { Spinner, Button, addToast } from '@heroui/react';
import { useRouter } from 'next/navigation';
import type { Session, ScannedItem } from '@split-snap/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { ItemEditor } from '@/components/receipt/ItemEditor';

export default function EditSessionPage({
  params
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

  // Fetch existing session
  useEffect(() => {
    api.sessions
      .get(code)
      .then((s) => {
        setSession(s);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Session not found');
      })
      .finally(() => setLoading(false));
  }, [code]);

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
      // Map items, preserving IDs for existing items by matching name+position
      const itemsWithIds = data.items.map((item) => {
        // Try to find a matching existing item by name to preserve its ID
        const existingItem = session?.items.find(
          (existing) => existing.name === item.name
        );
        return {
          ...(existingItem ? { id: existingItem.id } : {}),
          name: item.name,
          price: item.price,
          quantity: item.quantity
        };
      });

      await api.sessions.updateItems(code, {
        items: itemsWithIds,
        subtotal: data.subtotal,
        tax: data.tax,
        tip: data.tip,
        total: data.total,
        currency: data.currency
      });

      addToast({ title: 'Items updated!', color: 'success' });
      router.push(`/session/${code}`);
    } catch (err) {
      addToast({
        title: 'Failed to update items',
        description: err instanceof Error ? err.message : 'Unknown error',
        color: 'danger'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-xl text-danger">{error || 'Session not found'}</p>
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
    quantity: item.quantity
  }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">Edit Items</h1>
            <p className="text-default-500 text-base font-semibold">Session {code}</p>
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
