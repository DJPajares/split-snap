import { Button } from '@heroui/react';
import Image from 'next/image';
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
                −
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
                +
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
          <div className="border-default-200 flex max-h-80 justify-center overflow-auto rounded-lg border">
            <Image
              src={receiptImageUrl}
              alt="Scanned receipt"
              className="origin-top transition-transform"
              style={{ transform: `scale(${receiptZoom})` }}
              width={400}
              height={600}
            />
          </div>
        </div>
      )}
    </div>
  );
}
