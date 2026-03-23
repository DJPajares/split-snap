'use client';

import { Button, Modal } from '@heroui/react';
import { useRouter } from 'next/navigation';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';

// ─── Types ─────────────────────────────────────────────────

interface ErrorModalOptions {
  /** Where to navigate when the user clicks the action button (default: none/close). */
  redirectTo?: string;
  /** Custom label for the action button (default: "OK" or "Go Home" when redirectTo is set). */
  actionLabel?: string;
  /** Callback fired when the modal is closed/dismissed. */
  onClose?: () => void;
}

interface ErrorModalContextValue {
  showErrorModal: (
    title: string,
    message: string,
    options?: ErrorModalOptions,
  ) => void;
}

// ─── Context ───────────────────────────────────────────────

const ErrorModalContext = createContext<ErrorModalContextValue | null>(null);

export function useErrorModal() {
  const ctx = useContext(ErrorModalContext);
  if (!ctx)
    throw new Error('useErrorModal must be used within ErrorModalProvider');
  return ctx;
}

// ─── Provider ──────────────────────────────────────────────

interface ModalState {
  title: string;
  message: string;
  options?: ErrorModalOptions;
}

export function ErrorModalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState | null>(null);

  const showErrorModal = useCallback(
    (title: string, message: string, options?: ErrorModalOptions) => {
      setModal({ title, message, options });
    },
    [],
  );

  const handleClose = useCallback(() => {
    const onClose = modal?.options?.onClose;
    const redirectTo = modal?.options?.redirectTo;
    setModal(null);
    onClose?.();
    if (redirectTo) {
      router.push(redirectTo);
    }
  }, [modal, router]);

  return (
    <ErrorModalContext.Provider value={{ showErrorModal }}>
      {children}

      <Modal>
        <Modal.Backdrop
          isOpen={modal !== null}
          onOpenChange={(open) => {
            if (!open) handleClose();
          }}
          isDismissable={false}
        >
          <Modal.Container>
            <Modal.Dialog>
              {() => (
                <>
                  <Modal.Header className="flex items-center gap-2">
                    <span className="text-danger text-xl">⚠️</span>
                    {modal?.title}
                  </Modal.Header>
                  <Modal.Body>
                    <p className="text-description-lg">{modal?.message}</p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button onPress={handleClose}>
                      {modal?.options?.actionLabel ??
                        (modal?.options?.redirectTo ? 'Go Home' : 'OK')}
                    </Button>
                  </Modal.Footer>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </ErrorModalContext.Provider>
  );
}
