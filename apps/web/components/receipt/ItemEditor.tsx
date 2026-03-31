'use client';

import {
  Button,
  Card,
  CardHeader,
  Dropdown,
  FieldError,
  Input,
  InputGroup,
  Label,
  ListBox,
  Modal,
  Select,
  Separator,
  Surface,
  TextField,
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
import { IconGridDots, IconPlus, IconX } from '@tabler/icons-react';
import { useCallback, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';

import {
  TypographyCaption,
  TypographyCardTitle,
  TypographyMuted,
  TypographyOverline,
  TypographySectionTitle,
  TypographySubsectionTitle,
} from '../shared/Typography';
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

// const toNumberInputValue = (value: string): number | undefined => {
//   if (value.trim() === '') return undefined;
//   const parsed = Number(value);
//   return Number.isFinite(parsed) ? parsed : undefined;
// };

// const toFormNumberString = (value: number): string => {
//   if (!Number.isFinite(value)) return '';
//   return value.toString();
// };

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
  <Dropdown>
    {/* Trigger */}
    <Dropdown.Trigger>
      <div role="button" tabIndex={0}>
        <p className="text-description">
          {mode === '$' ? (currencySymbol ?? '$') : '%'}
          <span className="ml-1 text-xs">▾</span>
        </p>
      </div>
    </Dropdown.Trigger>
    {/* Menu */}
    <Dropdown.Popover className="min-w-32">
      <Dropdown.Menu
        aria-label={ariaLabel}
        selectionMode="single"
        selectedKeys={[mode]}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as AmountMode | undefined;
          if (selected) onChange(selected);
        }}
      >
        <Dropdown.Item id="$" textValue={currencySymbol ?? '$'}>
          <Label>{currencySymbol ?? '$'}</Label>
          <Dropdown.ItemIndicator />
        </Dropdown.Item>
        <Dropdown.Item id="%" textValue="%">
          <Label>%</Label>
          <Dropdown.ItemIndicator />
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown.Popover>
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
    handleSubmit,
    setValue,
    // formState: { errors },
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
        <TypographyCardTitle>Review Items</TypographyCardTitle>
        <TypographyMuted>
          Enter each row amount as shown on the receipt, with quantity in Qty.
        </TypographyMuted>

        <Controller
          name="currency"
          control={control}
          render={({ field }) => (
            <Select
              variant="secondary"
              placeholder="Select currency"
              name={field.name}
              value={field.value}
              onChange={(key) => {
                if (key !== null) {
                  field.onChange(String(key));
                }
              }}
              onBlur={field.onBlur}
              fullWidth
            >
              <Label>Currency</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {CURRENCIES.map((currency) => (
                    <ListBox.Item
                      key={currency.code}
                      id={currency.code}
                      textValue={`${currency.code} (${currency.name})`}
                    >
                      {currency.code} ({currency.name})
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          )}
        />
      </CardHeader>

      <Separator />

      <Card.Content className="gap-5">
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
                <div className="border-default-200 bg-surface/90 flex flex-col gap-2 rounded-2xl border p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <TypographyCaption className="flex items-center gap-2 font-medium tracking-wide uppercase">
                      <IconGridDots
                        size={12}
                        className="cursor-grab"
                        aria-hidden="true"
                      />
                      Item {i + 1}
                    </TypographyCaption>
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => requestRemoveItem(i)}
                      isDisabled={fields.length <= 1}
                      aria-label="Remove item"
                      className="text-danger"
                      isIconOnly
                    >
                      <IconX />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:gap-3">
                    <Controller
                      name={`items.${i}.name`}
                      control={control}
                      render={({ field }) => (
                        <TextField type="text" className="w-full sm:col-span-6">
                          <Label>Item</Label>
                          <Input
                            variant="secondary"
                            placeholder="Burger"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            className="w-full sm:col-span-7"
                          />
                          <FieldError />
                        </TextField>
                      )}
                    />
                    <Controller
                      name={`items.${i}.amount`}
                      control={control}
                      render={({ field }) => (
                        // <NumberInput
                        //   label="Amount"
                        //   type="number"
                        //   placeholder="0.00"
                        //   value={toNumberInputValue(f.value)}
                        //   onValueChange={(value) =>
                        //     f.onChange(toFormNumberString(value))
                        //   }
                        //   onBlur={f.onBlur}
                        //   startContent={
                        //     <span className="text-description">
                        //       {currencySymbol}
                        //     </span>
                        //   }
                        //   className="w-full sm:col-span-3"
                        //   size="sm"
                        //   isInvalid={Boolean(errors.items?.[i]?.amount)}
                        //   errorMessage={errors.items?.[i]?.amount?.message}
                        //   isWheelDisabled
                        //   hideStepper
                        //   isClearable
                        // />

                        <TextField className="w-full sm:col-span-4">
                          <Label>Amount</Label>
                          <InputGroup variant="secondary">
                            <InputGroup.Prefix>
                              <TypographyOverline>
                                {currencySymbol}
                              </TypographyOverline>
                            </InputGroup.Prefix>
                            <InputGroup.Input
                              placeholder="0.00"
                              type="number"
                              inputMode="decimal"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                            />
                            {/* <InputGroup.Suffix>
                              {watchedCurrency}
                            </InputGroup.Suffix> */}
                          </InputGroup>
                          <FieldError />
                        </TextField>
                      )}
                    />
                    <Controller
                      name={`items.${i}.quantity`}
                      control={control}
                      render={({ field }) => (
                        // <NumberInput
                        //   label="Qty"
                        //   type="number"
                        //   placeholder="1"
                        //   value={toNumberInputValue(f.value)}
                        //   onValueChange={(value) =>
                        //     f.onChange(toFormNumberString(value))
                        //   }
                        //   onBlur={f.onBlur}
                        //   className="w-full sm:col-span-2"
                        //   size="sm"
                        //   isInvalid={Boolean(errors.items?.[i]?.quantity)}
                        //   errorMessage={errors.items?.[i]?.quantity?.message}
                        //   hideStepper
                        //   isWheelDisabled
                        //   isClearable
                        // />

                        <TextField className="w-full sm:col-span-2">
                          <Label>Qty</Label>
                          <Input
                            variant="secondary"
                            placeholder="1"
                            type="number"
                            inputMode="numeric"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                          />
                          <FieldError />
                        </TextField>
                      )}
                    />
                  </div>
                  {parsedQuantity > 1 && parsedAmount > 0 && (
                    <span className="flex justify-end">
                      <TypographyCaption>
                        {`${formatCurrency({
                          value: amountPerUnit,
                          currency: watchedCurrency,
                          decimal: 2,
                        })} each`}
                      </TypographyCaption>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Button
          variant="tertiary"
          size="sm"
          onPress={addItem}
          isDisabled={!canAddItem}
          className="self-start"
        >
          <IconPlus />
          Add Item
        </Button>

        <Separator />

        {/* Totals */}
        <div className="space-y-3">
          <Surface variant="secondary" className="rounded-lg p-2 text-center">
            <TypographyCaption>Subtotal</TypographyCaption>
            <TypographySubsectionTitle>
              {formatCurrency({
                value: subtotal,
                currency: watchedCurrency,
                decimal: 2,
              })}
            </TypographySubsectionTitle>
          </Surface>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <Controller
                  name="tax"
                  control={control}
                  render={({ field }) => (
                    // <NumberInput
                    //   label={
                    //     watchedTaxMode === '%' ? 'Tax (% of subtotal)' : 'Tax'
                    //   }
                    //   type="number"
                    //   placeholder="0.00"
                    //   value={toNumberInputValue(f.value)}
                    //   onValueChange={(value) =>
                    //     f.onChange(toFormNumberString(value))
                    //   }
                    //   startContent={
                    //     <span className="text-description">
                    //       {watchedTaxMode === '$' ? currencySymbol : '%'}
                    //     </span>
                    //   }
                    //   size="sm"
                    //   isInvalid={
                    //     Boolean(errors.tax) ||
                    //     (f.value !== '' && parseNumber(f.value) < 0) ||
                    //     (watchedTaxMode === '%' && parseNumber(f.value) > 100)
                    //   }
                    //   errorMessage={
                    //     errors.tax?.message ||
                    //     (f.value !== '' && parseNumber(f.value) < 0
                    //       ? 'Tax cannot be negative.'
                    //       : watchedTaxMode === '%' && parseNumber(f.value) > 100
                    //         ? 'Percentage cannot exceed 100%.'
                    //         : undefined)
                    //   }
                    //   className="flex-1"
                    //   endContent={
                    //     <div
                    //       className="flex items-center"
                    //       onMouseDown={(event) => event.stopPropagation()}
                    //       onClick={(event) => event.stopPropagation()}
                    //     >
                    //       <ModeDropdown
                    //         mode={watchedTaxMode}
                    //         currencySymbol={currencySymbol}
                    //         ariaLabel="Tax mode"
                    //         onChange={(mode) =>
                    //           setValue('taxMode', mode, {
                    //             shouldTouch: true,
                    //             shouldDirty: true,
                    //             shouldValidate: true,
                    //           })
                    //         }
                    //       />
                    //     </div>
                    //   }
                    //   hideStepper
                    //   isWheelDisabled
                    // />

                    <TextField className="w-full sm:col-span-4">
                      <Label>
                        {watchedTaxMode === '%' ? 'Tax (% of subtotal)' : 'Tax'}
                      </Label>
                      <InputGroup variant="secondary">
                        <InputGroup.Prefix>
                          <TypographyOverline>
                            {watchedTaxMode === '$' ? currencySymbol : '%'}
                          </TypographyOverline>
                        </InputGroup.Prefix>
                        <InputGroup.Input
                          placeholder="0.00"
                          type="number"
                          inputMode="decimal"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                        <InputGroup.Suffix>
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
                        </InputGroup.Suffix>
                      </InputGroup>
                      <FieldError />
                    </TextField>

                    // <NumberField
                    //   className="w-full sm:col-span-2"
                    //   value={toNumberInputValue(field.value)}
                    //   onChange={(value) =>
                    //     field.onChange(toFormNumberString(value))
                    //   }
                    //   isWheelDisabled
                    // >
                    //   <Label>Qty</Label>
                    //   <NumberField.Group>
                    //     <NumberField.Input placeholder="1" type="number" />
                    //   </NumberField.Group>
                    //   <FieldError />
                    // </NumberField>
                  )}
                />
              </div>
              {/* Show resolved tax amount when in percentage mode */}
              {watchedTaxMode === '%' && subtotal > 0 && (
                <span className="flex justify-end">
                  <TypographyCaption>
                    {watchedTaxMode === '%' && parseNumber(watchedTax) > 0 && (
                      <span>
                        {formatCurrency({
                          value: taxValue,
                          currency: watchedCurrency,
                          decimal: 2,
                        })}
                      </span>
                    )}
                  </TypographyCaption>
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <Controller
                  name="tip"
                  control={control}
                  render={({ field }) => (
                    // <NumberInput
                    //   label={
                    //     watchedTipMode === '%'
                    //       ? 'Service Charge/Tip (% of subtotal)'
                    //       : 'Service Charge/Tip'
                    //   }
                    //   type="number"
                    //   placeholder="0.00"
                    //   value={toNumberInputValue(f.value)}
                    //   onValueChange={(value) =>
                    //     f.onChange(toFormNumberString(value))
                    //   }
                    //   startContent={
                    //     <span className="text-description">
                    //       {watchedTipMode === '$' ? currencySymbol : '%'}
                    //     </span>
                    //   }
                    //   size="sm"
                    //   isInvalid={
                    //     Boolean(errors.tip) ||
                    //     (f.value !== '' && parseNumber(f.value) < 0) ||
                    //     (watchedTipMode === '%' && parseNumber(f.value) > 100)
                    //   }
                    //   errorMessage={
                    //     errors.tip?.message ||
                    //     (f.value !== '' && parseNumber(f.value) < 0
                    //       ? 'Tip cannot be negative.'
                    //       : watchedTipMode === '%' && parseNumber(f.value) > 100
                    //         ? 'Percentage cannot exceed 100%.'
                    //         : undefined)
                    //   }
                    //   className="flex-1"
                    //   endContent={
                    //     <div
                    //       className="flex items-center"
                    //       onMouseDown={(event) => event.stopPropagation()}
                    //       onClick={(event) => event.stopPropagation()}
                    //     >
                    //       <ModeDropdown
                    //         mode={watchedTipMode}
                    //         currencySymbol={currencySymbol}
                    //         ariaLabel="Tip mode"
                    //         onChange={(mode) =>
                    //           setValue('tipMode', mode, {
                    //             shouldTouch: true,
                    //             shouldDirty: true,
                    //             shouldValidate: true,
                    //           })
                    //         }
                    //       />
                    //     </div>
                    //   }
                    //   hideStepper
                    //   isWheelDisabled
                    // />

                    <TextField className="w-full sm:col-span-4">
                      <Label>
                        {watchedTipMode === '%'
                          ? 'Service Charge/Tip (% of subtotal)'
                          : 'Service Charge/Tip'}
                      </Label>
                      <InputGroup variant="secondary">
                        <InputGroup.Prefix>
                          <TypographyOverline>
                            {watchedTipMode === '$' ? currencySymbol : '%'}
                          </TypographyOverline>
                        </InputGroup.Prefix>
                        <InputGroup.Input
                          placeholder="0.00"
                          type="number"
                          inputMode="decimal"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                        <InputGroup.Suffix>
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
                        </InputGroup.Suffix>
                      </InputGroup>
                      <FieldError />
                    </TextField>
                  )}
                />
              </div>
              {/* Show resolved tip amount when in percentage mode */}
              {watchedTipMode === '%' && subtotal > 0 && (
                <span className="flex justify-end">
                  <TypographyCaption className="flex">
                    {watchedTipMode === '%' && parseNumber(watchedTip) > 0 && (
                      <span>
                        {formatCurrency({
                          value: tipValue,
                          currency: watchedCurrency,
                          decimal: 2,
                        })}
                      </span>
                    )}
                  </TypographyCaption>
                </span>
              )}
            </div>
          </div>

          <Surface variant="secondary" className="rounded-lg p-2 text-center">
            <TypographyCaption>Total</TypographyCaption>
            <TypographySectionTitle>
              {formatCurrency({
                value: total,
                currency: watchedCurrency,
                decimal: 2,
              })}
            </TypographySectionTitle>
          </Surface>
        </div>

        <Button
          size="lg"
          onPress={() => handleSubmit(onFormSubmit)()}
          isPending={isSubmitting}
          fullWidth
        >
          {submitLabel}
        </Button>
      </Card.Content>

      <Modal.Backdrop
        isOpen={removeIndex !== null}
        onOpenChange={cancelRemoveItem}
      >
        <Modal.Container>
          <Modal.Dialog aria-label="Remove item confirmation">
            {({ close }) => (
              <>
                <Modal.Header>Remove item?</Modal.Header>
                <Modal.Body>
                  <p>
                    This will remove{' '}
                    {removeIndex !== null
                      ? watchedItems[removeIndex]?.name?.trim().toLowerCase() ||
                        `Item ${removeIndex + 1}`
                      : ''}
                    . Continue?
                  </p>
                </Modal.Body>
                <Modal.Footer>
                  <Button
                    variant="tertiary"
                    onPress={() => {
                      cancelRemoveItem();
                      close();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onPress={() => {
                      confirmRemoveItem();
                      close();
                    }}
                  >
                    Remove
                  </Button>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Card>
  );
}
