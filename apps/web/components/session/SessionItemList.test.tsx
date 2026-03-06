import type { Session } from '@split-snap/shared/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SessionItemList } from './SessionItemList';

interface MockCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  isPressable?: boolean;
}

interface MockCardBodyProps {
  children: React.ReactNode;
}

interface MockChipProps {
  children: React.ReactNode;
}

interface MockCheckboxProps {
  children?: React.ReactNode;
  isSelected?: boolean;
  isDisabled?: boolean;
  isIndeterminate?: boolean;
  onChange?: () => void;
  'aria-label'?: string;
}

vi.mock('@heroui/react', () => ({
  Card: ({ children, onPress, isPressable }: MockCardProps) => (
    <button onClick={onPress} disabled={!isPressable}>
      {children}
    </button>
  ),
  CardBody: ({ children }: MockCardBodyProps) => <div>{children}</div>,
  Chip: ({ children }: MockChipProps) => <span>{children}</span>,
  Checkbox: ({
    children,
    isSelected,
    isDisabled,
    isIndeterminate,
    onChange,
    'aria-label': ariaLabel,
  }: MockCheckboxProps) => (
    <label>
      <input
        aria-label={ariaLabel ?? 'claim-item'}
        type="checkbox"
        checked={isSelected}
        disabled={isDisabled}
        data-indeterminate={isIndeterminate ? 'true' : 'false'}
        onChange={onChange}
      />
      {children}
    </label>
  ),
}));

const baseSession: Session = {
  id: 's1',
  code: 'ABC123',
  createdBy: 'u1',
  receiptImageUrl: null,
  participants: [],
  pendingParticipants: [],
  kickedUsers: [],
  requireApproval: false,
  subtotal: 10,
  tax: 1,
  tip: 1,
  total: 12,
  currency: 'USD',
  status: 'active',
  createdAt: new Date().toISOString(),
  expiresAt: new Date().toISOString(),
  items: [
    {
      id: 'item-1',
      name: 'Burger',
      price: 10,
      quantity: 1,
      claimedBy: [],
    },
  ],
};

describe('SessionItemList', () => {
  it('calls onClaimToggle when pressing an item in active session', async () => {
    const user = userEvent.setup();
    const onClaimToggle = vi.fn();

    render(
      <SessionItemList
        session={baseSession}
        participantId="p1"
        onClaimToggle={onClaimToggle}
        onClaimAllToggle={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button'));

    expect(onClaimToggle).toHaveBeenCalledWith('item-1');
  });

  it('does not call onClaimToggle when session is settled', async () => {
    const user = userEvent.setup();
    const onClaimToggle = vi.fn();

    render(
      <SessionItemList
        session={{ ...baseSession, status: 'settled' }}
        participantId="p1"
        onClaimToggle={onClaimToggle}
        onClaimAllToggle={vi.fn()}
      />,
    );

    await user.click(screen.getByLabelText('claim-item-item-1'));

    expect(onClaimToggle).not.toHaveBeenCalled();
  });

  it('calls onClaimAllToggle once when selecting claim all', async () => {
    const user = userEvent.setup();
    const onClaimToggle = vi.fn();
    const onClaimAllToggle = vi.fn();

    render(
      <SessionItemList
        session={{
          ...baseSession,
          items: [
            {
              id: 'item-1',
              name: 'Burger',
              price: 10,
              quantity: 1,
              claimedBy: [],
            },
            {
              id: 'item-2',
              name: 'Fries',
              price: 5,
              quantity: 1,
              claimedBy: [{ participantId: 'p1', displayName: 'Pat' }],
            },
          ],
        }}
        participantId="p1"
        onClaimToggle={onClaimToggle}
        onClaimAllToggle={onClaimAllToggle}
      />,
    );

    await user.click(screen.getByLabelText('claim-all-items'));

    expect(onClaimAllToggle).toHaveBeenCalledTimes(1);
    expect(onClaimAllToggle).toHaveBeenCalledWith(true);
    expect(onClaimToggle).not.toHaveBeenCalled();
  });
});
