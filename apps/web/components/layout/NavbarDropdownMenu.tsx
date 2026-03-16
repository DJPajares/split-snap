import {
  addToast,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@heroui/react';
import { Icon } from '@iconify/react';
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
      sessionStorage.removeItem('receipt_image');
    } catch {
      // Ignore
    }

    addToast({
      title: 'You have been logged out',
      color: 'success',
    });

    router.push('/');
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  return (
    <Dropdown>
      <DropdownTrigger>{children}</DropdownTrigger>
      <DropdownMenu aria-label="User menu">
        <DropdownItem
          key="dark-mode"
          aria-label="Toggle dark mode"
          onPress={handleDarkModeToggle}
        >
          {isDarkMode ? (
            <span className="flex items-center">
              <Icon icon="tabler:sun-filled" className="mr-2" />
              Light Mode
            </span>
          ) : (
            <span className="flex items-center">
              <Icon icon="tabler:moon" className="mr-2" />
              Dark Mode
            </span>
          )}
        </DropdownItem>
        {user ? (
          <DropdownItem
            key="logout"
            aria-label="Log out"
            onPress={handleLogout}
            color="danger"
          >
            <span className="flex items-center">
              <Icon icon="tabler:logout" className="mr-2" />
              Log Out
            </span>
          </DropdownItem>
        ) : (
          <DropdownItem
            key="login"
            aria-label="Log in"
            onPress={handleLogin}
            color="primary"
          >
            <span className="flex items-center">
              <Icon icon="tabler:login" className="mr-2" />
              Log In
            </span>
          </DropdownItem>
        )}
      </DropdownMenu>
    </Dropdown>
  );
}
