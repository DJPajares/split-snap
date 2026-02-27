"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Input,
  addToast,
} from "@heroui/react";
import { QRCodeSVG } from "qrcode.react";

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
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${sessionCode}`
      : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      addToast({ title: "Link copied!", color: "success" });
    } catch {
      addToast({ title: "Failed to copy", color: "danger" });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="center">
      <ModalContent>
        <ModalHeader>Share This Session</ModalHeader>
        <ModalBody className="pb-6 gap-6">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-xl">
              <QRCodeSVG value={shareUrl} size={200} level="M" />
            </div>
            <p className="text-sm text-default-500 text-center">
              Scan this QR code or share the link below
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              readOnly
              value={shareUrl}
              size="sm"
              className="flex-1"
            />
            <Button color="primary" size="sm" onPress={copyLink}>
              Copy
            </Button>
          </div>

          <div className="text-center">
            <p className="text-lg font-mono font-bold tracking-widest">
              {sessionCode}
            </p>
            <p className="text-xs text-default-400">Session Code</p>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
