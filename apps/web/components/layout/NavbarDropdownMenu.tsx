import {
  addToast,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@heroui/react';
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
        </DropdownItem>
        {user ? (
          <DropdownItem
            key="logout"
            aria-label="Log out"
            onPress={handleLogout}
            color="danger"
          >
            <div className="flex flex-row items-center gap-2">
              <IconLogout size={20} />
              <p>Log Out</p>
            </div>
          </DropdownItem>
        ) : (
          <DropdownItem
            key="login"
            aria-label="Log in"
            onPress={handleLogin}
            color="primary"
          >
            <div className="flex flex-row items-center gap-2">
              <IconLogin size={20} />
              <p>Log In</p>
            </div>
          </DropdownItem>
        )}
      </DropdownMenu>
    </Dropdown>
  );
}
