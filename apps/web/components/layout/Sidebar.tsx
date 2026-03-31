import { Description, Drawer } from '@heroui/react';
import { APP } from '@split-snap/shared/constants';
import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import packageInfo from '@/package.json';

import { TypographySubsectionTitle } from '../shared/Typography';
import { MenuItemsProps } from './Navbar';

type SidebarProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  menuItems: MenuItemsProps[];
};

export default function Sidebar({
  isOpen,
  setIsOpen,
  menuItems,
}: SidebarProps) {
  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Content placement="left">
        <Drawer.Dialog>
          <Drawer.Header>
            <Drawer.Heading>
              <Link
                href="/"
                className="flex items-center gap-2 no-underline"
                onClick={() => setIsOpen(false)}
              >
                <Image
                  src="/logo.png"
                  alt={`${APP.NAME} logo`}
                  width={28}
                  height={28}
                  className="rounded-md"
                  priority
                />
                <TypographySubsectionTitle>
                  {APP.NAME}
                </TypographySubsectionTitle>
              </Link>
            </Drawer.Heading>
          </Drawer.Header>
          <Drawer.Body className="py-4">
            <p className="">Menu</p>
            <nav className="flex flex-col gap-1">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="text-foreground hover:bg-default flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
                >
                  <span
                    className={cn(
                      'flex w-full items-center gap-2 no-underline',
                      item.isActive && 'text-accent font-medium',
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </span>
                </Link>
              ))}
            </nav>
          </Drawer.Body>
          <Drawer.Footer>
            <Description>{`${APP.NAME} v${packageInfo.version}`}</Description>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
