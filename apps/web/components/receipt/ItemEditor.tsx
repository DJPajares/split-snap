"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Card,
  CardBody,
  CardHeader,
  Divider,
} from "@heroui/react";
import type { ScannedItem } from "@split-snap/shared";

interface ItemEditorProps {
  initialItems: ScannedItem[];
  initialSubtotal: number;
  initialTax: number;
  initialTip: number;
  initialTotal: number;
  onSubmit: (data: {
    items: ScannedItem[];
    subtotal: number;
    tax: number;
    tip: number;
    total: number;
  }) => void;
  isSubmitting: boolean;
}

type EditableItem = {
  name: string;
  price: string;
  quantity: string;
};

type ItemField = keyof EditableItem;

type ItemErrors = {
  price?: string;
  quantity?: string;
};

export function ItemEditor({
  initialItems,
  initialTax,
  initialTip,
  onSubmit,
  isSubmitting,
}: ItemEditorProps) {
  const [items, setItems] = useState<EditableItem[]>(
    initialItems.length > 0
      ? initialItems.map((item) => ({
          name: item.name,
          price: item.price ? item.price.toString() : "",
          quantity: item.quantity ? item.quantity.toString() : "",
        }))
      : [{ name: "", price: "", quantity: "" }]
  );
  const [tax, setTax] = useState(initialTax ? initialTax.toString() : "");
  const [tip, setTip] = useState(initialTip ? initialTip.toString() : "");
  const [itemErrors, setItemErrors] = useState<ItemErrors[]>(
    () =>
      (initialItems.length > 0 ? initialItems : [{ name: "", price: 0, quantity: 1 }]).map(
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
    (sum, item) => sum + parseNumber(item.price) * parseInteger(item.quantity),
    0
  );
  const taxValue = parseNumber(tax);
  const tipValue = parseNumber(tip);
  const total = subtotal + taxValue + tipValue;

  const updateItem = (index: number, field: ItemField, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );

    if (field === "price" || field === "quantity") {
      setItemErrors((prev) =>
        prev.map((error, i) =>
          i === index ? { ...error, [field]: undefined } : error
        )
      );
    }
  };

  const validateItemField = (index: number, field: "price" | "quantity") => {
    const value = items[index]?.[field] ?? "";
    let error: string | undefined;

    if (field === "price") {
      if (value.trim() === "") {
        error = "Price is required.";
      } else if (parseNumber(value) < 0) {
        error = "Price cannot be negative.";
      }
    }

    if (field === "quantity") {
      if (value.trim() === "" || parseInteger(value) < 1) {
        error = "Quantity must be at least 1.";
      }
    }

    setItemErrors((prev) =>
      prev.map((itemError, i) =>
        i === index ? { ...itemError, [field]: error } : itemError
      )
    );

    return !error;
  };

  const validateExtraAmount = (value: string, type: "tax" | "tip") => {
    const nextError =
      value.trim() !== "" && parseNumber(value) < 0
        ? `${type === "tax" ? "Tax" : "Tip/Service Charge"} cannot be negative.`
        : undefined;

    if (type === "tax") {
      setTaxError(nextError);
    } else {
      setTipError(nextError);
    }

    return !nextError;
  };

  const addItem = () => {
    setItems((prev) => [...prev, { name: "", price: "", quantity: "" }]);
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
      const priceValue = parseNumber(item.price);
      const quantityValue = parseInteger(item.quantity);

      const rowErrors: ItemErrors = {};

      if (item.name.trim()) {
        if (item.price.trim() === "") {
          rowErrors.price = "Price is required.";
        } else if (priceValue < 0) {
          rowErrors.price = "Price cannot be negative.";
        }

        if (item.quantity.trim() === "" || quantityValue < 1) {
          rowErrors.quantity = "Quantity must be at least 1.";
        }
      }

      if (rowErrors.price || rowErrors.quantity) {
        hasError = true;
      }

      return rowErrors;
    });

    setItemErrors(nextItemErrors);

    const isTaxValid = validateExtraAmount(tax, "tax");
    const isTipValid = validateExtraAmount(tip, "tip");

    if (!isTaxValid || !isTipValid) {
      hasError = true;
    }

    const validItems: ScannedItem[] = items
      .map((item) => ({
        name: item.name.trim(),
        price: parseNumber(item.price),
        quantity: parseInteger(item.quantity),
      }))
      .filter((item) => item.name && item.price > 0 && item.quantity >= 1);

    if (validItems.length === 0 || hasError) return;

    onSubmit({ items: validItems, subtotal, tax: taxValue, tip: tipValue, total });
  };

  const canSubmit =
    items.some(
      (item) =>
        item.name.trim() && parseNumber(item.price) > 0 && parseInteger(item.quantity) >= 1
    ) &&
    itemErrors.every((error) => !error.price && !error.quantity) &&
    !taxError &&
    !tipError;

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-1">
        <h2 className="text-xl font-bold">Review Items</h2>
        <p className="text-sm text-default-500">
          Edit, add, or remove items before creating the session.
        </p>
      </CardHeader>
      <Divider />
      <CardBody className="gap-4">
        {/* Items */}
        <div className="space-y-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row gap-2 items-start sm:items-end"
            >
              <Input
                label="Item"
                placeholder="e.g. Burger"
                value={item.name}
                onValueChange={(val) => updateItem(i, "name", val)}
                className="flex-1"
                size="sm"
              />
              <Input
                label="Price"
                type="number"
                placeholder="0.00"
                value={item.price}
                onValueChange={(val) => updateItem(i, "price", val)}
                onBlur={() => validateItemField(i, "price")}
                startContent={<span className="text-default-400 text-sm">$</span>}
                className="w-full sm:w-28"
                size="sm"
                isInvalid={Boolean(itemErrors[i]?.price)}
                errorMessage={itemErrors[i]?.price}
              />
              <Input
                label="Qty"
                type="number"
                placeholder="1"
                value={item.quantity}
                onValueChange={(val) => updateItem(i, "quantity", val)}
                onBlur={() => validateItemField(i, "quantity")}
                className="w-full sm:w-20"
                size="sm"
                isInvalid={Boolean(itemErrors[i]?.quantity)}
                errorMessage={itemErrors[i]?.quantity}
              />
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
          ))}
        </div>

        <Button variant="flat" size="sm" onPress={addItem} className="self-start">
          + Add Item
        </Button>

        <Divider />

        {/* Totals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Tax"
            type="number"
            placeholder="0.00"
            value={tax}
            onValueChange={(val) => {
              setTax(val);
              setTaxError(undefined);
            }}
            onBlur={() => validateExtraAmount(tax, "tax")}
            startContent={<span className="text-default-400 text-sm">$</span>}
            size="sm"
            isInvalid={Boolean(taxError)}
            errorMessage={taxError}
          />
          <Input
            label="Tip/Service Charge"
            type="number"
            placeholder="0.00"
            value={tip}
            onValueChange={(val) => {
              setTip(val);
              setTipError(undefined);
            }}
            onBlur={() => validateExtraAmount(tip, "tip")}
            startContent={<span className="text-default-400 text-sm">$</span>}
            size="sm"
            isInvalid={Boolean(tipError)}
            errorMessage={tipError}
          />
          <div className="flex items-end">
            <div className="w-full bg-content2 rounded-lg p-3 text-center">
              <p className="text-xs text-default-500">Total</p>
              <p className="text-lg font-bold">${total.toFixed(2)}</p>
            </div>
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
          Create Session
        </Button>
      </CardBody>
    </Card>
  );
}
