'use client';

import { Button, Card, Spinner } from '@heroui/react';
import { IconCamera } from '@tabler/icons-react';
import { useCallback, useRef, useState } from 'react';

import { TypographyMuted } from '../shared/Typography';

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
        isDragging ? 'border-accent bg-accent/10' : 'border-default-300'
      }`}
    >
      <Card.Content
        className="flex min-h-50 cursor-pointer flex-col items-center justify-center gap-4 p-8 text-center"
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
            <Spinner size="lg" />
            <TypographyMuted className="text-base">
              Scanning receipt with AI...
            </TypographyMuted>
          </>
        ) : preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Receipt preview"
              className="max-h-48 rounded-lg object-contain"
            />
            <TypographyMuted>Click or drop to replace</TypographyMuted>
          </>
        ) : (
          <>
            <IconCamera size={48} />
            <p className="text-lg font-semibold">
              Drop a receipt image or tap to scan
            </p>
            <TypographyMuted>Supports JPEG, PNG, HEIC</TypographyMuted>
            <Button
              variant="tertiary"
              onPress={() => inputRef.current?.click()}
            >
              Choose File
            </Button>
          </>
        )}
      </Card.Content>
    </Card>
  );
}
