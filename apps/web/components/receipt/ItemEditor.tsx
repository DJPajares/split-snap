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
  SelectItem
} from '@heroui/react';
import type { ScannedItem } from '@split-snap/shared';
import { CURRENCIES, getCurrencySymbol } from '@split-snap/shared';

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
  submitLabel = 'Create Session'
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
          quantity: item.quantity ? item.quantity.toString() : ''
        }))
      : [{ name: '', amount: '', quantity: '' }]
  );
  const [tax, setTax] = useState(initialTax ? initialTax.toString() : '');
  const [tip, setTip] = useState(initialTip ? initialTip.toString() : '');
  const [itemErrors, setItemErrors] = useState<ItemErrors[]>(() =>
    Array.from(
      { length: initialItems.length > 0 ? initialItems.length : 1 },
      () => ({})
    )
  );
  const [taxError, setTaxError] = useState<string | undefined>();
  const [tipError, setTipError] = useState<string | undefined>();

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
    0
  );
  const taxValue = parseNumber(tax);
  const tipValue = parseNumber(tip);
  const total = subtotal + taxValue + tipValue;

  const updateItem = (index: number, field: ItemField, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );

    if (field === 'amount' || field === 'quantity') {
      setItemErrors((prev) =>
        prev.map((error, i) =>
          i === index ? { ...error, [field]: undefined } : error
        )
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
        i === index ? { ...itemError, [field]: error } : itemError
      )
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
    setItems((prev) => [...prev, { name: '', amount: '', quantity: '' }]);
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
        amount: parseNumber(item.amount)
      }))
      .map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.quantity > 0 ? item.amount / item.quantity : 0
      }))
      .filter((item) => item.name && item.price > 0 && item.quantity >= 1);

    if (validItems.length === 0 || hasError) return;

    onSubmit({
      items: validItems,
      subtotal,
      tax: taxValue,
      tip: tipValue,
      total,
      currency
    });
  };

  const canSubmit =
    items.some(
      (item) =>
        item.name.trim() &&
        parseNumber(item.amount) > 0 &&
        parseInteger(item.quantity) >= 1
    ) &&
    itemErrors.every((error) => !error.amount && !error.quantity) &&
    !taxError &&
    !tipError;

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-2">
        <h2 className="text-xl font-bold">Review Items</h2>
        <p className="text-sm text-default-500">
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
          className="max-w-xs"
        >
          {CURRENCIES.map((c) => (
            <SelectItem key={c.code} textValue={`${c.code} (${c.symbol})`}>
              {c.symbol} — {c.code} ({c.name})
            </SelectItem>
          ))}
        </Select>
      </CardHeader>
      <Divider />
      <CardBody className="gap-4">
        {/* Items */}
        <div className="space-y-0 divide-y divide-default-200">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row gap-2 items-start sm:items-center py-4 first:pt-0 last:pb-0"
            >
              {/* Item name + mobile X button in a row */}
              <div className="flex gap-2 items-start w-full sm:contents">
                <Input
                  label="Item"
                  placeholder="e.g. Burger"
                  value={item.name}
                  onValueChange={(val) => updateItem(i, 'name', val)}
                  className="flex-1"
                  size="sm"
                />
                <Button
                  isIconOnly
                  variant="light"
                  color="danger"
                  size="sm"
                  onPress={() => removeItem(i)}
                  isDisabled={items.length <= 1}
                  aria-label="Remove item"
                  className="mt-1 shrink-0 sm:hidden"
                >
                  ✕
                </Button>
              </div>
              <Input
                label="Amount"
                type="number"
                placeholder="0.00"
                value={item.amount}
                onValueChange={(val) => updateItem(i, 'amount', val)}
                onBlur={() => validateItemField(i, 'amount')}
                startContent={
                  <span className="text-default-400 text-sm">{currencySymbol}</span>
                }
                className="w-full sm:w-28"
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
                className="w-full sm:w-20"
                size="sm"
                isInvalid={Boolean(itemErrors[i]?.quantity)}
                errorMessage={itemErrors[i]?.quantity}
              />
              {parseInteger(item.quantity) > 1 &&
                parseNumber(item.amount) > 0 && (
                  <p className="text-xs text-default-500 w-full sm:w-auto sm:min-w-28 sm:text-right">
                    {currencySymbol}
                    {(
                      parseNumber(item.amount) / parseInteger(item.quantity)
                    ).toFixed(2)}{' '}
                    each
                  </p>
                )}
              {/* Desktop: inline X button, vertically centered */}
              <Button
                isIconOnly
                variant="light"
                color="danger"
                size="sm"
                onPress={() => removeItem(i)}
                isDisabled={items.length <= 1}
                aria-label="Remove item"
                className="hidden sm:flex self-center"
              >
                ✕
              </Button>
            </div>
          ))}
        </div>

        <Button
          variant="flat"
          size="sm"
          onPress={addItem}
          className="self-start"
        >
          + Add Item
        </Button>

        <Divider />

        {/* Totals */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              startContent={<span className="text-default-400 text-sm">{currencySymbol}</span>}
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
              startContent={<span className="text-default-400 text-sm">{currencySymbol}</span>}
              size="sm"
              isInvalid={Boolean(tipError)}
              errorMessage={tipError}
            />
          </div>
          <div className="w-full bg-content2 rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-default-500">Total</p>
            <p className="text-lg font-bold">{currencySymbol}{total.toFixed(2)}</p>
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
