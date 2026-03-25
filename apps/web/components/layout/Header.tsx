'use client';

import { Avatar, Link } from '@heroui/react';
import { APP } from '@split-snap/shared/constants';
import {
  IconLayoutDashboardFilled,
  IconLogin,
  IconReceipt,
} from '@tabler/icons-react';
import Image from 'next/image';

import { useAuth } from '@/hooks/useAuth';

import { MenuItemsProps, Navbar } from './Navbar';
import { NavbarDropdownMenu } from './NavbarDropdownMenu';

const MENU_ITEMS: MenuItemsProps[] = [
  { icon: <IconReceipt />, label: 'Scan Receipt', href: '/scan' },
  {
    icon: <IconLayoutDashboardFilled />,
    label: 'Dashboard',
    href: '/dashboard',
  },
];

const AUTH_MENU_ITEMS: MenuItemsProps[] = [
  { icon: <IconLogin />, label: 'Log In', href: '/auth/login' },
];

export default function Header() {
  const { user } = useAuth();

  return (
    <Navbar
      maxWidth="full"
      position="hide-on-scroll"
      brand={
        <Link href="/" className="flex items-center gap-2 no-underline">
          <Image
            src="/logo.png"
            alt={`${APP.NAME} logo`}
            width={28}
            height={28}
            className="rounded-md"
            priority
          />
          <p className="font-bold">{APP.NAME}</p>
        </Link>
      }
      items={!user ? [...MENU_ITEMS, ...AUTH_MENU_ITEMS] : MENU_ITEMS}
      rightContent={
        <>
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
        </>
      }
    />
  );
}
