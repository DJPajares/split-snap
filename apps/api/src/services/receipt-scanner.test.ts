import { describe, expect, it } from 'vitest';

import { parseReceiptText, sanitizeResult } from './receipt-scanner.js';

// Helper: run text through parseReceiptText then sanitizeResult with proper-casing
// (mirrors what the Tesseract provider does)
function parse(text: string) {
  return sanitizeResult(parseReceiptText(text), { properCaseNames: true });
}

// ─── Harbor Lane Cafe receipt format ─────────────────────────
// Plain leading quantity: "1 Tacos Del Mal Shrimp $14.98"

describe('parseReceiptText — leading plain quantity', () => {
  it('parses "1 ItemName $Price" with quantity=1 (unit price unchanged)', () => {
    const result = parse(
      `1 Tacos Del Mal Shrimp $14.98
1 Especial Salad Chicken $12.50
1 Fountain Beverage $1.99

SUBTOTAL: $29.47
TAX: $1.92
TOTAL: $31.39`,
    );

    expect(result.items).toEqual([
      { name: 'Tacos Del Mal Shrimp', price: 14.98, quantity: 1 },
      { name: 'Especial Salad Chicken', price: 12.5, quantity: 1 },
      { name: 'Fountain Beverage', price: 1.99, quantity: 1 },
    ]);
    expect(result.subtotal).toBe(29.47);
    expect(result.tax).toBe(1.92);
    expect(result.total).toBe(31.39);
    expect(result.tip).toBe(0);
  });

  it('parses "3 ItemName $LineTotal" — divides line-total by quantity', () => {
    const result = parse(`3 Fish Tacos $21.00`);

    expect(result.items).toEqual([
      { name: 'Fish Tacos', price: 7.0, quantity: 3 },
    ]);
  });
});

// ─── Dinefine Restaurant receipt format ──────────────────────
// "Nx" prefix: "2X CAESAR SALAD $24.00" (line-total for qty 2)

describe('parseReceiptText — Nx prefix quantity', () => {
  it('parses "2X CAESAR SALAD $24.00" with qty=2 and unit price=12.00', () => {
    const result = parse(
      `2X CAESAR SALAD $24.00
GRILLED SALMON $22.00
CHEESECAKE $7.50
2X SPARKLING WATER $6.00

SUBTOTAL: $47.50
TAX: $3.80
TOTAL: $51.30`,
    );

    expect(result.items).toEqual([
      { name: 'Caesar Salad', price: 12.0, quantity: 2 },
      { name: 'Grilled Salmon', price: 22.0, quantity: 1 },
      { name: 'Cheesecake', price: 7.5, quantity: 1 },
      { name: 'Sparkling Water', price: 3.0, quantity: 2 },
    ]);
    expect(result.subtotal).toBe(47.5);
    expect(result.tax).toBe(3.8);
    expect(result.total).toBe(51.3);
  });

  it('parses "3x" with lowercase x', () => {
    const result = parse(`3x Garlic Bread $15.00`);

    expect(result.items).toEqual([
      { name: 'Garlic Bread', price: 5.0, quantity: 3 },
    ]);
  });
});

// ─── No quantity prefix ──────────────────────────────────────

describe('parseReceiptText — no quantity prefix', () => {
  it('defaults to quantity=1 when no prefix', () => {
    const result = parse(`Grilled Salmon $22.00`);

    expect(result.items).toEqual([
      { name: 'Grilled Salmon', price: 22.0, quantity: 1 },
    ]);
  });
});

// ─── Edge cases: false positive guards ───────────────────────

describe('parseReceiptText — leading number edge cases', () => {
  it('does NOT treat "7 Up" as qty=7 (remaining name too short)', () => {
    const result = parse(`7 Up $2.50`);

    expect(result.items).toEqual([{ name: '7 Up', price: 2.5, quantity: 1 }]);
  });

  it('does NOT treat "3M Tape" as qty=3 (no space after digit)', () => {
    // "3M Tape" → "3M" is not separated by space, so leading-qty regex doesn't match
    const result = parse(`3M Tape $5.00`);
    expect(result.items).toEqual([
      { name: '3m Tape', price: 5.0, quantity: 1 },
    ]);
  });

  it('handles "10 Piece Nuggets $8.99" correctly as qty=10', () => {
    const result = parse(`10 Piece Nuggets $8.99`);

    // qty=10, "Piece Nuggets" has length >= 3
    expect(result.items).toEqual([
      { name: 'Piece Nuggets', price: 0.9, quantity: 10 },
    ]);
  });

  it('handles items with numbers in the name like "A5 Wagyu $45.00"', () => {
    // "A5 Wagyu" doesn't start with a digit — no leading qty match
    const result = parse(`A5 Wagyu $45.00`);

    expect(result.items).toEqual([
      { name: 'A5 Wagyu', price: 45.0, quantity: 1 },
    ]);
  });
});

// ─── Trailing quantity ───────────────────────────────────────

describe('parseReceiptText — trailing quantity', () => {
  it('parses "Chicken Rice 2 $12.50" with trailing qty=2', () => {
    const result = parse(`Chicken Rice 2 $12.50`);

    expect(result.items).toEqual([
      { name: 'Chicken Rice', price: 6.25, quantity: 2 },
    ]);
  });
});

// ─── Summary extraction ──────────────────────────────────────

describe('parseReceiptText — summary fields', () => {
  it('extracts subtotal, tax, tip, and total', () => {
    const result = parse(
      `Burger $10.00
Fries $5.00

Subtotal: $15.00
Tax: $1.20
Tip: $2.25
Total: $18.45`,
    );

    expect(result.subtotal).toBe(15.0);
    expect(result.tax).toBe(1.2);
    expect(result.tip).toBe(2.25);
    expect(result.total).toBe(18.45);
  });

  it('extracts percentage-based tax', () => {
    const result = parse(
      `Burger $10.00

Subtotal: $10.00
GST (8%) $0.80
Total: $10.80`,
    );

    expect(result.tax).toBe(0.8);
  });

  it('computes subtotal from items when not present', () => {
    const result = parse(
      `Burger $10.00
Fries $5.00`,
    );

    expect(result.subtotal).toBe(15.0);
  });
});

// ─── Currency symbols ────────────────────────────────────────

describe('parseReceiptText — currency symbols', () => {
  it('handles S$ prefix', () => {
    const result = parse(`Chicken Rice S$5.50`);

    expect(result.items).toEqual([
      { name: 'Chicken Rice', price: 5.5, quantity: 1 },
    ]);
  });

  it('handles € prefix', () => {
    const result = parse(`Pasta €12.00`);

    expect(result.items).toEqual([{ name: 'Pasta', price: 12.0, quantity: 1 }]);
  });
});
