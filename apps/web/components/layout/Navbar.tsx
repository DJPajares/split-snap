'use client';

import {
  addToast,
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Link,
  Navbar as HeroNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { APP } from '@split-snap/shared/constants';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useState } from 'react';

import { useAuth } from '@/hooks/useAuth';

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    <HeroNavbar
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      maxWidth="xl"
      isBordered
    >
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          className="sm:hidden"
        />
        <NavbarBrand>
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold text-inherit"
          >
            <Image
              src="/logo.png"
              alt={`${APP.NAME} logo`}
              width={28}
              height={28}
              className="rounded-md"
              priority
            />
            <span>{APP.NAME}</span>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden gap-4 sm:flex" justify="center">
        <NavbarItem>
          <Link href="/scan" color="foreground">
            Scan Receipt
          </Link>
        </NavbarItem>
        {user && (
          <NavbarItem>
            <Link href="/dashboard" color="foreground">
              Dashboard
            </Link>
          </NavbarItem>
        )}
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <Dropdown>
            <DropdownTrigger>
              {user ? (
                <Avatar
                  isBordered
                  size="sm"
                  color="primary"
                  src="https://i.pravatar.cc/150?u=a04258114e29026708c"
                />
              ) : (
                <Avatar size="sm" />
              )}
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu">
              <DropdownItem
                key="dark-mode"
                aria-label="Toggle dark mode"
                onPress={handleDarkModeToggle}
              >
                {isDarkMode ? (
                  <span className="flex items-center">
                    <Icon
                      icon="line-md:sun-rising-twotone-loop"
                      className="mr-2"
                    />
                    Light Mode
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Icon icon="line-md:moon-alt-loop" className="mr-2" />
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
                    <Icon icon="line-md:logout" className="mr-2" />
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
                    <Icon icon="line-md:login" className="mr-2" />
                    Log In
                  </span>
                </DropdownItem>
              )}
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>

      {/* Mobile menu */}
      <NavbarMenu>
        <NavbarMenuItem>
          <Link
            href="/scan"
            className="w-full"
            size="lg"
            onPress={() => setIsMenuOpen(false)}
          >
            Scan Receipt
          </Link>
        </NavbarMenuItem>
        {user && (
          <NavbarMenuItem>
            <Link
              href="/dashboard"
              className="w-full"
              size="lg"
              onPress={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
          </NavbarMenuItem>
        )}
        {!user && (
          <NavbarMenuItem>
            <Link
              href="/auth/login"
              className="w-full"
              size="lg"
              onPress={() => setIsMenuOpen(false)}
            >
              Log In
            </Link>
          </NavbarMenuItem>
        )}
      </NavbarMenu>
    </HeroNavbar>
  );
}
