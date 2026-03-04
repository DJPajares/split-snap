import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Session } from '@split-snap/shared/types';
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
  isSelected?: boolean;
  isDisabled?: boolean;
  onChange?: () => void;
}

vi.mock('@heroui/react', () => ({
  Card: ({ children, onPress, isPressable }: MockCardProps) => (
    <button onClick={onPress} disabled={!isPressable}>
      {children}
    </button>
  ),
  CardBody: ({ children }: MockCardBodyProps) => <div>{children}</div>,
  Chip: ({ children }: MockChipProps) => <span>{children}</span>,
  Checkbox: ({ isSelected, isDisabled, onChange }: MockCheckboxProps) => (
    <input
      aria-label="claim-item"
      type="checkbox"
      checked={isSelected}
      disabled={isDisabled}
      onChange={onChange}
    />
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
      />,
    );

    await user.click(screen.getByLabelText('claim-item'));

    expect(onClaimToggle).not.toHaveBeenCalled();
  });
});
