'use client';

import { Button, Card, CardBody, Spinner } from '@heroui/react';
import { useCallback, useRef, useState } from 'react';

interface ReceiptUploaderProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

export function ReceiptUploader({
  onFileSelected,
  isLoading,
}: ReceiptUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      setPreview(url);
      onFileSelected(file);
    },
    [onFileSelected],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <Card
      className={`border-2 border-dashed transition-colors ${
        isDragging ? 'border-primary bg-primary/10' : 'border-default-300'
      }`}
    >
      <CardBody
        className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-4 p-8"
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
            <p className="text-default-500 text-sm">Click or drop to replace</p>
          </>
        ) : (
          <>
            <span className="text-5xl">📸</span>
            <p className="text-lg font-semibold">
              Drop a receipt image or tap to scan
            </p>
            <p className="text-default-500 text-sm">Supports JPEG, PNG, HEIC</p>
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
