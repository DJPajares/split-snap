import { Avatar, Dropdown, Label, toast } from '@heroui/react';
import { STORAGE_KEYS } from '@split-snap/shared/constants';
import {
  IconLogin,
  IconLogout,
  IconMoonFilled,
  IconSunFilled,
  IconUserFilled,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useState } from 'react';

import { useAuth } from '@/hooks/useAuth';

import { TypographyCaption, TypographyLabel } from '../shared/Typography';

export function NavbarDropdownMenu() {
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
      <Dropdown.Trigger>
        {user ? (
          <Avatar size="sm" variant="soft" className="ring-accent ring-2">
            <Avatar.Image src="https://i.pravatar.cc/150?u=a04258114e29026708c" />
            <Avatar.Fallback>
              <IconUserFilled size={20} />
            </Avatar.Fallback>
          </Avatar>
        ) : (
          <Avatar size="sm">
            <Avatar.Fallback>
              <IconUserFilled size={20} />
            </Avatar.Fallback>
          </Avatar>
        )}
      </Dropdown.Trigger>
      <Dropdown.Popover className="min-w-40">
        {/* User Info */}
        {user && (
          <div className="flex items-center gap-3 p-3">
            <Avatar size="sm" variant="soft" className="ring-accent ring-2">
              <Avatar.Image src="https://i.pravatar.cc/150?u=a04258114e29026708c" />
              <Avatar.Fallback>
                <IconUserFilled size={20} />
              </Avatar.Fallback>
            </Avatar>
            <div className="flex flex-col gap-0">
              <TypographyLabel>{user?.name}</TypographyLabel>
              <TypographyCaption>{user?.email}</TypographyCaption>
            </div>
          </div>
        )}

        {/* Items */}
        <Dropdown.Menu aria-label="user menu">
          <Dropdown.Item
            id="dark-mode"
            textValue={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            onPress={handleDarkModeToggle}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <div className="flex w-full items-center justify-between gap-2">
                <Label>Light Mode</Label>
                <IconSunFilled className="text-muted size-3.5" />
              </div>
            ) : (
              <div className="flex w-full items-center justify-between gap-2">
                <Label>Dark Mode</Label>
                <IconMoonFilled className="text-muted size-3.5" />
              </div>
            )}
          </Dropdown.Item>

          {user ? (
            <Dropdown.Item
              id="logout"
              textValue="Log Out"
              aria-label="log out"
              onPress={handleLogout}
            >
              {/* <IconLogout className="text-muted size-4 shrink-0" />
              <Label>Log Out</Label> */}
              <div className="flex w-full items-center justify-between gap-2">
                <Label>Log Out</Label>
                <IconLogout className="text-muted size-3.5" />
              </div>
            </Dropdown.Item>
          ) : (
            <Dropdown.Item
              id="login"
              textValue="Log In"
              aria-label="log in"
              onPress={handleLogin}
            >
              {/* <IconLogin className="text-muted size-4 shrink-0" />
              <Label>Log In</Label> */}
              <div className="flex w-full items-center justify-between gap-2">
                <Label>Log In</Label>
                <IconLogin className="text-muted size-3.5" />
              </div>
            </Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
