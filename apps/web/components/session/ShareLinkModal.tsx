'use client';

import { Button, Input, Modal, toast } from '@heroui/react';
import { QRCodeSVG } from 'qrcode.react';

interface ShareLinkModalProps {
  isOpen: boolean;
  sessionCode: string;
}

export function ShareLinkModal({ isOpen, sessionCode }: ShareLinkModalProps) {
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${sessionCode}`
      : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied!');
    } catch {
      toast.danger('Failed to copy');
    }
  };

  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen}>
        <Modal.Container placement="center">
          <Modal.Dialog>
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
                      <p className="text-description text-center">
                        Scan this QR code or share the link below
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Input value={shareUrl} className="flex-1" readOnly />
                      <Button
                        variant="primary"
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
                      <p className="text-caption">Session Code</p>
                    </div>
                  </div>
                </Modal.Body>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
