'use client';

import {
  Avatar,
  Link,
  Navbar as HeroNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from '@heroui/react';
import { APP } from '@split-snap/shared/constants';
import Image from 'next/image';
import { useState } from 'react';

import { useAuth } from '@/hooks/useAuth';

import { NavbarDropdownMenu } from './NavbarDropdownMenu';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <HeroNavbar
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      maxWidth="full"
      isBordered
    >
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          className="sm:hidden"
        />
        <NavbarBrand>
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt={`${APP.NAME} logo`}
              width={28}
              height={28}
              className="rounded-md"
              priority
            />
            <h4 className="title-card">{APP.NAME}</h4>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden gap-4 sm:flex" justify="center">
        <NavbarItem>
          <Link href="/scan">
            <h5 className="title-subsection">Scan Receipt</h5>
          </Link>
        </NavbarItem>
        {user && (
          <NavbarItem>
            <Link href="/dashboard">
              <h5 className="title-subsection">Dashboard</h5>
            </Link>
          </NavbarItem>
        )}
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <NavbarDropdownMenu>
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
          </NavbarDropdownMenu>
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
            <h4 className="title-card">Scan Receipt</h4>
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
              <h4 className="title-card">Dashboard</h4>
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
              <h4 className="title-card">Log In</h4>
            </Link>
          </NavbarMenuItem>
        )}
      </NavbarMenu>
    </HeroNavbar>
  );
}
