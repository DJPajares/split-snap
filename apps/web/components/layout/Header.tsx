'use client';

import { Avatar } from '@heroui/react';
import { APP } from '@split-snap/shared/constants';
import {
  IconLayoutDashboardFilled,
  IconLogin,
  IconReceipt,
} from '@tabler/icons-react';
import Image from 'next/image';

import { useAuth } from '@/hooks/useAuth';

import { BrandProps, MenuItemsProps, Navbar } from './Navbar';
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

const brand: BrandProps = {
  name: APP.NAME,
  logo: (
    <Image
      src="/logo.png"
      alt={`${APP.NAME} logo`}
      width={28}
      height={28}
      className="rounded-md"
      priority
    />
  ),
  href: '/',
};

export default function Header() {
  const { user } = useAuth();

  return (
    <Navbar
      maxWidth="full"
      position="hide-on-scroll"
      brand={brand}
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
