import { Button, Card } from '@heroui/react';
import { IconMinus, IconPlus, IconReceiptFilled } from '@tabler/icons-react';
import { useState } from 'react';

type ReceiptImageProps = {
  receiptImageUrl: string;
};

export function ReceiptImage({ receiptImageUrl }: ReceiptImageProps) {
  const [receiptExpanded, setReceiptExpanded] = useState(false);
  const [receiptZoom, setReceiptZoom] = useState(1);

  return (
    <Card>
      <Card.Content className="flex flex-col gap-4 py-4">
        <button
          className="flex w-full items-center gap-2 text-left"
          onClick={() => setReceiptExpanded(!receiptExpanded)}
        >
          <IconReceiptFilled size={16} />
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
                  size="sm"
                  variant="tertiary"
                  onPress={() => setReceiptZoom((z) => Math.max(0.5, z - 0.25))}
                  aria-label="Zoom out"
                  isIconOnly
                >
                  <IconMinus size={12} />
                </Button>
                <span className="text-caption w-12 text-center">
                  {Math.round(receiptZoom * 100)}%
                </span>
                <Button
                  size="sm"
                  variant="tertiary"
                  onPress={() => setReceiptZoom((z) => Math.min(3, z + 0.25))}
                  isIconOnly
                  aria-label="Zoom in"
                >
                  <IconPlus size={12} />
                </Button>
              </div>
              {receiptZoom !== 1 && (
                <Button
                  size="sm"
                  variant="tertiary"
                  onPress={() => setReceiptZoom(1)}
                >
                  Reset
                </Button>
              )}
            </div>
            <div className="border-default-200 max-h-80 overflow-auto rounded-lg border sm:max-h-120">
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
      </Card.Content>
    </Card>
  );
}
