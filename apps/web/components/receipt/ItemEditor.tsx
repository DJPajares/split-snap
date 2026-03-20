'use client';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  NumberInput,
  Select,
  SelectItem,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CURRENCIES,
  formatCurrency,
  getCurrencySymbol,
} from '@split-snap/shared/currency';
import {
  type AmountMode,
  type ItemEditorFormData,
  itemEditorSchema,
} from '@split-snap/shared/schemas';
import type { ScannedItem } from '@split-snap/shared/types';
import { useCallback, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';

import { ReceiptImage } from './ReceiptImage';

interface ItemEditorProps {
  initialItems: ScannedItem[];
  initialSubtotal: number;
  initialTax: number;
  initialTip: number;
  initialTotal: number;
  initialPriceInterpretation?: 'unit' | 'line-total';
  initialCurrency?: string;
  initialTaxMode?: AmountMode;
  initialTipMode?: AmountMode;
  onSubmit: (data: {
    items: ScannedItem[];
    subtotal: number;
    tax: number;
    tip: number;
    taxMode: AmountMode;
    tipMode: AmountMode;
    total: number;
    currency: string;
  }) => void;
  isSubmitting: boolean;
  submitLabel?: string;
  receiptImageUrl?: string | null;
}

const parseNumber = (value: string) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseInteger = (value: string) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toNumberInputValue = (value: string): number | undefined => {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toFormNumberString = (value: number): string => {
  if (!Number.isFinite(value)) return '';
  return value.toString();
};

const roundTo = (value: number, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

interface ModeDropdownProps {
  mode: AmountMode;
  currencySymbol?: string;
  ariaLabel: string;
  onChange: (mode: AmountMode) => void;
}

const ModeDropdown = ({
  mode,
  currencySymbol,
  ariaLabel,
  onChange,
}: ModeDropdownProps) => (
  <Dropdown placement="bottom-end">
    <DropdownTrigger>
      <div
        role="button"
        tabIndex={0}
        className="hover:bg-default-100 rounded-medium cursor-pointer px-2 py-1"
      >
        <p className="text-description">
          {mode === '$' ? (currencySymbol ?? '$') : '%'}
          <span className="ml-1 text-xs">▾</span>
        </p>
      </div>
    </DropdownTrigger>
    <DropdownMenu
      aria-label={ariaLabel}
      selectionMode="single"
      selectedKeys={[mode]}
      onSelectionChange={(keys) => {
        const selected = Array.from(keys)[0] as AmountMode | undefined;
        if (selected) onChange(selected);
      }}
    >
      <DropdownItem key="$">{currencySymbol ?? '$'}</DropdownItem>
      <DropdownItem key="%">%</DropdownItem>
    </DropdownMenu>
  </Dropdown>
);

export function ItemEditor({
  initialItems,
  initialSubtotal,
  initialTax,
  initialTip,
  initialPriceInterpretation = 'unit',
  initialCurrency = 'SGD',
  initialTaxMode = '$',
  initialTipMode = '$',
  onSubmit,
  isSubmitting,
  submitLabel = 'Create Session',
  receiptImageUrl,
}: ItemEditorProps) {
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const defaultItems =
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
      : [{ name: '', amount: '', quantity: '1' }];

  const toInitialInputValue = (
    amount: number,
    mode: AmountMode,
    baseSubtotal: number,
  ) => {
    if (!amount) return '0';
    if (mode === '%' && baseSubtotal > 0) {
      return roundTo((amount / baseSubtotal) * 100).toString();
    }
    return roundTo(amount).toString();
  };

  const initialTaxInput = toInitialInputValue(
    initialTax,
    initialTaxMode,
    initialSubtotal,
  );
  const initialTipInput = toInitialInputValue(
    initialTip,
    initialTipMode,
    initialSubtotal,
  );

  const {
    control,
    handleSubmit: rhfHandleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ItemEditorFormData>({
    resolver: zodResolver(itemEditorSchema),
    defaultValues: {
      currency: initialCurrency,
      items: defaultItems,
      tax: initialTaxInput,
      tip: initialTipInput,
      taxMode: initialTaxMode,
      tipMode: initialTipMode,
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = useWatch({
    control,
    name: 'items',
    defaultValue: defaultItems,
  });
  const watchedTax = useWatch({
    control,
    name: 'tax',
    defaultValue: initialTaxInput,
  });
  const watchedTip = useWatch({
    control,
    name: 'tip',
    defaultValue: initialTipInput,
  });
  const watchedTaxMode = useWatch({
    control,
    name: 'taxMode',
    defaultValue: initialTaxMode,
  });
  const watchedTipMode = useWatch({
    control,
    name: 'tipMode',
    defaultValue: initialTipMode,
  });
  const watchedCurrency = useWatch({
    control,
    name: 'currency',
    defaultValue: initialCurrency,
  });
  const currencySymbol = getCurrencySymbol(watchedCurrency);

  const subtotal = useMemo(
    () => watchedItems.reduce((sum, item) => sum + parseNumber(item.amount), 0),
    [watchedItems],
  );

  const resolveAmount = useCallback(
    (value: string, mode: AmountMode) => {
      const num = parseNumber(value);
      if (mode === '%') return roundTo((subtotal * num) / 100);
      return roundTo(num);
    },
    [subtotal],
  );

  const taxValue = resolveAmount(watchedTax, watchedTaxMode);
  const tipValue = resolveAmount(watchedTip, watchedTipMode);
  const total = subtotal + taxValue + tipValue;

  const isItemComplete = (item: {
    name: string;
    amount: string;
    quantity: string;
  }) =>
    Boolean(item.name.trim()) &&
    parseNumber(item.amount) > 0 &&
    parseInteger(item.quantity) >= 1;

  const canAddItem = watchedItems.every(isItemComplete);

  const addItem = () => {
    if (!canAddItem) return;
    append({ name: '', amount: '', quantity: '1' });
  };

  const removeItem = (index: number) => {
    if (fields.length <= 1) return;
    remove(index);
  };

  const onDragStartItem = (index: number) => {
    setDraggingIndex(index);
  };

  const onDropItem = (targetIndex: number) => {
    if (draggingIndex === null || draggingIndex === targetIndex) {
      setDraggingIndex(null);
      return;
    }
    move(draggingIndex, targetIndex);
    setDraggingIndex(null);
  };

  const requestRemoveItem = (index: number) => {
    if (fields.length <= 1) return;
    setRemoveIndex(index);
  };

  const cancelRemoveItem = () => {
    setRemoveIndex(null);
  };

  const confirmRemoveItem = () => {
    if (removeIndex === null) return;
    removeItem(removeIndex);
    setRemoveIndex(null);
  };

  // Custom validation and submission
  const onFormSubmit = (data: ItemEditorFormData) => {
    const validItems: ScannedItem[] = data.items
      .map((item) => ({
        name: item.name.trim(),
        quantity: parseInteger(item.quantity),
        amount: parseNumber(item.amount),
      }))
      .map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.quantity > 0 ? item.amount / item.quantity : 0,
      }));

    const computedSubtotal = data.items.reduce(
      (sum, item) => sum + parseNumber(item.amount),
      0,
    );
    const finalTax = resolveAmount(data.tax, data.taxMode);
    const finalTip = resolveAmount(data.tip, data.tipMode);
    const finalTotal = computedSubtotal + finalTax + finalTip;

    onSubmit({
      items: validItems,
      subtotal: computedSubtotal,
      tax: finalTax,
      tip: finalTip,
      taxMode: data.taxMode,
      tipMode: data.tipMode,
      total: finalTotal,
      currency: data.currency,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-2">
        <h4 className="title-card">Review Items</h4>
        <p className="text-description">
          Enter each row amount as shown on the receipt, with quantity in Qty.
        </p>
        <Controller
          name="currency"
          control={control}
          render={({ field }) => (
            <Select
              label="Currency"
              selectedKeys={[field.value]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                if (selected) field.onChange(selected);
              }}
              size="sm"
            >
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} textValue={`${c.code} (${c.name})`}>
                  {c.code} ({c.name})
                </SelectItem>
              ))}
            </Select>
          )}
        />
      </CardHeader>

      <Divider />

      <CardBody className="gap-5">
        {/* Receipt reference image */}
        {receiptImageUrl && <ReceiptImage receiptImageUrl={receiptImageUrl} />}

        {/* Items */}
        <div className="space-y-4">
          {fields.map((field, i) => {
            const parsedAmount = parseNumber(watchedItems[i]?.amount ?? '0');
            const parsedQuantity = parseInteger(
              watchedItems[i]?.quantity ?? '1',
            );
            const amountPerUnit =
              parsedQuantity > 0 ? parsedAmount / parsedQuantity : 0;

            return (
              <div
                key={field.id}
                className="space-y-1.5"
                draggable
                onDragStart={() => onDragStartItem(i)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => onDropItem(i)}
                onDragEnd={() => setDraggingIndex(null)}
              >
                <div className="border-default-200 bg-content1/90 flex flex-col gap-2 rounded-2xl border p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-caption flex items-center gap-2 font-medium tracking-wide uppercase">
                      <span
                        className="cursor-grab select-none"
                        aria-hidden="true"
                      >
                        ⋮⋮
                      </span>
                      Item {i + 1}
                    </p>
                    <Button
                      isIconOnly
                      variant="light"
                      color="danger"
                      size="sm"
                      onPress={() => requestRemoveItem(i)}
                      isDisabled={fields.length <= 1}
                      aria-label="Remove item"
                    >
                      ✕
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:gap-3">
                    <Controller
                      name={`items.${i}.name`}
                      control={control}
                      render={({ field: f }) => (
                        <Input
                          label="Item"
                          placeholder="e.g. Burger"
                          value={f.value}
                          onValueChange={f.onChange}
                          onBlur={f.onBlur}
                          className="w-full sm:col-span-7"
                          size="sm"
                          isInvalid={Boolean(errors.items?.[i]?.name)}
                          errorMessage={errors.items?.[i]?.name?.message}
                          isClearable
                        />
                      )}
                    />
                    <Controller
                      name={`items.${i}.amount`}
                      control={control}
                      render={({ field: f }) => (
                        <NumberInput
                          label="Amount"
                          type="number"
                          placeholder="0.00"
                          value={toNumberInputValue(f.value)}
                          onValueChange={(value) =>
                            f.onChange(toFormNumberString(value))
                          }
                          onBlur={f.onBlur}
                          startContent={
                            <span className="text-description">
                              {currencySymbol}
                            </span>
                          }
                          className="w-full sm:col-span-3"
                          size="sm"
                          isInvalid={Boolean(errors.items?.[i]?.amount)}
                          errorMessage={errors.items?.[i]?.amount?.message}
                          isWheelDisabled
                          hideStepper
                          isClearable
                        />
                      )}
                    />
                    <Controller
                      name={`items.${i}.quantity`}
                      control={control}
                      render={({ field: f }) => (
                        <NumberInput
                          label="Qty"
                          type="number"
                          placeholder="1"
                          value={toNumberInputValue(f.value)}
                          onValueChange={(value) =>
                            f.onChange(toFormNumberString(value))
                          }
                          onBlur={f.onBlur}
                          className="w-full sm:col-span-2"
                          size="sm"
                          isInvalid={Boolean(errors.items?.[i]?.quantity)}
                          errorMessage={errors.items?.[i]?.quantity?.message}
                          hideStepper
                          isWheelDisabled
                          isClearable
                        />
                      )}
                    />
                  </div>
                  {parsedQuantity > 1 && parsedAmount > 0 && (
                    <span className="flex justify-end">
                      <p className="text-caption">
                        {`${formatCurrency({
                          value: amountPerUnit,
                          currency: watchedCurrency,
                          decimal: 2,
                        })} each`}
                      </p>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
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
          <div className="bg-content2 w-full rounded-lg px-3 py-2 text-center">
            <p className="text-caption">Subtotal</p>
            <h5 className="title-subsection">
              {formatCurrency({
                value: subtotal,
                currency: watchedCurrency,
                decimal: 2,
              })}
            </h5>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <Controller
                  name="tax"
                  control={control}
                  render={({ field: f }) => (
                    <NumberInput
                      label={
                        watchedTaxMode === '%' ? 'Tax (% of subtotal)' : 'Tax'
                      }
                      type="number"
                      placeholder="0.00"
                      value={toNumberInputValue(f.value)}
                      onValueChange={(value) =>
                        f.onChange(toFormNumberString(value))
                      }
                      startContent={
                        <span className="text-description">
                          {watchedTaxMode === '$' ? currencySymbol : '%'}
                        </span>
                      }
                      size="sm"
                      isInvalid={
                        Boolean(errors.tax) ||
                        (f.value !== '' && parseNumber(f.value) < 0) ||
                        (watchedTaxMode === '%' && parseNumber(f.value) > 100)
                      }
                      errorMessage={
                        errors.tax?.message ||
                        (f.value !== '' && parseNumber(f.value) < 0
                          ? 'Tax cannot be negative.'
                          : watchedTaxMode === '%' && parseNumber(f.value) > 100
                            ? 'Percentage cannot exceed 100%.'
                            : undefined)
                      }
                      className="flex-1"
                      endContent={
                        <div
                          className="flex items-center"
                          onMouseDown={(event) => event.stopPropagation()}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <ModeDropdown
                            mode={watchedTaxMode}
                            currencySymbol={currencySymbol}
                            ariaLabel="Tax mode"
                            onChange={(mode) =>
                              setValue('taxMode', mode, {
                                shouldTouch: true,
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }
                          />
                        </div>
                      }
                      hideStepper
                      isWheelDisabled
                    />
                  )}
                />
              </div>
              {/* Show resolved tax amount when in percentage mode */}
              {watchedTaxMode === '%' && subtotal > 0 && (
                <span className="flex justify-end">
                  <p className="text-caption">
                    {watchedTaxMode === '%' && parseNumber(watchedTax) > 0 && (
                      <span>
                        {formatCurrency({
                          value: taxValue,
                          currency: watchedCurrency,
                          decimal: 2,
                        })}
                      </span>
                    )}
                  </p>
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <Controller
                  name="tip"
                  control={control}
                  render={({ field: f }) => (
                    <NumberInput
                      label={
                        watchedTipMode === '%'
                          ? 'Service Charge/Tip (% of subtotal)'
                          : 'Service Charge/Tip'
                      }
                      type="number"
                      placeholder="0.00"
                      value={toNumberInputValue(f.value)}
                      onValueChange={(value) =>
                        f.onChange(toFormNumberString(value))
                      }
                      startContent={
                        <span className="text-description">
                          {watchedTipMode === '$' ? currencySymbol : '%'}
                        </span>
                      }
                      size="sm"
                      isInvalid={
                        Boolean(errors.tip) ||
                        (f.value !== '' && parseNumber(f.value) < 0) ||
                        (watchedTipMode === '%' && parseNumber(f.value) > 100)
                      }
                      errorMessage={
                        errors.tip?.message ||
                        (f.value !== '' && parseNumber(f.value) < 0
                          ? 'Tip cannot be negative.'
                          : watchedTipMode === '%' && parseNumber(f.value) > 100
                            ? 'Percentage cannot exceed 100%.'
                            : undefined)
                      }
                      className="flex-1"
                      endContent={
                        <div
                          className="flex items-center"
                          onMouseDown={(event) => event.stopPropagation()}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <ModeDropdown
                            mode={watchedTipMode}
                            currencySymbol={currencySymbol}
                            ariaLabel="Tip mode"
                            onChange={(mode) =>
                              setValue('tipMode', mode, {
                                shouldTouch: true,
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }
                          />
                        </div>
                      }
                      hideStepper
                      isWheelDisabled
                    />
                  )}
                />
              </div>
              {/* Show resolved tip amount when in percentage mode */}
              {watchedTipMode === '%' && subtotal > 0 && (
                <span className="flex justify-end">
                  <p className="text-caption flex">
                    {watchedTipMode === '%' && parseNumber(watchedTip) > 0 && (
                      <span>
                        {formatCurrency({
                          value: tipValue,
                          currency: watchedCurrency,
                          decimal: 2,
                        })}
                      </span>
                    )}
                  </p>
                </span>
              )}
            </div>
          </div>

          <div className="bg-content2 w-full rounded-lg px-3 py-2 text-center">
            <p className="text-caption">Total</p>
            <h3 className="title-section">
              {formatCurrency({
                value: total,
                currency: watchedCurrency,
                decimal: 2,
              })}
            </h3>
          </div>
        </div>

        <Button
          color="primary"
          size="lg"
          onPress={() => rhfHandleSubmit(onFormSubmit)()}
          isLoading={isSubmitting}
        >
          {submitLabel}
        </Button>
      </CardBody>

      <Modal isOpen={removeIndex !== null} onOpenChange={cancelRemoveItem}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Remove item?</ModalHeader>
              <ModalBody>
                <p>
                  This will remove{' '}
                  {removeIndex !== null
                    ? watchedItems[removeIndex]?.name?.trim() ||
                      `Item ${removeIndex + 1}`
                    : ''}
                  . Continue?
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  onPress={() => {
                    cancelRemoveItem();
                    onClose();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={() => {
                    confirmRemoveItem();
                    onClose();
                  }}
                >
                  Remove
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Card>
  );
}
