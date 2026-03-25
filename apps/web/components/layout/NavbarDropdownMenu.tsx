import { Dropdown, Label, toast } from '@heroui/react';
import { STORAGE_KEYS } from '@split-snap/shared/constants';
import {
  IconLogin,
  IconLogout,
  IconMoon,
  IconSunFilled,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useState } from 'react';

import { useAuth } from '@/hooks/useAuth';

type NavbarDropdownMenuProps = {
  children: React.ReactNode;
};

export function NavbarDropdownMenu({ children }: NavbarDropdownMenuProps) {
  const { theme, setTheme } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(theme === 'dark');
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleDarkModeToggle = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
    setIsDarkMode(!isDarkMode);
  };

  const handleLogout = () => {
    logout();

    // Clear receipt image from sessionStorage
    try {
      sessionStorage.removeItem(STORAGE_KEYS.KEY_RECEIPT_IMAGE);

      router.push('/auth/login');
    } catch {
      // Ignore
    }

    toast.success('You have been logged out');

    router.push('/');
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  return (
    <Dropdown>
      <Dropdown.Trigger>{children}</Dropdown.Trigger>
      <Dropdown.Popover>
        <Dropdown.Menu aria-label="user menu">
          <Dropdown.Item
            id="dark-mode"
            textValue="New file"
            onPress={handleDarkModeToggle}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <>
                <IconSunFilled className="text-muted size-4 shrink-0" />
                <Label>Light Mode</Label>
              </>
            ) : (
              <>
                <IconMoon className="text-muted size-4 shrink-0" />
                <Label>Dark Mode</Label>
              </>
            )}
          </Dropdown.Item>

          {user ? (
            <Dropdown.Item
              id="logout"
              textValue="Log Out"
              aria-label="log out"
              onPress={handleLogout}
            >
              <IconLogout className="text-muted size-4 shrink-0" />
              <Label>Log Out</Label>
            </Dropdown.Item>
          ) : (
            <Dropdown.Item
              id="login"
              textValue="Log In"
              aria-label="log in"
              onPress={handleLogin}
            >
              <IconLogin className="text-muted size-4 shrink-0" />
              <Label>Log In</Label>
            </Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
