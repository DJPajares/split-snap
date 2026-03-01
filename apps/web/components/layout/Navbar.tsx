'use client';

import {
  Navbar as HeroNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Button,
  Link
} from '@heroui/react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

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
            className="font-bold text-inherit text-xl gap-2 flex items-center"
          >
            <Image
              src="/logo.png"
              alt="Split Snap logo"
              width={28}
              height={28}
              className="rounded-md"
              priority
            />
            <span>Split Snap</span>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
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
        {user ? (
          <>
            <NavbarItem className="hidden sm:flex">
              <span className="text-sm text-default-500">{user.name}</span>
            </NavbarItem>
            <NavbarItem>
              <Button
                size="sm"
                variant="flat"
                onPress={() => {
                  logout();
                  router.push('/');
                }}
              >
                Log Out
              </Button>
            </NavbarItem>
          </>
        ) : (
          <>
            <NavbarItem>
              <Button as={Link} href="/auth/login" size="sm" variant="flat">
                Log In
              </Button>
            </NavbarItem>
          </>
        )}
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
