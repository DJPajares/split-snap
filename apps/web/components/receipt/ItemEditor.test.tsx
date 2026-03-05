import type { ScannedItem } from '@split-snap/shared/types';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ItemEditor } from './ItemEditor';

// --- Mocks for @heroui/react ---

interface MockChildrenProps {
  children: ReactNode;
}
interface MockButtonProps {
  children: ReactNode;
  onPress?: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
  isIconOnly?: boolean;
  'aria-label'?: string;
  [key: string]: unknown;
}
interface MockInputProps {
  label?: string;
  value?: string;
  placeholder?: string;
  onValueChange?: (v: string) => void;
  onBlur?: () => void;
  isInvalid?: boolean;
  errorMessage?: string;
  [key: string]: unknown;
}
interface MockNumberInputProps {
  label?: string;
  value?: number;
  placeholder?: string;
  onValueChange?: (v: number) => void;
  onBlur?: () => void;
  isInvalid?: boolean;
  errorMessage?: string;
  [key: string]: unknown;
}
interface MockSelectProps {
  label?: string;
  children: ReactNode;
  selectedKeys?: string[];
  onSelectionChange?: (keys: Set<string>) => void;
  [key: string]: unknown;
}
interface MockModalProps {
  children: ReactNode | ((onClose: () => void) => ReactNode);
  isOpen?: boolean;
  onOpenChange?: () => void;
}

vi.mock('@heroui/react', () => ({
  Card: ({ children }: MockChildrenProps) => <div>{children}</div>,
  CardHeader: ({ children }: MockChildrenProps) => <div>{children}</div>,
  CardBody: ({ children }: MockChildrenProps) => <div>{children}</div>,
  Divider: () => <hr />,
  Button: ({ children, onPress, isDisabled, ...rest }: MockButtonProps) => (
    <button
      onClick={onPress}
      disabled={isDisabled}
      aria-label={rest['aria-label']}
    >
      {children}
    </button>
  ),
  Input: ({ label, value, onValueChange, placeholder }: MockInputProps) => (
    <label>
      {label}
      <input
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onValueChange?.(e.target.value)}
      />
    </label>
  ),
  NumberInput: ({
    label,
    value,
    onValueChange,
    placeholder,
  }: MockNumberInputProps) => (
    <label>
      {label}
      <input
        type="number"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onValueChange?.(Number(e.target.value))}
      />
    </label>
  ),
  Select: ({ label, children, selectedKeys }: MockSelectProps) => (
    <label>
      {label}
      <select value={selectedKeys?.[0] ?? ''}>{children}</select>
    </label>
  ),
  SelectItem: ({
    children,
    ...rest
  }: MockChildrenProps & { [key: string]: unknown }) => (
    <option value={String(rest['data-key'] ?? '')}>{children}</option>
  ),
  Dropdown: ({ children }: MockChildrenProps) => <div>{children}</div>,
  DropdownTrigger: ({ children }: MockChildrenProps) => <div>{children}</div>,
  DropdownMenu: ({ children }: MockChildrenProps) => <div>{children}</div>,
  DropdownItem: ({ children }: MockChildrenProps) => <div>{children}</div>,
  Modal: ({ children, isOpen, onOpenChange }: MockModalProps) =>
    isOpen ? (
      <div data-testid="modal">
        {typeof children === 'function'
          ? children(onOpenChange ?? (() => {}))
          : children}
      </div>
    ) : null,
  ModalContent: ({ children }: MockModalProps) => (
    <div>{typeof children === 'function' ? children(() => {}) : children}</div>
  ),
  ModalHeader: ({ children }: MockChildrenProps) => <div>{children}</div>,
  ModalBody: ({ children }: MockChildrenProps) => <div>{children}</div>,
  ModalFooter: ({ children }: MockChildrenProps) => <div>{children}</div>,
}));

// --- Helpers ---

const defaultProps = {
  initialItems: [] as ScannedItem[],
  initialSubtotal: 0,
  initialTax: 0,
  initialTip: 0,
  initialTotal: 0,
  initialCurrency: 'USD',
  onSubmit: vi.fn(),
  isSubmitting: false,
};

const twoItemProps = {
  ...defaultProps,
  initialItems: [
    { name: 'Burger', price: 10, quantity: 1 },
    { name: 'Fries', price: 5, quantity: 2 },
  ] as ScannedItem[],
  initialSubtotal: 20,
  initialTotal: 20,
};

// --- Tests ---

describe('ItemEditor', () => {
  it('renders items from initialItems', () => {
    render(<ItemEditor {...twoItemProps} />);

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Burger')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Fries')).toBeInTheDocument();
  });

  it('renders an empty item row when no initialItems', () => {
    render(<ItemEditor {...defaultProps} />);

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Burger')).toHaveValue('');
  });

  it('shows the custom submit label', () => {
    render(<ItemEditor {...defaultProps} submitLabel="Save Changes" />);

    expect(
      screen.getByRole('button', { name: 'Save Changes' }),
    ).toBeInTheDocument();
  });

  it('defaults submit label to "Create Session"', () => {
    render(<ItemEditor {...defaultProps} />);

    expect(
      screen.getByRole('button', { name: 'Create Session' }),
    ).toBeInTheDocument();
  });

  it('computes and displays subtotal from items', () => {
    render(<ItemEditor {...twoItemProps} />);

    // Burger: 10 * 1 = 10, Fries: 5 * 2 = 10  → subtotal = $20.00
    // Currency symbol and amount are adjacent text nodes in the same <p>
    expect(screen.getByText('Subtotal').nextElementSibling).toHaveTextContent(
      '20.00',
    );
  });

  it('disables "Add Item" button when current item is incomplete', () => {
    render(<ItemEditor {...defaultProps} />);

    const addBtn = screen.getByRole('button', { name: '+ Add Item' });
    expect(addBtn).toBeDisabled();
  });

  it('enables "Add Item" button when all items are complete', () => {
    render(<ItemEditor {...twoItemProps} />);

    const addBtn = screen.getByRole('button', { name: '+ Add Item' });
    expect(addBtn).not.toBeDisabled();
  });

  it('adds a new empty item row when "Add Item" is clicked', async () => {
    const user = userEvent.setup();
    render(<ItemEditor {...twoItemProps} />);

    await user.click(screen.getByRole('button', { name: '+ Add Item' }));

    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('shows remove confirmation modal with item name', async () => {
    const user = userEvent.setup();
    render(<ItemEditor {...twoItemProps} />);

    const removeButtons = screen.getAllByRole('button', {
      name: 'Remove item',
    });
    await user.click(removeButtons[0]);

    const modal = screen.getByTestId('modal');
    expect(within(modal).getByText(/Burger/)).toBeInTheDocument();
  });

  it('shows remove confirmation modal with fallback text for unnamed items', async () => {
    const user = userEvent.setup();
    const propsWithBlankName = {
      ...defaultProps,
      initialItems: [
        { name: '', price: 10, quantity: 1 },
        { name: 'Fries', price: 5, quantity: 1 },
      ] as ScannedItem[],
      initialSubtotal: 15,
      initialTotal: 15,
    };
    render(<ItemEditor {...propsWithBlankName} />);

    const removeButtons = screen.getAllByRole('button', {
      name: 'Remove item',
    });
    await user.click(removeButtons[0]);

    const modal = screen.getByTestId('modal');
    expect(within(modal).getByText(/Item 1/)).toBeInTheDocument();
  });

  it('removes item after confirming in the modal', async () => {
    const user = userEvent.setup();
    render(<ItemEditor {...twoItemProps} />);

    const removeButtons = screen.getAllByRole('button', {
      name: 'Remove item',
    });
    await user.click(removeButtons[0]);

    const modal = screen.getByTestId('modal');
    await user.click(within(modal).getByRole('button', { name: 'Remove' }));

    expect(screen.queryByDisplayValue('Burger')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Fries')).toBeInTheDocument();
  });

  it('cancels removal when Cancel is clicked in modal', async () => {
    const user = userEvent.setup();
    render(<ItemEditor {...twoItemProps} />);

    const removeButtons = screen.getAllByRole('button', {
      name: 'Remove item',
    });
    await user.click(removeButtons[0]);

    const modal = screen.getByTestId('modal');
    await user.click(within(modal).getByRole('button', { name: 'Cancel' }));

    expect(screen.getByDisplayValue('Burger')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Fries')).toBeInTheDocument();
  });

  it('does not show remove button as enabled when only one item', () => {
    render(<ItemEditor {...defaultProps} />);

    const removeBtn = screen.getByRole('button', { name: 'Remove item' });
    expect(removeBtn).toBeDisabled();
  });

  it('shows receipt reference toggle when receiptImageUrl is provided', () => {
    render(
      <ItemEditor
        {...defaultProps}
        receiptImageUrl="https://example.com/r.jpg"
      />,
    );

    expect(screen.getByText('Receipt Reference')).toBeInTheDocument();
  });

  it('does not show receipt reference when no URL', () => {
    render(<ItemEditor {...defaultProps} />);

    expect(screen.queryByText('Receipt Reference')).not.toBeInTheDocument();
  });

  it('calls onSubmit with computed values when form is submitted', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ItemEditor {...twoItemProps} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Create Session' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: 20,
        tax: 0,
        tip: 0,
        total: 20,
        currency: 'USD',
      }),
    );
  });
});
