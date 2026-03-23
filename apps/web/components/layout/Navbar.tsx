'use client';

import { Avatar, Link } from '@heroui/react';
import { APP } from '@split-snap/shared/constants';
import Image from 'next/image';
import { useState } from 'react';

import { useAuth } from '@/hooks/useAuth';

import { NavbarDropdownMenu } from './NavbarDropdownMenu';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <nav className="border-separator bg-background/70 sticky top-0 z-40 w-full border-b backdrop-blur-lg">
      <header className="flex h-16 items-center justify-between px-6">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className="sr-only">Menu</span>
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
          <Link href="/" className="flex items-center gap-2 no-underline">
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
        </div>

        {/* Menu Items */}
        <ul className="hidden items-center gap-4 md:flex">
          <li>
            <Link href="/scan" className="no-underline">
              <h5 className="title-subsection">Scan Receipt</h5>
            </Link>
          </li>
          <li>
            <Link href="/dashboard" className="no-underline">
              <h5 className="title-subsection">Dashboard</h5>
            </Link>
          </li>
        </ul>

        {/* User */}
        <div className="flex items-center gap-4">
          <NavbarDropdownMenu>
            {user ? (
              <Avatar size="sm" variant="soft" className="ring-accent ring-2">
                <Avatar.Image src="https://i.pravatar.cc/150?u=a04258114e29026708c" />
                <Avatar.Fallback>JD</Avatar.Fallback>
              </Avatar>
            ) : (
              <Avatar size="sm" />
            )}
          </NavbarDropdownMenu>
        </div>
      </header>

      {/* <NavbarContent>
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
      </NavbarContent> */}

      {/* <NavbarContent className="hidden gap-4 sm:flex" justify="center">
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
      </NavbarContent> */}

      {/* <NavbarContent justify="end">
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
      </NavbarContent> */}

      {/* Mobile menu */}
      {/* <NavbarMenu>
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
      </NavbarMenu> */}
    </nav>
  );
}
