import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useState } from 'react';

type ReceiptImageProps = {
  receiptImageUrl: string;
};

export function ReceiptImage({ receiptImageUrl }: ReceiptImageProps) {
  const [receiptExpanded, setReceiptExpanded] = useState(false);
  const [receiptZoom, setReceiptZoom] = useState(1);

  return (
    <div className="space-y-2">
      <button
        className="flex w-full items-center gap-2 text-left"
        onClick={() => setReceiptExpanded(!receiptExpanded)}
      >
        <span className="text-lg">🧾</span>
        <span className="flex-1 text-sm font-medium">Receipt Reference</span>
        <span className="text-caption">
          {receiptExpanded ? 'Hide' : 'Show'}
        </span>
      </button>
      {receiptExpanded && (
        <div className="space-y-2">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center gap-2">
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                onPress={() => setReceiptZoom((z) => Math.max(0.5, z - 0.25))}
                aria-label="Zoom out"
              >
                <Icon icon="tabler:minus" height={12} />
              </Button>
              <span className="text-caption w-12 text-center">
                {Math.round(receiptZoom * 100)}%
              </span>
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                onPress={() => setReceiptZoom((z) => Math.min(3, z + 0.25))}
                aria-label="Zoom in"
              >
                <Icon icon="tabler:plus" height={12} />
              </Button>
            </div>
            {receiptZoom !== 1 && (
              <Button
                size="sm"
                variant="light"
                onPress={() => setReceiptZoom(1)}
              >
                Reset
              </Button>
            )}
          </div>
          <div className="border-default-200 max-h-80 overflow-auto rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receiptImageUrl}
              alt="Scanned receipt"
              className="w-full origin-top-left transition-transform"
              style={{ transform: `scale(${receiptZoom})` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
