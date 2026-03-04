'use client';

import { useCallback } from 'react';
import { addToast } from '@heroui/react';
import { useErrorModal } from '@/components/error/error-modal-context';
import { ApiError } from '@/lib/errors';

interface UseApiErrorOptions {
  /** Default redirect for critical errors (e.g. "/" for home). */
  redirectTo?: string;
}

/**
 * Returns a `handleError` function that:
 * - Shows a **modal** for critical/blocking API errors
 * - Shows a **toast** for minor/validation errors
 */
export function useApiError(options?: UseApiErrorOptions) {
  const { showErrorModal } = useErrorModal();

  const handleError = useCallback(
    (err: unknown, toastTitle?: string) => {
      if (err instanceof ApiError && err.isCritical) {
        showErrorModal(toastTitle ?? 'Error', err.message, {
          redirectTo: options?.redirectTo,
        });
        return;
      }

      // Minor / non-critical — use toast
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'An unexpected error occurred';

      addToast({
        title: toastTitle ?? 'Error',
        description: message,
        color: 'danger',
      });
    },
    [showErrorModal, options?.redirectTo],
  );

  return { handleError };
}
