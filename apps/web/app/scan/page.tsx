'use client';

import { addToast, Spinner, Tab, Tabs } from '@heroui/react';
import type { ScannedItem, ScanResult } from '@split-snap/shared/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useState } from 'react';

import { ItemEditor } from '@/components/receipt/ItemEditor';
import { ReceiptUploader } from '@/components/receipt/ReceiptUploader';
import { useApiError } from '@/hooks/useApiError';
import { api } from '@/lib/api';

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      }
    >
      <ScanPageInner />
    </Suspense>
  );
}

function ScanPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startManual = searchParams.get('manual') === 'true';

  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState(startManual ? 'manual' : 'scan');
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | null>(null);
  const { handleError } = useApiError();

  const handleFileSelected = useCallback(
    async (file: File) => {
      setScanning(true);
      setReceiptImageUrl(URL.createObjectURL(file));

      // Store receipt image as base64 in sessionStorage for persistence across routes
      try {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          // Only store if under 4MB (sessionStorage limit ~5MB)
          if (base64.length < 4 * 1024 * 1024) {
            sessionStorage.setItem('receipt_image', base64);
          }
        };
        reader.readAsDataURL(file);
      } catch {
        // Ignore storage errors silently
      }

      try {
        const result = await api.receipts.scan(file);
        setScanResult(result);
        setActiveTab('manual'); // Switch to editor after scan
      } catch (err) {
        handleError(err, 'Scan failed');
        addToast({
          description: 'You can enter items manually.',
          color: 'warning',
        });
      } finally {
        setScanning(false);
      }
    },
    [handleError],
  );

  const handleCreateSession = useCallback(
    async (data: {
      items: ScannedItem[];
      subtotal: number;
      tax: number;
      tip: number;
      taxMode: '$' | '%';
      tipMode: '$' | '%';
      total: number;
      currency: string;
    }) => {
      setCreating(true);
      try {
        const session = await api.sessions.create({
          items: data.items,
          subtotal: data.subtotal,
          tax: data.tax,
          tip: data.tip,
          taxMode: data.taxMode,
          tipMode: data.tipMode,
          total: data.total,
          currency: data.currency,
        });

        // If the host was auto-joined, store participant ID to skip join page
        if (session.participantId) {
          localStorage.setItem(
            `participant_${session.code}`,
            session.participantId,
          );
        }

        // Store guest host token for non-authenticated session creators
        if (session.hostToken) {
          localStorage.setItem(`host_token_${session.code}`, session.hostToken);
        }

        router.push(`/session/${session.code}`);
      } catch (err) {
        handleError(err, 'Failed to create session');
      } finally {
        setCreating(false);
      }
    },
    [router, handleError],
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">New Split</h1>
      <p className="text-default-500 mb-6">
        Scan a receipt or enter items manually to start splitting.
      </p>

      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="mb-6"
      >
        <Tab key="scan" title="📸 Scan Receipt">
          <div className="mt-4">
            <ReceiptUploader
              onFileSelected={handleFileSelected}
              isLoading={scanning}
            />
          </div>
        </Tab>
        <Tab key="manual" title="✏️ Manual Entry">
          <div className="mt-4">
            <ItemEditor
              initialItems={scanResult?.items ?? []}
              initialSubtotal={scanResult?.subtotal ?? 0}
              initialTax={scanResult?.tax ?? 0}
              initialTip={scanResult?.tip ?? 0}
              initialTotal={scanResult?.total ?? 0}
              initialPriceInterpretation="line-total"
              onSubmit={handleCreateSession}
              isSubmitting={creating}
              receiptImageUrl={receiptImageUrl}
            />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
