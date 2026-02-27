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

export function ItemEditor({
  initialItems,
  initialSubtotal,
  initialTax,
  initialTip,
  initialTotal,
  onSubmit,
  isSubmitting,
}: ItemEditorProps) {
  const [items, setItems] = useState<ScannedItem[]>(
    initialItems.length > 0
      ? initialItems
      : [{ name: "", price: 0, quantity: 1 }]
  );
  const [tax, setTax] = useState(initialTax);
  const [tip, setTip] = useState(initialTip);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + tax + tip;

  const updateItem = (index: number, field: keyof ScannedItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, { name: "", price: 0, quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const validItems = items.filter((item) => item.name.trim() && item.price > 0);
    if (validItems.length === 0) return;
    onSubmit({ items: validItems, subtotal, tax, tip, total });
  };

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
                value={item.price.toString()}
                onValueChange={(val) => updateItem(i, "price", parseFloat(val) || 0)}
                startContent={<span className="text-default-400 text-sm">$</span>}
                className="w-full sm:w-28"
                size="sm"
              />
              <Input
                label="Qty"
                type="number"
                value={item.quantity.toString()}
                onValueChange={(val) =>
                  updateItem(i, "quantity", Math.max(1, parseInt(val) || 1))
                }
                className="w-full sm:w-20"
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
            value={tax.toString()}
            onValueChange={(val) => setTax(parseFloat(val) || 0)}
            startContent={<span className="text-default-400 text-sm">$</span>}
            size="sm"
          />
          <Input
            label="Tip"
            type="number"
            value={tip.toString()}
            onValueChange={(val) => setTip(parseFloat(val) || 0)}
            startContent={<span className="text-default-400 text-sm">$</span>}
            size="sm"
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
          isDisabled={items.filter((i) => i.name.trim() && i.price > 0).length === 0}
        >
          Create Session
        </Button>
      </CardBody>
    </Card>
  );
}
