'use client';

import { Button, Input, Modal, toast } from '@heroui/react';
import { QRCodeSVG } from 'qrcode.react';

import { TypographyCaption, TypographyMuted } from '../shared/Typography';

interface ShareLinkModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sessionCode: string;
}

export function ShareLinkModal({
  isOpen,
  onOpenChange,
  sessionCode,
}: ShareLinkModalProps) {
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${sessionCode}`
      : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      onOpenChange(false);
      toast.success('Link copied!');
    } catch {
      toast.danger('Failed to copy');
    }
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container placement="center">
        <Modal.Dialog aria-label="Share This Session">
          {({ close }) => (
            <>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Share This Session</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <div className="gap-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="rounded-xl bg-white p-4">
                      <QRCodeSVG value={shareUrl} size={200} level="M" />
                    </div>
                    <TypographyMuted className="text-center">
                      Scan this QR code or share the link below
                    </TypographyMuted>
                  </div>

                  <div className="flex gap-2">
                    <Input value={shareUrl} className="flex-1" readOnly />
                    <Button
                      size="sm"
                      onPress={() => {
                        copyLink();
                        close();
                      }}
                    >
                      Copy
                    </Button>
                  </div>

                  <div className="text-center">
                    <p className="font-mono text-lg font-bold tracking-widest">
                      {sessionCode}
                    </p>
                    <TypographyCaption>Session Code</TypographyCaption>
                  </div>
                </div>
              </Modal.Body>
            </>
          )}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
