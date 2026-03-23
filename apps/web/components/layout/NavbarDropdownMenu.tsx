import { Dropdown, toast } from '@heroui/react';
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
import packageInfo from '@/package.json';

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
        <Dropdown.Menu aria-label="User menu">
          <Dropdown.Item
            id="dark-mode"
            textValue="New file"
            onPress={handleDarkModeToggle}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <div className="flex flex-row items-center gap-2">
                <IconSunFilled size={20} />
                <p>Light Mode</p>
              </div>
            ) : (
              <div className="flex flex-row items-center gap-2">
                <IconMoon size={20} />
                <p>Dark Mode</p>
              </div>
            )}
          </Dropdown.Item>

          {user ? (
            <Dropdown.Item
              key="logout"
              aria-label="Log out"
              onPress={handleLogout}
              variant="danger"
            >
              <div className="flex flex-row items-center justify-between gap-2">
                <div className="flex flex-row items-center gap-2">
                  <IconLogout size={20} />
                  <p>Log Out</p>
                </div>
                <p className="text-caption">{`v${packageInfo.version}`}</p>
              </div>
            </Dropdown.Item>
          ) : (
            <Dropdown.Item
              key="login"
              aria-label="Log in"
              onPress={handleLogin}
            >
              <div className="flex flex-row items-center justify-between gap-2">
                <div className="flex flex-row items-center gap-2">
                  <IconLogin size={20} />
                  <p>Log In</p>
                </div>
                <p className="text-caption">{`v${packageInfo.version}`}</p>
              </div>
            </Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
