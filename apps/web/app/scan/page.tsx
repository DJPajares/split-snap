"use client";

import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, Tab, addToast, Spinner } from "@heroui/react";
import { ReceiptUploader } from "@/components/receipt/ReceiptUploader";
import { ItemEditor } from "@/components/receipt/ItemEditor";
import { api } from "@/lib/api";
import type { ScanResult, ScannedItem } from "@split-snap/shared";

export default function ScanPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Spinner size="lg" /></div>}>
      <ScanPageInner />
    </Suspense>
  );
}

function ScanPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startManual = searchParams.get("manual") === "true";

  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState(startManual ? "manual" : "scan");

  const handleFileSelected = useCallback(async (file: File) => {
    setScanning(true);
    try {
      const result = await api.receipts.scan(file);
      setScanResult(result);
      setActiveTab("manual"); // Switch to editor after scan
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to scan receipt";
      addToast({
        title: "Scan failed",
        description: message + ". You can enter items manually.",
        color: "danger",
      });
    } finally {
      setScanning(false);
    }
  }, []);

  const handleCreateSession = useCallback(
    async (data: {
      items: ScannedItem[];
      subtotal: number;
      tax: number;
      tip: number;
      total: number;
    }) => {
      setCreating(true);
      try {
        const session = await api.sessions.create({
          items: data.items,
          subtotal: data.subtotal,
          tax: data.tax,
          tip: data.tip,
          total: data.total,
        });
        router.push(`/session/${session.code}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create session";
        addToast({
          title: "Error",
          description: message,
          color: "danger",
        });
      } finally {
        setCreating(false);
      }
    },
    [router]
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">New Split</h1>
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
              onSubmit={handleCreateSession}
              isSubmitting={creating}
            />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
