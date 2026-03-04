import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider, useAuth } from './useAuth';

const meMock = vi.fn();
const loginMock = vi.fn();
const registerMock = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    auth: {
      me: () => meMock(),
      login: (data: unknown) => loginMock(data),
      register: (data: unknown) => registerMock(data),
    },
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    meMock.mockReset();
    loginMock.mockReset();
    registerMock.mockReset();
  });

  it('loads current user when auth token exists', async () => {
    localStorage.setItem('auth_token', 'token-123');
    meMock.mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      name: 'Alex',
      createdAt: new Date().toISOString(),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user?.email).toBe('user@example.com');
    expect(meMock).toHaveBeenCalledTimes(1);
  });

  it('removes stale token when me endpoint fails', async () => {
    localStorage.setItem('auth_token', 'stale-token');
    meMock.mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('logout restores guest participants and removes non-guest participant keys', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    localStorage.setItem('participant_ABC123', 'user-participant-id');
    localStorage.setItem('guest_participant_ABC123', 'guest-participant-id');

    localStorage.setItem('participant_DEF456', 'another-user-participant-id');

    act(() => {
      result.current.logout();
    });

    expect(localStorage.getItem('participant_ABC123')).toBe(
      'guest-participant-id',
    );
    expect(localStorage.getItem('guest_participant_ABC123')).toBeNull();
    expect(localStorage.getItem('participant_DEF456')).toBeNull();
  });
});
