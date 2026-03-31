'use client';

import { IconMenu2 } from '@tabler/icons-react';
import Link from 'next/link';
import { ReactNode, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import { TypographySubsectionTitle } from '../shared/Typography';
import Sidebar from './Sidebar';

export type MenuItemsProps = {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
};

export type BrandProps = {
  name: string;
  logo?: React.ReactNode;
  href?: string;
};

type NavbarProps = {
  brand: BrandProps;
  items: MenuItemsProps[];
  rightContent?: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  position?: 'static' | 'sticky' | 'fixed' | 'hide-on-scroll';
};

const maxWidthClasses = {
  sm: 'max-w-[640px]',
  md: 'max-w-[768px]',
  lg: 'max-w-[1024px]',
  xl: 'max-w-[1280px]',
  '2xl': 'max-w-[1536px]',
  full: 'max-w-full',
};

function useScrollDirection() {
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = Math.max(window.scrollY, 0);
      const isScrollingDown = currentScrollY > lastScrollYRef.current;

      setIsHidden(isScrollingDown && currentScrollY > 64);
      lastScrollYRef.current = currentScrollY;
    };

    lastScrollYRef.current = window.scrollY;
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return isHidden;
}

export function Navbar({
  brand,
  items,
  rightContent,
  className,
  maxWidth = 'lg',
  position = 'hide-on-scroll',
}: NavbarProps) {
  const isHidden = useScrollDirection();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <nav
        className={cn(
          'bg-background/70 z-40 w-full backdrop-blur-lg transition-transform duration-300',
          position === 'sticky' && 'sticky top-0',
          position === 'fixed' && 'fixed top-0',
          position === 'hide-on-scroll' && 'sticky top-0',
          position === 'hide-on-scroll' && isHidden && '-translate-y-full',
          className,
        )}
      >
        <header
          className={cn(
            'flex h-16 items-center justify-between px-6',
            maxWidth !== 'full' && maxWidthClasses[maxWidth],
            'mx-auto',
          )}
        >
          {/* Left side (brand and menu button) */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle menu"
              aria-expanded={isSidebarOpen}
              className="cursor-pointer sm:hidden"
            >
              <span className="sr-only">Menu</span>
              <IconMenu2 size={24} />
            </button>

            <Link
              href={brand.href || '/'}
              className="flex items-center gap-2 no-underline"
            >
              {brand.logo && <>{brand.logo}</>}
              <TypographySubsectionTitle>
                {brand.name}
              </TypographySubsectionTitle>
            </Link>
          </div>

          {/* Header menu */}
          <ul className="hidden items-center gap-4 sm:flex">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'no-underline',
                    item.isActive && 'text-accent font-bold',
                  )}
                  aria-current={item.isActive ? 'page' : undefined}
                >
                  <TypographySubsectionTitle>
                    {item.label}
                  </TypographySubsectionTitle>
                </Link>
              </li>
            ))}
          </ul>

          {/* Right side (user avatar, etc.) */}
          {rightContent && (
            <div className="flex items-center gap-4">{rightContent}</div>
          )}
        </header>
      </nav>

      {/* Mobile view only */}
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        menuItems={items}
      />
    </>
  );
}
