import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ApiError } from '@/lib/errors';

const { addToastMock, showErrorModalMock } = vi.hoisted(() => ({
  addToastMock: vi.fn(),
  showErrorModalMock: vi.fn(),
}));

vi.mock('@heroui/react', () => ({
  addToast: addToastMock,
}));

vi.mock('@/components/error/error-modal-context', () => ({
  useErrorModal: () => ({
    showErrorModal: showErrorModalMock,
  }),
}));

import { useApiError } from './useApiError';

describe('useApiError', () => {
  beforeEach(() => {
    addToastMock.mockReset();
    showErrorModalMock.mockReset();
  });

  it('shows modal for critical ApiError', () => {
    const { result } = renderHook(() => useApiError({ redirectTo: '/' }));
    const criticalError = new ApiError(
      'SESSION_NOT_FOUND',
      'Session missing',
      404,
    );

    act(() => {
      result.current.handleError(criticalError, 'Cannot continue');
    });

    expect(showErrorModalMock).toHaveBeenCalledWith(
      'Cannot continue',
      'Session missing',
      { redirectTo: '/' },
    );
    expect(addToastMock).not.toHaveBeenCalled();
  });

  it('shows toast for non-ApiError values', () => {
    const { result } = renderHook(() => useApiError());

    act(() => {
      result.current.handleError(new Error('Unexpected failure'));
    });

    expect(addToastMock).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Unexpected failure',
      color: 'danger',
    });
    expect(showErrorModalMock).not.toHaveBeenCalled();
  });
});
