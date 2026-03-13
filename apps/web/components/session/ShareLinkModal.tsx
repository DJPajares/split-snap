'use client';

import {
  addToast,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from '@heroui/react';
import { QRCodeSVG } from 'qrcode.react';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionCode: string;
}

export function ShareLinkModal({
  isOpen,
  onClose,
  sessionCode,
}: ShareLinkModalProps) {
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${sessionCode}`
      : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      addToast({ title: 'Link copied!', color: 'success' });
      onClose();
    } catch {
      addToast({ title: 'Failed to copy', color: 'danger' });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="center">
      <ModalContent>
        <ModalHeader>Share This Session</ModalHeader>
        <ModalBody className="gap-6">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-xl bg-white p-4">
              <QRCodeSVG value={shareUrl} size={200} level="M" />
            </div>
            <p className="text-description text-center">
              Scan this QR code or share the link below
            </p>
          </div>

          <div className="flex gap-2">
            <Input readOnly value={shareUrl} size="sm" className="flex-1" />
            <Button color="primary" size="sm" onPress={copyLink}>
              Copy
            </Button>
          </div>

          <div className="text-center">
            <p className="font-mono text-lg font-bold tracking-widest">
              {sessionCode}
            </p>
            <p className="text-caption">Session Code</p>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
