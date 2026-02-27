"use client";

import { useRef, useState, useCallback } from "react";
import {
  Card,
  CardBody,
  Button,
  Spinner,
} from "@heroui/react";

interface ReceiptUploaderProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

export function ReceiptUploader({ onFileSelected, isLoading }: ReceiptUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      setPreview(url);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <Card
      className={`border-2 border-dashed transition-colors ${
        isDragging ? "border-primary bg-primary/10" : "border-default-300"
      }`}
    >
      <CardBody
        className="flex flex-col items-center justify-center p-8 gap-4 min-h-[200px] cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {isLoading ? (
          <>
            <Spinner size="lg" color="primary" />
            <p className="text-default-500">Scanning receipt with AI...</p>
          </>
        ) : preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Receipt preview"
              className="max-h-48 rounded-lg object-contain"
            />
            <p className="text-sm text-default-500">
              Click or drop to replace
            </p>
          </>
        ) : (
          <>
            <span className="text-5xl">📸</span>
            <p className="font-semibold text-lg">
              Drop a receipt image or tap to scan
            </p>
            <p className="text-sm text-default-500">
              Supports JPEG, PNG, HEIC
            </p>
            <Button
              color="primary"
              variant="flat"
              onPress={() => inputRef.current?.click()}
            >
              Choose File
            </Button>
          </>
        )}
      </CardBody>
    </Card>
  );
}
