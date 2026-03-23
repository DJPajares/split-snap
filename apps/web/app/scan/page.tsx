'use client';

import { Spinner, Tabs, toast } from '@heroui/react';
import { STORAGE_KEYS } from '@split-snap/shared/constants';
import type { ScannedItem, ScanResult } from '@split-snap/shared/types';
import { IconCamera, IconPencil } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useState, useTransition } from 'react';

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
  const [isRouting, startTransition] = useTransition();
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
            sessionStorage.setItem(STORAGE_KEYS.KEY_RECEIPT_IMAGE, base64);
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
        toast.warning('You can enter items manually.');
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
      if (creating || isRouting) {
        return;
      }

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
            `${STORAGE_KEYS.KEY_PARTICIPANT_PREFIX}${session.code}`,
            session.participantId,
          );
        }

        // Store guest host token for non-authenticated session creators
        if (session.hostToken) {
          localStorage.setItem(
            `${STORAGE_KEYS.KEY_HOST_TOKEN_PREFIX}${session.code}`,
            session.hostToken,
          );
        }

        startTransition(() => {
          router.push(`/session/${session.code}`);
        });
      } catch (err) {
        setCreating(false);
        handleError(err, 'Failed to create session');
      }
    },
    [creating, isRouting, router, handleError],
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h3 className="title-section">New Split</h3>
        <p className="text-description-lg">
          Scan a receipt or enter items manually to start splitting.
        </p>
      </div>

      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label="Scan or Manual Entry">
            <Tabs.Tab id="scan">
              <div className="flex flex-row items-center gap-2">
                <IconCamera size={16} />
                <p>Scan Receipt</p>
              </div>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="manual">
              <div className="flex flex-row items-center gap-2">
                <IconPencil size={16} />
                <p>Manual Entry</p>
              </div>
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel id="scan">
          <ReceiptUploader
            onFileSelected={handleFileSelected}
            isLoading={scanning}
          />
        </Tabs.Panel>
        <Tabs.Panel id="manual">
          <ItemEditor
            initialItems={scanResult?.items ?? []}
            initialSubtotal={scanResult?.subtotal ?? 0}
            initialTax={scanResult?.tax ?? 0}
            initialTip={scanResult?.tip ?? 0}
            initialTotal={scanResult?.total ?? 0}
            initialPriceInterpretation="line-total"
            onSubmit={handleCreateSession}
            isSubmitting={creating || isRouting}
            receiptImageUrl={receiptImageUrl}
          />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
