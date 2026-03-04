'use client';

import { useState } from 'react';
import {
  Button,
  Input,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Select,
  SelectItem,
} from '@heroui/react';
import type { ScannedItem } from '@split-snap/shared/types';
import { CURRENCIES, getCurrencySymbol } from '@split-snap/shared/currency';

interface ItemEditorProps {
  initialItems: ScannedItem[];
  initialSubtotal: number;
  initialTax: number;
  initialTip: number;
  initialTotal: number;
  initialPriceInterpretation?: 'unit' | 'line-total';
  initialCurrency?: string;
  onSubmit: (data: {
    items: ScannedItem[];
    subtotal: number;
    tax: number;
    tip: number;
    total: number;
    currency: string;
  }) => void;
  isSubmitting: boolean;
  submitLabel?: string;
  receiptImageUrl?: string | null;
}

type EditableItem = {
  name: string;
  amount: string;
  quantity: string;
};

type ItemField = keyof EditableItem;

type ItemErrors = {
  amount?: string;
  quantity?: string;
};

export function ItemEditor({
  initialItems,
  initialTax,
  initialTip,
  initialPriceInterpretation = 'unit',
  initialCurrency = 'SGD',
  onSubmit,
  isSubmitting,
  submitLabel = 'Create Session',
  receiptImageUrl,
}: ItemEditorProps) {
  const [currency, setCurrency] = useState(initialCurrency);
  const currencySymbol = getCurrencySymbol(currency);
  const [items, setItems] = useState<EditableItem[]>(
    initialItems.length > 0
      ? initialItems.map((item) => ({
          name: item.name,
          amount:
            item.price && item.quantity
              ? (initialPriceInterpretation === 'unit'
                  ? item.price * item.quantity
                  : item.price
                ).toString()
              : '',
          quantity: item.quantity ? item.quantity.toString() : '1',
        }))
      : [{ name: '', amount: '', quantity: '1' }],
  );
  const [tax, setTax] = useState(initialTax ? initialTax.toString() : '');
  const [tip, setTip] = useState(initialTip ? initialTip.toString() : '');
  const [itemErrors, setItemErrors] = useState<ItemErrors[]>(() =>
    Array.from(
      { length: initialItems.length > 0 ? initialItems.length : 1 },
      () => ({}),
    ),
  );
  const [taxError, setTaxError] = useState<string | undefined>();
  const [tipError, setTipError] = useState<string | undefined>();
  const [receiptExpanded, setReceiptExpanded] = useState(false);
  const [receiptZoom, setReceiptZoom] = useState(1);

  const parseNumber = (value: string) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const parseInteger = (value: string) => {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const subtotal = items.reduce(
    (sum, item) => sum + parseNumber(item.amount),
    0,
  );
  const taxValue = parseNumber(tax);
  const tipValue = parseNumber(tip);
  const total = subtotal + taxValue + tipValue;
  const isItemComplete = (item: EditableItem) =>
    Boolean(item.name.trim()) &&
    parseNumber(item.amount) > 0 &&
    parseInteger(item.quantity) >= 1;

  const canAddItem = items.every(isItemComplete);

  const updateItem = (index: number, field: ItemField, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );

    if (field === 'amount' || field === 'quantity') {
      setItemErrors((prev) =>
        prev.map((error, i) =>
          i === index ? { ...error, [field]: undefined } : error,
        ),
      );
    }
  };

  const validateItemField = (index: number, field: 'amount' | 'quantity') => {
    const value = items[index]?.[field] ?? '';
    let error: string | undefined;

    if (field === 'amount') {
      if (value.trim() === '') {
        error = 'Amount is required.';
      } else if (parseNumber(value) < 0) {
        error = 'Amount cannot be negative.';
      }
    }

    if (field === 'quantity') {
      if (value.trim() === '' || parseInteger(value) < 1) {
        error = 'Quantity must be at least 1.';
      }
    }

    setItemErrors((prev) =>
      prev.map((itemError, i) =>
        i === index ? { ...itemError, [field]: error } : itemError,
      ),
    );

    return !error;
  };

  const validateExtraAmount = (value: string, type: 'tax' | 'tip') => {
    const nextError =
      value.trim() !== '' && parseNumber(value) < 0
        ? `${type === 'tax' ? 'Tax' : 'Service Charge/Tip'} cannot be negative.`
        : undefined;

    if (type === 'tax') {
      setTaxError(nextError);
    } else {
      setTipError(nextError);
    }

    return !nextError;
  };

  const addItem = () => {
    if (!canAddItem) return;
    setItems((prev) => [...prev, { name: '', amount: '', quantity: '1' }]);
    setItemErrors((prev) => [...prev, {}]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
    setItemErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    let hasError = false;

    const nextItemErrors = items.map((item) => {
      const amountValue = parseNumber(item.amount);
      const quantityValue = parseInteger(item.quantity);

      const rowErrors: ItemErrors = {};

      if (item.name.trim()) {
        if (item.amount.trim() === '') {
          rowErrors.amount = 'Amount is required.';
        } else if (amountValue < 0) {
          rowErrors.amount = 'Amount cannot be negative.';
        }

        if (item.quantity.trim() === '' || quantityValue < 1) {
          rowErrors.quantity = 'Quantity must be at least 1.';
        }
      }

      if (rowErrors.amount || rowErrors.quantity) {
        hasError = true;
      }

      return rowErrors;
    });

    setItemErrors(nextItemErrors);

    const isTaxValid = validateExtraAmount(tax, 'tax');
    const isTipValid = validateExtraAmount(tip, 'tip');

    if (!isTaxValid || !isTipValid) {
      hasError = true;
    }

    const validItems: ScannedItem[] = items
      .map((item) => ({
        name: item.name.trim(),
        quantity: parseInteger(item.quantity),
        amount: parseNumber(item.amount),
      }))
      .map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.quantity > 0 ? item.amount / item.quantity : 0,
      }))
      .filter((item) => item.name && item.price > 0 && item.quantity >= 1);

    if (validItems.length === 0 || hasError) return;

    onSubmit({
      items: validItems,
      subtotal,
      tax: taxValue,
      tip: tipValue,
      total,
      currency,
    });
  };

  const canSubmit =
    items.some(
      (item) =>
        item.name.trim() &&
        parseNumber(item.amount) > 0 &&
        parseInteger(item.quantity) >= 1,
    ) &&
    itemErrors.every((error) => !error.amount && !error.quantity) &&
    !taxError &&
    !tipError;

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-2">
        <h2 className="text-xl font-bold">Review Items</h2>
        <p className="text-default-500 text-sm">
          Enter each row amount as shown on the receipt, with quantity in Qty.
        </p>
        <Select
          label="Currency"
          selectedKeys={[currency]}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            if (selected) setCurrency(selected);
          }}
          size="sm"
        >
          {CURRENCIES.map((c) => (
            <SelectItem key={c.code} textValue={`${c.code} (${c.symbol})`}>
              {c.symbol} — {c.code} ({c.name})
            </SelectItem>
          ))}
        </Select>
      </CardHeader>
      <Divider />
      <CardBody className="gap-5">
        {/* Receipt reference image */}
        {receiptImageUrl && (
          <div className="space-y-2">
            <button
              className="flex w-full items-center gap-2 text-left"
              onClick={() => setReceiptExpanded(!receiptExpanded)}
            >
              <span className="text-lg">🧾</span>
              <span className="flex-1 text-sm font-medium">
                Receipt Reference
              </span>
              <span className="text-default-400 text-xs">
                {receiptExpanded ? 'Hide' : 'Show'}
              </span>
            </button>
            {receiptExpanded && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    onPress={() =>
                      setReceiptZoom((z) => Math.max(0.5, z - 0.25))
                    }
                    aria-label="Zoom out"
                  >
                    −
                  </Button>
                  <span className="text-default-500 w-12 text-center text-xs">
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
        )}

        {/* Items */}
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="space-y-1.5">
              <div className="border-default-200 bg-content1/90 flex flex-col gap-2 rounded-2xl border p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <p className="text-default-500 text-xs font-medium tracking-wide uppercase">
                    Item {i + 1}
                  </p>
                  <Button
                    isIconOnly
                    variant="light"
                    color="danger"
                    size="sm"
                    onPress={() => removeItem(i)}
                    isDisabled={items.length <= 1}
                    aria-label="Remove item"
                  >
                    ✕
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:gap-3">
                  <Input
                    label="Item"
                    placeholder="e.g. Burger"
                    value={item.name}
                    onValueChange={(val) => updateItem(i, 'name', val)}
                    className="w-full sm:col-span-7"
                    size="sm"
                  />
                  <Input
                    label="Amount"
                    type="number"
                    placeholder="0.00"
                    value={item.amount}
                    onValueChange={(val) => updateItem(i, 'amount', val)}
                    onBlur={() => validateItemField(i, 'amount')}
                    startContent={
                      <span className="text-default-400 text-sm">
                        {currencySymbol}
                      </span>
                    }
                    className="w-full sm:col-span-3"
                    size="sm"
                    isInvalid={Boolean(itemErrors[i]?.amount)}
                    errorMessage={itemErrors[i]?.amount}
                  />
                  <Input
                    label="Qty"
                    type="number"
                    placeholder="1"
                    value={item.quantity}
                    onValueChange={(val) => updateItem(i, 'quantity', val)}
                    onBlur={() => validateItemField(i, 'quantity')}
                    className="w-full sm:col-span-2"
                    size="sm"
                    isInvalid={Boolean(itemErrors[i]?.quantity)}
                    errorMessage={itemErrors[i]?.quantity}
                  />
                </div>
                {parseInteger(item.quantity) > 1 &&
                  parseNumber(item.amount) > 0 && (
                    <p className="text-default-500 text-xs">
                      {currencySymbol}
                      {(
                        parseNumber(item.amount) / parseInteger(item.quantity)
                      ).toFixed(2)}{' '}
                      each
                    </p>
                  )}
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="flat"
          size="sm"
          onPress={addItem}
          isDisabled={!canAddItem}
          className="self-start"
        >
          + Add Item
        </Button>

        <Divider />

        {/* Totals */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Tax"
              type="number"
              placeholder="0.00"
              value={tax}
              onValueChange={(val) => {
                setTax(val);
                setTaxError(undefined);
              }}
              onBlur={() => validateExtraAmount(tax, 'tax')}
              startContent={
                <span className="text-default-400 text-sm">
                  {currencySymbol}
                </span>
              }
              size="sm"
              isInvalid={Boolean(taxError)}
              errorMessage={taxError}
            />
            <Input
              label="Service Charge/Tip"
              type="number"
              placeholder="0.00"
              value={tip}
              onValueChange={(val) => {
                setTip(val);
                setTipError(undefined);
              }}
              onBlur={() => validateExtraAmount(tip, 'tip')}
              startContent={
                <span className="text-default-400 text-sm">
                  {currencySymbol}
                </span>
              }
              size="sm"
              isInvalid={Boolean(tipError)}
              errorMessage={tipError}
            />
          </div>
          <div className="bg-content2 w-full rounded-lg px-3 py-2 text-center">
            <p className="text-default-500 text-xs">Total</p>
            <p className="text-lg font-bold">
              {currencySymbol}
              {total.toFixed(2)}
            </p>
          </div>
        </div>

        <Button
          color="primary"
          size="lg"
          className="mt-2 font-semibold"
          onPress={handleSubmit}
          isLoading={isSubmitting}
          isDisabled={!canSubmit}
        >
          {submitLabel}
        </Button>
      </CardBody>
    </Card>
  );
}
