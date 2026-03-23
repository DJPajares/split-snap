import { Card, CardHeader, Separator } from '@heroui/react';
import { formatCurrency } from '@split-snap/shared/currency';
import type { PersonSummary } from '@split-snap/shared/types';

type PersonSummaryCardProps = {
  summary: PersonSummary;
  currency: string;
};

const PersonSummaryCard = ({ summary, currency }: PersonSummaryCardProps) => {
  const quantityFormatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const fractionGlyphs = [
    { value: 0.125, glyph: '⅛' },
    { value: 0.25, glyph: '¼' },
    { value: 0.333, glyph: '⅓' },
    { value: 0.375, glyph: '⅜' },
    { value: 0.5, glyph: '½' },
    { value: 0.625, glyph: '⅝' },
    { value: 0.667, glyph: '⅔' },
    { value: 0.75, glyph: '¾' },
    { value: 0.875, glyph: '⅞' },
  ];

  const isWholeNumber = (value: number) =>
    Math.abs(value - Math.round(value)) < 0.001;

  const formatFriendlyQuantity = (value: number) => {
    const rounded = Math.round(value * 100) / 100;
    const whole = Math.trunc(rounded);
    const fractional = rounded - whole;

    for (const fraction of fractionGlyphs) {
      if (Math.abs(fractional - fraction.value) < 0.02) {
        return whole > 0 ? `${whole}${fraction.glyph}` : fraction.glyph;
      }
    }

    return quantityFormatter.format(rounded);
  };

  const getItemQuantityLabel = (claimedQuantity: number) => {
    const normalizedClaimed = isWholeNumber(claimedQuantity)
      ? Math.round(claimedQuantity)
      : claimedQuantity;

    if (Number.isInteger(normalizedClaimed)) {
      return ` (x${normalizedClaimed})`;
    }

    return ` (${formatFriendlyQuantity(normalizedClaimed)} share)`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex w-full items-center justify-between">
          <h5 className="title-subsection">{summary.displayName}</h5>
          <h4 className="title-card text-accent">
            {formatCurrency({
              value: summary.total,
              currency,
              decimal: 2,
            })}
          </h4>
        </div>
      </CardHeader>

      <Separator />

      <Card.Content className="gap-2">
        {summary.items.map((item, i) => (
          <div key={i} className="flex justify-between">
            <p className="text-description-lg">
              {item.name}
              {getItemQuantityLabel(item.claimedQuantity)}
            </p>
            <p>
              {formatCurrency({
                value: item.amount,
                currency,
                decimal: 2,
              })}
            </p>
          </div>
        ))}

        {summary.items.length > 0 && <Separator className="my-1" />}

        <div className="flex justify-between">
          <span className="text-description-lg">Items subtotal</span>
          <span>
            {formatCurrency({
              value: summary.itemsSubtotal,
              currency,
              decimal: 2,
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-description-lg">Tax (share)</span>
          <span>
            {formatCurrency({
              value: summary.taxShare,
              currency,
              decimal: 2,
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-description-lg">
            Service Charge/Tip (share)
          </span>
          <span>
            {formatCurrency({
              value: summary.tipShare,
              currency,
              decimal: 2,
            })}
          </span>
        </div>
      </Card.Content>
    </Card>
  );
};

export default PersonSummaryCard;
